import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Adjunto } from '../models/adjunto';

/**
 * Enlaces de cualquier registro.
 *
 * No usa las acciones genéricas: el servidor tiene las suyas, que antes de
 * responder verifican el permiso sobre el registro al que el enlace cuelga.
 */
@Injectable({ providedIn: 'root' })
export class AdjuntoService {

  constructor(private api: ApiService) { }

  /**
   * Enlaces de un registro. Sin `registroId`, trae los de toda la tabla que la
   * sesión pueda ver: así un módulo se abre con una sola llamada en vez de una
   * por fila.
   */
  listar(entidad: string, registroId?: string): Observable<Adjunto[]> {
    return this.api.llamar<Adjunto[]>('adjuntos', { entidad, registroId });
  }

  crear(datos: Adjunto): Observable<Adjunto> {
    return this.api.llamar<Adjunto>('adjuntar', { datos });
  }

  quitar(id: string): Observable<any> {
    return this.api.llamar('quitarAdjunto', { id });
  }

  /** Cuántos enlaces tiene cada registro, a partir de una lista ya traída. */
  agrupar(adjuntos: Adjunto[]): { [registroId: string]: Adjunto[] } {
    const mapa: { [registroId: string]: Adjunto[] } = {};
    adjuntos.forEach(a => {
      const clave = String(a.RegistroID);
      if (!mapa[clave]) mapa[clave] = [];
      mapa[clave].push(a);
    });
    return mapa;
  }
}
