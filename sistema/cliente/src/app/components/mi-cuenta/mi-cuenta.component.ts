import { Component } from '@angular/core';
import { LoginService } from '../../services/login.service';
import { StorageService } from '../../services/storage.service';

/**
 * Cada persona define o cambia su propia contraseña.
 * Sirve para que los consultores que entraron con su correo se pongan una,
 * sin depender de que se la cargue Administración.
 */
@Component({
  selector: 'app-mi-cuenta',
  templateUrl: './mi-cuenta.component.html',
  styleUrls: ['./mi-cuenta.component.css']
})
export class MiCuentaComponent {

  clave = '';
  repetir = '';
  guardando = false;
  mensaje = '';
  error = false;

  constructor(private loginService: LoginService, private storage: StorageService) { }

  get nombre(): string { return this.storage.nombre; }
  get rol(): string { return this.storage.rol; }

  async guardar(): Promise<void> {
    if (!this.clave || this.clave.length < 4) { this.avisar('La contraseña debe tener al menos 4 caracteres.', true); return; }
    if (this.clave !== this.repetir) { this.avisar('Las dos contraseñas no coinciden.', true); return; }

    this.guardando = true;
    const hash = await this.loginService.hashear(this.clave);
    this.loginService.definirContrasena(hash).subscribe({
      next: () => { this.guardando = false; this.clave = ''; this.repetir = ''; this.avisar('Listo. Tu contraseña quedó definida.', false); },
      error: e => { this.guardando = false; this.avisar(e.message, true); }
    });
  }

  private avisar(t: string, e: boolean): void { this.mensaje = t; this.error = e; }
}
