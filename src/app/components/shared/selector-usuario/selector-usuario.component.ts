import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UsuarioService } from '../../../core/services/usuario.service';

/**
 * Selector reusable de los usuarios del tenant activo (los mismos que
 * Configuración → Equipo), para no reimplementar el <select> en cada
 * pantalla que necesite asignar un responsable/cajero/etc.
 * Uso: <app-selector-usuario [(value)]="form.responsable"></app-selector-usuario>
 */
@Component({
  selector: 'app-selector-usuario',
  standalone: false,
  template: `
    <select [ngModel]="value" (ngModelChange)="onChange($event)" [class]="clase">
      <option value="">{{ placeholder }}</option>
      <option *ngFor="let u of usuarioService.usuarios" [value]="u.nombre">{{ u.nombre }}{{ u.email ? ' (' + u.email + ')' : '' }}</option>
    </select>
  `,
})
export class SelectorUsuarioComponent implements OnInit {
  @Input() value: string | null = '';
  @Input() placeholder = 'Sin asignar';
  @Input() clase = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm';
  @Output() valueChange = new EventEmitter<string>();

  constructor(public usuarioService: UsuarioService) {}

  ngOnInit() {
    if (!this.usuarioService.usuarios.length) this.usuarioService.cargarUsuarios().subscribe();
  }

  onChange(v: string) {
    this.value = v;
    this.valueChange.emit(v);
  }
}
