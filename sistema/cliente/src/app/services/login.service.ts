import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { Sesion } from '../models/sesion';
import { Catalogos } from '../models/catalogos';

/** Ingreso, salida y contraseñas. */
@Injectable({ providedIn: 'root' })
export class LoginService {

  constructor(private api: ApiService, private storage: StorageService) { }

  /**
   * Primer paso: preguntar si esa cuenta ya tiene contraseña.
   * Los consultores que todavía no la tienen entran con su correo, así nadie
   * pierde el acceso mientras se van creando.
   */
  estadoAcceso(id: string): Observable<{ existe: boolean; tieneContrasena: boolean }> {
    return this.api.llamar('estadoAcceso', { id });
  }

  ingresar(id: string, hash: string): Observable<Sesion> {
    return this.api.llamar<Sesion>('login', { id, hash })
      .pipe(tap(sesion => this.storage.guardar(sesion)));
  }

  definirContrasena(hash: string, usuarioId?: string): Observable<any> {
    return this.api.llamar('contrasena', { hash, usuarioId });
  }

  catalogos(): Observable<Catalogos> {
    return this.api.llamar<Catalogos>('catalogos');
  }

  salir(): void { this.storage.borrar(); }

  /** SHA-256 en el navegador: la contraseña nunca sale en texto plano. */
  async hashear(texto: string): Promise<string> {
    if (!texto) return '';
    const datos = new TextEncoder().encode(texto);
    const buffer = await crypto.subtle.digest('SHA-256', datos);
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
