import { Adjunto } from './adjunto';
import { Busqueda } from './busqueda';
import { Candidato } from './candidato';
import { Empresa } from './empresa';
import { Observacion } from './observacion';

/** Un pedido del cliente. */
export interface Solicitud {
  ID?: string;
  EmpresaID?: string;
  Categoria?: string;
  Tipo: string;
  Titulo: string;
  Descripcion?: string;
  Prioridad?: string;
  ResponsableCliente?: string;
  ResponsableEscencial?: string;
  FechaSolicitud?: string;
  FechaEstimada?: string;
  Estado?: string;
  AutorID?: string;
  AutorNombre?: string;
  MarcaTiempo?: string;
}

/** Un mensaje de la conversación sobre un pedido. */
export interface Mensaje {
  ID?: string;
  Entidad: string;
  RegistroID: string;
  Texto: string;
  AutorID?: string;
  AutorNombre?: string;
  RolAutor?: string;
  Fecha?: string;
  MarcaTiempo?: string;
}

/** Todo lo que el cliente ve de su vínculo con Escencial, en una sola llamada. */
export interface Portal {
  empresa: Empresa | null;
  solicitudes: Solicitud[];
  busquedas: Busqueda[];
  candidatos: Candidato[];
  observaciones: Observacion[];
  proyectos: any[];
  capacitaciones: any[];
  adjuntos: Adjunto[];
  mensajes: Mensaje[];
}
