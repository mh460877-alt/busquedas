import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, throwError, catchError } from 'rxjs';
import { environment } from '../../environments/environment';
import { Respuesta } from '../models/sesion';

/**
 * Punto único de contacto con el servidor.
 *
 * En el proyecto de referencia cada servicio pegaba contra su propia ruta REST.
 * Acá hay un solo endpoint —la implementación del Apps Script— y la acción
 * viaja en el cuerpo. Todo lo demás (un servicio por entidad) se mantiene igual.
 *
 * El cuerpo va como texto plano a propósito: así el navegador no dispara la
 * verificación previa que Apps Script no sabe responder, y podemos LEER lo que
 * el servidor contesta. El sistema anterior escribía a ciegas.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {

  private cabeceras = new HttpHeaders({ 'Content-Type': 'text/plain;charset=utf-8' });

  constructor(private http: HttpClient) { }

  llamar<T>(accion: string, extra: any = {}): Observable<T> {
    const cuerpo = { accion, ...extra };
    return this.http.post<Respuesta<T>>(environment.api, JSON.stringify(cuerpo), { headers: this.cabeceras })
      .pipe(
        map(r => {
          if (!r.ok) throw new Error(r.error || 'No se pudo completar la operación');
          return r.datos as T;
        }),
        catchError(e => throwError(() => new Error(
          e instanceof Error ? e.message : 'No pudimos conectar con el servidor'
        )))
      );
  }

  /* Acciones genéricas, las mismas para todas las entidades. */
  listar<T>(entidad: string): Observable<T[]> {
    return this.llamar<T[]>('listar', { entidad });
  }
  crear<T>(entidad: string, datos: T): Observable<T> {
    return this.llamar<T>('crear', { entidad, datos });
  }
  editar(entidad: string, id: string, cambios: any): Observable<any> {
    return this.llamar('editar', { entidad, id, cambios });
  }
  baja(entidad: string, id: string): Observable<any> {
    return this.llamar('baja', { entidad, id });
  }
  eliminar(entidad: string, id: string, forzar = false): Observable<any> {
    return this.llamar('eliminar', { entidad, id, forzar });
  }
}
