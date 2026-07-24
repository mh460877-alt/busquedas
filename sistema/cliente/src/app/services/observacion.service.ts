import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Observacion } from '../models/observacion';

/**
 * Un servicio por entidad, igual que en el proyecto de referencia.
 * Qué filas devuelve cada llamada lo decide el servidor según el rol:
 * lo que no corresponde no llega, no se oculta acá.
 */
@Injectable({ providedIn: 'root' })
export class ObservacionService {

  private readonly entidad = 'Observaciones';

  constructor(private api: ApiService) { }

  listar(): Observable<Observacion[]> { return this.api.listar<Observacion>(this.entidad); }
  crear(dato: Observacion): Observable<Observacion> { return this.api.crear<Observacion>(this.entidad, dato); }
  editar(id: string, cambios: Partial<Observacion>): Observable<any> { return this.api.editar(this.entidad, id, cambios); }
  baja(id: string): Observable<any> { return this.api.baja(this.entidad, id); }
  eliminar(id: string, forzar = false): Observable<any> { return this.api.eliminar(this.entidad, id, forzar); }
}
