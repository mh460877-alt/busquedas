/**
 * SHEETS · Lectura y escritura sobre la planilla.
 *
 * Nadie más toca SpreadsheetApp: todas las tablas pasan por acá.
 * Es la capa que en el sistema de referencia resuelve mongoose.
 */

function ss_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * MEMORIA DE LA EJECUCIÓN
 *
 * Cada pedido a Apps Script arranca un proceso nuevo, así que esto no guarda
 * nada entre usuarios ni entre llamadas: sirve para no volver a leer la misma
 * hoja dos veces dentro del mismo pedido.
 *
 * Y eso pasaba todo el tiempo. Listar una tabla ya la lee entera; después el
 * filtro de pertenencia vuelve a leerla, el control de alcance otra vez, y una
 * pantalla que muestra cuatro tablas relacionadas terminaba abriendo la misma
 * planilla diez veces. Con pocos datos igual se nota, porque lo que cuesta no
 * son las filas sino cada viaje a la planilla.
 *
 * Cualquier escritura borra lo memorizado: es preferible releer que contestar
 * con algo que ya cambió.
 */
var _cacheHoja = {};
var _cacheDatos = {};
var _cacheFilas = {};
var _validada = {};

function olvidarCache_(entidad) {
  if (entidad) {
    delete _cacheDatos[entidad];
    delete _cacheFilas[entidad];
  } else {
    _cacheDatos = {};
    _cacheFilas = {};
  }
}

/**
 * El contenido completo de la hoja: encabezado y filas, en UNA sola lectura.
 *
 * Acá estaba el costo escondido. Medido contra el servidor real, cada tabla
 * suma unos 800 ms al pedido tenga ocho filas o ninguna, porque lo que se paga
 * es el viaje a la planilla. Y el código hacía tres viajes por tabla: uno para
 * ubicar la hoja, otro para leer el encabezado y otro para leer las filas.
 *
 * getDataRange ya trae el encabezado en su primera fila, así que el viaje del
 * medio sobraba: leer todo junto y repartirlo después sale igual de barato que
 * leer solo los títulos.
 */
function datosDe_(entidad) {
  if (!_cacheDatos[entidad]) {
    _cacheDatos[entidad] = hoja_(entidad).getDataRange().getValues();
  }
  return _cacheDatos[entidad];
}

/** El encabezado real de la hoja, sin leerla de nuevo. */
function encabezado_(entidad) {
  var datos = datosDe_(entidad);
  return datos.length ? datos[0] : columnasDe(entidad);
}

/**
 * Devuelve la hoja, creándola si no existe y verificando su encabezado una
 * sola vez por pedido.
 */
function hoja_(entidad) {
  var sh = _cacheHoja[entidad];
  if (!sh) {
    var ss = ss_();
    sh = ss.getSheetByName(entidad);
    if (!sh) {
      // Si dos llamadas concurrentes intentan crearla a la vez, la segunda
      // falla; en ese caso se usa la que acaba de crear la otra.
      try {
        sh = ss.insertSheet(entidad);
      } catch (e) {
        sh = ss.getSheetByName(entidad);
        if (!sh) throw e;
      }
    }
    _cacheHoja[entidad] = sh;
  }
  if (!_validada[entidad]) {
    _validada[entidad] = true;   // antes de verificar, para no entrar en bucle
    verificarEncabezado_(entidad, sh);
  }
  return sh;
}

