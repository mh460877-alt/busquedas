import { Component, OnInit } from '@angular/core';
import { PortalService } from '../../services/portal.service';
import { Portal } from '../../models/solicitud';
import { Adjunto } from '../../models/adjunto';

interface GrupoDoc { titulo: string; icono: string; docs: Adjunto[]; }

/**
 * La biblioteca del cliente: todo lo que Escencial le compartió, junto.
 *
 * Los documentos no se cargan acá: cuelgan de la búsqueda, del candidato, del
 * proyecto o del pedido donde se generaron. Esta pantalla los junta y los
 * agrupa por origen, para cuando uno sabe qué busca pero no dónde estaba.
 */
@Component({
  selector: 'app-portal-documentos',
  templateUrl: './portal-documentos.component.html',
  styleUrls: ['./portal-documentos.component.css']
})
export class PortalDocumentosComponent implements OnInit {

  p: Portal | null = null;
  cargando = true;
  mensaje = '';
  filtro = '';

  constructor(private portal: PortalService) { }

  ngOnInit(): void {
    this.portal.cargar().subscribe({
      next: p => { this.p = p; this.cargando = false; },
      error: e => { this.mensaje = e.message; this.cargando = false; }
    });
  }

  private nombreDe(a: Adjunto): string {
    const id = String(a.RegistroID);
    if (a.Entidad === 'Candidatos') {
      return this.p?.candidatos.find(c => String(c.ID) === id)?.Nombre ?? 'Candidato';
    }
    if (a.Entidad === 'Busquedas') {
      return this.p?.busquedas.find(b => String(b.ID) === id)?.Puesto ?? 'Búsqueda';
    }
    if (a.Entidad === 'Solicitudes') {
      return this.p?.solicitudes.find(s => String(s.ID) === id)?.Titulo ?? 'Pedido';
    }
    if (a.Entidad === 'Proyectos') {
      return this.p?.proyectos.find(x => String(x.ID) === id)?.Proyecto ?? 'Proyecto';
    }
    if (a.Entidad === 'Capacitaciones') {
      return this.p?.capacitaciones.find(x => String(x.ID) === id)?.Tema ?? 'Capacitación';
    }
    return this.p?.empresa?.Nombre ?? 'Mi empresa';
  }

  origen(a: Adjunto): string { return this.nombreDe(a); }

  get grupos(): GrupoDoc[] {
    const t = this.filtro.toLowerCase().trim();
    const todos = (this.p?.adjuntos ?? []).filter(a =>
      !t || (a.Titulo + ' ' + this.nombreDe(a)).toLowerCase().includes(t));

    const def: { entidad: string; titulo: string; icono: string }[] = [
      { entidad: 'Candidatos', titulo: 'Candidatos', icono: 'fa-user-check' },
      { entidad: 'Busquedas', titulo: 'Búsquedas', icono: 'fa-briefcase' },
      { entidad: 'Proyectos', titulo: 'Proyectos', icono: 'fa-diagram-project' },
      { entidad: 'Capacitaciones', titulo: 'Capacitaciones', icono: 'fa-graduation-cap' },
      { entidad: 'Solicitudes', titulo: 'Pedidos', icono: 'fa-inbox' },
      { entidad: 'Empresas', titulo: 'De tu empresa', icono: 'fa-building' }
    ];

    return def
      .map(d => ({
        titulo: d.titulo, icono: d.icono,
        docs: todos.filter(a => a.Entidad === d.entidad)
      }))
      .filter(g => g.docs.length > 0);
  }

  get total(): number { return this.grupos.reduce((n, g) => n + g.docs.length, 0); }
}
