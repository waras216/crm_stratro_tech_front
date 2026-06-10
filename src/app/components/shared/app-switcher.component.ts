import { Component, Input, Output, EventEmitter } from '@angular/core';

export type AppMode = 'crm' | 'pos' | 'erp';

@Component({
  selector: 'app-switcher',
  standalone: false,
  templateUrl: './app-switcher.component.html',
  styleUrls: ['./app-switcher.component.scss'],
})
export class AppSwitcherComponent {
  @Input() activeApp: AppMode = 'crm';
  @Output() switchApp = new EventEmitter<AppMode>();
}
