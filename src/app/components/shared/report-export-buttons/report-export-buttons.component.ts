import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-report-export-buttons',
  standalone: false,
  templateUrl: './report-export-buttons.component.html',
})
export class ReportExportButtonsComponent {
  @Output() pdf = new EventEmitter<void>();
  @Output() excel = new EventEmitter<void>();
}
