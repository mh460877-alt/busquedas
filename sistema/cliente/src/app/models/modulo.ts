/** Configuración de un módulo interno tabular (pendientes, viajes, etc.). */
export interface CampoModulo {
  clave: string;
  etiqueta: string;
  tipo: 'texto' | 'textarea' | 'fecha' | 'select' | 'url' | 'password';
  /** Para tipo select: nombre de la lista dentro de catálogos, o valores fijos. */
  catalogo?: string;
  opciones?: string[];
  /** Si true, se muestra en la tabla. */
  enTabla?: boolean;
  /** Si es un estado, se pinta como badge. */
  badge?: boolean;
  requerido?: boolean;
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
