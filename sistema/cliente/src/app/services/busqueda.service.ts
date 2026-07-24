import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Busqueda } from '../models/busqueda';

/**
 * Un servicio por entidad, igual que en el proyecto de referencia.
 * Qué filas devuelve cada llamada lo decide el servidor según el rol:
 * lo que no corresponde no llega, no se oculta acá.
 */
@Injectable({ providedIn: 'root' })
export class BusquedaService {

  private readonly entidad = 'Busquedas';

  constructor(private api: ApiService) { }

  listar(): Observable<Busqueda[]> { return this.api.listar<Busqueda>(this.entidad); }
  crear(dato: Busqueda): Observable<Busqueda> { return this.api.crear<Busqueda>(this.entidad, dato); }
  editar(id: string, cambios: Partial<Busqueda>): Observable<any> { return this.api.editar(this.entidad, id, cambios); }
  baja(id: string): Observable<any> { return this.api.baja(this.entidad, id); }
  eliminar(id: string, forzar = false): Observable<any> { return this.api.eliminar(this.entidad, id, forzar); }
}
