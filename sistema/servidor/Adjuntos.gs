/**
 * ADJUNTOS · Enlaces guardados sobre cualquier registro.
 *
 * En lugar de un único campo "Link" por ficha, cada registro puede tener todos
 * los enlaces que haga falta, con su nombre: la carpeta de Drive, el informe,
 * la planilla de seguimiento, el acta de la reunión. Es la idea de los adjuntos
 * de una tarjeta de Trello, pero adentro del sistema, para que la plataforma
 * sirva también de resguardo de dónde está cada cosa.
 *
 * Estos enlaces NO pasan por las acciones genéricas (listar/crear/editar). Van
 * por las suyas, y cada una verifica primero el permiso sobre el registro al
 * que el enlace cuelga: si no podés ver la búsqueda, no ves sus enlaces.
 */

/**
 * ARCHIVOS
 *
 * Un adjunto puede ser un enlace pegado a mano o un archivo subido desde la
 * computadora. El archivo no se guarda en la planilla —ahí no entra ni tendría
 * sentido— sino en el Drive de la cuenta que publicó el sistema, dentro de una
 * carpeta propia. En la tabla queda su dirección, igual que cualquier enlace,
 * así que todo lo que ya existe sigue funcionando sin cambios.
 */
var CARPETA_ARCHIVOS = 'Escencial · Archivos del sistema';

/**
 * Tope de tamaño. Apps Script recibe el archivo codificado en texto, lo que lo
 * agranda cerca de un tercio, y un pedido demasiado grande se corta a la mitad
 * sin decir por qué. Ocho megas es cómodo para informes y CV, que es para lo
 * que se usa.
 */
var MAX_ARCHIVO_MB = 8;

/** La carpeta del sistema en Drive. Se crea sola la primera vez. */
function carpetaArchivos_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('CARPETA_ARCHIVOS_ID');
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (e) { /* la borraron: se rehace */ }
  }
  var carpeta = DriveApp.createFolder(CARPETA_ARCHIVOS);
  props.setProperty('CARPETA_ARCHIVOS_ID', carpeta.getId());
  return carpeta;
}

/**
 * Sube un archivo y lo cuelga del registro, como un adjunto más.
 *
 * Queda compartido por enlace: es lo que permite que el partner abra el CV o
 * que el cliente lea el informe sin tener cuenta de Google. Quien tenga la
 * dirección puede verlo, así que no es lugar para documentación reservada.
 */
function subirArchivo_(sesion, datos) {
  var entidad = String(datos.Entidad || '');
  var registroId = String(datos.RegistroID || '');

  validarEntidadAdjunto_(entidad);
  exigirPermiso_(sesion, entidad, 'ver');
  exigirPermisoAdjunto_(sesion, entidad);
  exigirAlcance_(sesion, entidad, registroId);

  var contenido = String(datos.Contenido || '');
  if (!contenido) throw new Error('El archivo llegó vacío');

  var bytes = Utilities.base64Decode(contenido);
  var megas = bytes.length / (1024 * 1024);
  if (megas > MAX_ARCHIVO_MB) {
    throw new Error('El archivo pesa ' + megas.toFixed(1) + ' MB y el máximo es ' +
                    MAX_ARCHIVO_MB + ' MB. Subilo a Drive y pegá el enlace.');
  }

  var nombre = String(datos.Nombre || 'archivo').trim() || 'archivo';
  var blob = Utilities.newBlob(bytes, String(datos.TipoMime || 'application/octet-stream'), nombre);
  var archivo = carpetaArchivos_().createFile(blob);
  archivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var creado = insertar_('Adjuntos', {
    Entidad: entidad,
    RegistroID: registroId,
    Titulo: String(datos.Titulo || '').trim() || nombre,
    URL: archivo.getUrl(),
    Tipo: 'Archivo',
    ArchivoID: archivo.getId(),
    Peso: megas < 1 ? Math.round(megas * 1024) + ' KB' : megas.toFixed(1) + ' MB',
    Nota: String(datos.Nota || '').trim(),
    AutorID: sesion.uid,
    AutorNombre: sesion.nombre,
    Fecha: hoy_()
  });

  auditar_(sesion, 'subio un archivo', entidad, registroId, creado.Titulo);
  return creado;
}

/** Se puede colgar un enlace acá, ¿sí o no? */
function validarEntidadAdjunto_(entidad) {
  if (ENTIDADES_CON_ADJUNTOS.indexOf(String(entidad)) < 0) {
    throw new Error('No se pueden guardar enlaces en ' + entidad);
  }
}

/**
 * Solo http y https.
 *
 * Un "enlace" que empiece con javascript: no es un enlace: es código que se
 * ejecutaría en el navegador de quien lo clickee. Se corta acá, en el servidor,
 * y no solo en la pantalla.
 */
function validarUrl_(url) {
  var u = String(url || '').trim();
  if (!u) throw new Error('Falta la dirección del enlace');
  if (!/^https?:\/\//i.test(u)) {
    throw new Error('El enlace tiene que empezar con http:// o https://');
  }
  return u;
}

