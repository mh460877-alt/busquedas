import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EmpresaService } from '../../services/empresa.service';
import { BusquedaService } from '../../services/busqueda.service';
import { StorageService } from '../../services/storage.service';
import { Empresa } from '../../models/empresa';
import { Busqueda } from '../../models/busqueda';

@Component({
  selector: 'app-empresa-list',
  templateUrl: './empresa-list.component.html',
  styleUrls: ['./empresa-list.component.css']
})
export class EmpresaListComponent implements OnInit {

  empresas: Empresa[] = [];
  busquedas: Busqueda[] = [];
  filtro = '';
  cargando = true;
  mensaje = '';

  constructor(
    private empresaService: EmpresaService,
    private busquedaService: BusquedaService,
    private storage: StorageService,
    private router: Router
  ) { }

  ngOnInit(): void { this.cargar(); }

  get esAdmin(): boolean { return this.storage.rol === 'Admin'; }

  cargar(): void {
    this.cargando = true;
    this.empresaService.listar().subscribe({
      next: e => { this.empresas = e; this.cargando = false; },
      error: e => { this.mensaje = e.message; this.cargando = false; }
    });
    this.busquedaService.listar().subscribe({ next: b => this.busquedas = b, error: () => { } });
  }

  get visibles(): Empresa[] {
    const t = this.filtro.toLowerCase().trim();
    if (!t) return this.empresas;
    return this.empresas.filter(e =>
      [e.Nombre, e.Linea, e.Contacto, e.Email, e.Estado].join(' ').toLowerCase().includes(t));
  }

  cantidadBusquedas(e: Empresa): number {
    return this.busquedas.filter(b => b.EmpresaID === e.ID).length;
  }

  darDeBaja(e: Empresa): void {
    if (!confirm(`¿Cerrar el cliente ${e.Nombre}? Sus búsquedas se conservan.`)) return;
    this.empresaService.baja(e.ID ?? '').subscribe({
      next: () => { this.mensaje = 'Cliente cerrado'; this.cargar(); },
      error: err => this.mensaje = err.message
    });
  }

  nueva(): void { this.router.navigate(['/empresa-form', 'nueva']); }
  editar(e: Empresa): void { this.router.navigate(['/empresa-form', e.ID]); }

  /** Todo lo del cliente junto: búsquedas, agenda interna y enlaces. */
  verFicha(e: Empresa): void { this.router.navigate(['/empresa', e.ID]); }
}
