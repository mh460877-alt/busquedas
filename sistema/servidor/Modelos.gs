/**
 * MODELOS · Definición de las tablas y los catálogos.
 *
 * Este es el único lugar donde se declara qué columnas tiene cada hoja.
 * Equivale a la carpeta models/ del sistema de referencia.
 * Toda hoja arranca con MarcaTiempo; el resto son las columnas declaradas acá.
 */

var HOJAS = {
  Usuarios: {
    cols: ['ID', 'Usuario', 'Nombre', 'Correo', 'Rol', 'EmpresaID', 'Salt', 'Hash', 'Estado'],
    requeridos: ['Nombre', 'Rol']
  },
  Empresas: {
    cols: ['ID', 'Nombre', 'Linea', 'Contacto', 'Email', 'Telefono', 'Estado', 'LinkInformes', 'LinkCVs', 'FechaAlta'],
    requeridos: ['Nombre']
  },
  Busquedas: {
    cols: ['ID', 'Puesto', 'EmpresaID', 'Provincia', 'Descripcion', 'Etapa', 'Estado', 'Responsable', 'FechaAlta', 'FechaCierre'],
    requeridos: ['Puesto']
  },
  Asignaciones: {
    cols: ['ID', 'BusquedaID', 'ConsultorID', 'FechaAsignacion'],
    requeridos: ['BusquedaID', 'ConsultorID']
  },
  Candidatos: {
    cols: ['ID', 'DNI', 'Nombre', 'BusquedaID', 'ConsultorID', 'LinkCV', 'LinkVideo', 'LinkInforme', 'Etapa', 'Provincia', 'FechaCarga', 'Estado'],
    requeridos: ['DNI', 'Nombre', 'BusquedaID']
  },
  Observaciones: {
    cols: ['ID', 'CandidatoID', 'AutorID', 'RolAutor', 'Texto', 'Visibilidad', 'Fecha'],
    requeridos: ['CandidatoID', 'Texto']
  },
  Auditoria: {
    cols: ['ID', 'Fecha', 'UsuarioID', 'UsuarioNombre', 'Accion', 'Entidad', 'RegistroID', 'Detalle'],
    requeridos: []
  },

  /* ===================== MUNDO INTERNO (agenda RR.HH.) ===================== */
  /* Mismas columnas que la agenda actual, para poder migrar sin fricción.    */

  Pendientes: {
    cols: ['ID', 'Titulo', 'Tipo', 'Responsable', 'Fecha', 'Estado', 'Observaciones', 'Link'],
    requeridos: ['Titulo']
  },
  Proyectos: {
    cols: ['ID', 'Proyecto', 'Cliente', 'Linea', 'Responsable', 'Estado', 'FechaInicio', 'FechaFin', 'Avance', 'Observaciones', 'Link'],
    requeridos: ['Proyecto']
  },
  Viajes: {
    cols: ['ID', 'Viajero', 'Destino', 'Motivo', 'Cliente', 'FechaSalida', 'FechaRegreso', 'Paga', 'Estado', 'Observaciones'],
    requeridos: ['Viajero', 'Destino']
  },
  Onboarding: {
    cols: ['ID', 'Tipo', 'Persona', 'Empresa', 'Etapa', 'Responsable', 'Fecha', 'Estado', 'Observaciones', 'Link'],
    requeridos: ['Persona']
  },
  Capacitaciones: {
    cols: ['ID', 'Fecha', 'Tema', 'Linea', 'Facilitador', 'Ambito', 'Formato', 'Observaciones', 'Link'],
    requeridos: ['Tema']
  },
  Comunicaciones: {
    cols: ['ID', 'Fecha', 'Titulo', 'Nivel', 'Canal', 'Responsable', 'Resumen', 'Link'],
    requeridos: ['Titulo']
  },
  Cumpleanos: {
    cols: ['ID', 'Tipo', 'Persona', 'Fecha', 'Area'],
    requeridos: ['Persona', 'Fecha']
  },
  Accesos: {
    cols: ['ID', 'Sistema', 'Tipo', 'Usuario', 'Clave', 'URL', 'Owner', 'Notas', 'ProximaRotacion'],
    requeridos: ['Sistema']
  },
  Materiales: {
    cols: ['ID', 'Titulo', 'Tipo', 'Destinatario', 'Estado', 'Responsable', 'Link', 'Fecha', 'Observaciones'],
    requeridos: ['Titulo']
  }
};

