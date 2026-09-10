import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { NotifyService } from '../../../core/services/notify.service';
import { ErpMesa } from '../../../models/erp.models';

/**
 * Pantalla para el bartender/cocinero (no el mesero): todas las mesas del
 * tenant con una comanda enviada a preparación, sin importar la sección
 * (Bar/Restaurante) -- erp_mesas no distingue sección, ver Mesa::class.
 * Se refresca sola porque normalmente vive en una tablet/monitor fijo en la
 * barra, no en manos de alguien que le da "recargar".
 */
@Component({
  selector: 'app-pos-comandas',
  standalone: false,
  templateUrl: './comandas.component.html',
})
export class PosComandasComponent implements OnInit, OnDestroy {
  mesas: ErpMesa[] = [];
  cargando = false;
  marcando: number | null = null;
  private poll: ReturnType<typeof setInterval> | null = null;

  constructor(private erpService: ErpService, private notify: NotifyService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cargando = true;
    this.erpService.comandasPendientes$.subscribe(data => { this.mesas = data; this.cdr.detectChanges(); });
    this.cargar();
    this.poll = setInterval(() => this.cargar(), 8000);
  }

  ngOnDestroy() {
    if (this.poll) clearInterval(this.poll);
  }

  cargar() {
    this.erpService.cargarComandasPendientes().subscribe({
      next: () => { this.cargando = false; this.cdr.detectChanges(); },
      error: () => { this.cargando = false; this.cdr.detectChanges(); },
    });
  }

  totalMesa(m: ErpMesa): number {
    return m.comanda_activa?.items.reduce((s, i) => s + i.precio_unitario * i.cantidad, 0) ?? 0;
  }

  marcarLista(m: ErpMesa) {
    this.marcando = m.id;
    this.erpService.marcarComandaLista(m.id).subscribe({
      next: () => { this.marcando = null; this.notify.success(`Mesa ${m.numero} lista para servir`); this.cdr.detectChanges(); },
      error: () => { this.marcando = null; this.notify.error('No se pudo marcar la comanda como lista'); this.cdr.detectChanges(); },
    });
  }
}
