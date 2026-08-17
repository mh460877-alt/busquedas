/**
 * AUTH · Ingreso y sesión.
 *
 * La contraseña se hashea en el navegador antes de salir, y acá se vuelve a
 * hashear —con estiramiento de clave y un secreto propio del servidor (pepper)—
 * junto a una sal única por usuario. El texto plano nunca llega al servidor ni
 * queda en la planilla, y aunque la planilla se filtre, sin el pepper del
 * proyecto los hashes no se pueden atacar sin conocerlo.
 *
 * El token de sesión cumple el papel del JWT del sistema de referencia:
 * lleva quién sos y hasta cuándo vale, y va firmado para que no se pueda alterar.
 */

var HORAS_SESION = 12;

/**
 * Estiramiento de clave (key-stretching). Cuantas más vueltas, más caro es
 * probar contraseñas por fuerza bruta. Apps Script no tiene bcrypt nativo, así
 * que iteramos HMAC-SHA256; este número es un equilibrio entre seguridad y la
 * demora del login. Subilo si el servidor lo permite.
 */
var ITERACIONES_HASH = 4096;

/** Intentos fallidos permitidos antes de frenar temporalmente el login. */
var MAX_INTENTOS = 5;
var VENTANA_BLOQUEO_SEG = 900;   // 15 minutos

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

/**
 * "Pepper" de las contraseñas: secreto propio del servidor, separado del de las
 * sesiones. Aunque alguien copie la planilla completa (Salt y Hash incluidos),
 * sin este valor —que solo vive en las propiedades del proyecto— no puede
 * montar un ataque de diccionario contra los hashes.
 */
function secretoPass_() {
  var props = PropertiesService.getScriptProperties();
  var s = props.getProperty('SECRETO_PASS');
  if (!s) {
    s = Utilities.getUuid() + Utilities.getUuid();
    props.setProperty('SECRETO_PASS', s);
  }
  return s;
}

function hexDe_(bytes) {
  return bytes.map(function (b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');
}

function sha256_(texto) {
  return hexDe_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, texto, Utilities.Charset.UTF_8));
}

function firmar_(texto) {
  return hexDe_(Utilities.computeHmacSha256Signature(texto, secreto_()));
}

/**
 * Comparación de tiempo constante: no corta al primer byte distinto, para no
 * filtrar por timing cuánto de un hash o una firma se acertó.
 */
function igualesSeguro_(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  var dif = 0;
  for (var i = 0; i < a.length; i++) dif |= (a.charCodeAt(i) ^ b.charCodeAt(i));
  return dif === 0;
}

/**
 * Hash robusto de contraseña: HMAC-SHA256 iterado, con la sal del usuario y el
 * pepper del servidor. Formato guardado: "v2$<iteraciones>$<hex>".
 */
function hashClave_(salt, clientHash) {
  var pepper = secretoPass_();
  var u = Utilities.computeHmacSha256Signature(salt + ':' + clientHash, pepper);
  for (var i = 1; i < ITERACIONES_HASH; i++) {
    u = Utilities.computeHmacSha256Signature(u, pepper);
  }
  return 'v2$' + ITERACIONES_HASH + '$' + hexDe_(u);
}

/**
 * Verifica una contraseña contra el hash guardado. Soporta el formato viejo
 * (sha256 simple) para no dejar afuera cuentas ya migradas: se actualizan solas
 * al formato robusto en el primer ingreso exitoso.
 */
function verificarClave_(usuario, clientHash) {
  var guardado = String(usuario.Hash || '');
  if (guardado.indexOf('v2$') === 0) {
    return igualesSeguro_(hashClave_(usuario.Salt, clientHash), guardado);
  }
  return igualesSeguro_(sha256_(usuario.Salt + clientHash), guardado);   // heredado
}

/* ---- Freno a la fuerza bruta (por identificador, ventana corta) ---- */

function claveIntentos_(id) { return 'fail:' + id; }

function verificarBloqueo_(id) {
  var n = Number(CacheService.getScriptCache().get(claveIntentos_(id)) || '0');
  if (n >= MAX_INTENTOS) {
    throw new Error('Demasiados intentos fallidos. Esperá unos minutos e intentá de nuevo.');
  }
}

function registrarIntentoFallido_(id) {
  var cache = CacheService.getScriptCache();
  var n = Number(cache.get(claveIntentos_(id)) || '0') + 1;
  cache.put(claveIntentos_(id), String(n), VENTANA_BLOQUEO_SEG);
}

function limpiarIntentos_(id) {
  CacheService.getScriptCache().remove(claveIntentos_(id));
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
  if (!igualesSeguro_(firmar_(partes[0]), partes[1])) throw new Error('Sesión inválida');
  var cuerpo = JSON.parse(deB64_(partes[0]));
  if (!cuerpo.exp || cuerpo.exp < Date.now()) throw new Error('La sesión venció, volvé a entrar');
  return cuerpo;
}

/* ============================ ACCIONES ============================ */

