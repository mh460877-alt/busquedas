import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Empresa, FichaEmpresa } from '../models/empresa';

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

  /**
   * Todo lo del cliente en una sola llamada: sus búsquedas, sus candidatos, lo
   * que tenga en cada módulo interno y todos los enlaces guardados.
   *
   * Va junto a propósito. Armarlo con llamadas sueltas serían diez pedidos, y
   * cada pedido a Apps Script relee la planilla entera.
   */
  ficha(empresaId: string): Observable<FichaEmpresa> {
    return this.api.llamar<FichaEmpresa>('fichaEmpresa', { empresaId });
  }
}
