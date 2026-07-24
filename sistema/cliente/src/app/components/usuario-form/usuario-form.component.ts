import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';
import { EmpresaService } from '../../services/empresa.service';
import { LoginService } from '../../services/login.service';
import { Usuario } from '../../models/usuario';
import { Empresa } from '../../models/empresa';

@Component({
  selector: 'app-usuario-form',
  templateUrl: './usuario-form.component.html',
  styleUrls: ['./usuario-form.component.css']
})
export class UsuarioFormComponent implements OnInit {

  usuario: Usuario = { Nombre: '', Rol: 'Consultor', Usuario: '', Correo: '', EmpresaID: '' };
  empresas: Empresa[] = [];
  roles: string[] = [];
  clave = '';
  esNuevo = true;
  guardando = false;
  mensaje = '';

  constructor(
    private usuarioService: UsuarioService,
    private empresaService: EmpresaService,
    private loginService: LoginService,
    private ruta: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loginService.catalogos().subscribe({ next: c => this.roles = c.roles, error: () => { } });
    this.empresaService.listar().subscribe({ next: e => this.empresas = e, error: () => { } });

    const id = this.ruta.snapshot.paramMap.get('id');
    if (id && id !== 'nuevo') {
      this.esNuevo = false;
      this.usuarioService.listar().subscribe({
        next: lista => {
          const encontrado = lista.find(u => u.ID === id);
          if (encontrado) this.usuario = encontrado;
        },
        error: e => this.mensaje = e.message
      });
    }
  }

  /** Un usuario de empresa sin empresa asignada no podría ver nada. */
  get necesitaEmpresa(): boolean { return this.usuario.Rol === 'Empresa'; }

  async guardar(): Promise<void> {
    if (!this.usuario.Nombre?.trim()) { this.mensaje = 'El nombre es obligatorio.'; return; }
    if (this.necesitaEmpresa && !this.usuario.EmpresaID) {
      this.mensaje = 'Un acceso de empresa necesita tener su empresa asignada.';
      return;
    }
    this.guardando = true;

    const hash = this.clave ? await this.loginService.hashear(this.clave) : '';

    const luego = (id: string) => {
      if (!hash) { this.terminar(); return; }
      this.loginService.definirContrasena(hash, id).subscribe({
        next: () => this.terminar(),
        error: e => { this.guardando = false; this.mensaje = e.message; }
      });
    };

    if (this.esNuevo) {
      this.usuarioService.crear(this.usuario).subscribe({
        next: creado => luego(creado.ID ?? ''),
        error: e => { this.guardando = false; this.mensaje = e.message; }
      });
    } else {
      this.usuarioService.editar(this.usuario.ID ?? '', this.usuario).subscribe({
        next: () => luego(this.usuario.ID ?? ''),
        error: e => { this.guardando = false; this.mensaje = e.message; }
      });
    }
  }

  private terminar(): void {
    this.guardando = false;
    this.router.navigate(['/usuarios']);
  }

  volver(): void { this.router.navigate(['/usuarios']); }
}
