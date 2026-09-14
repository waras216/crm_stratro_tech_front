import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { CrmService } from '../../../core/services/crm-service';
import { NotifyService } from '../../../core/services/notify.service';
import { ErpClienteCredito, ErpMovimientoCredito } from '../../../models/erp.models';
import { Cliente } from '../../../models/crm.models';
import { modalLeave } from '../../shared/animations';

@Component({
  selector: 'app-erp-clientes-creditos',
  standalone: false,
  templateUrl: './clientes-creditos.component.html',
  styleUrls: ['./clientes-creditos.component.scss'],
  animations: [modalLeave],
})
export class ErpClientesCreditosComponent implements OnInit {
  clientes: ErpClienteCredito[] = [];
  cargando = true;

  // Modal: asignar línea de crédito a un cliente nuevo
  dialogAsignarOpen = false;
  clienteBusqueda = '';
  clientesResultados: Cliente[] = [];
  clienteSeleccionado: Cliente | null = null;
  limiteNuevo = '';
  asignarSaving = false;
  asignarError = '';

  // Modal: editar límite existente
  dialogLimiteOpen = false;
  clienteParaLimite: ErpClienteCredito | null = null;
  limiteEditado = '';
  limiteSaving = false;

  // Modal: movimientos + cargar/abonar
  dialogMovimientosOpen = false;
  clienteParaMovimientos: ErpClienteCredito | null = null;
  movimientos: ErpMovimientoCredito[] = [];
  montoMovimiento = '';
  referenciaMovimiento = '';
  movSaving = false;
  movError = '';

  constructor(
    private erpService: ErpService,
    private crmService: CrmService,
    private notify: NotifyService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.erpService.clientesCredito$.subscribe(data => { this.clientes = data; this.cargando = false; this.cdr.detectChanges(); });
    this.erpService.cargarClientesCredito().subscribe();
  }

  disponible(c: ErpClienteCredito): number { return c.limite_credito - c.saldo_credito; }

  abrirAsignar() {
    this.clienteBusqueda = '';
    this.clientesResultados = [];
    this.clienteSeleccionado = null;
    this.limiteNuevo = '';
    this.asignarError = '';
    this.dialogAsignarOpen = true;
  }

  buscarCliente() {
    if (!this.clienteBusqueda) { this.clientesResultados = []; return; }
    this.crmService.cargarClientes(1, this.clienteBusqueda).subscribe(page => {
      this.clientesResultados = page.data;
      this.cdr.detectChanges();
    });
  }

  seleccionarCliente(c: Cliente) {
    this.clienteSeleccionado = c;
    this.clientesResultados = [];
    this.clienteBusqueda = c.nombre;
  }

  submitAsignar() {
    if (this.asignarSaving || !this.clienteSeleccionado) return;
    if (!this.limiteNuevo || Number(this.limiteNuevo) <= 0) { this.asignarError = 'Ingresa un límite de crédito mayor a 0.'; return; }

    this.asignarSaving = true;
    this.asignarError = '';
    this.erpService.actualizarLimiteCredito(this.clienteSeleccionado.id_cliente, Number(this.limiteNuevo)).subscribe({
      next: () => { this.asignarSaving = false; this.dialogAsignarOpen = false; this.notify.success('Línea de crédito asignada'); this.cdr.detectChanges(); },
      error: (err) => { this.asignarSaving = false; this.asignarError = 'No se pudo asignar el crédito.'; this.cdr.detectChanges(); console.error(err); },
    });
  }

  abrirEditarLimite(c: ErpClienteCredito) {
    this.clienteParaLimite = c;
    this.limiteEditado = String(c.limite_credito);
    this.dialogLimiteOpen = true;
  }

  submitLimite() {
    if (this.limiteSaving || !this.clienteParaLimite) return;
    if (!this.limiteEditado || Number(this.limiteEditado) < 0) return;

    this.limiteSaving = true;
    this.erpService.actualizarLimiteCredito(this.clienteParaLimite.id_cliente, Number(this.limiteEditado)).subscribe({
      next: () => { this.limiteSaving = false; this.dialogLimiteOpen = false; this.notify.success('Límite actualizado'); this.cdr.detectChanges(); },
      error: (err) => { this.limiteSaving = false; this.notify.error('No se pudo actualizar el límite'); this.cdr.detectChanges(); console.error(err); },
    });
  }

  abrirMovimientos(c: ErpClienteCredito) {
    this.clienteParaMovimientos = c;
    this.montoMovimiento = '';
    this.referenciaMovimiento = '';
    this.movError = '';
    this.movimientos = [];
    this.dialogMovimientosOpen = true;
    this.erpService.cargarMovimientosCredito(c.id_cliente).subscribe(data => { this.movimientos = data; this.cdr.detectChanges(); });
  }

  private ejecutarMovimiento(tipo: 'cargo' | 'abono') {
    if (this.movSaving || !this.clienteParaMovimientos) return;
    if (!this.montoMovimiento || Number(this.montoMovimiento) <= 0) { this.movError = 'Ingresa un monto válido.'; return; }

    this.movSaving = true;
    this.movError = '';
    const obs = tipo === 'cargo'
      ? this.erpService.cargarCredito(this.clienteParaMovimientos.id_cliente, Number(this.montoMovimiento), this.referenciaMovimiento || undefined)
      : this.erpService.abonarCredito(this.clienteParaMovimientos.id_cliente, Number(this.montoMovimiento), this.referenciaMovimiento || undefined);

    obs.subscribe({
      next: (mov) => {
        this.movSaving = false;
        this.montoMovimiento = '';
        this.referenciaMovimiento = '';
        this.movimientos = [mov, ...this.movimientos];
        if (this.clienteParaMovimientos) this.clienteParaMovimientos.saldo_credito = mov.saldo_resultante;
        this.cdr.detectChanges();
      },
      error: (err) => { this.movSaving = false; this.movError = err?.error?.message || 'No se pudo registrar el movimiento.'; this.cdr.detectChanges(); console.error(err); },
    });
  }

  cargar() { this.ejecutarMovimiento('cargo'); }
  abonar() { this.ejecutarMovimiento('abono'); }
}
