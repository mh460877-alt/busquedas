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
      { clave: 'Responsable', etiqueta: 'Responsable', tipo: 'select', catalogo: 'equipo', enTabla: true },
      { clave: 'EmpresaID', etiqueta: 'Empresa / cliente', tipo: 'empresa', enTabla: true },
      { clave: 'Fecha', etiqueta: 'Fecha', tipo: 'fecha', enTabla: true },
      { clave: 'Estado', etiqueta: 'Estado', tipo: 'select', catalogo: 'estadosPendiente', enTabla: true, badge: true },
      { clave: 'Observaciones', etiqueta: 'Observaciones', tipo: 'textarea' },
      { clave: 'Link', etiqueta: 'Enlace', tipo: 'url' }
    ]
  },

  proyectos: {
    entidad: 'Proyectos', titulo: 'Proyectos', icono: 'fa-diagram-project',
    descripcion: 'Proyectos delegados y su avance.',
    campoEstado: 'Estado',
    campos: [
      { clave: 'Proyecto', etiqueta: 'Proyecto', tipo: 'texto', enTabla: true, requerido: true },
      { clave: 'EmpresaID', etiqueta: 'Cliente', tipo: 'empresa', enTabla: true },
      { clave: 'Linea', etiqueta: 'Línea', tipo: 'select', catalogo: 'lineas' },
      { clave: 'Responsable', etiqueta: 'Responsable', tipo: 'select', catalogo: 'equipo', enTabla: true },
      { clave: 'Estado', etiqueta: 'Estado', tipo: 'select', catalogo: 'estadosProyecto', enTabla: true, badge: true },
      { clave: 'FechaInicio', etiqueta: 'Inicio', tipo: 'fecha' },
      { clave: 'FechaFin', etiqueta: 'Cierre', tipo: 'fecha', enTabla: true },
      { clave: 'Avance', etiqueta: 'Avance / devolución', tipo: 'textarea' },
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
      { clave: 'EmpresaID', etiqueta: 'Cliente', tipo: 'empresa', enTabla: true },
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
      { clave: 'EmpresaID', etiqueta: 'Empresa', tipo: 'empresa', enTabla: true },
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
      { clave: 'EmpresaID', etiqueta: 'Empresa / cliente', tipo: 'empresa', enTabla: true },
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
      { clave: 'EmpresaID', etiqueta: 'Empresa / cliente', tipo: 'empresa', enTabla: true },
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
    descripcion: 'Accesos de la empresa. Solo Dirección puede editarlos.',
    campos: [
      { clave: 'Sistema', etiqueta: 'Sistema', tipo: 'texto', enTabla: true, requerido: true },
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
      { clave: 'EmpresaID', etiqueta: 'Empresa / cliente', tipo: 'empresa' },
      { clave: 'Estado', etiqueta: 'Estado', tipo: 'select', catalogo: 'estadosMaterial', enTabla: true, badge: true },
      { clave: 'Responsable', etiqueta: 'Responsable', tipo: 'select', catalogo: 'equipo' },
      { clave: 'Link', etiqueta: 'Enlace', tipo: 'url' },
      { clave: 'Fecha', etiqueta: 'Fecha', tipo: 'fecha' },
      { clave: 'Observaciones', etiqueta: 'Observaciones', tipo: 'textarea' }
    ]
  }
};
