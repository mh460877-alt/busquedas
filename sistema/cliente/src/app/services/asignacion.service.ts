import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Asignacion } from '../models/asignacion';

/**
 * Asignar es reemplazar de una vez la lista de consultores de una búsqueda.
 * Antes esto era una celda con nombres separados por comas; ahora es una tabla.
 */
@Injectable({ providedIn: 'root' })
export class AsignacionService {

  constructor(private api: ApiService) { }

  listar(): Observable<Asignacion[]> { return this.api.listar<Asignacion>('Asignaciones'); }

  asignar(busquedaId: string, consultores: string[]): Observable<any> {
    return this.api.llamar('asignar', { busquedaId, consultores });
  }

  /** IDs de los consultores asignados a una búsqueda. */
  consultoresDe(asignaciones: Asignacion[], busquedaId: string): string[] {
    return asignaciones
      .filter(a => String(a.BusquedaID) === String(busquedaId))
      .map(a => String(a.ConsultorID));
  }
}
