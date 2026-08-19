/**
 * CODIGO · Punto de entrada.
 *
 * Recibe todos los pedidos y los reparte. Equivale al index.js con las rutas
 * del sistema de referencia. Ninguna acción toca datos sin pasar antes por Guard.
 *
 * Formato de llamada (POST, cuerpo en JSON):
 *   { accion: 'listar', token: '...', entidad: 'Candidatos' }
 *
 * Respuesta siempre:
 *   { ok: true, datos: ... }   |   { ok: false, error: 'mensaje' }
 */

function doPost(e) {
  return responder_(procesar_(e));
}

/** Se mantiene GET solo para verificar que el servicio está publicado. */
function doGet(e) {
  if (e && e.parameter && e.parameter.accion === 'ping') {
    return responder_({ ok: true, datos: { servicio: 'Escencial', version: 1 } });
  }
  return responder_({ ok: false, error: 'Usá POST para operar con el sistema' });
}

function responder_(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}

function procesar_(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) throw new Error('Pedido vacío');
    var p = JSON.parse(e.postData.contents);
    var accion = p.accion;

    // Única acción abierta: el ingreso. Todo lo demás exige sesión.
    // 'estadoAcceso' se quitó: revelaba, sin autenticación, qué cuentas existían
    // y cuáles no tenían contraseña (enumeración de usuarios).
    if (accion === 'login')         return { ok: true, datos: login_(p) };

    // De acá en adelante, hay que estar identificado.
    var sesion = leerSesion_(p.token);

    switch (accion) {
      case 'sesion':
        return { ok: true, datos: sesion };

      case 'contrasena':
        return { ok: true, datos: definirContrasena_(sesion, p) };

      case 'catalogos':
        return { ok: true, datos: catalogos_(sesion) };

      case 'listar':
        return { ok: true, datos: listar_(sesion, p.entidad) };

      case 'panel':
        return { ok: true, datos: panel_(sesion) };

      case 'crear':
        return { ok: true, datos: crear_(sesion, p.entidad, p.datos || {}) };

      case 'editar':
        return { ok: true, datos: editar_(sesion, p.entidad, p.id, p.cambios || {}) };

      case 'baja':
        return { ok: true, datos: baja_(sesion, p.entidad, p.id) };

      case 'eliminar':
        return { ok: true, datos: eliminarRegistro_(sesion, p.entidad, p.id, p.forzar) };

      case 'asignar':
        return { ok: true, datos: asignar_(sesion, p.busquedaId, p.consultores || []) };

      /* --- Enlaces colgados de un registro (ver Adjuntos.gs) --- */
      case 'adjuntos':
        return { ok: true, datos: listarAdjuntos_(sesion, p.entidad, p.registroId) };

      case 'adjuntar':
        return { ok: true, datos: crearAdjunto_(sesion, p.datos || {}) };

      case 'quitarAdjunto':
        return { ok: true, datos: quitarAdjunto_(sesion, p.id) };

      /* --- Conversación sobre un pedido (ver Mensajes.gs) --- */
      case 'mensajes':
        return { ok: true, datos: listarMensajes_(sesion, p.entidad, p.registroId) };

      case 'mensajear':
        return { ok: true, datos: crearMensaje_(sesion, p.datos || {}) };

      /* --- El portal del cliente, en una sola llamada --- */
      case 'portalCliente':
        return { ok: true, datos: portalCliente_(sesion) };

      /* --- Toda la agenda interna, en una sola llamada --- */
      case 'agenda':
        return { ok: true, datos: agenda_(sesion) };

      /* --- Todo lo de un cliente, en una sola llamada --- */
      case 'fichaEmpresa':
        return { ok: true, datos: fichaEmpresa_(sesion, p.empresaId) };

      default:
        throw new Error('Acción no reconocida: ' + accion);
    }
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
}

/* ============================ ACCIONES GENÉRICAS ============================ */

