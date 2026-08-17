import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EmpresaService } from '../../services/empresa.service';
import { FichaEmpresa } from '../../models/empresa';
import { Adjunto } from '../../models/adjunto';
import { MODULOS } from '../../models/modulos.config';

/**
 * Ficha de un cliente: todo lo que hicimos y tenemos de esa empresa, junto.
 *
 * Es lo que convierte al sistema en resguardo y no solo en organizador. Antes,
 * para saber qué pasaba con un cliente había que mirar el calendario, después
 * las búsquedas, después los viajes, y los enlaces estaban en un Trello aparte.
 * Acá está todo en una pantalla, y en una sola llamada al servidor.
 */
@Component({
  selector: 'app-empresa-ficha',
  templateUrl: './empresa-ficha.component.html',
  styleUrls: ['./empresa-ficha.component.css']
})
export class EmpresaFichaComponent implements OnInit {

  ficha: FichaEmpresa | null = null;
  cargando = true;
  mensaje = '';

  /** Enlaces agrupados por tabla y registro, para colgarlos donde corresponde. */
  private porRegistro: { [clave: string]: Adjunto[] } = {};

  /** Orden en que se muestran los módulos internos. */
  readonly ordenModulos = [
    'Proyectos', 'Pendientes', 'Viajes', 'Onboarding',
    'Capacitaciones', 'Comunicaciones', 'Materiales'
  ];

  constructor(
    private empresaService: EmpresaService,
    private ruta: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void { this.cargar(); }

  private cargar(): void {
    const id = this.ruta.snapshot.paramMap.get('id') ?? '';
    this.cargando = true;
    this.empresaService.ficha(id).subscribe({
      next: f => {
        this.ficha = f;
        this.indexarAdjuntos(f.adjuntos || []);
        this.cargando = false;
      },
      error: e => { this.mensaje = e.message; this.cargando = false; }
    });
  }

  private indexarAdjuntos(lista: Adjunto[]): void {
    this.porRegistro = {};
    lista.forEach(a => {
      const clave = a.Entidad + ':' + a.RegistroID;
      if (!this.porRegistro[clave]) this.porRegistro[clave] = [];
      this.porRegistro[clave].push(a);
    });
  }

  enlacesDe(entidad: string, registroId?: string): Adjunto[] {
    return this.porRegistro[entidad + ':' + registroId] || [];
  }

  /* ---------------- Módulos internos ---------------- */

  /** Solo los módulos que tienen algo cargado para este cliente. */
  get modulosConDatos(): string[] {
    if (!this.ficha) return [];
    return this.ordenModulos.filter(e => (this.ficha!.modulos[e] || []).length > 0);
  }

  filasDe(entidad: string): any[] {
    return this.ficha?.modulos[entidad] ?? [];
  }

  /** Título y campos visibles salen de la misma config que dibuja cada módulo. */
  private configDe(entidad: string) {
    const clave = Object.keys(MODULOS).find(k => MODULOS[k].entidad === entidad);
    return clave ? MODULOS[clave] : null;
  }

  tituloDe(entidad: string): string { return this.configDe(entidad)?.titulo ?? entidad; }
  iconoDe(entidad: string): string { return this.configDe(entidad)?.icono ?? 'fa-folder'; }

  /** Las columnas de la tabla, sin la del cliente: acá ya sabemos cuál es. */
  columnasDe(entidad: string) {
    const config = this.configDe(entidad);
    if (!config) return [];
    return config.campos.filter(c => c.enTabla && c.clave !== 'EmpresaID');
  }

  candidatosDe(busquedaId?: string): any[] {
    return (this.ficha?.candidatos ?? []).filter(c => c.BusquedaID === busquedaId);
  }

  /* ---------------- Totales del encabezado ---------------- */

  get totalRegistros(): number {
    if (!this.ficha) return 0;
    return this.ordenModulos.reduce((n, e) => n + (this.ficha!.modulos[e] || []).length, 0);
  }

  get totalEnlaces(): number { return this.ficha?.adjuntos.length ?? 0; }

  abrirBusqueda(id?: string): void { this.router.navigate(['/busqueda', id]); }
  editar(): void { this.router.navigate(['/empresa-form', this.ficha?.empresa.ID]); }
  volver(): void { this.router.navigate(['/empresas']); }
}
