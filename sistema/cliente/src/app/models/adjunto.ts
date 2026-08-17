/**
 * Un enlace colgado de un registro.
 *
 * Cualquier ficha del sistema puede tener todos los que haga falta —la carpeta
 * de Drive, el informe, el acta— en lugar del único campo "Link" de antes.
 */
export interface Adjunto {
  ID?: string;
  /** Tabla a la que cuelga: 'Pendientes', 'Busquedas', 'Empresas'… */
  Entidad: string;
  /** ID del registro dentro de esa tabla. */
  RegistroID: string;
  Titulo?: string;
  URL: string;
  Nota?: string;
  AutorID?: string;
  AutorNombre?: string;
  Fecha?: string;
  MarcaTiempo?: string;
}

/** Una empresa, tal como viaja en los catálogos para los desplegables. */
export interface EmpresaOpcion {
  id: string;
  nombre: string;
  estado?: string;
}