function listar_(sesion, entidad) {
  exigirPermiso_(sesion, entidad, 'ver');
  var filas = filtrarPorPertenencia_(sesion, entidad, listarTodo_(entidad));
  // El hash nunca sale del servidor; en su lugar mandamos un indicador simple
  // de si la cuenta ya tiene contraseña definida, para la columna de Usuarios.
  if (entidad === 'Usuarios') {
    filas = filas.map(function (u) { u.TieneContrasena = !!u.Hash; return u; });
  }
  // Bóveda: la contraseña se guarda cifrada; se descifra solo para quien la ve.
  if (entidad === 'Accesos') {
    filas = filas.map(function (a) { a.Clave = descifrar_(a.Clave); return a; });
  }
  return filas.map(function (f) { return proyectar(sesion.rol, entidad, f); });
}

function crear_(sesion, entidad, datos) {
  exigirPermiso_(sesion, entidad, 'crear');
  quitarCamposVedados_(sesion, entidad, datos);
  datos = validarAlta_(sesion, entidad, datos);
  // La contraseña de la bóveda se guarda cifrada.
  if (entidad === 'Accesos' && datos.Clave) datos.Clave = cifrar_(datos.Clave);
  var creado = insertar_(entidad, datos);
  auditar_(sesion, 'creo', entidad, creado.ID, resumen_(datos));
  // Al devolver, mostrar la clave en claro (no el cifrado recién guardado).
  if (entidad === 'Accesos') creado.Clave = descifrar_(creado.Clave);
  return proyectar(sesion.rol, entidad, creado);
}

function editar_(sesion, entidad, id, cambios) {
  exigirPermiso_(sesion, entidad, 'editar');
  exigirAlcance_(sesion, entidad, id);

  // Nadie edita a mano lo que el sistema controla.
  ['ID', 'Salt', 'Hash', 'ConsultorID', 'AutorID'].forEach(function (c) { delete cambios[c]; });
  quitarCamposVedados_(sesion, entidad, cambios);
  if (entidad === 'Usuarios' && sesion.rol !== 'Admin') delete cambios.Rol;
  // Si se cambia la contraseña de la bóveda, se guarda cifrada.
  if (entidad === 'Accesos' && cambios.Clave) cambios.Clave = cifrar_(cambios.Clave);

  var r = actualizar_(entidad, id, cambios);
  auditar_(sesion, 'edito', entidad, id, resumen_(cambios));
  return r;
}

/** Dar de baja es marcar inactivo, no borrar: preserva el historial. */
function baja_(sesion, entidad, id) {
  exigirPermiso_(sesion, entidad, 'baja');
  exigirAlcance_(sesion, entidad, id);
  var estado = (entidad === 'Busquedas') ? 'Cerrada' : (entidad === 'Empresas' ? 'Cerrado' : 'Baja');
  var r = actualizar_(entidad, id, { Estado: estado });
  auditar_(sesion, 'dio de baja', entidad, id, '');
  return r;
}

/** Eliminar de verdad. Solo si nada apunta al registro, o si se confirma. */
function eliminarRegistro_(sesion, entidad, id, forzar) {
  exigirPermiso_(sesion, entidad, 'eliminar');
  var deps = dependenciasDe_(entidad, id);
  if (deps.length && !forzar) {
    return {
      requiereConfirmacion: true,
      dependencias: deps,
      mensaje: 'Este registro tiene ' + deps.map(function (d) {
        return d.cantidad + ' ' + d.nombre;
      }).join(' y ') + '. Conviene darlo de baja en lugar de eliminarlo.'
    };
  }
  eliminar_(entidad, id);
  borrarAdjuntosDe_(entidad, id);   // los enlaces se van con la ficha
  borrarMensajesDe_(entidad, id);   // la conversación, también
  borrarHijos_(entidad, id);        // y lo que no existe sin ella
  auditar_(sesion, 'elimino', entidad, id, deps.length ? 'Forzado con dependencias' : '');
  return { eliminado: true, id: id };
}

