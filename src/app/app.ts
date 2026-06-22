import { Component } from '@angular/core';
import { ModuloCRM } from './models/crm.models';
import { AppMode } from './components/shared/app-switcher.component';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  appMode: AppMode = 'crm';
  moduloActivo: ModuloCRM = 'dashboard';

  navigate(modulo: ModuloCRM) { this.moduloActivo = modulo; }
  switchApp(mode: AppMode) { this.appMode = mode; }
}
