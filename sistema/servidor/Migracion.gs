/**
 * MIGRACIÓN · Trae los datos del sistema anterior a la estructura nueva.
 *
 * Se ejecuta UNA sola vez, a mano, desde el editor o desde el menú de la planilla.
 * No borra nada: renombra las hojas viejas con el sufijo "anterior" y las deja
 * ahí por si hace falta volver a mirarlas.
 *
 * Qué hace con cada cosa:
 *   Consultores  → Usuarios con rol Consultor (sin contraseña: entran con su correo)
 *   Busquedas    → Busquedas, con la provincia normalizada
 *   la columna de consultores asignados → filas en Asignaciones
 *   Candidatos   → Candidatos, enlazados por puesto y por consultor
 */

var VIEJAS = ['Busquedas', 'Candidatos', 'Consultores'];

/** Provincias escritas de distinta forma: se unifican al migrar. */
function normalizarProvincia_(valor) {
  var v = String(valor || '').trim();
  if (!v) return '';
  var mapa = {
    'salta': 'Salta', 'jujuy': 'Jujuy', 'tucuman': 'Tucumán', 'tucumán': 'Tucumán',
    'buenos aires': 'Buenos Aires', 'caba': 'CABA', 'cordoba': 'Córdoba', 'córdoba': 'Córdoba',
    'rio negro': 'Río Negro', 'río negro': 'Río Negro', 'santa fe': 'Santa Fe',
    'mendoza': 'Mendoza', 'chaco': 'Chaco', 'misiones': 'Misiones', 'bolivia': 'Bolivia'
  };
  return mapa[v.toLowerCase()] || (v.charAt(0).toUpperCase() + v.slice(1).toLowerCase());
}

/** Los estados de candidato del sistema viejo, en el vocabulario nuevo. */
function normalizarEtapaCandidato_(valor) {
  var v = String(valor || '').toLowerCase();
  if (v.indexOf('rechaz') >= 0) return 'Rechazado';
  if (v.indexOf('contrat') >= 0) return 'Contratado';
  if (v.indexOf('terna') >= 0) return 'Terna';
  if (v.indexOf('entrevista') >= 0) return 'Entrevista inicial';
  if (v.indexOf('prueba') >= 0 || v.indexOf('tecnic') >= 0) return 'Pruebas tecnicas';
  return 'En revision';
}

function leerHojaCruda_(nombre) {
  var sh = ss_().getSheetByName(nombre);
  if (!sh || sh.getLastRow() < 2) return [];
  var datos = sh.getDataRange().getValues();
  datos.shift();
  return datos;
}

/** ¿Esta hoja es del formato viejo? */
function esFormatoViejo_(nombre) {
  var sh = ss_().getSheetByName(nombre);
  if (!sh || sh.getLastRow() < 1) return false;
  return sh.getRange(1, 1).getValue() !== 'MarcaTiempo';
}

