export interface Busqueda {
  ID?: string;
  Puesto: string;
  EmpresaID?: string;
  Provincia?: string;
  Descripcion?: string;
  Etapa?: string;
  Estado?: string;
  Responsable?: string;
  /** Los mismos cuatro enlaces, pero de este proceso puntual. */
  LinkTerna?: string;
  LinkCVs?: string;
  LinkInformes?: string;
  LinkReferencias?: string;
  FechaAlta?: string;
  FechaCierre?: string;
  /** Particularidades de este cliente o de este pedido. */
  Observaciones?: string;
  MarcaTiempo?: string;
}
