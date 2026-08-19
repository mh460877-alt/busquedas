import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { StorageService } from './services/storage.service';

/**
 * Vigilante de rutas.
 *
 * Mismo patrón que el proyecto de referencia: cada ruta declara qué rol la
 * puede abrir y este guard la deja pasar o no.
 *
 *   { path: 'usuarios', component: UsuarioListComponent,
 *     data: { rol: ['Admin'] }, canActivate: [VigilanteGuard] }
 *
 * Importante: esto es comodidad, no seguridad. Evita mostrarle a alguien una
 * pantalla que no le corresponde, pero el control que cuenta está en el
 * servidor, que no entrega datos fuera de su alcance aunque se los pidan.
 */
@Injectable({ providedIn: 'root' })
export class VigilanteGuard implements CanActivate {

  constructor(private storage: StorageService, private router: Router) { }

  canActivate(ruta: ActivatedRouteSnapshot): boolean {
    const sesion = this.storage.leer();

    if (!sesion?.token) {
      this.router.navigate(['/login']);
      return false;
    }

    const permitidos = this.normalizar(ruta.data['rol']);
    if (permitidos.length && !permitidos.includes(sesion.usuario.rol)) {
      // No lo dejamos afuera: lo mandamos a donde sí le corresponde estar.
      this.router.navigate([this.inicioDe(sesion.usuario.rol)]);
      return false;
    }
    return true;
  }

  private normalizar(valor: unknown): string[] {
    if (!valor) return [];
    return Array.isArray(valor) ? valor as string[] : [valor as string];
  }

  /** Pantalla de inicio de cada rol. */
  inicioDe(rol: string): string {
    switch (rol) {
      case 'Admin': return '/busquedas';
      case 'Interno': return '/busquedas';
      case 'Consultor': return '/mis-busquedas';
      case 'Empresa': return '/inicio';
      default: return '/login';
    }
  }
}
