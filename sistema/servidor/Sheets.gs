/**
 * SHEETS · Lectura y escritura sobre la planilla.
 *
 * Nadie más toca SpreadsheetApp: todas las tablas pasan por acá.
 * Es la capa que en el sistema de referencia resuelve mongoose.
 */

function ss_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/** Devuelve la hoja, creándola con sus encabezados si no existe. */
function hoja_(entidad) {
  var cols = columnasDe(entidad);
  var ss = ss_();
  var sh = ss.getSheetByName(entidad);
  if (!sh) {
    // Crear la hoja. Si dos llamadas concurrentes intentan crearla a la vez,
    // la segunda falla con "Ya existe una hoja...". En ese caso, simplemente
    // usamos la que acaba de crear la otra llamada.
    try {
      sh = ss.insertSheet(entidad);
    } catch (e) {
      sh = ss.getSheetByName(entidad);
      if (!sh) throw e;   // si de verdad no existe, propagar el error real
    }
  }
  var ultima = sh.getLastColumn();
  var actual = ultima > 0 ? sh.getRange(1, 1, 1, ultima).getValues()[0] : [];

  if (!actual.length || actual[0] !== 'MarcaTiempo') {
    /**
     * Protección: si la hoja ya tiene datos con otra estructura, es una hoja
     * del sistema anterior. Escribirle los encabezados nuevos encima dejaría
     * las filas desalineadas. Se frena y se pide migrar primero.
     */
    if (sh.getLastRow() > 1) {
      throw new Error(
        'La hoja "' + entidad + '" ya tiene datos con otra estructura. ' +
        'Ejecutá migrarDatosAnteriores antes de inicializar el sistema.'
      );
    }
    var rng = sh.getRange(1, 1, 1, cols.length);
    rng.setValues([cols]);
    rng.setFontWeight('bold').setFontColor('#ffffff').setBackground('#1C5A4A');
    sh.setFrozenRows(1);
  } else {
    var faltan = cols.filter(function (c) { return actual.indexOf(c) < 0; });
    if (faltan.length) {
      var r2 = sh.getRange(1, actual.length + 1, 1, faltan.length);
      r2.setValues([faltan]);
      r2.setFontWeight('bold').setFontColor('#ffffff').setBackground('#1C5A4A');
    }
  }
  return sh;
}

/** Crea todas las hojas del modelo. Se ejecuta una sola vez, a mano. */
function inicializarSistema() {
  for (var entidad in HOJAS) { hoja_(entidad); }
  return 'Listo. Hojas creadas: ' + Object.keys(HOJAS).join(', ');
}

function nuevoId_(prefijo) {
  return prefijo + '-' + Utilities.getUuid().slice(0, 8);
}

/**
 * Evita inyección de fórmulas en la planilla. Un texto que empieza con = + - @
 * lo interpretaría Google Sheets como fórmula al abrir la hoja (por ejemplo,
 * =IMPORTXML(...) para filtrar datos). Se le antepone una comilla, que Sheets
 * usa como marca de "esto es texto": se guarda y se lee igual, pero no ejecuta.
 */
function seguroParaCelda_(valor) {
  if (typeof valor === 'string' && valor.length && '=+-@'.indexOf(valor.charAt(0)) >= 0) {
    return "'" + valor;
  }
  return valor;
}

function hoy_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function aTexto_(valor, columna) {
  if (valor instanceof Date) {
    var f = (columna === 'MarcaTiempo' || columna === 'Fecha') ? 'yyyy-MM-dd HH:mm:ss' : 'yyyy-MM-dd';
    return Utilities.formatDate(valor, Session.getScriptTimeZone(), f);
  }
  return valor === null || valor === undefined ? '' : String(valor);
}

/** Todas las filas de una tabla, como objetos. */
function listarTodo_(entidad) {
  var sh = hoja_(entidad);
  var datos = sh.getDataRange().getValues();
  if (datos.length < 2) return [];
  var cab = datos[0], salida = [];
  for (var r = 1; r < datos.length; r++) {
    var o = {};
    for (var c = 0; c < cab.length; c++) { o[cab[c]] = aTexto_(datos[r][c], cab[c]); }
    salida.push(o);
  }
  return salida;
}

function buscarPorId_(entidad, id) {
  var filas = listarTodo_(entidad);
  for (var i = 0; i < filas.length; i++) {
    if (String(filas[i].ID) === String(id)) return filas[i];
  }
  return null;
}

/** Número de fila real en la planilla, o -1. */
function filaDe_(entidad, id) {
  var sh = hoja_(entidad);
  var datos = sh.getDataRange().getValues();
  var iID = datos[0].indexOf('ID');
  if (iID < 0) return -1;
  for (var r = 1; r < datos.length; r++) {
    if (String(datos[r][iID]) === String(id)) return r + 1;
  }
  return -1;
}

