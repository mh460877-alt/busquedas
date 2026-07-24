import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EmpresaService } from '../../services/empresa.service';
import { LoginService } from '../../services/login.service';
import { Empresa } from '../../models/empresa';

@Component({
  selector: 'app-empresa-form',
  templateUrl: './empresa-form.component.html',
  styleUrls: ['./empresa-form.component.css']
})
export class EmpresaFormComponent implements OnInit {

  empresa: Empresa = { Nombre: '', Linea: '', Contacto: '', Email: '', Telefono: '' };
  lineas: string[] = [];
  estados: string[] = [];
  esNueva = true;
  guardando = false;
  mensaje = '';

  constructor(
    private empresaService: EmpresaService,
    private loginService: LoginService,
    private ruta: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loginService.catalogos().subscribe({
      next: c => { this.lineas = c.lineas; this.estados = c.estadosEmpresa; },
      error: () => { }
    });

    const id = this.ruta.snapshot.paramMap.get('id');
    if (id && id !== 'nueva') {
      this.esNueva = false;
      this.empresaService.listar().subscribe({
        next: lista => {
          const encontrada = lista.find(e => e.ID === id);
          if (encontrada) this.empresa = encontrada;
        },
        error: e => this.mensaje = e.message
      });
    }
  }

  guardar(): void {
    if (!this.empresa.Nombre?.trim()) { this.mensaje = 'El nombre es obligatorio.'; return; }
    this.guardando = true;

    const listo = () => { this.guardando = false; this.router.navigate(['/empresas']); };
    const falla = (e: Error) => { this.guardando = false; this.mensaje = e.message; };

    if (this.esNueva) {
      this.empresaService.crear(this.empresa).subscribe({ next: listo, error: falla });
    } else {
      this.empresaService.editar(this.empresa.ID ?? '', this.empresa).subscribe({ next: listo, error: falla });
    }
  }

  volver(): void { this.router.navigate(['/empresas']); }
}
