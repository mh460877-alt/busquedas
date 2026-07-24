import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { LoginService } from '../../services/login.service';
import { StorageService } from '../../services/storage.service';
import { MODULOS } from '../../models/modulos.config';
import { ConfigModulo, CampoModulo } from '../../models/modulo';

/**
 * Componente genérico para los módulos internos (agenda RR.HH.).
 * Todos son tablas CRUD del mismo patrón, así que uno solo los dibuja a todos:
 * la configuración de cada módulo vive en modulos.config.ts.
 *
 * Los permisos los aplica el servidor; acá solo se muestran u ocultan botones.
 */
@Component({
  selector: 'app-modulo-interno',
  templateUrl: './modulo-interno.component.html',
  styleUrls: ['./modulo-interno.component.css']
})
export class ModuloInternoComponent implements OnInit {

  config!: ConfigModulo;
  filas: any[] = [];
  catalogos: any = {};
  permisos: string[] = [];
  filtro = '';
  cargando = true;
  mensaje = '';

  editando: any | null = null;   // registro en edición (o {} para nuevo)
  esNuevo = false;
  guardando = false;
  verClaves: { [id: string]: boolean } = {};   // mostrar/ocultar en la bóveda

  constructor(
    private api: ApiService,
    private loginService: LoginService,
    private storage: StorageService,
    private ruta: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // Se reconfigura al cambiar de módulo sin recrear el componente.
    this.ruta.data.subscribe(() => this.iniciar());
    this.ruta.params.subscribe(() => this.iniciar());
  }

  private iniciar(): void {
    const clave = this.ruta.snapshot.data['modulo'];
    this.config = MODULOS[clave];
    this.editando = null;
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.loginService.catalogos().subscribe({
      next: c => {
        this.catalogos = c;
        this.permisos = (c.permisos && c.permisos[this.config.entidad]) || [];
      },
      error: () => { }
    });
    this.api.listar<any>(this.config.entidad).subscribe({
      next: f => { this.filas = f; this.cargando = false; },
      error: e => { this.mensaje = e.message; this.cargando = false; }
    });
  }

  get rol(): string { return this.storage.rol; }
  puede(accion: string): boolean { return this.permisos.includes(accion); }

  get columnas(): CampoModulo[] { return this.config.campos.filter(c => c.enTabla); }

  opcionesDe(campo: CampoModulo): string[] {
    if (campo.opciones) return campo.opciones;
    if (campo.catalogo) return this.catalogos[campo.catalogo] || [];
    return [];
  }

  get visibles(): any[] {
    const t = this.filtro.toLowerCase().trim();
    if (!t) return this.filas;
    return this.filas.filter(f =>
      this.config.campos.map(c => f[c.clave]).join(' ').toLowerCase().includes(t));
  }

  mostrar(fila: any, campo: CampoModulo): string {
    const v = fila[campo.clave];
    if (campo.tipo === 'password') {
      return this.verClaves[fila.ID] ? (v || '—') : '••••••••';
    }
    return v || '—';
  }

  alternarClave(fila: any): void { this.verClaves[fila.ID] = !this.verClaves[fila.ID]; }

  nuevo(): void { this.esNuevo = true; this.editando = {}; }
  editar(fila: any): void { this.esNuevo = false; this.editando = { ...fila }; }
  cerrar(): void { this.editando = null; }

  guardar(): void {
    const faltan = this.config.campos
      .filter(c => c.requerido && !this.editando[c.clave])
      .map(c => c.etiqueta);
    if (faltan.length) { this.mensaje = 'Faltan: ' + faltan.join(', '); return; }

    this.guardando = true;
    const fin = () => { this.guardando = false; this.editando = null; this.mensaje = 'Guardado'; this.cargar(); };
    const err = (e: Error) => { this.guardando = false; this.mensaje = e.message; };

    if (this.esNuevo) {
      this.api.crear(this.config.entidad, this.editando).subscribe({ next: fin, error: err });
    } else {
      this.api.editar(this.config.entidad, this.editando.ID, this.editando).subscribe({ next: fin, error: err });
    }
  }

  eliminar(fila: any): void {
    if (!confirm('¿Eliminar este registro?')) return;
    this.api.eliminar(this.config.entidad, fila.ID, true).subscribe({
      next: () => { this.mensaje = 'Eliminado'; this.cargar(); },
      error: e => this.mensaje = e.message
    });
  }
}
