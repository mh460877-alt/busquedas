import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { Router } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';
import { LoginService } from '../../services/login.service';
import { StorageService } from '../../services/storage.service';
import { Usuario } from '../../models/usuario';

/**
 * Quiénes de un cliente pueden entrar al sistema.
 *
 * Se usa en la ficha del cliente y también al editar la empresa, que es donde
 * la mayoría lo va a buscar. Un solo componente para los dos lugares:
 *
 *   <app-accesos-empresa [empresaId]="e.ID" [empresaNombre]="e.Nombre">
 *
 * El rol y la empresa del usuario nuevo salen del contexto, no se preguntan:
 * si estás parado en la ficha de un cliente, ya se sabe para quién es.
 */
@Component({
  selector: 'app-accesos-empresa',
  templateUrl: './accesos-empresa.component.html',
  styleUrls: ['./accesos-empresa.component.css']
})
export class AccesosEmpresaComponent implements OnChanges {

  @Input() empresaId = '';
  @Input() empresaNombre = '';
  /** Si quien nos usa ya los tiene traídos, no se pide nada de nuevo. */
  @Input() precargados: Usuario[] | null = null;

  @Output() cambio = new EventEmitter<void>();

  usuarios: Usuario[] = [];
  cargando = false;
  mensaje = '';

  alta: Usuario | null = null;
  clave = '';
  guardando = false;

  constructor(
    private usuarioService: UsuarioService,
    private loginService: LoginService,
    private storage: StorageService,
    private router: Router
  ) { }

  ngOnChanges(): void {
    if (this.precargados) { this.usuarios = this.precargados; return; }
    this.cargar();
  }

  cargar(): void {
    if (!this.empresaId) return;
    this.cargando = true;
    this.usuarioService.listar().subscribe({
      next: lista => {
        this.usuarios = lista.filter(u => String(u.EmpresaID) === String(this.empresaId));
        this.cargando = false;
      },
      error: e => { this.mensaje = e.message; this.cargando = false; }
    });
  }

  get esAdmin(): boolean { return this.storage.rol === 'Admin'; }

  tieneContrasena(u: Usuario): boolean { return !!(u as any).TieneContrasena; }

  abrirAlta(): void {
    this.mensaje = '';
    this.clave = '';
    this.alta = {
      Nombre: '', Usuario: '', Correo: '',
      Rol: 'Empresa', EmpresaID: this.empresaId
    };
  }

  cerrarAlta(): void { this.alta = null; this.mensaje = ''; }

  async guardar(): Promise<void> {
    if (!this.alta?.Nombre?.trim()) { this.mensaje = 'Poné el nombre de la persona.'; return; }
    this.guardando = true;

    const hash = this.clave ? await this.loginService.hashear(this.clave) : '';

    this.usuarioService.crear(this.alta).subscribe({
      next: creado => {
        if (!hash) { this.terminar(); return; }
        this.loginService.definirContrasena(hash, creado.ID ?? '').subscribe({
          next: () => this.terminar(),
          error: e => { this.guardando = false; this.mensaje = e.message; }
        });
      },
      error: e => { this.guardando = false; this.mensaje = e.message; }
    });
  }

  private terminar(): void {
    this.guardando = false;
    this.alta = null;
    this.clave = '';
    this.precargados = null;   // de acá en más nos refrescamos solos
    this.cargar();
    this.cambio.emit();
  }

  darDeBaja(u: Usuario): void {
    if (!confirm(`¿Dar de baja el acceso de ${u.Nombre}? Deja de poder entrar, pero se conserva lo que haya hecho.`)) return;
    this.usuarioService.baja(u.ID ?? '').subscribe({
      next: () => { this.precargados = null; this.cargar(); this.cambio.emit(); },
      error: e => this.mensaje = e.message
    });
  }

  reactivar(u: Usuario): void {
    this.usuarioService.editar(u.ID ?? '', { Estado: 'Activo' }).subscribe({
      next: () => { this.precargados = null; this.cargar(); this.cambio.emit(); },
      error: e => this.mensaje = e.message
    });
  }

  editar(u: Usuario): void { this.router.navigate(['/usuario-form', u.ID]); }
}
