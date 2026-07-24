export interface Empresa {
  ID?: string;
  Nombre: string;
  Linea?: string;
  Contacto?: string;
  Email?: string;
  Telefono?: string;
  Estado?: string;
  LinkInformes?: string;
  LinkCVs?: string;
  /** Desde cuándo se trabaja con el cliente: referencia para facturar. */
  FechaAlta?: string;
  MarcaTiempo?: string;
}
