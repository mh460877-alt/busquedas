import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Empresa } from '../models/empresa';

/**
 * Un servicio por entidad, igual que en el proyecto de referencia.
 * Qué filas devuelve cada llamada lo decide el servidor según el rol:
 * lo que no corresponde no llega, no se oculta acá.
 */
@Injectable({ providedIn: 'root' })
export class EmpresaService {

  private readonly entidad = 'Empresas';

  constructor(private api: ApiService) { }

  listar(): Observable<Empresa[]> { return this.api.listar<Empresa>(this.entidad); }
  crear(dato: Empresa): Observable<Empresa> { return this.api.crear<Empresa>(this.entidad, dato); }
  editar(id: string, cambios: Partial<Empresa>): Observable<any> { return this.api.editar(this.entidad, id, cambios); }
  baja(id: string): Observable<any> { return this.api.baja(this.entidad, id); }
  eliminar(id: string, forzar = false): Observable<any> { return this.api.eliminar(this.entidad, id, forzar); }
}