/** Reemplaza de una vez los consultores asignados a una búsqueda. */
function asignar_(sesion, busquedaId, consultores) {
  exigirPermiso_(sesion, 'Asignaciones', 'crear');
  listarTodo_('Asignaciones')
    .filter(function (a) { return String(a.BusquedaID) === String(busquedaId); })
    .forEach(function (a) { eliminar_('Asignaciones', a.ID); });

  consultores.forEach(function (consultorId) {
    insertar_('Asignaciones', {
      BusquedaID: busquedaId, ConsultorID: consultorId, FechaAsignacion: hoy_()
    });
  });
  auditar_(sesion, 'asigno', 'Busquedas', busquedaId, consultores.length + ' consultor(es)');
  return { busquedaId: busquedaId, cantidad: consultores.length };
}

/* ============================ APOYO ============================ */

/** Listas fijas que necesita el navegador para armar los formularios. */
function catalogos_(sesion) {
  return {
    roles: ROLES,
    etapasBusqueda: ETAPAS_BUSQUEDA,
    etapasCandidato: ETAPAS_CANDIDATO,
    etapasVisiblesEmpresa: ETAPAS_VISIBLES_EMPRESA,
    estadosBusqueda: ESTADOS_BUSQUEDA,
    estadosEmpresa: ESTADOS_EMPRESA,
    lineas: LINEAS,
    visibilidad: VISIBILIDAD_OBS,
    // Mundo interno
    tiposPendiente: TIPOS_PENDIENTE,
    estadosPendiente: ESTADOS_PENDIENTE,
    estadosProyecto: ESTADOS_PROYECTO,
    tiposOnboarding: TIPOS_ONBOARDING,
    ambitos: AMBITOS,
    nivelesComunicacion: NIVELES_COMUNICACION,
    tiposCumple: TIPOS_CUMPLE,
    destinatariosMaterial: DESTINATARIOS_MATERIAL,
    estadosMaterial: ESTADOS_MATERIAL,
    // Portal del cliente
    categoriasSolicitud: CATEGORIAS_SOLICITUD,
    tiposSolicitud: TIPOS_SOLICITUD,
    estadosSolicitud: ESTADOS_SOLICITUD,
    prioridades: PRIORIDADES,
    // Nómina
    tiposPermiso: TIPOS_PERMISO,
    estadosPermiso: ESTADOS_PERMISO,
    tiposContrato: TIPOS_CONTRATO,
    areasTrabajo: AREAS_TRABAJO,
    estadosColaborador: ESTADOS_COLABORADOR,
    colaboradores: colaboradoresParaElegir_(sesion),
    // Nombres del equipo, para elegir responsables sin escribirlos a mano
    equipo: listarTodo_('Usuarios')
      .filter(function (u) { return u.Rol === 'Admin' || u.Rol === 'Interno'; })
      .map(function (u) { return u.Nombre; }),
    // Clientes, para vincular cada registro interno con su empresa. Van todas,
    // también las cerradas: si no, un registro viejo no podría mostrar su nombre.
    empresas: empresasParaElegir_(sesion),
    permisos: PERMISOS[sesion.rol] || {}
  };
}

/**
 * Las tablas que alimentan el calendario y el tablero.
 *
 * Van juntas en una sola llamada a propósito. Pedirlas por separado eran nueve
 * viajes al servidor, y cada viaje a Apps Script vuelve a abrir la planilla:
 * el calendario tardaba más en dibujarse que en leerse.
 */
var TABLAS_AGENDA = [
  'Pendientes', 'Viajes', 'Cumpleanos', 'Permisos',
  'Proyectos', 'Onboarding', 'Capacitaciones', 'Comunicaciones', 'Candidatos'
];

function agenda_(sesion) {
  var salida = {};
  TABLAS_AGENDA.forEach(function (entidad) {
    var puede = ((PERMISOS[sesion.rol] || {})[entidad] || []).indexOf('ver') >= 0;
    salida[entidad] = puede ? listar_(sesion, entidad) : [];
  });
  return salida;
}

