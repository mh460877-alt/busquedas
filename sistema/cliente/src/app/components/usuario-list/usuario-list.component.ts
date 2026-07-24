import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';
import { EmpresaService } from '../../services/empresa.service';
import { Usuario } from '../../models/usuario';
import { Empresa } from '../../models/empresa';

/** Altas y bajas de accesos. Solo Administración. */
@Component({
  selector: 'app-usuario-list',
  templateUrl: './usuario-list.component.html',
  styleUrls: ['./usuario-list.component.css']
})
export class UsuarioListComponent implements OnInit {

  usuarios: Usuario[] = [];
  empresas: Empresa[] = [];
  filtro = '';
  cargando = true;
  mensaje = '';

  constructor(
    private usuarioService: UsuarioService,
    private empresaService: EmpresaService,
    private router: Router
  ) { }

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cargando = true;
    this.usuarioService.listar().subscribe({
      next: u => { this.usuarios = u; this.cargando = false; },
      error: e => { this.mensaje = e.message; this.cargando = false; }
    });
    this.empresaService.listar().subscribe({ next: e => this.empresas = e, error: () => { } });
  }

  get visibles(): Usuario[] {
    const t = this.filtro.toLowerCase().trim();
    if (!t) return this.usuarios;
    return this.usuarios.filter(u =>
      [u.Nombre, u.Usuario, u.Correo, u.Rol].join(' ').toLowerCase().includes(t));
  }

  empresa(id?: string): string {
    if (!id) return '—';
    return this.empresas.find(e => e.ID === id)?.Nombre ?? '—';
  }

  /**
   * Los consultores que todavía no tienen contraseña entran con su correo.
   * Mostrarlo acá permite ir migrando sin perseguir a nadie.
   */
  tieneContrasena(u: Usuario): boolean { return !!(u as any).TieneContrasena; }

  darDeBaja(u: Usuario): void {
    if (!confirm(`¿Dar de baja a ${u.Nombre}? Deja de poder entrar, pero su historial se conserva.`)) return;
    this.usuarioService.baja(u.ID ?? '').subscribe({
      next: () => { this.mensaje = 'Usuario dado de baja'; this.cargar(); },
      error: e => this.mensaje = e.message
    });
  }

  reactivar(u: Usuario): void {
    this.usuarioService.editar(u.ID ?? '', { Estado: 'Activo' }).subscribe({
      next: () => { this.mensaje = 'Usuario reactivado'; this.cargar(); },
      error: e => this.mensaje = e.message
    });
  }

  nuevo(): void { this.router.navigate(['/usuario-form', 'nuevo']); }
  editar(u: Usuario): void { this.router.navigate(['/usuario-form', u.ID]); }
}
