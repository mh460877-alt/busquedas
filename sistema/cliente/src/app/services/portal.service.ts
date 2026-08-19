import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { Portal, Solicitud, Mensaje } from '../models/solicitud';

/**
 * El portal del cliente.
 *
 * Trae todo de una sola vez y lo guarda, porque las cuatro pantallas del portal
 * miran los mismos datos: pedirlos de nuevo en cada una serían cuatro viajes al
 * servidor para mostrar lo que ya estaba en memoria.
 */
@Injectable({ providedIn: 'root' })
export class PortalService {

  private cache: Portal | null = null;

  constructor(private api: ApiService) { }

  /** Lo ya traído, o null si todavía no se pidió. */
  get datos(): Portal | null { return this.cache; }

  cargar(forzar = false): Observable<Portal> {
    if (this.cache && !forzar) {
      return new Observable<Portal>(o => { o.next(this.cache!); o.complete(); });
    }
    return this.api.llamar<Portal>('portalCliente').pipe(tap(p => this.cache = p));
  }

  /** Después de crear algo, lo guardado ya no sirve. */
  invalidar(): void { this.cache = null; }

  crearSolicitud(datos: Solicitud): Observable<Solicitud> {
    return this.api.crear<Solicitud>('Solicitudes', datos).pipe(tap(() => this.invalidar()));
  }

  mensajes(entidad: string, registroId?: string): Observable<Mensaje[]> {
    return this.api.llamar<Mensaje[]>('mensajes', { entidad, registroId });
  }

  enviarMensaje(entidad: string, registroId: string, texto: string): Observable<Mensaje> {
    return this.api.llamar<Mensaje>('mensajear', { datos: { Entidad: entidad, RegistroID: registroId, Texto: texto } })
      .pipe(tap(() => this.invalidar()));
  }
}
