import { Component, EventEmitter, Input, Output } from '@angular/core';

export type EmptyStateColor = 'indigo' | 'blue' | 'emerald' | 'amber' | 'rose';

// Mismo tratamiento (gradiente + glow) que los botones "Nuevo X" de las toolbars
// (ver Clientes/.btn-accent) — antes este botón era un bg-*-600 plano y desentonaba.
const ACCION_STYLE: Record<EmptyStateColor, string> = {
  indigo: 'background:linear-gradient(135deg,#6366f1,#8b5cf6);box-shadow:0 4px 12px rgba(99,102,241,.4)',
  blue:   'background:linear-gradient(135deg,#3b82f6,#2563eb);box-shadow:0 4px 12px rgba(59,130,246,.4)',
  emerald:'background:linear-gradient(135deg,#10b981,#059669);box-shadow:0 4px 12px rgba(16,185,129,.4)',
  amber:  'background:linear-gradient(135deg,#f59e0b,#d97706);box-shadow:0 4px 12px rgba(245,158,11,.4)',
  rose:   'background:linear-gradient(135deg,#f43f5e,#e11d48);box-shadow:0 4px 12px rgba(244,63,94,.4)',
};

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

  get accionStyle(): string { return ACCION_STYLE[this.color]; }
}
