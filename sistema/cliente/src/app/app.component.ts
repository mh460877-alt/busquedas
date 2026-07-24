import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  /** La barra de navegación no se muestra en la pantalla de acceso. */
  mostrarNav = false;

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(e => {
        this.mostrarNav = !(e as NavigationEnd).urlAfterRedirects.startsWith('/login');
      });
  }
}