function migrarDatosAnteriores() {
  var ss = ss_();
  var informe = [];

  /* 1 · Guardar las hojas viejas antes de crear las nuevas. */
  var crudos = {};
  VIEJAS.forEach(function (nombre) {
    if (esFormatoViejo_(nombre)) {
      crudos[nombre] = leerHojaCruda_(nombre);
      var sh = ss.getSheetByName(nombre);
      var destino = nombre + ' anterior';
      if (ss.getSheetByName(destino)) ss.deleteSheet(ss.getSheetByName(destino));
      sh.setName(destino);
      informe.push('Se conservó "' + destino + '" con ' + crudos[nombre].length + ' filas.');
    } else {
      crudos[nombre] = [];
    }
  });

  /* 2 · Crear la estructura nueva, ya sin conflicto de nombres. */
  inicializarSistema();

  /* 3 · Consultores → Usuarios. Sin contraseña: entran con su correo. */
  var correosVistos = {};
  var consultoresPorNombre = {};
  (crudos['Consultores'] || []).forEach(function (fila) {
    var nombre = String(fila[0] || '').trim();
    var correo = String(fila[1] || '').trim().toLowerCase();
    if (!nombre && !correo) return;
    if (correo && correosVistos[correo]) return;      // el mismo correo cargado dos veces
    correosVistos[correo] = true;

    var creado = insertar_('Usuarios', {
      Usuario: correo.split('@')[0],
      Nombre: nombre,
      Correo: correo,
      Rol: 'Consultor',
      Estado: 'Activo'
    });
    consultoresPorNombre[nombre.toLowerCase()] = creado.ID;
  });
  informe.push('Usuarios creados: ' + Object.keys(consultoresPorNombre).length +
               ' (sin contraseña, entran con su correo).');

  /* 4 · Búsquedas. Se guarda a qué ID nuevo corresponde cada puesto. */
  var busquedaPorPuesto = {};
  var asignadas = 0;
  (crudos['Busquedas'] || []).forEach(function (fila) {
    var puesto = String(fila[1] || '').trim();
    if (!puesto) return;

    var creada = insertar_('Busquedas', {
      Puesto: puesto,
      Provincia: normalizarProvincia_(fila[4]),
      Descripcion: String(fila[3] || ''),
      Etapa: 'Relevamiento del perfil',
      Estado: String(fila[5] || 'Activa'),
      FechaAlta: fila[2] instanceof Date
        ? Utilities.formatDate(fila[2], Session.getScriptTimeZone(), 'yyyy-MM-dd')
        : hoy_()
    });
    busquedaPorPuesto[puesto.toLowerCase()] = creada.ID;

    // La celda con nombres separados por comas pasa a ser una fila por consultor.
    String(fila[6] || '').split(',').forEach(function (nombre) {
      var id = consultoresPorNombre[nombre.trim().toLowerCase()];
      if (!id) return;
      insertar_('Asignaciones', {
        BusquedaID: creada.ID, ConsultorID: id, FechaAsignacion: hoy_()
      });
      asignadas++;
    });
  });
  informe.push('Búsquedas migradas: ' + Object.keys(busquedaPorPuesto).length +
               ', con ' + asignadas + ' asignaciones.');

  /* 5 · Candidatos. */
  var migrados = 0, sinBusqueda = 0, duplicados = 0;
  var dnisVistos = {};
  (crudos['Candidatos'] || []).forEach(function (fila) {
    var dni = String(fila[0] || '').trim();
    if (!dni) return;
    if (dnisVistos[dni]) { duplicados++; return; }
    dnisVistos[dni] = true;

    var puesto = String(fila[2] || '').trim().toLowerCase();
    var busquedaId = busquedaPorPuesto[puesto];
    if (!busquedaId) { sinBusqueda++; return; }

    insertar_('Candidatos', {
      DNI: dni,
      Nombre: String(fila[1] || ''),
      BusquedaID: busquedaId,
      ConsultorID: consultoresPorNombre[String(fila[3] || '').trim().toLowerCase()] || '',
      LinkCV: String(fila[4] || ''),
      LinkVideo: String(fila[5] || ''),
      Etapa: normalizarEtapaCandidato_(fila[6]),
      Provincia: normalizarProvincia_(fila[7]),
      FechaCarga: hoy_()
    });
    migrados++;
  });
  informe.push('Candidatos migrados: ' + migrados +
               (duplicados ? ' · documentos repetidos omitidos: ' + duplicados : '') +
               (sinBusqueda ? ' · sin búsqueda coincidente: ' + sinBusqueda : ''));

  informe.push('');
  informe.push('Falta: crear los accesos de Administración, del equipo interno y de las empresas.');

  var texto = informe.join('\n');
  Logger.log(texto);
  return texto;
}

/** Deja ver el resultado sin salir de la planilla. */
function migrarYMostrar() {
  var resultado = migrarDatosAnteriores();
  SpreadsheetApp.getUi().alert('Migración terminada', resultado, SpreadsheetApp.getUi().ButtonSet.OK);
}
