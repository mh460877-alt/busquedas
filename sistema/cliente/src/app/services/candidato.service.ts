import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Candidato } from '../models/candidato';

/**
 * Un servicio por entidad, igual que en el proyecto de referencia.
 * Qué filas devuelve cada llamada lo decide el servidor según el rol:
 * lo que no corresponde no llega, no se oculta acá.
 */
@Injectable({ providedIn: 'root' })
export class CandidatoService {

  private readonly entidad = 'Candidatos';

  constructor(private api: ApiService) { }

  listar(): Observable<Candidato[]> { return this.api.listar<Candidato>(this.entidad); }
  crear(dato: Candidato): Observable<Candidato> { return this.api.crear<Candidato>(this.entidad, dato); }
  editar(id: string, cambios: Partial<Candidato>): Observable<any> { return this.api.editar(this.entidad, id, cambios); }
  baja(id: string): Observable<any> { return this.api.baja(this.entidad, id); }
  /**
   * La empresa deja dicho qué le pareció el candidato.
   * Acción propia y no un editar: el cliente no puede editar candidatos.
   */
  decidir(id: string, decision: string, motivo?: string): Observable<any> {
    return this.api.llamar('decidirCandidato', { id, decision, motivo });
  }

  eliminar(id: string, forzar = false): Observable<any> { return this.api.eliminar(this.entidad, id, forzar); }
}
