/** Configuración de un módulo interno tabular (pendientes, viajes, etc.). */
export interface CampoModulo {
  clave: string;
  etiqueta: string;
  /**
   * 'empresa' es un desplegable de clientes: guarda el ID de la hoja Empresas
   * y muestra el nombre. Es lo que permite filtrar el calendario por cliente y
   * juntar después todo lo suyo en su ficha.
   */
  tipo: 'texto' | 'textarea' | 'fecha' | 'select' | 'url' | 'password' | 'empresa';
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
}
