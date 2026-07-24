import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BusquedaService } from '../../services/busqueda.service';
import { CandidatoService } from '../../services/candidato.service';
import { StorageService } from '../../services/storage.service';
import { Busqueda } from '../../models/busqueda';
import { Candidato } from '../../models/candidato';

/**
 * Panel C · lo que ve un consultor externo.
 *
 * No hay ningún filtro acá: el servidor solo devuelve las búsquedas que tiene
 * asignadas y los candidatos que él mismo presentó. Si no tiene nada asignado,
 * no recibe nada.
 */
@Component({
  selector: 'app-mis-busquedas',
  templateUrl: './mis-busquedas.component.html',
  styleUrls: ['./mis-busquedas.component.css']
})
export class MisBusquedasComponent implements OnInit {

  busquedas: Busqueda[] = [];
  candidatos: Candidato[] = [];
  cargando = true;
  mensaje = '';

  constructor(
    private busquedaService: BusquedaService,
    private candidatoService: CandidatoService,
    private storage: StorageService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.busquedaService.listar().subscribe({
      next: b => { this.busquedas = b; this.cargando = false; },
      error: e => { this.mensaje = e.message; this.cargando = false; }
    });
    this.candidatoService.listar().subscribe({ next: c => this.candidatos = c, error: () => { } });
  }

  get nombre(): string { return this.storage.nombre; }

  presentados(b: Busqueda): number {
    return this.candidatos.filter(c => c.BusquedaID === b.ID).length;
  }

  abrir(b: Busqueda): void { this.router.navigate(['/busqueda', b.ID]); }
  presentar(b: Busqueda): void { this.router.navigate(['/presentar', b.ID]); }
}
