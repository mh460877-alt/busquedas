import { Component, OnInit } from '@angular/core';
import { BusquedaService } from '../../services/busqueda.service';
import { CandidatoService } from '../../services/candidato.service';
import { ObservacionService } from '../../services/observacion.service';
import { StorageService } from '../../services/storage.service';
import { Busqueda } from '../../models/busqueda';
import { Candidato } from '../../models/candidato';
import { Observacion } from '../../models/observacion';

/**
 * Panel E · lo que ve una empresa cliente.
 *
 * Tres definiciones acordadas, que aplica el servidor:
 *   · los candidatos aparecen recién a partir de terna
 *   · no se muestra qué consultor los presentó
 *   · no se envía el documento
 *
 * Lo que sí tiene es un espacio propio para dejar devoluciones, que vuelven
 * al panel interno sin que nadie tenga que reenviar nada.
 */
@Component({
  selector: 'app-mi-proceso',
  templateUrl: './mi-proceso.component.html',
  styleUrls: ['./mi-proceso.component.css']
})
export class MiProcesoComponent implements OnInit {

  busquedas: Busqueda[] = [];
  candidatos: Candidato[] = [];
  observaciones: Observacion[] = [];
  cargando = true;
  mensaje = '';

  comentando: Candidato | null = null;
  texto = '';

  constructor(
    private busquedaService: BusquedaService,
    private candidatoService: CandidatoService,
    private observacionService: ObservacionService,
    private storage: StorageService
  ) { }

  ngOnInit(): void { this.cargar(); }

  get nombre(): string { return this.storage.nombre; }

  cargar(): void {
    this.cargando = true;
    this.busquedaService.listar().subscribe({
      next: b => { this.busquedas = b; this.cargando = false; },
      error: e => { this.mensaje = e.message; this.cargando = false; }
    });
    this.candidatoService.listar().subscribe({ next: c => this.candidatos = c, error: () => { } });
    this.observacionService.listar().subscribe({ next: o => this.observaciones = o, error: () => { } });
  }

  candidatosDe(b: Busqueda): Candidato[] {
    return this.candidatos.filter(c => c.BusquedaID === b.ID);
  }

  observacionesDe(c: Candidato): Observacion[] {
    return this.observaciones.filter(o => o.CandidatoID === c.ID);
  }

  abrirObservacion(c: Candidato): void { this.comentando = c; this.texto = ''; }

  guardar(): void {
    if (!this.comentando?.ID || !this.texto.trim()) return;
    this.observacionService.crear({
      CandidatoID: this.comentando.ID,
      Texto: this.texto.trim()
    }).subscribe({
      next: o => {
        this.observaciones.push(o);
        this.comentando = null;
        this.mensaje = 'Gracias. Tu devolución ya le llegó al equipo.';
      },
      error: e => this.mensaje = e.message
    });
  }
}