/* ============================ CATÁLOGOS ============================ */

var ROLES = ['Admin', 'Interno', 'Consultor', 'Empresa'];

/** Etapas del proceso de selección, en orden. */
var ETAPAS_BUSQUEDA = [
  'Relevamiento del perfil', 'Busqueda activa', 'Filtro de CV', 'Entrevista',
  'Evaluaciones', 'Terna', 'Terna final', 'Contratacion', 'Cerrada'
];

/** Etapas por las que pasa un candidato. */
var ETAPAS_CANDIDATO = [
  'En revision', 'Entrevista inicial', 'Pruebas tecnicas', 'Terna',
  'Terna final', 'Contratado', 'Rechazado'
];

/**
 * DEFINICIÓN 1 · Desde qué etapa ve la empresa a un candidato.
 * Antes de terna, la empresa no ve nada: es trabajo en crudo.
 */
var ETAPAS_VISIBLES_EMPRESA = ['Terna', 'Terna final', 'Contratado'];

/* Catálogos del mundo interno. */
var TIPOS_PENDIENTE = ['Entrega', 'Reunion', 'Reunion de alineamiento', 'Seguimiento', 'Comodin'];
var ESTADOS_PENDIENTE = ['Pendiente', 'En curso', 'Finalizada'];
var ESTADOS_PROYECTO = ['Sin iniciar', 'En curso', 'En pausa', 'Finalizado'];
var TIPOS_ONBOARDING = ['Ingreso colaborador', 'Alta cliente', 'Manual de proceso', 'Politica'];
var AMBITOS = ['Interno', 'Externo', 'Ambos'];
var NIVELES_COMUNICACION = ['Informativo', 'Importante', 'Urgente'];
var TIPOS_CUMPLE = ['Cumpleaños de vida', 'Cumpleaños laboral'];
var DESTINATARIOS_MATERIAL = ['Interno', 'Docentes', 'Empresas'];
var ESTADOS_MATERIAL = ['Borrador', 'En revisión', 'Aprobado'];

var ESTADOS_BUSQUEDA = ['Activa', 'Deshabilitada', 'Cerrada'];
var ESTADOS_GENERALES = ['Activo', 'Baja'];
var ESTADOS_EMPRESA = ['Activo', 'En pausa', 'Cerrado'];
var LINEAS = ['Seleccion y reclutamiento', 'Consultoria externa', 'Soluciones integrales', 'Transversal'];
var VISIBILIDAD_OBS = ['Interna', 'Compartida'];

/**
 * DEFINICIONES 2 y 3 · Campos que nunca se le envían a una empresa.
 * ConsultorID expondría con qué partner externo trabaja la consultora.
 * DNI es un dato personal que la empresa no necesita para decidir.
 */
var CAMPOS_OCULTOS = {
  Empresa: {
    Candidatos: ['DNI', 'ConsultorID'],
    Usuarios: ['Salt', 'Hash', 'Correo']
  },
  Consultor: {
    Usuarios: ['Salt', 'Hash']
  },
  Interno: {
    Usuarios: ['Salt', 'Hash']
  },
  Admin: {
    Usuarios: ['Salt', 'Hash']
  }
};

/** Devuelve las columnas reales de una hoja, con MarcaTiempo al frente. */
function columnasDe(entidad) {
  if (!HOJAS.hasOwnProperty(entidad)) throw new Error('Tabla no reconocida: ' + entidad);
  return ['MarcaTiempo'].concat(HOJAS[entidad].cols);
}

/** Quita de un registro los campos que ese rol no debe recibir. */
function proyectar(rol, entidad, fila) {
  var ocultos = (CAMPOS_OCULTOS[rol] || {})[entidad];
  if (!ocultos || !fila) return fila;
  var copia = {};
  for (var k in fila) { if (ocultos.indexOf(k) < 0) copia[k] = fila[k]; }
  return copia;
}
