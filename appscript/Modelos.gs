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

  /**
   * Enlaces guardados sobre cualquier registro del sistema.
   *
   * Es el "cajón" de la plataforma: en lugar de un único Link por ficha, cada
   * registro puede tener todos los enlaces que haga falta, con su nombre, igual
   * que los adjuntos de una tarjeta de Trello. Así el sistema deja de ser solo
   * un organizador y pasa a ser también el resguardo de dónde está cada cosa.
   *
   * No se lee ni se escribe con las acciones genéricas: tiene las suyas, que
   * antes de responder verifican el permiso sobre el registro al que cuelga.
   */
  Adjuntos: {
    cols: ['ID', 'Entidad', 'RegistroID', 'Titulo', 'URL', 'Tipo', 'ArchivoID',
           'Peso', 'Nota', 'AutorID', 'AutorNombre', 'Fecha'],
    requeridos: ['Entidad', 'RegistroID', 'URL']
  },

  /* ===================== MUNDO INTERNO (agenda RR.HH.) ===================== */
  /* Mismas columnas que la agenda actual, para poder migrar sin fricción.    */
  /* EmpresaID enlaza cada registro con el cliente de la hoja Empresas: es lo */
  /* que permite después filtrar el calendario y armar la ficha por empresa.  */

  Pendientes: {
    cols: ['ID', 'Titulo', 'Tipo', 'Detalle', 'Responsable', 'EmpresaID', 'Fecha', 'Estado', 'Observaciones', 'Link'],
    requeridos: ['Titulo']
  },
  Proyectos: {
    cols: ['ID', 'Proyecto', 'EmpresaID', 'Cliente', 'Linea', 'Responsable', 'Estado', 'FechaInicio', 'FechaFin', 'Avance', 'Observaciones', 'Link'],
    requeridos: ['Proyecto']
  },
  Viajes: {
    cols: ['ID', 'Viajero', 'Destino', 'Motivo', 'EmpresaID', 'Cliente', 'FechaSalida', 'FechaRegreso', 'Paga', 'Estado', 'Observaciones'],
    requeridos: ['Viajero', 'Destino']
  },
  Onboarding: {
    cols: ['ID', 'Tipo', 'Persona', 'EmpresaID', 'Empresa', 'Etapa', 'Responsable', 'Fecha', 'Estado', 'Observaciones', 'Link'],
    requeridos: ['Persona']
  },
  Capacitaciones: {
    cols: ['ID', 'Fecha', 'Tema', 'Linea', 'EmpresaID', 'Facilitador', 'Ambito', 'Formato', 'Observaciones', 'Link'],
    requeridos: ['Tema']
  },
  Comunicaciones: {
    cols: ['ID', 'Fecha', 'Titulo', 'Nivel', 'EmpresaID', 'Canal', 'Responsable', 'Resumen', 'Link'],
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
    cols: ['ID', 'Titulo', 'Tipo', 'Destinatario', 'EmpresaID', 'Estado', 'Responsable', 'Link', 'Fecha', 'Observaciones'],
    requeridos: ['Titulo']
  },

  /* ===================== PORTAL DEL CLIENTE ===================== */

  /**
   * Lo que el cliente pide. Es el corazón del portal: hasta ahora los pedidos
   * quedaban repartidos entre WhatsApp, mail y reuniones, y nadie podía decir
   * con certeza qué se había pedido, cuándo, ni en qué quedó.
   */
  Solicitudes: {
    cols: [
      'ID', 'EmpresaID', 'Categoria', 'Tipo', 'Titulo', 'Descripcion', 'Prioridad',
      'ResponsableCliente', 'ResponsableEscencial', 'FechaSolicitud', 'FechaEstimada',
      'Estado', 'AutorID', 'AutorNombre'
    ],
    requeridos: ['Tipo', 'Titulo']
  },

  /**
   * La conversación sobre un registro: cliente y equipo, ida y vuelta.
   *
   * Es distinta de Observaciones, que es de candidatos y tiene tres audiencias
   * —equipo, consultor y empresa— con su marca de Interna o Compartida. Acá la
   * conversación es entre dos partes y todo lo escrito lo ven las dos: mezclar
   * ambos modelos en una tabla sería pedir que un día se filtre lo que no debe.
   */
  Mensajes: {
    cols: ['ID', 'Entidad', 'RegistroID', 'Texto', 'AutorID', 'AutorNombre', 'RolAutor', 'Fecha'],
    requeridos: ['Entidad', 'RegistroID', 'Texto']
  },

  /* ===================== OBJETIVOS Y AVANCES ===================== */

  /**
   * Lo que alguien se propuso lograr, con su meta y su plazo.
   *
   * Sin una meta no hay "cuánto me falta" ni "mi mejor resultado": habría solo
   * una cuenta de actividad, que es exactamente lo que este tablero no quiere
   * ser. La meta es un número y la unidad la elige quien lo define.
   */
  Objetivos: {
    cols: [
      'ID', 'Titulo', 'Ambito', 'Colaborador', 'Alcance', 'Descripcion', 'Unidad',
      'MetaDiaria', 'MetaSemanal', 'MetaMensual',
      'MetaTrimestral', 'MetaSemestral', 'MetaAnual',
      'Meta', 'Frecuencia', 'Desde', 'Hasta', 'EmpresaID', 'Estado'
    ],
    requeridos: ['Titulo']
  },

  /**
   * Cada paso dado hacia un objetivo, con su fecha.
   *
   * Se guardan uno por uno y no como un total que se pisa, porque de las fechas
   * sale todo lo demás: la evolución del período, la comparación con el período
   * anterior y la marca a superar.
   */
  Avances: {
    cols: ['ID', 'ObjetivoID', 'Fecha', 'Cantidad', 'Nota', 'AutorID', 'AutorNombre'],
    requeridos: ['ObjetivoID', 'Cantidad']
  },

  /* ===================== NÓMINA DE PERSONAL ===================== */

  /**
   * Una fila por colaborador: lo que no cambia todos los días.
   * Los datos de liquidación viven acá pero no le llegan a cualquiera; ver
   * CAMPOS_SENSIBLES_NOMINA más abajo.
   */
  Colaboradores: {
    cols: [
      'ID', 'Nombre', 'DNI', 'FechaNacimiento', 'Correo', 'Telefono', 'Direccion', 'Localidad',
      'Puesto', 'Area', 'FechaIngreso', 'TipoContrato', 'Estado',
      'CUIL', 'Sueldo', 'Banco', 'CBU', 'ObraSocial',
      'TalleRemera', 'TallePantalon', 'TalleCalzado',
      'Observaciones'
    ],
    requeridos: ['Nombre']
  },

  /**
   * Cada permiso o licencia es su propio registro, porque se repiten en el
   * tiempo. Con las fechas de cada uno el calendario puede mostrar quién está
   * ausente cada día.
   */
  Permisos: {
    cols: ['ID', 'ColaboradorID', 'Tipo', 'Desde', 'Hasta', 'Dias', 'Estado', 'Motivo', 'Autoriza', 'Observaciones'],
    requeridos: ['ColaboradorID', 'Tipo', 'Desde']
  }
};