/**
 * Todo lo que el cliente necesita ver de su vínculo con Escencial, junto.
 *
 * Una sola llamada por la misma razón que la ficha de empresa: cada pedido a
 * Apps Script vuelve a abrir la planilla, y el portal muestra ocho cosas a la
 * vez. El recorte lo hace listar_ como siempre —el cliente recibe lo suyo y
 * nada más—, así que acá no hay que volver a filtrar por empresa.
 */
function portalCliente_(sesion) {
  var puede = function (entidad) {
    return ((PERMISOS[sesion.rol] || {})[entidad] || []).indexOf('ver') >= 0;
  };
  var leer = function (entidad) { return puede(entidad) ? listar_(sesion, entidad) : []; };

  var salida = {
    empresa: null,
    solicitudes: leer('Solicitudes'),
    busquedas: leer('Busquedas'),
    candidatos: leer('Candidatos'),
    observaciones: leer('Observaciones'),
    proyectos: leer('Proyectos'),
    capacitaciones: leer('Capacitaciones'),
    adjuntos: [],
    mensajes: []
  };

  if (puede('Empresas')) {
    var empresas = listar_(sesion, 'Empresas');
    salida.empresa = empresas.length ? empresas[0] : null;
  }

  /**
   * Los enlaces de todo lo que el cliente alcanza: el informe de un candidato,
   * el entregable de un proyecto, lo que se adjuntó a su pedido.
   */
  var alcance = {
    Candidatos: salida.candidatos.map(function (c) { return String(c.ID); }),
    Busquedas: salida.busquedas.map(function (b) { return String(b.ID); }),
    Solicitudes: salida.solicitudes.map(function (s) { return String(s.ID); }),
    Proyectos: salida.proyectos.map(function (p) { return String(p.ID); }),
    Capacitaciones: salida.capacitaciones.map(function (c) { return String(c.ID); })
  };
  if (salida.empresa) alcance.Empresas = [String(salida.empresa.ID)];

  salida.adjuntos = listarTodo_('Adjuntos').filter(function (a) {
    var ids = alcance[String(a.Entidad)];
    return !!ids && ids.indexOf(String(a.RegistroID)) >= 0;
  });

  salida.mensajes = listarTodo_('Mensajes').filter(function (m) {
    var ids = alcance[String(m.Entidad)];
    return !!ids && ids.indexOf(String(m.RegistroID)) >= 0;
  });

  return salida;
}

/** Nombres de la nómina, para colgarle un permiso a quien corresponde. */
function colaboradoresParaElegir_(sesion) {
  if (((PERMISOS[sesion.rol] || {}).Colaboradores || []).indexOf('ver') < 0) return [];
  return listarTodo_('Colaboradores').map(function (c) {
    return { id: c.ID, nombre: c.Nombre, estado: c.Estado };
  });
}

/** Lista de clientes para los desplegables. Solo la ve quien trabaja adentro. */
function empresasParaElegir_(sesion) {
  if (sesion.rol !== 'Admin' && sesion.rol !== 'Interno') return [];
  return listarTodo_('Empresas').map(function (e) {
    return { id: e.ID, nombre: e.Nombre, estado: e.Estado };
  });
}

/**
 * Ficha de un cliente: todo lo que el sistema sabe de esa empresa, junto.
 *
 * Va en una sola llamada a propósito. Armarlo desde el navegador serían diez
 * pedidos, y cada pedido a Apps Script vuelve a leer la planilla entera.
 */
