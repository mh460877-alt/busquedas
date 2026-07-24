import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { LoginService } from '../../services/login.service';

/** Barra superior. Muestra solo los accesos que el rol tiene habilitados. */
@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent {

  constructor(
    private storage: StorageService,
    private loginService: LoginService,
    private router: Router
  ) { }

  get nombre(): string { return this.storage.nombre; }
  get rol(): string { return this.storage.rol; }

  es(...roles: string[]): boolean { return roles.includes(this.rol); }

  salir(): void {
    this.loginService.salir();
    this.router.navigate(['/login']);
  }
}
