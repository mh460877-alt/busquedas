import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BusquedaService } from '../../services/busqueda.service';
import { EmpresaService } from '../../services/empresa.service';
import { UsuarioService } from '../../services/usuario.service';
import { AsignacionService } from '../../services/asignacion.service';
import { StorageService } from '../../services/storage.service';
import { Busqueda } from '../../models/busqueda';
import { Empresa } from '../../models/empresa';
import { Usuario } from '../../models/usuario';
import { Asignacion } from '../../models/asignacion';

@Component({
  selector: 'app-busqueda-list',
  templateUrl: './busqueda-list.component.html',
  styleUrls: ['./busqueda-list.component.css']
})
export class BusquedaListComponent implements OnInit {

  busquedas: Busqueda[] = [];
  empresas: Empresa[] = [];
  consultores: Usuario[] = [];
  asignaciones: Asignacion[] = [];
  filtro = '';
  cargando = true;
  mensaje = '';

  /** Búsqueda cuya asignación se está editando. */
  asignando: Busqueda | null = null;
  seleccionados: string[] = [];

  constructor(
    private busquedaService: BusquedaService,
    private empresaService: EmpresaService,
    private usuarioService: UsuarioService,
    private asignacionService: AsignacionService,
    private storage: StorageService,
    private router: Router
  ) { }

  ngOnInit(): void { this.cargar(); }

  get esAdmin(): boolean { return this.storage.rol === 'Admin'; }

  cargar(): void {
    this.cargando = true;
    this.busquedaService.listar().subscribe({
      next: b => { this.busquedas = b; this.cargando = false; },
      error: e => { this.mensaje = e.message; this.cargando = false; }
    });
    this.empresaService.listar().subscribe({ next: e => this.empresas = e, error: () => { } });
    this.usuarioService.listar().subscribe({
      next: u => this.consultores = u.filter(x => x.Rol === 'Consultor' && x.Estado !== 'Baja'),
      error: () => { }
    });
    this.asignacionService.listar().subscribe({ next: a => this.asignaciones = a, error: () => { } });
  }

  get visibles(): Busqueda[] {
    const t = this.filtro.toLowerCase().trim();
    if (!t) return this.busquedas;
    return this.busquedas.filter(b =>
      [b.Puesto, b.Provincia, b.Etapa, b.Estado, this.empresa(b.EmpresaID)]
        .join(' ').toLowerCase().includes(t));
  }

  empresa(id?: string): string {
    return this.empresas.find(e => e.ID === id)?.Nombre ?? '—';
  }

  nombresAsignados(busqueda: Busqueda): string {
    const ids = this.asignacionService.consultoresDe(this.asignaciones, busqueda.ID ?? '');
    const nombres = ids
      .map(id => this.consultores.find(c => c.ID === id)?.Nombre)
      .filter((n): n is string => !!n);
    return nombres.length ? nombres.join(', ') : 'Sin asignar';
  }

  abrirAsignacion(busqueda: Busqueda): void {
    this.asignando = busqueda;
    this.seleccionados = this.asignacionService.consultoresDe(this.asignaciones, busqueda.ID ?? '');
  }

  alternar(consultorId: string): void {
    const i = this.seleccionados.indexOf(consultorId);
    if (i >= 0) { this.seleccionados.splice(i, 1); } else { this.seleccionados.push(consultorId); }
  }

  guardarAsignacion(): void {
    if (!this.asignando?.ID) return;
    this.asignacionService.asignar(this.asignando.ID, this.seleccionados).subscribe({
      next: () => { this.asignando = null; this.mensaje = 'Asignación guardada'; this.cargar(); },
      error: e => this.mensaje = e.message
    });
  }

  cambiarEstado(b: Busqueda): void {
    const estado = b.Estado === 'Activa' ? 'Deshabilitada' : 'Activa';
    this.busquedaService.editar(b.ID ?? '', { Estado: estado }).subscribe({
      next: () => { b.Estado = estado; this.mensaje = 'Estado actualizado'; },
      error: e => this.mensaje = e.message
    });
  }

  /**
   * Dar de baja no borra: cierra la búsqueda y conserva el trabajo hecho.
   * Eliminar de verdad solo se ofrece si nada quedó colgando de ella.
   */
  darDeBaja(b: Busqueda): void {
    if (!confirm(`¿Cerrar la búsqueda "${b.Puesto}"? Los candidatos presentados se conservan.`)) return;
    this.busquedaService.baja(b.ID ?? '').subscribe({
      next: () => { this.mensaje = 'Búsqueda cerrada'; this.cargar(); },
      error: e => this.mensaje = e.message
    });
  }

  eliminar(b: Busqueda): void {
    this.busquedaService.eliminar(b.ID ?? '').subscribe({
      next: r => {
        if (r?.requiereConfirmacion) {
          if (confirm(r.mensaje + '\n\n¿Eliminar igual?')) {
            this.busquedaService.eliminar(b.ID ?? '', true).subscribe({
              next: () => { this.mensaje = 'Búsqueda eliminada'; this.cargar(); },
              error: e => this.mensaje = e.message
            });
          }
          return;
        }
        this.mensaje = 'Búsqueda eliminada';
        this.cargar();
      },
      error: e => this.mensaje = e.message
    });
  }

  abrir(b: Busqueda): void { this.router.navigate(['/busqueda', b.ID]); }
  nueva(): void { this.router.navigate(['/busqueda-form', 'nueva']); }
  editar(b: Busqueda): void { this.router.navigate(['/busqueda-form', b.ID]); }
}
