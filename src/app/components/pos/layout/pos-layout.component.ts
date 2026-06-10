import { Component } from '@angular/core';

@Component({
  selector: 'app-pos-layout',
  standalone: false,
  templateUrl: './pos-layout.component.html',
  styleUrls: ['./pos-layout.component.scss'],
})
export class PosLayoutComponent {
  now = new Date();
  cajero = 'Administrador';
}