/** IDs de esa tabla que esta sesión tiene derecho a ver. */
function idsVisibles_(sesion, entidad) {
  return filtrarPorPertenencia_(sesion, entidad, listarTodo_(entidad))
    .map(function (f) { return String(f.ID); });
}

/**
 * Quién puede sumar o sacar enlaces de un registro: quien puede crearlo o
 * editarlo. Mirar no alcanza —si no, una empresa podría escribir sobre la ficha
 * de un candidato— y exigir 'editar' dejaría afuera al consultor, que carga
 * candidatos pero no los edita.
 */
function exigirPermisoAdjunto_(sesion, entidad) {
  var permitidas = (PERMISOS[sesion.rol] || {})[entidad] || [];
  if (permitidas.indexOf('editar') < 0 && permitidas.indexOf('crear') < 0) {
    throw new Error('No tenés permiso para guardar enlaces en ' + entidad);
  }
  return true;
}

/* ============================ ACCIONES ============================ */

/**
 * Enlaces de un registro, o de toda una tabla si no se pasa registroId.
 * Traer los de toda la tabla de una vez evita una llamada por fila cuando se
 * abre un módulo: Apps Script relee la planilla en cada pedido.
 */
function listarAdjuntos_(sesion, entidad, registroId) {
  validarEntidadAdjunto_(entidad);
  exigirPermiso_(sesion, entidad, 'ver');

  var permitidos = idsVisibles_(sesion, entidad);
  if (registroId) {
    if (permitidos.indexOf(String(registroId)) < 0) {
      throw new Error('Ese registro no está a tu alcance');
    }
    permitidos = [String(registroId)];
  }

  return listarTodo_('Adjuntos').filter(function (a) {
    return String(a.Entidad) === String(entidad) &&
           permitidos.indexOf(String(a.RegistroID)) >= 0;
  });
}

/** Suma un enlace a un registro. */
function crearAdjunto_(sesion, datos) {
  var entidad = String(datos.Entidad || '');
  var registroId = String(datos.RegistroID || '');

  validarEntidadAdjunto_(entidad);
  exigirPermiso_(sesion, entidad, 'ver');
  exigirPermisoAdjunto_(sesion, entidad);
  exigirAlcance_(sesion, entidad, registroId);

  var url = validarUrl_(datos.URL);
  var titulo = String(datos.Titulo || '').trim();

  var creado = insertar_('Adjuntos', {
    Entidad: entidad,
    RegistroID: registroId,
    Titulo: titulo || url,          // sin nombre, se muestra la dirección
    URL: url,
    Tipo: 'Enlace',
    Nota: String(datos.Nota || '').trim(),
    AutorID: sesion.uid,
    AutorNombre: sesion.nombre,
    Fecha: hoy_()
  });

  auditar_(sesion, 'adjunto un enlace', entidad, registroId, creado.Titulo);
  return creado;
}

/**
 * Saca un enlace.
 * Lo puede sacar quien lo puso, y Administración o el equipo interno cualquiera
 * de los que estén a su alcance.
 */
function quitarAdjunto_(sesion, id) {
  var adjunto = buscarPorId_('Adjuntos', id);
  if (!adjunto) throw new Error('No se encontró ese enlace');

  var entidad = String(adjunto.Entidad);
  validarEntidadAdjunto_(entidad);
  exigirPermiso_(sesion, entidad, 'ver');
  exigirPermisoAdjunto_(sesion, entidad);
  exigirAlcance_(sesion, entidad, adjunto.RegistroID);

  var esAutor = String(adjunto.AutorID) === String(sesion.uid);
  var mandaEnLaCasa = (sesion.rol === 'Admin' || sesion.rol === 'Interno');
  if (!esAutor && !mandaEnLaCasa) {
    throw new Error('Ese enlace lo cargó otra persona');
  }

  // Si era un archivo subido, se va también de Drive: dejarlo ahí sería
  // guardar para siempre algo que el sistema ya no muestra.
  if (adjunto.ArchivoID) {
    try { DriveApp.getFileById(adjunto.ArchivoID).setTrashed(true); } catch (e) { }
  }

  eliminar_('Adjuntos', id);
  auditar_(sesion, 'quito un adjunto', entidad, adjunto.RegistroID, adjunto.Titulo);
  return { eliminado: true, id: id };
}

/** Se van con el registro: si se borra la ficha, no quedan enlaces colgando. */
function borrarAdjuntosDe_(entidad, registroId) {
  listarTodo_('Adjuntos')
    .filter(function (a) {
      return String(a.Entidad) === String(entidad) &&
             String(a.RegistroID) === String(registroId);
    })
    .forEach(function (a) {
      if (a.ArchivoID) {
        try { DriveApp.getFileById(a.ArchivoID).setTrashed(true); } catch (e) { }
      }
      eliminar_('Adjuntos', a.ID);
    });
}
