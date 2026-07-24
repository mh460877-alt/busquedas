import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CandidatoService } from '../../services/candidato.service';
import { BusquedaService } from '../../services/busqueda.service';
import { Candidato } from '../../models/candidato';
import { Busqueda } from '../../models/busqueda';

/**
 * Presentar un candidato, en dos pasos.
 *
 * Primero se verifica el documento contra la base: si ya está cargado, no se
 * habilita el resto del formulario. Es la validación que ya existía y se
 * conserva, pero ahora la decide el servidor, no la pantalla.
 */
@Component({
  selector: 'app-candidato-form',
  templateUrl: './candidato-form.component.html',
  styleUrls: ['./candidato-form.component.css']
})
export class CandidatoFormComponent implements OnInit {

  candidato: Candidato = { DNI: '', Nombre: '', BusquedaID: '', LinkCV: '', LinkVideo: '' };
  busquedas: Busqueda[] = [];
  dniVerificado = false;
  verificando = false;
  guardando = false;
  mensaje = '';
  error = false;

  constructor(
    private candidatoService: CandidatoService,
    private busquedaService: BusquedaService,
    private ruta: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    const busquedaId = this.ruta.snapshot.paramMap.get('busquedaId');
    this.busquedaService.listar().subscribe({
      next: b => {
        this.busquedas = b.filter(x => x.Estado === 'Activa');
        if (busquedaId && busquedaId !== 'nueva') this.candidato.BusquedaID = busquedaId;
      },
      error: e => this.avisar(e.message, true)
    });
  }

  verificarDni(): void {
    const dni = (this.candidato.DNI ?? '').trim();
    if (!dni) { this.avisar('Ingresá un documento válido.', true); return; }

    this.verificando = true;
    this.candidatoService.listar().subscribe({
      next: lista => {
        this.verificando = false;
        const repetido = lista.some(c => String(c.DNI).trim() === dni);
        if (repetido) {
          this.avisar('Ese documento ya está registrado en el sistema. No se puede duplicar.', true);
          return;
        }
        this.dniVerificado = true;
        this.avisar('Documento libre. Podés continuar con la carga.', false);
      },
      error: e => { this.verificando = false; this.avisar(e.message, true); }
    });
  }

  corregirDni(): void {
    this.dniVerificado = false;
    this.mensaje = '';
  }

  guardar(): void {
    if (!this.candidato.Nombre?.trim() || !this.candidato.BusquedaID) {
      this.avisar('Completá el nombre y la búsqueda.', true);
      return;
    }
    this.guardando = true;

    // El servidor vuelve a validar el documento y fuerza quién lo presentó.
    this.candidatoService.crear(this.candidato).subscribe({
      next: () => {
        this.guardando = false;
        this.router.navigate(['/busqueda', this.candidato.BusquedaID]);
      },
      error: e => { this.guardando = false; this.avisar(e.message, true); }
    });
  }

  volver(): void { this.router.navigate(['/mis-busquedas']); }

  private avisar(texto: string, esError: boolean): void {
    this.mensaje = texto;
    this.error = esError;
  }
}
