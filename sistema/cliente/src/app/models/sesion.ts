/** Lo que devuelve el servidor al iniciar sesión. */
export type Rol = 'Admin' | 'Interno' | 'Consultor' | 'Empresa';

export interface UsuarioSesion {
  id: string;
  nombre: string;
  rol: Rol;
  empresaId: string;
  tieneContrasena: boolean;
  modoIngreso: 'con-contrasena' | 'primer-ingreso';
}

export interface Sesion {
  token: string;
  usuario: UsuarioSesion;
}

/** Envoltorio uniforme de toda respuesta del Apps Script. */
export interface Respuesta<T> {
  ok: boolean;
  datos?: T;
  error?: string;
}
