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
  LinkReferencias?: string;
  /** Cuándo quedó a la vista de la empresa. Es el registro de lo enviado. */
  FechaEnvio?: string;
  /** Qué dijo la empresa: sin ver, en evaluación, quiere entrevistarlo, descartado. */
  DecisionEmpresa?: string;
  MotivoDecision?: string;
  FechaDecision?: string;
  Etapa?: string;
  Provincia?: string;
  FechaCarga?: string;
  Estado?: string;
  MarcaTiempo?: string;
}
