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
  // Objetivos
  frecuenciasObjetivo?: string[];
  ambitosObjetivo?: string[];
  estadosObjetivo?: string[];
  unidadesObjetivo?: string[];
  /** Los objetivos, para colgarles un avance. */
  objetivos?: EmpresaOpcion[];
  // Portal del cliente
  categoriasSolicitud?: string[];
  tiposSolicitud?: string[];
  estadosSolicitud?: string[];
  prioridades?: string[];
  // Nómina
  tiposPermiso?: string[];
  estadosPermiso?: string[];
  tiposContrato?: string[];
  areasTrabajo?: string[];
  estadosColaborador?: string[];
  /** La nómina, para colgarle un permiso a quien corresponde. */
  colaboradores?: EmpresaOpcion[];
  permisos: { [entidad: string]: string[] };
}
