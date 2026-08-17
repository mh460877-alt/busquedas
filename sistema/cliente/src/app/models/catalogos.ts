import { EmpresaOpcion } from './adjunto';

/** Listas fijas que el servidor envía para armar los formularios. */
export interface Catalogos {
  roles: string[];
  etapasBusqueda: string[];
  etapasCandidato: string[];
  etapasVisiblesEmpresa: string[];
  estadosBusqueda: string[];
  estadosEmpresa: string[];
  lineas: string[];
  visibilidad: string[];
  // Mundo interno
  tiposPendiente?: string[];
  estadosPendiente?: string[];
  estadosProyecto?: string[];
  tiposOnboarding?: string[];
  ambitos?: string[];
  nivelesComunicacion?: string[];
  tiposCumple?: string[];
  destinatariosMaterial?: string[];
  estadosMaterial?: string[];
  equipo?: string[];
  /** Clientes, para vincular cada registro interno con su empresa. */
  empresas?: EmpresaOpcion[];
  permisos: { [entidad: string]: string[] };
}
