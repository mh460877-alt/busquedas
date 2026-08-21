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

  /**
   * Sube un archivo y lo cuelga del registro.
   *
   * El archivo viaja codificado en texto porque Apps Script no recibe formularios
   * con archivos: eso lo agranda cerca de un tercio, y por eso el tope de 8 MB
   * es más bajo de lo que uno esperaría. Para algo más pesado conviene subirlo a
   * Drive y pegar el enlace.
   */
  subir(entidad: string, registroId: string, archivo: File, titulo?: string, nota?: string): Observable<Adjunto> {
    return new Observable<Adjunto>(observador => {
      const lector = new FileReader();
      lector.onerror = () => observador.error(new Error('No se pudo leer el archivo'));
      lector.onload = () => {
        // readAsDataURL devuelve "data:tipo;base64,XXXX"; solo sirve lo de después de la coma.
        const texto = String(lector.result || '');
        const contenido = texto.slice(texto.indexOf(',') + 1);
        this.api.llamar<Adjunto>('subirArchivo', {
          datos: {
            Entidad: entidad, RegistroID: registroId,
            Nombre: archivo.name, TipoMime: archivo.type || 'application/octet-stream',
            Titulo: titulo || archivo.name, Nota: nota || '',
            Contenido: contenido
          }
        }).subscribe({
          next: a => { observador.next(a); observador.complete(); },
          error: e => observador.error(e)
        });
      };
      lector.readAsDataURL(archivo);
    });
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
