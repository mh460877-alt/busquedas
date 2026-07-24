import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BusquedaService } from '../../services/busqueda.service';
import { EmpresaService } from '../../services/empresa.service';
import { LoginService } from '../../services/login.service';
import { Busqueda } from '../../models/busqueda';
import { Empresa } from '../../models/empresa';

@Component({
  selector: 'app-busqueda-form',
  templateUrl: './busqueda-form.component.html',
  styleUrls: ['./busqueda-form.component.css']
})
export class BusquedaFormComponent implements OnInit {

  busqueda: Busqueda = { Puesto: '', EmpresaID: '', Provincia: '', Descripcion: '' };
  empresas: Empresa[] = [];
  etapas: string[] = [];
  estados: string[] = [];
  esNueva = true;
  guardando = false;
  mensaje = '';

  /** Provincias con valores fijos: escritas a mano nunca coinciden al filtrar. */
  provincias = [
    'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes',
    'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones',
    'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe',
    'Santiago del Estero', 'Tierra del Fuego', 'Tucumán', 'Bolivia'
  ];

  constructor(
    private busquedaService: BusquedaService,
    private empresaService: EmpresaService,
    private loginService: LoginService,
    private ruta: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loginService.catalogos().subscribe({
      next: c => { this.etapas = c.etapasBusqueda; this.estados = c.estadosBusqueda; },
      error: () => { }
    });
    this.empresaService.listar().subscribe({ next: e => this.empresas = e, error: () => { } });

    const id = this.ruta.snapshot.paramMap.get('id');
    if (id && id !== 'nueva') {
      this.esNueva = false;
      this.busquedaService.listar().subscribe({
        next: lista => {
          const encontrada = lista.find(b => b.ID === id);
          if (encontrada) this.busqueda = encontrada;
        },
        error: e => this.mensaje = e.message
      });
    }
  }

  guardar(): void {
    if (!this.busqueda.Puesto?.trim()) { this.mensaje = 'El puesto es obligatorio.'; return; }
    this.guardando = true;

    const listo = () => { this.guardando = false; this.router.navigate(['/busquedas']); };
    const falla = (e: Error) => { this.guardando = false; this.mensaje = e.message; };

    if (this.esNueva) {
      this.busquedaService.crear(this.busqueda).subscribe({ next: listo, error: falla });
    } else {
      this.busquedaService.editar(this.busqueda.ID ?? '', this.busqueda)
        .subscribe({ next: listo, error: falla });
    }
  }

  volver(): void { this.router.navigate(['/busquedas']); }
}
