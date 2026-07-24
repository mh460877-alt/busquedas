import { Injectable } from '@angular/core';
import { Sesion } from '../models/sesion';

/**
 * Guarda la sesión del lado del navegador.
 * Dura hasta cerrar la pestaña: el sistema va a tener adentro la bóveda de
 * contraseñas, así que no conviene dejar el acceso abierto indefinidamente.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {

  private readonly CLAVE = 'escencial_sesion';

  guardar(sesion: Sesion): void {
    sessionStorage.setItem(this.CLAVE, JSON.stringify(sesion));
  }

  leer(): Sesion | null {
    try {
      const crudo = sessionStorage.getItem(this.CLAVE);
      return crudo ? JSON.parse(crudo) as Sesion : null;
    } catch { return null; }
  }

  borrar(): void { sessionStorage.removeItem(this.CLAVE); }

  get token(): string { return this.leer()?.token ?? ''; }
  get rol(): string { return this.leer()?.usuario.rol ?? ''; }
  get nombre(): string { return this.leer()?.usuario.nombre ?? ''; }
  get identificado(): boolean { return !!this.token; }
}
