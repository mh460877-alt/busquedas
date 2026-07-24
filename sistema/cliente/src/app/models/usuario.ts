import { Rol } from './sesion';

export interface Usuario {
  ID?: string;
  Usuario?: string;
  Nombre: string;
  Correo?: string;
  Rol: Rol;
  /** Solo para el rol Empresa: a qué empresa pertenece. */
  EmpresaID?: string;
  Estado?: 'Activo' | 'Baja';
  MarcaTiempo?: string;
}
