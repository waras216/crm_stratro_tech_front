import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { ErpPedido } from '../../../models/erp.models';

@Component({
  selector: 'app-erp-ventas',
  standalone: false,
  template: `
    <div class="flex flex-col gap-5 page-enter">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="m-0 text-lg font-bold text-slate-800">Ventas</h2>
          <p class="text-xs text-slate-500 m-0 mt-1">Pedidos, presupuestos y facturación</p>
        </div>
        <button (click)="openNew()" class="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium border-0 cursor-pointer hover:bg-amber-700">+ Nuevo Pedido</button>
      </div>
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-1">
          <p class="text-xs text-slate-500 m-0">Pedidos</p>
          <p class="text-2xl font-bold text-amber-600 m-0">{{ pedidos.length }}</p>
        </div>
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-2">
          <p class="text-xs text-slate-500 m-0">Facturado</p>
          <p class="text-2xl font-bold text-emerald-600 m-0">\${{ facturado.toLocaleString() }}</p>
        </div>
        <div class="bg-white rounded-xl p-4 border border-slate-100 card-enter delay-3">
          <p class="text-xs text-slate-500 m-0">Por Cobrar</p>
          <p class="text-2xl font-bold text-red-600 m-0">\${{ porCobrar.toLocaleString() }}</p>
        </div>
      </div>
      <div class="bg-white border border-slate-200 rounded-xl overflow-hidden scale-in delay-3">
        <table class="w-full text-sm border-collapse">
          <thead><tr class="bg-slate-50">
            <th class="text-left px-4 py-3 font-medium text-slate-500">Pedido</th>
            <th class="text-left px-4 py-3 font-medium text-slate-500">Cliente</th>
            <th class="text-right px-4 py-3 font-medium text-slate-500">Total</th>
            <th class="text-center px-4 py-3 font-medium text-slate-500">Estado</th>
          </tr></thead>
          <tbody>
            <tr *ngFor="let p of pedidos" class="border-b border-slate-100 hover:bg-slate-50">
              <td class="px-4 py-3 font-mono text-xs">#{{ p.id }}</td>
              <td class="px-4 py-3 font-medium">{{ p.cliente }}</td>
              <td class="px-4 py-3 text-right font-medium">\${{ p.total.toLocaleString() }}</td>
              <td class="px-4 py-3 text-center"><span class="px-2 py-0.5 rounded-full text-xs font-medium" [ngClass]="p.estado==='enviado'?'badge-green':p.estado==='pendiente'?'badge-amber':'badge-blue'">{{ p.estado }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div *ngIf="dialogOpen" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" (click)="dialogOpen=false"></div>
    <div *ngIf="dialogOpen" class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl w-[90%] max-w-md z-[101] shadow-2xl p-6 modal-in">
      <h3 class="m-0 mb-4 text-lg font-semibold">Nuevo Pedido</h3>
      <div class="flex flex-col gap-3">
        <input class="px-3 py-2 border border-slate-200 rounded-lg text-sm" [(ngModel)]="form.cliente" placeholder="Cliente" />
        <input class="px-3 py-2 border border-slate-200 rounded-lg text-sm" type="number" [(ngModel)]="form.total" placeholder="Total $" />
        <p *ngIf="error" class="text-xs text-red-600 m-0">{{ error }}</p>
        <button (click)="submit()" [disabled]="saving" class="w-full py-2.5 bg-amber-600 text-white rounded-lg border-0 cursor-pointer text-sm font-semibold hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed">{{ saving ? 'Guardando...' : 'Crear Pedido' }}</button>
      </div>
    </div>
  `,
})
export class ErpVentasComponent implements OnInit {
  dialogOpen = false;
  saving = false;
  error = '';
  form = { cliente: '', total: '' };
  pedidos: ErpPedido[] = [];

  constructor(private erpService: ErpService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.erpService.cargarPedidos().subscribe();
    this.erpService.pedidos$.subscribe(data => { this.pedidos = data; this.cdr.detectChanges(); });
  }

  get facturado() { return this.pedidos.filter(p => p.estado === 'facturado').reduce((s, p) => s + Number(p.total), 0); }
  get porCobrar() { return this.pedidos.filter(p => p.estado !== 'facturado').reduce((s, p) => s + Number(p.total), 0); }

  openNew() { this.form = { cliente: '', total: '' }; this.error = ''; this.dialogOpen = true; }

  submit() {
    if (this.saving) return;
    if (!this.form.cliente) { this.error = 'El cliente es obligatorio.'; return; }

    this.saving = true;
    this.error = '';
    this.erpService.addPedido({
      cliente: this.form.cliente,
      total: Number(this.form.total) || 0,
    }).subscribe({
      next: () => { this.saving = false; this.dialogOpen = false; this.cdr.detectChanges(); },
      error: (err) => { this.saving = false; this.error = 'No se pudo guardar el pedido. Intenta de nuevo.'; this.cdr.detectChanges(); console.error(err); },
    });
  }
}