/**
 * Tablas del mundo interno que se pueden vincular a un cliente.
 * Es lo que junta la ficha de una empresa y lo que filtra el calendario.
 */
var ENTIDADES_POR_EMPRESA = [
  'Pendientes', 'Proyectos', 'Viajes', 'Onboarding',
  'Capacitaciones', 'Comunicaciones', 'Materiales'
];

/** Dónde se pueden colgar enlaces. Todo lo que se trabaja, menos la auditoría. */
var ENTIDADES_CON_ADJUNTOS = [
  'Empresas', 'Busquedas', 'Candidatos', 'Accesos',
  'Colaboradores', 'Permisos', 'Solicitudes', 'Objetivos'
].concat(ENTIDADES_POR_EMPRESA).concat(['Cumpleanos']);

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
var TIPOS_PENDIENTE = [
  'Entrega', 'Reunion', 'Reunion de alineamiento', 'Seguimiento',
  'Capacitación Incompany'
];
var ESTADOS_PENDIENTE = ['Pendiente', 'En curso', 'Finalizada'];
var ESTADOS_PROYECTO = ['Sin iniciar', 'En curso', 'En pausa', 'Finalizado'];
var TIPOS_ONBOARDING = ['Ingreso colaborador', 'Alta cliente', 'Manual de proceso', 'Politica'];
var AMBITOS = ['Interno', 'Externo', 'Ambos'];
var NIVELES_COMUNICACION = ['Informativo', 'Importante', 'Urgente'];
var TIPOS_CUMPLE = ['Cumpleaños de vida', 'Cumpleaños laboral'];
var DESTINATARIOS_MATERIAL = ['Interno', 'Docentes', 'Empresas'];
var ESTADOS_MATERIAL = ['Borrador', 'En revisión', 'Aprobado'];

