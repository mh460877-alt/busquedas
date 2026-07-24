/**
 * CIFRADO · Para las contraseñas de la bóveda.
 *
 * A diferencia del login (que usa hash, unidireccional), acá hace falta poder
 * recuperar la contraseña para mostrarla. Por eso es cifrado simétrico, no hash.
 *
 * Es un cifrado de flujo estilo CTR: el keystream se deriva con HMAC-SHA256 a
 * partir de un secreto maestro (guardado en las propiedades del proyecto, nunca
 * en el código ni en la planilla) y un nonce único por cada valor cifrado.
 *
 * Objetivo: que quien abra la planilla de Google directamente vea texto cifrado.
 * Las contraseñas solo se descifran en el servidor, para roles autorizados.
 */

/** Secreto maestro, propio de la bóveda. Se genera una vez y queda guardado. */
function secretoBoveda_() {
  var props = PropertiesService.getScriptProperties();
  var s = props.getProperty('SECRETO_BOVEDA');
  if (!s) {
    s = Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid();
    props.setProperty('SECRETO_BOVEDA', s);
  }
  return s;
}

/** Un bloque de 32 bytes de keystream para el contador dado. */
function keystream_(nonce, contador) {
  return Utilities.computeHmacSha256Signature(nonce + ':' + contador, secretoBoveda_());
}

var PREFIJO_CIFRADO = 'enc:';

/** Cifra un texto. Devuelve "enc:<nonce>:<base64>". Vacío queda vacío. */
function cifrar_(texto) {
  if (texto === '' || texto === null || texto === undefined) return '';
  texto = String(texto);
  var datos = Utilities.newBlob(texto).getBytes();     // bytes UTF-8 (signed)
  var nonce = Utilities.getUuid();
  var salida = [];
  var bloque = keystream_(nonce, 0), contador = 0;
  for (var i = 0; i < datos.length; i++) {
    if (i > 0 && i % 32 === 0) { contador++; bloque = keystream_(nonce, contador); }
    var b = datos[i] & 0xFF;
    var k = bloque[i % 32] & 0xFF;
    var x = b ^ k;                                      // 0..255
    salida.push(x > 127 ? x - 256 : x);                // vuelve a signed para el blob
  }
  return PREFIJO_CIFRADO + nonce + ':' + Utilities.base64Encode(salida);
}

/** Descifra. Si el valor no está cifrado (texto viejo), lo devuelve tal cual. */
function descifrar_(guardado) {
  if (!guardado) return '';
  guardado = String(guardado);
  if (guardado.indexOf(PREFIJO_CIFRADO) !== 0) return guardado;   // compatibilidad con lo cargado antes
  var resto = guardado.slice(PREFIJO_CIFRADO.length);
  var corte = resto.indexOf(':');
  if (corte < 0) return guardado;
  var nonce = resto.slice(0, corte);
  var datos = Utilities.base64Decode(resto.slice(corte + 1));
  var salida = [];
  var bloque = keystream_(nonce, 0), contador = 0;
  for (var i = 0; i < datos.length; i++) {
    if (i > 0 && i % 32 === 0) { contador++; bloque = keystream_(nonce, contador); }
    var b = datos[i] & 0xFF;
    var k = bloque[i % 32] & 0xFF;
    var x = b ^ k;
    salida.push(x > 127 ? x - 256 : x);
  }
  return Utilities.newBlob(salida).getDataAsString();  // interpreta UTF-8
}

/** Prueba rápida, para correr a mano desde el editor. */
function probarCifrado() {
  var original = 'Contraseña-Segura-123!ñ';
  var cif = cifrar_(original);
  var des = descifrar_(cif);
  return 'original: ' + original + '\ncifrado: ' + cif + '\ndescifrado: ' + des +
         '\ncoincide: ' + (des === original);
}
