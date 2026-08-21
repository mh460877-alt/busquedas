import { Adjunto } from './adjunto';
import { Busqueda } from './busqueda';
import { Candidato } from './candidato';
import { Usuario } from './usuario';

export interface Empresa {
  ID?: string;
  Nombre: string;
  Linea?: string;
  Contacto?: string;
  Email?: string;
  Telefono?: string;
  Estado?: string;
  /** Los cuatro enlaces de trabajo con el cliente. Ninguno obligatorio. */
  LinkTerna?: string;
  LinkCVs?: string;
  LinkInformes?: string;
  LinkReferencias?: string;
  /** Desde cuándo se trabaja con el cliente: referencia para facturar. */
  FechaAlta?: string;
  /** Particularidades de este cliente o de este pedido. */
  Observaciones?: string;
  MarcaTiempo?: string;
}

/**
 * Todo lo que el sistema sabe de un cliente, junto.
 * Es lo que devuelve la acción `fichaEmpresa` del servidor.
 */
export interface FichaEmpresa {
  empresa: Empresa;
  busquedas: Busqueda[];
  candidatos: Candidato[];
  /** Los accesos al sistema que tiene esa empresa. */
  usuarios: Usuario[];
  /** Registros de cada módulo interno vinculados a esta empresa. */
  modulos: { [entidad: string]: any[] };
  /** Enlaces de la empresa y de todo lo que cuelga de ella. */
  adjuntos: Adjunto[];
}