/* Catálogos de objetivos. */
var FRECUENCIAS_OBJETIVO = ['Diario', 'Semanal', 'Mensual', 'Trimestral', 'Semestral', 'Anual'];

/**
 * A quién le corresponde un objetivo.
 *
 * Uno de persona es de esa persona; los demás son compartidos y los ve todo el
 * que participa. Es lo que permite proponerse algo como equipo sin convertirlo
 * en una comparación entre compañeros.
 */
var AMBITOS_OBJETIVO = ['Persona', 'Equipo', 'Area', 'Proyecto', 'Servicio'];
var ESTADOS_OBJETIVO = ['Activo', 'En pausa', 'Cerrado'];
var UNIDADES_OBJETIVO = ['Cantidad', 'Horas', 'Porcentaje', 'Pesos'];

/* Catálogos de la nómina. */
var TIPOS_PERMISO = [
  'Vacaciones', 'Licencia por enfermedad', 'Licencia por estudio',
  'Permiso personal', 'Maternidad / paternidad', 'Duelo', 'Sin goce de sueldo'
];
var ESTADOS_PERMISO = ['Solicitado', 'Aprobado', 'Rechazado', 'Tomado'];
var TIPOS_CONTRATO = ['Relación de dependencia', 'Monotributista', 'Pasantía', 'Eventual'];
var AREAS_TRABAJO = [
  'Dirección', 'Seleccion y reclutamiento', 'Consultoria externa',
  'Soluciones integrales', 'Administración'
];
var ESTADOS_COLABORADOR = ['Activo', 'Licencia', 'Baja'];

/**
 * Datos de liquidación. Están en la misma ficha porque pertenecen a la persona,
 * pero no salen del servidor para el equipo interno: no es desconfianza, es que
 * un sueldo o un CBU no hacen falta para el trabajo diario, y lo que no se envía
 * no se puede filtrar.
 */
var CAMPOS_SENSIBLES_NOMINA = ['CUIL', 'Sueldo', 'Banco', 'CBU'];

/* Catálogos del portal del cliente. */
var CATEGORIAS_SOLICITUD = ['Seleccion y reclutamiento', 'Consultoria integral'];

var TIPOS_SOLICITUD = [
  // Selección y reclutamiento
  'Nueva busqueda laboral', 'Reemplazo de una posicion',
  'Ampliacion o modificacion de una busqueda', 'Solicitud de candidatos',
  'Consulta sobre un proceso', 'Feedback de candidatos', 'Solicitud de referencias',
  // Consultoría integral
  'Solicitud de diagnostico', 'Solicitud de reunion', 'Solicitud de capacitacion',
  'Solicitud de evaluacion', 'Solicitud de informe',
  'Intervencion sobre un area', 'Nueva necesidad o proyecto'
];

/** El flujo del pedido, de punta a punta. */
var ESTADOS_SOLICITUD = [
  'Nueva', 'Recibida', 'En analisis', 'En proceso', 'Pendiente cliente', 'Finalizada'
];
var PRIORIDADES = ['Baja', 'Normal', 'Alta', 'Urgente'];

/** Estados en los que el pedido sigue vivo, para contarlos en el tablero. */
var ESTADOS_SOLICITUD_ABIERTA = ['Nueva', 'Recibida', 'En analisis', 'En proceso', 'Pendiente cliente'];

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
    Usuarios: ['Salt', 'Hash', 'Correo'],
    /**
     * El cliente ve su proyecto y su capacitación, pero no las notas que el
     * equipo escribe al costado para trabajar. El avance sí: eso es lo que le
     * interesa y lo que se le viene contando por mail.
     */
    Proyectos: ['Observaciones'],
    Capacitaciones: ['Observaciones']
  },
  Consultor: {
    Usuarios: ['Salt', 'Hash']
  },
  Interno: {
    Usuarios: ['Salt', 'Hash'],
    Colaboradores: CAMPOS_SENSIBLES_NOMINA
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
