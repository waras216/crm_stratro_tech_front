import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { NotifyService } from '../../../core/services/notify.service';
import { AuthService } from '../../../core/auth/authservices';
import { ErpFactura, ErpPedido } from '../../../models/erp.models';

const USO_CFDI = [
  { value: 'G01', label: 'G01 — Adquisición de mercancías' },
  { value: 'G03', label: 'G03 — Gastos en general' },
  { value: 'P01', label: 'P01 — Por definir' },
];

const FORMA_PAGO_SAT = [
  { value: '01', label: '01 — Efectivo' },
  { value: '02', label: '02 — Cheque nominativo' },
  { value: '03', label: '03 — Transferencia electrónica' },
  { value: '04', label: '04 — Tarjeta de crédito' },
  { value: '28', label: '28 — Tarjeta de débito' },
];

const METODO_PAGO_SAT = [
  { value: 'PUE', label: 'PUE — Pago en una sola exhibición' },
  { value: 'PPD', label: 'PPD — Pago en parcialidades o diferido' },
];

@Component({
  selector: 'app-erp-facturacion',
  standalone: false,
  templateUrl: './facturacion.component.html',
  styleUrls: ['./facturacion.component.scss'],
})
export class ErpFacturacionComponent implements OnInit {
  cargando = true;
  facturas: ErpFactura[] = [];
  pedidosFacturables: ErpPedido[] = [];

  usoCfdiOptions = USO_CFDI;
  formaPagoOptions = FORMA_PAGO_SAT;
  metodoPagoOptions = METODO_PAGO_SAT;

  dialogOpen = false;
  saving = false;
  error = '';
  form = {
    id_pedido: '',
    tipo: 'interna' as 'interna' | 'timbrada',
    rfc_receptor: '',
    razon_social_receptor: '',
    uso_cfdi: 'G03',
    forma_pago_sat: '01',
    metodo_pago_sat: 'PUE',
  };

  timbrandoId: number | null = null;

  constructor(
    private erpService: ErpService,
    private notify: NotifyService,
    private cdr: ChangeDetectorRef,
    public auth: AuthService,
  ) {}

  get timbradoRealIncluido(): boolean {
    return !!this.auth.session?.plan?.incluye_facturacion_real;
  }

  ngOnInit() {
    this.erpService.cargarFacturas().subscribe();
    this.erpService.facturas$.subscribe(data => { this.facturas = data; this.cargando = false; this.cdr.detectChanges(); });

    this.erpService.cargarPedidos().subscribe();
    this.erpService.pedidos$.subscribe(data => {
      this.pedidosFacturables = data.filter(p => p.estado === 'facturado');
      this.cdr.detectChanges();
    });
  }

  get registradas() { return this.facturas.filter(f => f.estado !== 'cancelada').length; }
  get timbradas() { return this.facturas.filter(f => f.estado === 'timbrada').length; }
  get pendientes() { return this.facturas.filter(f => f.estado === 'pendiente_timbrado' || f.estado === 'error').length; }

  estadoBadgeClass(estado: ErpFactura['estado']): string {
    return {
      registrada: 'badge-green',
      timbrada: 'badge-green',
      pendiente_timbrado: 'badge-amber',
      error: 'badge-red',
      cancelada: 'badge-slate',
    }[estado] ?? 'badge-slate';
  }

  openNew() {
    this.form = {
      id_pedido: '', tipo: 'interna', rfc_receptor: '', razon_social_receptor: '',
      uso_cfdi: 'G03', forma_pago_sat: '01', metodo_pago_sat: 'PUE',
    };
    this.error = '';
    this.dialogOpen = true;
  }

  onPedidoChange() {
    const pedido = this.pedidosFacturables.find(p => p.id === Number(this.form.id_pedido));
    if (!pedido?.cliente) return;
    this.form.rfc_receptor = (pedido.cliente as any).rfc || this.form.rfc_receptor;
    this.form.razon_social_receptor = pedido.cliente.nombre || this.form.razon_social_receptor;
  }

  submit() {
    if (this.saving) return;
    if (!this.form.id_pedido) { this.error = 'Selecciona un pedido facturado.'; return; }
    if (!this.form.rfc_receptor || !this.form.razon_social_receptor) { this.error = 'RFC y razón social del receptor son obligatorios.'; return; }

    this.saving = true;
    this.error = '';
    this.erpService.crearFactura({
      id_pedido: Number(this.form.id_pedido),
      tipo: this.form.tipo,
      rfc_receptor: this.form.rfc_receptor,
      razon_social_receptor: this.form.razon_social_receptor,
      uso_cfdi: this.form.uso_cfdi,
      forma_pago_sat: this.form.forma_pago_sat,
      metodo_pago_sat: this.form.metodo_pago_sat,
    }).subscribe({
      next: () => { this.saving = false; this.dialogOpen = false; this.cdr.detectChanges(); },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.errors?.id_pedido?.[0] || err?.error?.errors?.tipo?.[0] || err?.error?.message || 'No se pudo registrar la factura.';
        this.cdr.detectChanges();
        console.error(err);
      },
    });
  }

  timbrar(factura: ErpFactura) {
    if (this.timbrandoId) return;
    this.timbrandoId = factura.id;
    this.erpService.timbrarFactura(factura.id).subscribe({
      next: () => { this.timbrandoId = null; this.notify.success('Factura timbrada correctamente.'); this.cdr.detectChanges(); },
      error: (err) => {
        this.timbrandoId = null;
        this.notify.error(err?.error?.errors?.pac?.[0] || err?.error?.message || 'No se pudo timbrar la factura.');
        this.cdr.detectChanges();
      },
    });
  }

  async cancelar(factura: ErpFactura) {
    const ok = await this.notify.confirm(`¿Cancelar la factura #${factura.folio}?`, { danger: true, confirmText: 'Cancelar factura' });
    if (!ok) return;

    this.erpService.cancelarFactura(factura.id).subscribe({
      next: () => { this.notify.success('Factura cancelada'); this.cdr.detectChanges(); },
      error: (err) => { this.notify.error(err?.error?.errors?.estado?.[0] || 'No se pudo cancelar la factura'); console.error(err); },
    });
  }
}