/**
 * Ingreso. Acepta usuario, correo o nombre, igual que el sistema actual.
 *
 * Reglas de seguridad:
 *  - Mensaje de error genérico: no revela si el usuario existe ni si falló la
 *    contraseña (evita enumeración de cuentas).
 *  - Freno de fuerza bruta por identificador.
 *  - Ya NO se entra "solo con el correo". Una cuenta sin contraseña define la
 *    suya en su primer ingreso; a partir de ahí, siempre se pide.
 */
function login_(datos) {
  var id = String(datos.id || '').trim().toLowerCase();
  if (!id) throw new Error('Ingresá tu usuario o tu correo');

  verificarBloqueo_(id);

  var ERROR_GENERICO = 'Usuario o contraseña incorrectos';

  var usuarios = listarTodo_('Usuarios');
  var encontrado = null;
  for (var i = 0; i < usuarios.length; i++) {
    var u = usuarios[i];
    if (id === String(u.Usuario).toLowerCase() ||
        id === String(u.Correo).toLowerCase() ||
        id === String(u.Nombre).toLowerCase()) { encontrado = u; break; }
  }

  // No existe, o está de baja: se responde igual que una contraseña incorrecta,
  // para no confirmar qué cuentas existen ni cuáles están dadas de baja.
  if (!encontrado || String(encontrado.Estado).toLowerCase() === 'baja') {
    registrarIntentoFallido_(id);
    throw new Error(ERROR_GENERICO);
  }

  var tienePass = !!encontrado.Hash;
  var modo;

  if (tienePass) {
    if (!datos.hash || !verificarClave_(encontrado, datos.hash)) {
      registrarIntentoFallido_(id);
      throw new Error(ERROR_GENERICO);
    }
    // Si venía en el formato viejo, se reescribe al robusto ahora que tenemos
    // la contraseña correcta a mano.
    if (String(encontrado.Hash).indexOf('v2$') !== 0) {
      var saltAlDia = Utilities.getUuid();
      actualizar_('Usuarios', encontrado.ID, { Salt: saltAlDia, Hash: hashClave_(saltAlDia, datos.hash) });
    }
    modo = 'con-contrasena';
  } else {
    /**
     * PRIMER INGRESO. La cuenta todavía no tiene contraseña. Antes se entraba
     * solo con el correo —cualquiera que supiera un correo entraba como esa
     * persona—; ahora se exige elegir una contraseña, que queda asociada a la
     * cuenta en este mismo paso.
     */
    if (!datos.hash) {
      throw new Error('Es tu primer ingreso: elegí una contraseña para proteger tu cuenta.');
    }
    var salt = Utilities.getUuid();
    actualizar_('Usuarios', encontrado.ID, { Salt: salt, Hash: hashClave_(salt, datos.hash) });
    tienePass = true;
    modo = 'primer-ingreso';
  }

  limpiarIntentos_(id);

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

/** Guarda una contraseña nueva. Cada quien la suya; Admin, la de cualquiera. */
function definirContrasena_(sesion, datos) {
  var destino = datos.usuarioId || sesion.uid;
  if (destino !== sesion.uid && sesion.rol !== 'Admin') {
    throw new Error('Solo Administración puede cambiar la contraseña de otra persona');
  }
  if (!datos.hash) throw new Error('Falta la contraseña');

  var salt = Utilities.getUuid();
  actualizar_('Usuarios', destino, { Salt: salt, Hash: hashClave_(salt, datos.hash) });
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
 * La contraseña temporal se genera al azar y se muestra UNA sola vez en el
 * registro de ejecución; no queda escrita en el código. Cambiala al entrar.
 */
function crearPrimerAdmin() {
  var USUARIO = 'admin';
  var NOMBRE = 'Ayelen Lamas';
  var CORREO = 'direccion@escencialconsult.com.ar';

  var usuarios = listarTodo_('Usuarios');
  var yaHayAdmin = usuarios.some(function (u) { return u.Rol === 'Admin'; });
  if (yaHayAdmin) {
    return 'Ya hay un administrador. Las altas se hacen desde el panel.';
  }

  // Contraseña temporal aleatoria. El navegador la hashea con SHA-256 al entrar,
  // así que acá guardamos el hash robusto de ese mismo SHA-256.
  var temporal = Utilities.getUuid().slice(0, 12) + '!';
  var salt = Utilities.getUuid();
  var hash = hashClave_(salt, sha256_(temporal));

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
           'Entrá con "' + USUARIO + '" o con ' + existente.Correo + '. ' +
           'Contraseña temporal: ' + temporal + ' — cambiala apenas ingreses.';
  }

  insertar_('Usuarios', {
    Usuario: USUARIO, Nombre: NOMBRE, Correo: CORREO, Rol: 'Admin',
    Salt: salt, Hash: hash, Estado: 'Activo'
  });
  return 'Administrador creado. Usuario: "admin". ' +
         'Contraseña temporal: ' + temporal + ' — cambiala apenas ingreses.';
}
