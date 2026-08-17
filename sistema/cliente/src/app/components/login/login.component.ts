import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '../../services/login.service';
import { StorageService } from '../../services/storage.service';
import { VigilanteGuard } from '../../vigilante.guard';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  identificador = '';
  clave = '';
  mensaje = '';
  error = false;
  cargando = false;

  constructor(
    private loginService: LoginService,
    private storage: StorageService,
    private vigilante: VigilanteGuard,
    private router: Router
  ) { }

  ngOnInit(): void {
    const sesion = this.storage.leer();
    if (sesion?.token) {
      this.router.navigate([this.vigilante.inicioDe(sesion.usuario.rol)]);
    }
  }

  /** Un solo paso: usuario y contraseña juntos. */
  async ingresar(): Promise<void> {
    const id = this.identificador.trim();
    if (!id) { this.avisar('Escribí tu usuario o tu correo.', true); return; }

    this.cargando = true;
    this.mensaje = '';

    // La contraseña se hashea en el navegador antes de salir. En el primer
    // ingreso, la contraseña que elijas queda asociada a tu cuenta; después
    // se te pide siempre. Si la dejás vacía, el servidor te la va a exigir.
    const hash = this.clave ? await this.loginService.hashear(this.clave) : '';

    this.loginService.ingresar(id, hash).subscribe({
      next: sesion => {
        this.cargando = false;
        this.router.navigate([this.vigilante.inicioDe(sesion.usuario.rol)]);
      },
      error: e => { this.cargando = false; this.avisar(e.message, true); }
    });
  }

  private avisar(texto: string, esError: boolean): void {
    this.mensaje = texto;
    this.error = esError;
  }
}
