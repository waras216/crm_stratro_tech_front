import { Component } from '@angular/core';
import { ModuloCRM } from './models/crm.models';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  moduloActivo: ModuloCRM = 'dashboard';
  navigate(modulo: ModuloCRM) { this.moduloActivo = modulo; }
}
