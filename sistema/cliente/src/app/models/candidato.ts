export interface Candidato {
  ID?: string;
  /** El servidor no lo envía cuando quien mira es una empresa. */
  DNI?: string;
  Nombre: string;
  BusquedaID: string;
  /** Tampoco viaja hacia una empresa: expondría al partner externo. */
  ConsultorID?: string;
  LinkCV?: string;
  LinkVideo?: string;
  LinkInforme?: string;
  Etapa?: string;
  Provincia?: string;
  FechaCarga?: string;
  Estado?: string;
  MarcaTiempo?: string;
}
