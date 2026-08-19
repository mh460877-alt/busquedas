import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PortalService } from '../../services/portal.service';
import { StorageService } from '../../services/storage.service';
import { Portal } from '../../models/solicitud';

/** Una fecha que se viene, sin importar de qué tabla salió. */
interface Proxima { fecha: string; titulo: string; tipo: string; }

/**
 * Inicio del portal del cliente.
 *
 * Lo primero que ve al entrar: en qué está su vínculo con Escencial. Números
 * arriba, lo que se viene en el medio, y el botón para pedir algo nuevo, que
 * es lo que el portal vino a resolver.
 */
@Component({
  selector: 'app-portal-inicio',
  templateUrl: './portal-inicio.component.html',
  styleUrls: ['./portal-inicio.component.css']
})
export class PortalInicioComponent implements OnInit {

  p: Portal | null = null;
  cargando = true;
  mensaje = '';

  /** Un pedido sigue vivo mientras no esté finalizado. */
  private readonly abiertos = ['Nueva', 'Recibida', 'En analisis', 'En proceso', 'Pendiente cliente'];

  constructor(
    private portal: PortalService,
    private storage: StorageService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.portal.cargar().subscribe({
      next: p => { this.p = p; this.cargando = false; },
      error: e => { this.mensaje = e.message; this.cargando = false; }
    });
  }

  get nombre(): string { return this.storage.nombre; }
  get empresa(): string { return this.p?.empresa?.Nombre ?? ''; }

  get solicitudesAbiertas(): number {
    return (this.p?.solicitudes ?? []).filter(s => this.abiertos.includes(s.Estado || '')).length;
  }

  /** Pedidos que esperan algo del cliente: son los que frenan el trabajo. */
  get esperandome(): number {
    return (this.p?.solicitudes ?? []).filter(s => s.Estado === 'Pendiente cliente').length;
  }

  get busquedasActivas(): number {
    return (this.p?.busquedas ?? []).filter(b => b.Estado === 'Activa').length;
  }

  get candidatosPresentados(): number { return (this.p?.candidatos ?? []).length; }

  get proyectosEnCurso(): number {
    return (this.p?.proyectos ?? []).filter(p => !/finaliz/i.test(p.Estado || '')).length;
  }

  /** Candidatos que todavía no recibieron ninguna devolución del cliente. */
  get sinDevolucion(): number {
    const conObs = new Set((this.p?.observaciones ?? []).map(o => String(o.CandidatoID)));
    return (this.p?.candidatos ?? []).filter(c => !conObs.has(String(c.ID))).length;
  }

  /** Lo que viene: capacitaciones y cierres de proyecto, de hoy en adelante. */
  get proximas(): Proxima[] {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const salida: Proxima[] = [];
    const sumar = (fecha: string, titulo: string, tipo: string) => {
      if (!fecha) return;
      const d = new Date(String(fecha).slice(0, 10) + 'T00:00:00');
      if (isNaN(d.getTime()) || d < hoy) return;
      salida.push({ fecha: String(fecha).slice(0, 10), titulo, tipo });
    };
    (this.p?.capacitaciones ?? []).forEach(c => sumar(c.Fecha, c.Tema || 'Capacitación', 'Capacitación'));
    (this.p?.proyectos ?? []).forEach(p => sumar(p.FechaFin, (p.Proyecto || 'Proyecto') + ' · cierre', 'Proyecto'));
    (this.p?.solicitudes ?? []).forEach(s => sumar(s.FechaEstimada || '', s.Titulo, 'Pedido'));
    return salida.sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 8);
  }

  /** Lo último que se adjuntó, que es lo que el cliente suele venir a buscar. */
  get documentosRecientes() {
    return (this.p?.adjuntos ?? [])
      .slice()
      .sort((a, b) => String(b.MarcaTiempo ?? '').localeCompare(String(a.MarcaTiempo ?? '')))
      .slice(0, 5);
  }

  ir(ruta: string): void { this.router.navigate([ruta]); }
}
