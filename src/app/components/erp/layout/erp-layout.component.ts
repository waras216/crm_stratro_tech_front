import { Component, Input, Output, EventEmitter } from '@angular/core';

export type ErpTab = 'inventario' | 'compras' | 'finanzas';

@Component({
  selector: 'app-erp-layout',
  standalone: false,
  templateUrl: './erp-layout.component.html',
  styleUrls: ['./erp-layout.component.scss'],
})
export class ErpLayoutComponent {
  @Input() tabActivo: ErpTab = 'inventario';
  @Output() cambiarTab = new EventEmitter<ErpTab>();

  tabs: { id: ErpTab; label: string; icon: string }[] = [
    { id: 'inventario', label: 'Inventario', icon: '📦' },
    { id: 'compras', label: 'Compras', icon: '🛒' },
    { id: 'finanzas', label: 'Finanzas', icon: '💰' },
  ];
}
