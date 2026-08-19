import { Injectable } from '@angular/core';
import { Observable, of, shareReplay, tap } from 'rxjs';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { Sesion } from '../models/sesion';
import { Catalogos } from '../models/catalogos';

/** Ingreso, salida y contraseñas. */
@Injectable({ providedIn: 'root' })
export class LoginService {

  constructor(private api: ApiService, private storage: StorageService) { }

  ingresar(id: string, hash: string): Observable<Sesion> {
    return this.api.llamar<Sesion>('login', { id, hash })
      .pipe(tap(sesion => this.storage.guardar(sesion)));
  }

  definirContrasena(hash: string, usuarioId?: string): Observable<any> {
    return this.api.llamar('contrasena', { hash, usuarioId });
  }

  /**
   * Los catálogos, una sola vez por sesión.
   *
   * Casi todas las pantallas los piden al abrirse, y cuestan unos cuatro
   * segundos porque el servidor arma nueve listas. Como son listas fijas y
   * nombres que cambian de vez en cuando, se guardan y se reparten: navegar
   * deja de pagar ese peaje en cada pantalla.
   *
   * Al crear o editar una empresa, un colaborador o un objetivo hay que llamar
   * a `refrescarCatalogos`, o el desplegable no muestra lo recién cargado.
   */
  private cacheCatalogos: Observable<Catalogos> | null = null;

  catalogos(): Observable<Catalogos> {
    if (!this.cacheCatalogos) {
      this.cacheCatalogos = this.api.llamar<Catalogos>('catalogos').pipe(shareReplay(1));
    }
    return this.cacheCatalogos;
  }

  refrescarCatalogos(): void { this.cacheCatalogos = null; }

  salir(): void {
    this.storage.borrar();
    this.cacheCatalogos = null;   // otra persona, otros catálogos
  }

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
