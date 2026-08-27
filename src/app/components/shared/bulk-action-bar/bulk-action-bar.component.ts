import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-bulk-action-bar',
  standalone: false,
  templateUrl: './bulk-action-bar.component.html',
})
export class BulkActionBarComponent {
  @Input() label = '';
  @Output() deleteSelected = new EventEmitter<void>();
  @Output() clearSelection = new EventEmitter<void>();
}
