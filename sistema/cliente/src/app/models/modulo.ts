/** Configuración de un módulo interno tabular (pendientes, viajes, etc.). */
export interface CampoModulo {
  clave: string;
  etiqueta: string;
  /**
   * 'referencia' es un desplegable que apunta a otra tabla: guarda el ID y
   * muestra el nombre. Se usa para el cliente de un pendiente y para de quién
   * es un permiso. Qué lista ofrece lo dice `refCatalogo`.
   */
  tipo: 'texto' | 'textarea' | 'fecha' | 'select' | 'url' | 'password' | 'referencia';
  /** Para 'referencia': catálogo de {id, nombre} que el servidor manda. */
  refCatalogo?: string;
  /** Datos sensibles: no se le muestran a quien no sea Administración. */
  soloAdmin?: boolean;
  /** Para tipo select: nombre de la lista dentro de catálogos, o valores fijos. */
  catalogo?: string;
  opciones?: string[];
  /** Si true, se muestra en la tabla. */
  enTabla?: boolean;
  /** Si es un estado, se pinta como badge. */
  badge?: boolean;
  requerido?: boolean;
  /** Texto de ejemplo dentro del campo, para que se entienda qué va ahí. */
  ayuda?: string;
}

export interface ConfigModulo {
  entidad: string;
  titulo: string;
  icono: string;
  descripcion: string;
  campos: CampoModulo[];
  /** Campo que define el estado, para el botón de baja. */
  campoEstado?: string;
  /**
   * Campo por el que se agrupan las filas, si conviene verlas en carpetas.
   * Las que no lo tengan cargado caen juntas al final.
   */
  agruparPor?: string;
}
