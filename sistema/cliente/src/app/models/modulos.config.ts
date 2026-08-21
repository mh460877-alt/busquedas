import { ConfigModulo } from './modulo';

/**
 * Definición de los módulos del mundo interno (agenda RR.HH.).
 * Cada uno es una tabla CRUD; el componente genérico los dibuja a todos.
 * Solo los ven Administración e Interno.
 */
export const MODULOS: { [ruta: string]: ConfigModulo } = {

  pendientes: {
    entidad: 'Pendientes', titulo: 'Pendientes y actividades', icono: 'fa-tasks',
    descripcion: 'Lo que cada persona está trabajando, con su estado.',
    campoEstado: 'Estado',
    campos: [
      { clave: 'Titulo', etiqueta: 'Actividad', tipo: 'texto', enTabla: true, requerido: true },
      { clave: 'Tipo', etiqueta: 'Tipo', tipo: 'select', catalogo: 'tiposPendiente', enTabla: true },
      {
        clave: 'Detalle', etiqueta: 'Detalle', tipo: 'texto', enTabla: true,
        // Para precisar el tipo cuando la lista se queda corta: elegís
        // "Capacitación Incompany" y acá escribís de quién.
        ayuda: 'Ej.: Incompany Clínica Ledesma'
      },
      { clave: 'Responsable', etiqueta: 'Responsable', tipo: 'select', catalogo: 'equipo', enTabla: true },
      { clave: 'EmpresaID', etiqueta: 'Empresa / cliente', tipo: 'referencia', refCatalogo: 'empresas', enTabla: true },
      { clave: 'Fecha', etiqueta: 'Fecha', tipo: 'fecha', enTabla: true },
      { clave: 'Estado', etiqueta: 'Estado', tipo: 'select', catalogo: 'estadosPendiente', enTabla: true, badge: true },
      { clave: 'Observaciones', etiqueta: 'Observaciones', tipo: 'textarea' },
      { clave: 'Link', etiqueta: 'Enlace', tipo: 'url' }
    ]
  },

  proyectos: {
    entidad: 'Proyectos', titulo: 'Proyectos', icono: 'fa-diagram-project',
    descripcion: 'Consultoría Integral: qué se busca lograr, en qué etapa está y qué se entregó.',
    campoEstado: 'Estado',
    campos: [
      { clave: 'Proyecto', etiqueta: 'Proyecto', tipo: 'texto', enTabla: true, requerido: true },
      { clave: 'EmpresaID', etiqueta: 'Cliente', tipo: 'referencia', refCatalogo: 'empresas', enTabla: true },
      { clave: 'Linea', etiqueta: 'Línea', tipo: 'select', catalogo: 'lineas' },
      { clave: 'Responsable', etiqueta: 'Responsable', tipo: 'select', catalogo: 'equipo', enTabla: true },

      { clave: 'Objetivo', etiqueta: 'Objetivo', tipo: 'textarea', ayuda: 'Qué se busca lograr' },
      { clave: 'Alcance', etiqueta: 'Alcance', tipo: 'textarea', ayuda: 'Hasta dónde llega el servicio' },
      { clave: 'Etapa', etiqueta: 'Etapa', tipo: 'select', catalogo: 'etapasProyecto', enTabla: true, badge: true },
      { clave: 'Porcentaje', etiqueta: 'Avance (%)', tipo: 'texto', enTabla: true, ayuda: 'Un número de 0 a 100' },
      { clave: 'Estado', etiqueta: 'Estado', tipo: 'select', catalogo: 'estadosProyecto', enTabla: true, badge: true },

      { clave: 'FechaInicio', etiqueta: 'Inicio', tipo: 'fecha' },
      { clave: 'FechaFin', etiqueta: 'Cierre', tipo: 'fecha', enTabla: true },

      { clave: 'Avance', etiqueta: 'Avance / devolución', tipo: 'textarea', ayuda: 'Lo ve el cliente' },
      { clave: 'Entregables', etiqueta: 'Entregables', tipo: 'textarea', ayuda: 'Lo ve el cliente' },
      { clave: 'Resultados', etiqueta: 'Resultados', tipo: 'textarea', ayuda: 'Lo ve el cliente' },
      // Observaciones queda para el equipo: el servidor no se lo manda al cliente.
      { clave: 'Observaciones', etiqueta: 'Observaciones internas', tipo: 'textarea' },
      { clave: 'Link', etiqueta: 'Enlace', tipo: 'url' }
    ]
  },

  viajes: {
    entidad: 'Viajes', titulo: 'Viajes', icono: 'fa-plane',
    descripcion: 'Quién viaja, a dónde, cuándo sale y vuelve.',
    campoEstado: 'Estado',
    campos: [
      { clave: 'Viajero', etiqueta: 'Viajero/a', tipo: 'select', catalogo: 'equipo', enTabla: true, requerido: true },
      { clave: 'Destino', etiqueta: 'Destino', tipo: 'texto', enTabla: true, requerido: true },
      { clave: 'EmpresaID', etiqueta: 'Cliente', tipo: 'referencia', refCatalogo: 'empresas', enTabla: true },
      { clave: 'Motivo', etiqueta: 'Motivo', tipo: 'texto' },
      { clave: 'FechaSalida', etiqueta: 'Salida', tipo: 'fecha', enTabla: true },
      { clave: 'FechaRegreso', etiqueta: 'Regreso', tipo: 'fecha', enTabla: true },
      { clave: 'Paga', etiqueta: 'Quién paga', tipo: 'texto' },
      { clave: 'Estado', etiqueta: 'Estado', tipo: 'select', opciones: ['Programado', 'En curso', 'Finalizada'], enTabla: true, badge: true },
      { clave: 'Observaciones', etiqueta: 'Observaciones', tipo: 'textarea' }
    ]
  },

  onboarding: {
    entidad: 'Onboarding', titulo: 'Onboarding', icono: 'fa-clipboard-check',
    descripcion: 'Altas de colaboradores y clientes, con su fecha de referencia.',
    campoEstado: 'Estado',
    campos: [
      { clave: 'Tipo', etiqueta: 'Tipo', tipo: 'select', catalogo: 'tiposOnboarding', enTabla: true },
      { clave: 'Persona', etiqueta: 'Persona / entidad', tipo: 'texto', enTabla: true, requerido: true },
      { clave: 'EmpresaID', etiqueta: 'Empresa', tipo: 'referencia', refCatalogo: 'empresas', enTabla: true },
      { clave: 'Etapa', etiqueta: 'Etapa', tipo: 'texto' },
      { clave: 'Responsable', etiqueta: 'Responsable', tipo: 'select', catalogo: 'equipo' },
      { clave: 'Fecha', etiqueta: 'Fecha de alta', tipo: 'fecha', enTabla: true },
      { clave: 'Estado', etiqueta: 'Estado', tipo: 'select', opciones: ['En proceso', 'Completado'], enTabla: true, badge: true },
      { clave: 'Observaciones', etiqueta: 'Observaciones', tipo: 'textarea' },
      { clave: 'Link', etiqueta: 'Enlace', tipo: 'url' }
    ]
  },

  capacitaciones: {
    entidad: 'Capacitaciones', titulo: 'Capacitaciones', icono: 'fa-graduation-cap',
    descripcion: 'Fechas de formación, internas y externas.',
    campos: [
      { clave: 'Fecha', etiqueta: 'Fecha', tipo: 'fecha', enTabla: true },
      { clave: 'Tema', etiqueta: 'Tema', tipo: 'texto', enTabla: true, requerido: true },
      { clave: 'Linea', etiqueta: 'Línea', tipo: 'select', catalogo: 'lineas' },
      { clave: 'EmpresaID', etiqueta: 'Empresa / cliente', tipo: 'referencia', refCatalogo: 'empresas', enTabla: true },
      { clave: 'Facilitador', etiqueta: 'Facilitador/a', tipo: 'select', catalogo: 'equipo', enTabla: true },
      { clave: 'Ambito', etiqueta: 'Ámbito', tipo: 'select', catalogo: 'ambitos', enTabla: true, badge: true },
      { clave: 'Formato', etiqueta: 'Formato', tipo: 'texto' },
      { clave: 'Observaciones', etiqueta: 'Observaciones', tipo: 'textarea' },
      { clave: 'Link', etiqueta: 'Enlace', tipo: 'url' }
    ]
  },

  comunicaciones: {
    entidad: 'Comunicaciones', titulo: 'Comunicaciones internas', icono: 'fa-bullhorn',
    descripcion: 'Lo que se comunica al equipo, para que quede constancia.',
    campos: [
      { clave: 'Fecha', etiqueta: 'Fecha', tipo: 'fecha', enTabla: true },
      { clave: 'Titulo', etiqueta: 'Título', tipo: 'texto', enTabla: true, requerido: true },
      { clave: 'Nivel', etiqueta: 'Nivel', tipo: 'select', catalogo: 'nivelesComunicacion', enTabla: true, badge: true },
      { clave: 'EmpresaID', etiqueta: 'Empresa / cliente', tipo: 'referencia', refCatalogo: 'empresas', enTabla: true },
      { clave: 'Canal', etiqueta: 'Canal', tipo: 'texto', enTabla: true },
      { clave: 'Responsable', etiqueta: 'Responsable', tipo: 'select', catalogo: 'equipo' },
      { clave: 'Resumen', etiqueta: 'Resumen', tipo: 'textarea' },
      { clave: 'Link', etiqueta: 'Enlace', tipo: 'url' }
    ]
  },

  cumpleanos: {
    entidad: 'Cumpleanos', titulo: 'Cumpleaños', icono: 'fa-cake-candles',
    descripcion: 'De vida y laborales. Se cargan una vez.',
    campos: [
      { clave: 'Tipo', etiqueta: 'Tipo', tipo: 'select', catalogo: 'tiposCumple', enTabla: true, badge: true },
      { clave: 'Persona', etiqueta: 'Persona', tipo: 'texto', enTabla: true, requerido: true },
      { clave: 'Fecha', etiqueta: 'Fecha', tipo: 'fecha', enTabla: true },
      { clave: 'Area', etiqueta: 'Área', tipo: 'texto', enTabla: true }
    ]
  },

  boveda: {
    entidad: 'Accesos', titulo: 'Bóveda de contraseñas', icono: 'fa-key',
    descripcion: 'Accesos de la empresa, en carpetas. Solo Dirección puede editarlos.',
    agruparPor: 'Categoria',
    campos: [
      { clave: 'Sistema', etiqueta: 'Sistema', tipo: 'texto', enTabla: true, requerido: true },
      { clave: 'Categoria', etiqueta: 'Carpeta', tipo: 'select', catalogo: 'categoriasAcceso' },
      { clave: 'Tipo', etiqueta: 'Tipo', tipo: 'texto', enTabla: true },
      { clave: 'Usuario', etiqueta: 'Usuario', tipo: 'texto', enTabla: true },
      { clave: 'Clave', etiqueta: 'Contraseña', tipo: 'password', enTabla: true },
      { clave: 'URL', etiqueta: 'Dirección', tipo: 'url' },
      { clave: 'Owner', etiqueta: 'Responsable', tipo: 'select', catalogo: 'equipo' },
      { clave: 'Notas', etiqueta: 'Notas', tipo: 'textarea' },
      { clave: 'ProximaRotacion', etiqueta: 'Próxima rotación', tipo: 'fecha' }
    ]
  },

  materiales: {
    entidad: 'Materiales', titulo: 'Cultura y materiales', icono: 'fa-folder-open',
    descripcion: 'Lo desarrollado y aprobado, separado por a quién va dirigido.',
    campoEstado: 'Estado',
    campos: [
      { clave: 'Titulo', etiqueta: 'Título', tipo: 'texto', enTabla: true, requerido: true },
      { clave: 'Tipo', etiqueta: 'Tipo', tipo: 'texto', enTabla: true },
      { clave: 'Destinatario', etiqueta: 'Destinatario', tipo: 'select', catalogo: 'destinatariosMaterial', enTabla: true, badge: true },
      { clave: 'EmpresaID', etiqueta: 'Empresa / cliente', tipo: 'referencia', refCatalogo: 'empresas' },
      { clave: 'Estado', etiqueta: 'Estado', tipo: 'select', catalogo: 'estadosMaterial', enTabla: true, badge: true },
      { clave: 'Responsable', etiqueta: 'Responsable', tipo: 'select', catalogo: 'equipo' },
      { clave: 'Link', etiqueta: 'Enlace', tipo: 'url' },
      { clave: 'Fecha', etiqueta: 'Fecha', tipo: 'fecha' },
      { clave: 'Observaciones', etiqueta: 'Observaciones', tipo: 'textarea' }
    ]
  },

  /* ===================== PEDIDOS DE LOS CLIENTES ===================== */

  solicitudes: {
    entidad: 'Solicitudes', titulo: 'Solicitudes de clientes', icono: 'fa-inbox',
    descripcion: 'Lo que los clientes piden desde su portal, con su estado y su responsable.',
    campoEstado: 'Estado',
    campos: [
      { clave: 'Titulo', etiqueta: 'Pedido', tipo: 'texto', enTabla: true, requerido: true },
      { clave: 'EmpresaID', etiqueta: 'Cliente', tipo: 'referencia', refCatalogo: 'empresas', enTabla: true },
      { clave: 'Categoria', etiqueta: 'Categoría', tipo: 'select', catalogo: 'categoriasSolicitud' },
      { clave: 'Tipo', etiqueta: 'Tipo de pedido', tipo: 'select', catalogo: 'tiposSolicitud', enTabla: true, requerido: true },
      { clave: 'Prioridad', etiqueta: 'Prioridad', tipo: 'select', catalogo: 'prioridades', enTabla: true, badge: true },
      { clave: 'Estado', etiqueta: 'Estado', tipo: 'select', catalogo: 'estadosSolicitud', enTabla: true, badge: true },
      { clave: 'ResponsableEscencial', etiqueta: 'Responsable de Escencial', tipo: 'select', catalogo: 'equipo', enTabla: true },
      { clave: 'ResponsableCliente', etiqueta: 'Responsable del cliente', tipo: 'texto' },
      { clave: 'FechaSolicitud', etiqueta: 'Fecha del pedido', tipo: 'fecha', enTabla: true },
      { clave: 'FechaEstimada', etiqueta: 'Fecha estimada', tipo: 'fecha' },
      { clave: 'Descripcion', etiqueta: 'Descripción y alcance', tipo: 'textarea' }
    ]
  },

  /* ===================== OBJETIVOS ===================== */

  objetivos: {
    entidad: 'Objetivos', titulo: 'Objetivos y desafíos', icono: 'fa-bullseye',
    descripcion: 'Lo que cada uno se propuso lograr. Con una meta alcanza; podés poner las seis.',
    campoEstado: 'Estado',
    campos: [
      { clave: 'Titulo', etiqueta: 'Objetivo', tipo: 'texto', enTabla: true, requerido: true },
      { clave: 'Ambito', etiqueta: 'Es de', tipo: 'select', catalogo: 'ambitosObjetivo', enTabla: true, badge: true },
      { clave: 'Colaborador', etiqueta: 'Persona', tipo: 'select', catalogo: 'equipo', enTabla: true },
      { clave: 'Alcance', etiqueta: 'Equipo / área / proyecto / servicio', tipo: 'texto', ayuda: 'Solo si no es de una persona' },
      { clave: 'Unidad', etiqueta: 'Unidad', tipo: 'select', catalogo: 'unidadesObjetivo' },

      // Una meta por horizonte: el mismo avance las alimenta a todas.
      { clave: 'MetaDiaria', etiqueta: '🏆 Meta diaria', tipo: 'texto', ayuda: 'Un número. Ej.: 2' },
      { clave: 'MetaSemanal', etiqueta: '🚀 Meta semanal', tipo: 'texto', enTabla: true, ayuda: 'Ej.: 10' },
      { clave: 'MetaMensual', etiqueta: '⭐ Meta mensual', tipo: 'texto', enTabla: true, ayuda: 'Ej.: 40' },
      { clave: 'MetaTrimestral', etiqueta: '📈 Meta trimestral', tipo: 'texto', ayuda: 'Ej.: 120' },
      { clave: 'MetaSemestral', etiqueta: '🔥 Meta semestral', tipo: 'texto', ayuda: 'Ej.: 240' },
      { clave: 'MetaAnual', etiqueta: '🏅 Meta anual', tipo: 'texto', enTabla: true, ayuda: 'Ej.: 480' },

      { clave: 'EmpresaID', etiqueta: 'Cliente (si aplica)', tipo: 'referencia', refCatalogo: 'empresas' },
      { clave: 'Estado', etiqueta: 'Estado', tipo: 'select', catalogo: 'estadosObjetivo', enTabla: true, badge: true },
      { clave: 'Descripcion', etiqueta: 'Descripción', tipo: 'textarea' }
    ]
  },

  avances: {
    entidad: 'Avances', titulo: 'Avances', icono: 'fa-forward-step',
    descripcion: 'Cada paso dado hacia un objetivo. De acá sale toda la evolución.',
    campos: [
      { clave: 'ObjetivoID', etiqueta: 'Objetivo', tipo: 'referencia', refCatalogo: 'objetivos', enTabla: true, requerido: true },
      { clave: 'Fecha', etiqueta: 'Fecha', tipo: 'fecha', enTabla: true },
      { clave: 'Cantidad', etiqueta: 'Cuánto avanzaste', tipo: 'texto', enTabla: true, requerido: true, ayuda: 'Un número. Ej.: 3' },
      { clave: 'Nota', etiqueta: 'Nota', tipo: 'texto', enTabla: true },
      { clave: 'AutorNombre', etiqueta: 'Cargado por', tipo: 'texto', enTabla: true }
    ]
  },

  /* ===================== NÓMINA DE PERSONAL ===================== */

  colaboradores: {
    entidad: 'Colaboradores', titulo: 'Nómina de personal', icono: 'fa-id-card',
    descripcion: 'El legajo de cada colaborador: datos personales, laborales y talles.',
    campoEstado: 'Estado',
    campos: [
      { clave: 'Nombre', etiqueta: 'Nombre y apellido', tipo: 'texto', enTabla: true, requerido: true },
      { clave: 'DNI', etiqueta: 'DNI', tipo: 'texto', enTabla: true },
      { clave: 'Puesto', etiqueta: 'Puesto', tipo: 'texto', enTabla: true },
      { clave: 'Area', etiqueta: 'Área', tipo: 'select', catalogo: 'areasTrabajo', enTabla: true },
      { clave: 'FechaIngreso', etiqueta: 'Fecha de ingreso', tipo: 'fecha', enTabla: true },
      { clave: 'Estado', etiqueta: 'Estado', tipo: 'select', catalogo: 'estadosColaborador', enTabla: true, badge: true },
      { clave: 'TipoContrato', etiqueta: 'Tipo de contrato', tipo: 'select', catalogo: 'tiposContrato' },

      { clave: 'FechaNacimiento', etiqueta: 'Fecha de nacimiento', tipo: 'fecha' },
      { clave: 'Correo', etiqueta: 'Correo', tipo: 'texto' },
      { clave: 'Telefono', etiqueta: 'Teléfono', tipo: 'texto' },
      { clave: 'Direccion', etiqueta: 'Dirección', tipo: 'texto' },
      { clave: 'Localidad', etiqueta: 'Localidad', tipo: 'texto' },
      { clave: 'ObraSocial', etiqueta: 'Obra social', tipo: 'texto' },

      // Liquidación: solo Dirección. Al equipo interno el servidor ni se los manda.
      { clave: 'CUIL', etiqueta: 'CUIL', tipo: 'texto', soloAdmin: true },
      { clave: 'Sueldo', etiqueta: 'Sueldo', tipo: 'texto', soloAdmin: true },
      { clave: 'Banco', etiqueta: 'Banco', tipo: 'texto', soloAdmin: true },
      { clave: 'CBU', etiqueta: 'CBU', tipo: 'texto', soloAdmin: true },

      { clave: 'TalleRemera', etiqueta: 'Talle de remera', tipo: 'texto' },
      { clave: 'TallePantalon', etiqueta: 'Talle de pantalón', tipo: 'texto' },
      { clave: 'TalleCalzado', etiqueta: 'Talle de calzado', tipo: 'texto' },

      { clave: 'Observaciones', etiqueta: 'Observaciones', tipo: 'textarea' }
    ]
  },

  permisos: {
    entidad: 'Permisos', titulo: 'Permisos y licencias', icono: 'fa-calendar-minus',
    descripcion: 'Vacaciones, licencias y permisos de cada colaborador.',
    campoEstado: 'Estado',
    campos: [
      { clave: 'ColaboradorID', etiqueta: 'Colaborador', tipo: 'referencia', refCatalogo: 'colaboradores', enTabla: true, requerido: true },
      { clave: 'Tipo', etiqueta: 'Tipo', tipo: 'select', catalogo: 'tiposPermiso', enTabla: true, requerido: true },
      { clave: 'Desde', etiqueta: 'Desde', tipo: 'fecha', enTabla: true, requerido: true },
      { clave: 'Hasta', etiqueta: 'Hasta', tipo: 'fecha', enTabla: true },
      { clave: 'Dias', etiqueta: 'Días', tipo: 'texto', enTabla: true },
      { clave: 'Estado', etiqueta: 'Estado', tipo: 'select', catalogo: 'estadosPermiso', enTabla: true, badge: true },
      { clave: 'Autoriza', etiqueta: 'Autoriza', tipo: 'select', catalogo: 'equipo' },
      { clave: 'Motivo', etiqueta: 'Motivo', tipo: 'texto' },
      { clave: 'Observaciones', etiqueta: 'Observaciones', tipo: 'textarea' }
    ]
  }
};
