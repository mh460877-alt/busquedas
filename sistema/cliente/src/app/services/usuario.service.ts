import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Usuario } from '../models/usuario';

/**
 * Un servicio por entidad, igual que en el proyecto de referencia.
 * Qué filas devuelve cada llamada lo decide el servidor según el rol:
 * lo que no corresponde no llega, no se oculta acá.
 */
@Injectable({ providedIn: 'root' })
export class UsuarioService {

  private readonly entidad = 'Usuarios';

  constructor(private api: ApiService) { }

  listar(): Observable<Usuario[]> { return this.api.listar<Usuario>(this.entidad); }
  crear(dato: Usuario): Observable<Usuario> { return this.api.crear<Usuario>(this.entidad, dato); }
  editar(id: string, cambios: Partial<Usuario>): Observable<any> { return this.api.editar(this.entidad, id, cambios); }
  baja(id: string): Observable<any> { return this.api.baja(this.entidad, id); }
  eliminar(id: string, forzar = false): Observable<any> { return this.api.eliminar(this.entidad, id, forzar); }
}
