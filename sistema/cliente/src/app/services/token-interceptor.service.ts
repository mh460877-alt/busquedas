import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { StorageService } from './storage.service';

/**
 * Agrega el token a cada llamada, igual que en el proyecto de referencia.
 * La diferencia es que acá no va en una cabecera sino dentro del cuerpo:
 * Apps Script no recibe cabeceras propias sin disparar la verificación previa
 * del navegador, que no sabe responder.
 */
@Injectable()
export class TokenInterceptorService implements HttpInterceptor {

  constructor(private storage: StorageService, private router: Router) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let pedido = req;
    const token = this.storage.token;

    if (token && typeof req.body === 'string') {
      try {
        const cuerpo = JSON.parse(req.body);
        if (!cuerpo.token) {
          cuerpo.token = token;
          pedido = req.clone({ body: JSON.stringify(cuerpo) });
        }
      } catch { /* si no es JSON, se manda tal cual */ }
    }

    return next.handle(pedido).pipe(
      tap({
        next: (evento: any) => {
          // La sesión venció: se limpia y se vuelve al acceso.
          if (evento?.body && evento.body.ok === false && /sesión/i.test(evento.body.error || '')) {
            this.storage.borrar();
            this.router.navigate(['/login']);
          }
        }
      })
    );
  }
}
