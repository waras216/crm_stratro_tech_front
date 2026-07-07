import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { ErpMovimiento } from '../../../models/erp.models';

@Component({
  selector: 'app-erp-finanzas',
  standalone: false,
  templateUrl: './finanzas.component.html',
  styleUrls: ['./finanzas.component.scss'],
})
export class ErpFinanzasComponent implements OnInit {
  movimientos: ErpMovimiento[] = [];

  constructor(private erpService: ErpService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.erpService.cargarMovimientos().subscribe();
    this.erpService.movimientos$.subscribe(data => { this.movimientos = data; this.cdr.detectChanges(); });
  }

  get ingresos() { return this.movimientos.filter(m => m.tipo === 'ingreso').reduce((s, m) => s + Number(m.monto), 0); }
  get egresos() { return this.movimientos.filter(m => m.tipo === 'egreso').reduce((s, m) => s + Number(m.monto), 0); }
  get balance() { return this.ingresos - this.egresos; }
}
