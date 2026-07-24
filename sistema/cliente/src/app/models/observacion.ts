import { Rol } from './sesion';

export interface Observacion {
  ID?: string;
  CandidatoID: string;
  AutorID?: string;
  RolAutor?: Rol;
  Texto: string;
  /** Interna la ve solo el equipo; Compartida también la empresa. */
  Visibilidad?: 'Interna' | 'Compartida';
  Fecha?: string;
}
