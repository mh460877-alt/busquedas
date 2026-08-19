/**
 * MENSAJES · La conversación sobre un registro.
 *
 * Cliente y equipo hablando sobre un pedido, en el lugar donde está el pedido,
 * en vez de en una cadena de mails que después nadie encuentra. Todo lo que se
 * escribe acá lo ven las dos partes: no hay mensajes internos. Para eso están
 * las observaciones de candidatos, que sí distinguen audiencias.
 *
 * Igual que los enlaces, no usa las acciones genéricas: hereda el permiso del
 * registro sobre el que se conversa.
 */

/** Dónde se puede conversar. Por ahora, sobre los pedidos del cliente. */
var ENTIDADES_CON_MENSAJES = ['Solicitudes'];

function validarEntidadMensaje_(entidad) {
  if (ENTIDADES_CON_MENSAJES.indexOf(String(entidad)) < 0) {
    throw new Error('No se puede conversar sobre ' + entidad);
  }
}

/**
 * Los mensajes de un registro, o los de toda una tabla si no se pasa uno.
 * Quien puede ver el registro puede leer y escribir: una conversación en la
 * que una parte no pueda contestar no es una conversación.
 */
function listarMensajes_(sesion, entidad, registroId) {
  validarEntidadMensaje_(entidad);
  exigirPermiso_(sesion, entidad, 'ver');

  var permitidos = idsVisibles_(sesion, entidad);
  if (registroId) {
    if (permitidos.indexOf(String(registroId)) < 0) {
      throw new Error('Ese registro no está a tu alcance');
    }
    permitidos = [String(registroId)];
  }

  return listarTodo_('Mensajes').filter(function (m) {
    return String(m.Entidad) === String(entidad) &&
           permitidos.indexOf(String(m.RegistroID)) >= 0;
  });
}

function crearMensaje_(sesion, datos) {
  var entidad = String(datos.Entidad || '');
  var registroId = String(datos.RegistroID || '');

  validarEntidadMensaje_(entidad);
  exigirPermiso_(sesion, entidad, 'ver');
  exigirAlcance_(sesion, entidad, registroId);

  var texto = String(datos.Texto || '').trim();
  if (!texto) throw new Error('Escribí algo antes de enviar');

  var creado = insertar_('Mensajes', {
    Entidad: entidad,
    RegistroID: registroId,
    Texto: texto,
    AutorID: sesion.uid,
    AutorNombre: sesion.nombre,
    RolAutor: sesion.rol,
    Fecha: hoy_()
  });

  auditar_(sesion, 'escribio', entidad, registroId, texto.slice(0, 60));
  return creado;
}

/** Se van con el registro: una conversación sin su pedido no significa nada. */
function borrarMensajesDe_(entidad, registroId) {
  listarTodo_('Mensajes')
    .filter(function (m) {
      return String(m.Entidad) === String(entidad) &&
             String(m.RegistroID) === String(registroId);
    })
    .forEach(function (m) { eliminar_('Mensajes', m.ID); });
}