function insertar_(entidad, datos) {
  var sh = hoja_(entidad);
  var faltantes = (HOJAS[entidad].requeridos || []).filter(function (c) {
    return !datos[c] && datos[c] !== 0;
  });
  if (faltantes.length) throw new Error('Faltan datos obligatorios: ' + faltantes.join(', '));

  if (!datos.ID) datos.ID = nuevoId_(entidad.slice(0, 3).toUpperCase());

  /**
   * La fila se arma siguiendo el encabezado REAL de la hoja, no el orden en que
   * las columnas están declaradas en Modelos.gs.
   *
   * Cuando se suma una columna nueva a un modelo, hoja_ la agrega al final del
   * encabezado de las hojas que ya existen. Si acá usáramos el orden declarado,
   * a partir de ese momento cada alta escribiría los valores corridos de lugar:
   * el dato de una columna terminaría guardado en otra.
   */
  var cab = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var fila = cab.map(function (c) {
    if (c === 'MarcaTiempo') return new Date();
    return seguroParaCelda_(datos[c] !== undefined && datos[c] !== null ? datos[c] : '');
  });
  sh.appendRow(fila);
  return datos;
}

function actualizar_(entidad, id, cambios) {
  var sh = hoja_(entidad);
  var fila = filaDe_(entidad, id);
  if (fila < 0) throw new Error('No se encontró el registro ' + id);
  var cab = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var tocados = [];
  for (var campo in cambios) {
    var col = cab.indexOf(campo);
    if (col >= 0 && campo !== 'ID' && campo !== 'MarcaTiempo') {
      sh.getRange(fila, col + 1).setValue(seguroParaCelda_(cambios[campo]));
      tocados.push(campo);
    }
  }
  return { id: id, campos: tocados };
}

function eliminar_(entidad, id) {
  var fila = filaDe_(entidad, id);
  if (fila < 0) throw new Error('No se encontró el registro ' + id);
  hoja_(entidad).deleteRow(fila);
  return { id: id };
}

/**
 * Vínculos que impiden eliminar un registro.
 * Una planilla no protege sola estas relaciones, así que las cuidamos acá.
 */
var DEPENDENCIAS = {
  Empresas:   [{ entidad: 'Busquedas', campo: 'EmpresaID', nombre: 'búsquedas' },
               { entidad: 'Usuarios', campo: 'EmpresaID', nombre: 'usuarios' }],
  Busquedas:  [{ entidad: 'Candidatos', campo: 'BusquedaID', nombre: 'candidatos' },
               { entidad: 'Asignaciones', campo: 'BusquedaID', nombre: 'asignaciones' }],
  Usuarios:   [{ entidad: 'Candidatos', campo: 'ConsultorID', nombre: 'candidatos cargados' },
               { entidad: 'Asignaciones', campo: 'ConsultorID', nombre: 'asignaciones' }],
  Candidatos: [{ entidad: 'Observaciones', campo: 'CandidatoID', nombre: 'observaciones' }],
  Colaboradores: [{ entidad: 'Permisos', campo: 'ColaboradorID', nombre: 'permisos' }]
};

/**
 * Lo que no tiene sentido sin su padre y se borra con él.
 *
 * Es a propósito más corto que DEPENDENCIAS: una observación sin candidato no
 * es nada, pero una búsqueda sin empresa sigue siendo una búsqueda. Por eso
 * borrar una empresa no arrastra sus búsquedas —ahí el sistema avisa y pide
 * confirmación— y borrar un candidato sí se lleva sus comentarios, que es lo
 * que el propio mensaje de la pantalla viene prometiendo.
 */
var HIJOS_EN_CASCADA = {
  Candidatos:    [{ entidad: 'Observaciones', campo: 'CandidatoID' }],
  Busquedas:     [{ entidad: 'Asignaciones', campo: 'BusquedaID' }],
  Usuarios:      [{ entidad: 'Asignaciones', campo: 'ConsultorID' }],
  Colaboradores: [{ entidad: 'Permisos', campo: 'ColaboradorID' }]
};

/** Borra los registros que colgaban del que se acaba de eliminar. */
function borrarHijos_(entidad, id) {
  (HIJOS_EN_CASCADA[entidad] || []).forEach(function (regla) {
    listarTodo_(regla.entidad)
      .filter(function (f) { return String(f[regla.campo]) === String(id); })
      .forEach(function (f) {
        eliminar_(regla.entidad, f.ID);
        borrarAdjuntosDe_(regla.entidad, f.ID);
      });
  });
}

/** Cuenta qué quedaría huérfano si se borra este registro. */
function dependenciasDe_(entidad, id) {
  var reglas = DEPENDENCIAS[entidad] || [];
  var encontradas = [];
  reglas.forEach(function (regla) {
    var n = listarTodo_(regla.entidad).filter(function (f) {
      return String(f[regla.campo]) === String(id);
    }).length;
    if (n > 0) encontradas.push({ nombre: regla.nombre, cantidad: n });
  });
  return encontradas;
}
