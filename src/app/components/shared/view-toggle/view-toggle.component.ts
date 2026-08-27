import { Component, EventEmitter, Input, Output } from '@angular/core';

export type ViewMode = 'grid' | 'table';

@Component({
  selector: 'app-view-toggle',
  standalone: false,
  templateUrl: './view-toggle.component.html',
})
export class ViewToggleComponent {
  @Input() value: ViewMode = 'grid';
  @Input() gridLabel = 'Tarjetas';
  @Input() tableLabel = 'Lista';
  @Output() valueChange = new EventEmitter<ViewMode>();

  set(mode: ViewMode) {
    if (mode === this.value) return;
    this.value = mode;
    this.valueChange.emit(mode);
  }
}
