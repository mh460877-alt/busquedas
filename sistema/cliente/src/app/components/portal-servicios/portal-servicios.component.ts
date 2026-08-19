import { Component, OnInit } from '@angular/core';
import { PortalService } from '../../services/portal.service';
import { Portal } from '../../models/solicitud';
import { Adjunto } from '../../models/adjunto';

/**
 * Mi servicio: qué tiene contratado el cliente y cómo va cada cosa.
 * Sus búsquedas, sus proyectos de consultoría y sus capacitaciones, con los
 * entregables colgando de cada uno.
 */
@Component({
  selector: 'app-portal-servicios',
  templateUrl: './portal-servicios.component.html',
  styleUrls: ['./portal-servicios.component.css']
})
export class PortalServiciosComponent implements OnInit {

  p: Portal | null = null;
  cargando = true;
  mensaje = '';

  constructor(private portal: PortalService) { }

  ngOnInit(): void {
    this.portal.cargar().subscribe({
      next: p => { this.p = p; this.cargando = false; },
      error: e => { this.mensaje = e.message; this.cargando = false; }
    });
  }

  get busquedas() { return this.p?.busquedas ?? []; }
  get proyectos() { return this.p?.proyectos ?? []; }
  get capacitaciones() { return this.p?.capacitaciones ?? []; }

  candidatosDe(busquedaId?: string): number {
    return (this.p?.candidatos ?? []).filter(c => String(c.BusquedaID) === String(busquedaId)).length;
  }

  enlacesDe(entidad: string, id?: string): Adjunto[] {
    return (this.p?.adjuntos ?? [])
      .filter(a => a.Entidad === entidad && String(a.RegistroID) === String(id));
  }

  activa(estado?: string): boolean { return !/finaliz|cerrad/i.test(estado || ''); }
}
