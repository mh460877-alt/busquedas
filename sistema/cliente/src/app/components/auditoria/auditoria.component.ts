import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

interface Movimiento {
  Fecha?: string;
  UsuarioNombre?: string;
  Accion?: string;
  Entidad?: string;
  RegistroID?: string;
  Detalle?: string;
}

/**
 * Quién hizo cada cosa.
 *
 * No se carga a mano: la escribe el sistema en cada movimiento. Es la respuesta
 * a «esto lo hizo Carla, esto lo hizo Paula» sin que nadie tenga que anotarlo.
 */
@Component({
  selector: 'app-auditoria',
  templateUrl: './auditoria.component.html',
  styleUrls: ['./auditoria.component.css']
})
export class AuditoriaComponent implements OnInit {

  movimientos: Movimiento[] = [];
  filtro = '';
  cargando = true;
  mensaje = '';

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    this.api.listar<Movimiento>('Auditoria').subscribe({
      next: m => { this.movimientos = m.reverse(); this.cargando = false; },
      error: e => { this.mensaje = e.message; this.cargando = false; }
    });
  }

  get visibles(): Movimiento[] {
    const t = this.filtro.toLowerCase().trim();
    if (!t) return this.movimientos;
    return this.movimientos.filter(m =>
      [m.UsuarioNombre, m.Accion, m.Entidad, m.Detalle].join(' ').toLowerCase().includes(t));
  }
}
