/**
 * AUTH · Ingreso y sesión.
 *
 * La contraseña se hashea en el navegador antes de salir, y acá se vuelve a
 * hashear con una sal propia de cada usuario. El texto plano nunca llega al
 * servidor ni queda en la planilla.
 *
 * El token de sesión cumple el papel del JWT del sistema de referencia:
 * lleva quién sos y hasta cuándo vale, y va firmado para que no se pueda alterar.
 */

var HORAS_SESION = 12;

/** El secreto vive en las propiedades del proyecto, nunca en el código. */
function secreto_() {
  var props = PropertiesService.getScriptProperties();
  var s = props.getProperty('SECRETO_SESION');
  if (!s) {
    s = Utilities.getUuid() + Utilities.getUuid();
    props.setProperty('SECRETO_SESION', s);
  }
  return s;
}

function sha256_(texto) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, texto, Utilities.Charset.UTF_8);
  return bytes.map(function (b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');
}

function firmar_(texto) {
  var bytes = Utilities.computeHmacSha256Signature(texto, secreto_());
  return bytes.map(function (b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');
}

function b64_(texto) {
  return Utilities.base64EncodeWebSafe(texto).replace(/=+$/, '');
}

function deB64_(texto) {
  return Utilities.newBlob(Utilities.base64DecodeWebSafe(texto)).getDataAsString();
}

function generarToken_(usuario) {
  var cuerpo = {
    uid: usuario.ID,
    nombre: usuario.Nombre,
    rol: usuario.Rol,
    empresaId: usuario.EmpresaID || '',
    exp: Date.now() + HORAS_SESION * 3600 * 1000
  };
  var carga = b64_(JSON.stringify(cuerpo));
  return carga + '.' + firmar_(carga);
}

/**
 * Valida el token y devuelve la sesión.
 * Es la puerta por la que pasa toda llamada: sin sesión válida, no hay dato.
 */
function leerSesion_(token) {
  if (!token || token.indexOf('.') < 0) throw new Error('Sesión no iniciada');
  var partes = token.split('.');
  if (firmar_(partes[0]) !== partes[1]) throw new Error('Sesión inválida');
  var cuerpo = JSON.parse(deB64_(partes[0]));
  if (!cuerpo.exp || cuerpo.exp < Date.now()) throw new Error('La sesión venció, volvé a entrar');
  return cuerpo;
}

/* ============================ ACCIONES ============================ */

/** Ingreso. Acepta usuario, correo o nombre, igual que el sistema actual. */
function login_(datos) {
  var id = String(datos.id || '').trim().toLowerCase();
  if (!id) throw new Error('Ingresá tu usuario o tu correo');

  var usuarios = listarTodo_('Usuarios');
  var encontrado = null;
  for (var i = 0; i < usuarios.length; i++) {
    var u = usuarios[i];
    if (id === String(u.Usuario).toLowerCase() ||
        id === String(u.Correo).toLowerCase() ||
        id === String(u.Nombre).toLowerCase()) { encontrado = u; break; }
  }
  if (!encontrado) throw new Error('No encontramos ese usuario');
  if (String(encontrado.Estado).toLowerCase() === 'baja') throw new Error('Ese acceso está dado de baja');

  /**
   * Contraseña opcional: si el usuario tiene una cargada, se le pide.
   * Si todavía no tiene, entra con su correo, y queda registrado cómo entró
   * para poder ver quién falta migrar.
   */
  var tienePass = !!encontrado.Hash;
  var modo = 'sin-contrasena';
  if (tienePass) {
    if (!datos.hash) throw new Error('Esta cuenta ya tiene contraseña. Ingresala para continuar.');
    if (sha256_(encontrado.Salt + datos.hash) !== encontrado.Hash) throw new Error('Contraseña incorrecta');
    modo = 'con-contrasena';
  }

  return {
    token: generarToken_(encontrado),
    usuario: {
      id: encontrado.ID,
      nombre: encontrado.Nombre,
      rol: encontrado.Rol,
      empresaId: encontrado.EmpresaID || '',
      tieneContrasena: tienePass,
      modoIngreso: modo
    }
  };
}

/** Indica si un identificador ya tiene contraseña, para saber qué pedir. */
function estadoAcceso_(datos) {
  var id = String(datos.id || '').trim().toLowerCase();
  if (!id) return { existe: false, tieneContrasena: false };
  var usuarios = listarTodo_('Usuarios');
  for (var i = 0; i < usuarios.length; i++) {
    var u = usuarios[i];
    if (id === String(u.Usuario).toLowerCase() ||
        id === String(u.Correo).toLowerCase() ||
        id === String(u.Nombre).toLowerCase()) {
      return { existe: true, tieneContrasena: !!u.Hash };
    }
  }
  return { existe: false, tieneContrasena: false };
}

/** Guarda una contraseña nueva. Cada quien la suya; Admin, la de cualquiera. */
function definirContrasena_(sesion, datos) {
  var destino = datos.usuarioId || sesion.uid;
  if (destino !== sesion.uid && sesion.rol !== 'Admin') {
    throw new Error('Solo Administración puede cambiar la contraseña de otra persona');
  }
  if (!datos.hash) throw new Error('Falta la contraseña');

  var salt = Utilities.getUuid();
  actualizar_('Usuarios', destino, { Salt: salt, Hash: sha256_(salt + datos.hash) });
  auditar_(sesion, 'editar', 'Usuarios', destino, 'Cambio de contraseña');
  return { ok: true };
}

/**
 * Crea el primer administrador.
 *
 * Se puede correr después de la migración: lo que la frena no es que existan
 * usuarios (la migración crea los consultores), sino que ya exista un Admin.
 * Si la persona ya está cargada como consultora —caso típico de la dirección,
 * que figuraba en la hoja vieja— la asciende en lugar de duplicarla.
 *
 * >>> CAMBIÁ LA CONTRASEÑA ANTES DE EJECUTAR <<<
 */
function crearPrimerAdmin() {
  var USUARIO = 'admin';
  var NOMBRE = 'Ayelen Lamas';
  var CORREO = 'direccion@escencialconsult.com.ar';
  var CONTRASENA = 'CambiarEstaClave2026';

  var usuarios = listarTodo_('Usuarios');
  var yaHayAdmin = usuarios.some(function (u) { return u.Rol === 'Admin'; });
  if (yaHayAdmin) {
    return 'Ya hay un administrador. Las altas se hacen desde el panel.';
  }

  var salt = Utilities.getUuid();
  var hash = sha256_(salt + sha256_(CONTRASENA));

  // ¿Esta persona ya está cargada, por ejemplo como consultora?
  var existente = null;
  for (var i = 0; i < usuarios.length; i++) {
    var u = usuarios[i];
    if (String(u.Correo).toLowerCase() === CORREO.toLowerCase() ||
        String(u.Nombre).toLowerCase() === NOMBRE.toLowerCase()) { existente = u; break; }
  }

  if (existente) {
    actualizar_('Usuarios', existente.ID, {
      Usuario: USUARIO, Rol: 'Admin', Salt: salt, Hash: hash, Estado: 'Activo'
    });
    return 'Se ascendió a "' + existente.Nombre + '" a Administración. ' +
           'Entrá con "' + USUARIO + '" o con ' + existente.Correo + '.';
  }

  insertar_('Usuarios', {
    Usuario: USUARIO, Nombre: NOMBRE, Correo: CORREO, Rol: 'Admin',
    Salt: salt, Hash: hash, Estado: 'Activo'
  });
  return 'Administrador creado: ' + USUARIO;
}