function fichaEmpresa_(sesion, empresaId) {
  exigirPermiso_(sesion, 'Empresas', 'ver');
  exigirAlcance_(sesion, 'Empresas', empresaId);

  var empresa = buscarPorId_('Empresas', empresaId);
  if (!empresa) throw new Error('No se encontró esa empresa');

  var salida = {
    empresa: proyectar(sesion.rol, 'Empresas', empresa),
    busquedas: [],
    candidatos: [],
    usuarios: [],
    modulos: {},
    adjuntos: []
  };

  // Los accesos que tiene esa empresa. Solo los ve quien puede ver usuarios,
  // que hoy es Administración y, de solo lectura, el equipo interno.
  if (((PERMISOS[sesion.rol] || {}).Usuarios || []).indexOf('ver') >= 0) {
    salida.usuarios = listar_(sesion, 'Usuarios').filter(function (u) {
      return String(u.EmpresaID) === String(empresaId);
    });
  }

  // Alcance: qué registros de esta empresa puede ver quien pregunta.
  var idsBusquedas = [];
  var deLaEmpresa = {};     // entidad -> IDs, para juntar después los enlaces

  if (((PERMISOS[sesion.rol] || {}).Busquedas || []).indexOf('ver') >= 0) {
    salida.busquedas = listar_(sesion, 'Busquedas').filter(function (b) {
      return String(b.EmpresaID) === String(empresaId);
    });
    idsBusquedas = salida.busquedas.map(function (b) { return String(b.ID); });
    deLaEmpresa['Busquedas'] = idsBusquedas;
  }

  if (((PERMISOS[sesion.rol] || {}).Candidatos || []).indexOf('ver') >= 0) {
    salida.candidatos = listar_(sesion, 'Candidatos').filter(function (c) {
      return idsBusquedas.indexOf(String(c.BusquedaID)) >= 0;
    });
    deLaEmpresa['Candidatos'] = salida.candidatos.map(function (c) { return String(c.ID); });
  }

  ENTIDADES_POR_EMPRESA.forEach(function (entidad) {
    if (((PERMISOS[sesion.rol] || {})[entidad] || []).indexOf('ver') < 0) return;
    var filas = listar_(sesion, entidad).filter(function (f) {
      return String(f.EmpresaID) === String(empresaId);
    });
    salida.modulos[entidad] = filas;
    deLaEmpresa[entidad] = filas.map(function (f) { return String(f.ID); });
  });

  // Los enlaces de la empresa misma y los de todo lo que cuelga de ella.
  deLaEmpresa['Empresas'] = [String(empresaId)];
  var todos = listarTodo_('Adjuntos');
  salida.adjuntos = todos.filter(function (a) {
    var permitidos = deLaEmpresa[String(a.Entidad)];
    return !!permitidos && permitidos.indexOf(String(a.RegistroID)) >= 0;
  });

  return salida;
}

/** Todo lo que el panel necesita, en una sola llamada. */
function panel_(sesion) {
  var salida = { sesion: sesion, catalogos: catalogos_(sesion) };
  var visibles = PERMISOS[sesion.rol] || {};
  for (var entidad in visibles) {
    if ((visibles[entidad] || []).indexOf('ver') >= 0) {
      salida[entidad] = listar_(sesion, entidad);
    }
  }
  return salida;
}

/**
 * Lo que un rol no puede ver, tampoco lo puede escribir.
 *
 * Sin esto, el equipo interno no vería el sueldo de un colaborador pero podría
 * cambiarlo mandando el campo por fuera de la pantalla. Se descarta en silencio:
 * el resto de la operación sigue su curso normalmente.
 */
function quitarCamposVedados_(sesion, entidad, datos) {
  var ocultos = (CAMPOS_OCULTOS[sesion.rol] || {})[entidad] || [];
  ocultos.forEach(function (campo) { delete datos[campo]; });
  return datos;
}

function resumen_(datos) {
  return Object.keys(datos || {}).filter(function (k) {
    return k !== 'Salt' && k !== 'Hash';
  }).slice(0, 6).join(', ');
}

/** Menú en la planilla, para no tener que entrar al editor. */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Escencial')
    .addItem('1 · Migrar datos del sistema anterior', 'migrarYMostrar')
    .addItem('2 · Crear primer administrador', 'crearPrimerAdmin')
    .addItem('3 · Vincular registros viejos con su cliente', 'vincularEmpresasYMostrar')
    .addSeparator()
    .addItem('Crear / reparar hojas', 'inicializarSistema')
    .addToUi();
}
