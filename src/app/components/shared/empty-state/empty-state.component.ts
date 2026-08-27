import { Component, EventEmitter, Input, Output } from '@angular/core';

export type EmptyStateColor = 'indigo' | 'blue' | 'emerald' | 'amber' | 'rose';

@Component({
  selector: 'app-empty-state',
  standalone: false,
  templateUrl: './empty-state.component.html',
})
export class EmptyStateComponent {
  @Input() titulo = '';
  @Input() subtitulo = '';
  @Input() accionLabel = '';
  @Input() color: EmptyStateColor = 'indigo';
  @Output() accion = new EventEmitter<void>();
}