/** Crea o completa los títulos de la hoja según el modelo. */
function verificarEncabezado_(entidad, sh) {
  var cols = columnasDe(entidad);
  var datos = datosDe_(entidad);
  var actual = datos.length ? datos[0] : [];

  if (!actual.length || actual[0] !== 'MarcaTiempo') {
    /**
     * Protección: si la hoja ya tiene datos con otra estructura, es una hoja
     * del sistema anterior. Escribirle los encabezados nuevos encima dejaría
     * las filas desalineadas. Se frena y se pide migrar primero.
     */
    if (datos.length > 1) {
      throw new Error(
        'La hoja "' + entidad + '" ya tiene datos con otra estructura. ' +
        'Ejecutá migrarDatosAnteriores antes de inicializar el sistema.'
      );
    }
    var rng = sh.getRange(1, 1, 1, cols.length);
    rng.setValues([cols]);
    rng.setFontWeight('bold').setFontColor('#ffffff').setBackground('#1C5A4A');
    sh.setFrozenRows(1);
    _cacheDatos[entidad] = [cols.slice()];
    return;
  }

  var faltan = cols.filter(function (c) { return actual.indexOf(c) < 0; });
  if (faltan.length) {
    var r2 = sh.getRange(1, actual.length + 1, 1, faltan.length);
    r2.setValues([faltan]);
    r2.setFontWeight('bold').setFontColor('#ffffff').setBackground('#1C5A4A');
    datos[0] = actual.concat(faltan);
  }
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

/**
 * Todas las filas de una tabla, como objetos.
 *
 * Devuelve copias y no las filas memorizadas: quien las recibe a veces las
 * modifica —agregar un indicador, descifrar una contraseña— y esos retoques no
 * deben quedar pegados para el resto del pedido.
 */
function listarTodo_(entidad) {
  if (!_cacheFilas[entidad]) {
    var datos = datosDe_(entidad);
    var salida = [];
    if (datos.length >= 2) {
      var cab = datos[0];
      for (var r = 1; r < datos.length; r++) {
        var o = {};
        for (var c = 0; c < cab.length; c++) { o[cab[c]] = aTexto_(datos[r][c], cab[c]); }
        salida.push(o);
      }
    }
    _cacheFilas[entidad] = salida;
  }
  return _cacheFilas[entidad].map(function (f) {
    var copia = {};
    for (var k in f) copia[k] = f[k];
    return copia;
  });
}

function buscarPorId_(entidad, id) {
  var filas = listarTodo_(entidad);
  for (var i = 0; i < filas.length; i++) {
    if (String(filas[i].ID) === String(id)) return filas[i];
  }
  return null;
}

/**
 * Número de fila real en la planilla, o -1.
 * Se apoya en lo ya leído en vez de volver a bajar toda la hoja: las filas
 * vienen en el mismo orden que la planilla, y la primera es la 2 porque la 1
 * es el encabezado.
 */
function filaDe_(entidad, id) {
  var filas = listarTodo_(entidad);
  for (var i = 0; i < filas.length; i++) {
    if (String(filas[i].ID) === String(id)) return i + 2;
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
  var fila = encabezado_(entidad).map(function (c) {
    if (c === 'MarcaTiempo') return new Date();
    return seguroParaCelda_(datos[c] !== undefined && datos[c] !== null ? datos[c] : '');
  });
  sh.appendRow(fila);
  olvidarCache_(entidad);
  return datos;
}

function actualizar_(entidad, id, cambios) {
  var sh = hoja_(entidad);
  var fila = filaDe_(entidad, id);
  if (fila < 0) throw new Error('No se encontró el registro ' + id);
  var cab = encabezado_(entidad);
  var tocados = [];
  for (var campo in cambios) {
    var col = cab.indexOf(campo);
    if (col >= 0 && campo !== 'ID' && campo !== 'MarcaTiempo') {
      sh.getRange(fila, col + 1).setValue(seguroParaCelda_(cambios[campo]));
      tocados.push(campo);
    }
  }
  olvidarCache_(entidad);
  return { id: id, campos: tocados };
}

function eliminar_(entidad, id) {
  var fila = filaDe_(entidad, id);
  if (fila < 0) throw new Error('No se encontró el registro ' + id);
  hoja_(entidad).deleteRow(fila);
  olvidarCache_(entidad);
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
  Colaboradores: [{ entidad: 'Permisos', campo: 'ColaboradorID', nombre: 'permisos' }],
  Objetivos:  [{ entidad: 'Avances', campo: 'ObjetivoID', nombre: 'avances registrados' }]
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
  Colaboradores: [{ entidad: 'Permisos', campo: 'ColaboradorID' }],
  Objetivos:     [{ entidad: 'Avances', campo: 'ObjetivoID' }]
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
