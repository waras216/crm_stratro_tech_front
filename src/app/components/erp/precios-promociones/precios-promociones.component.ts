import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { NotifyService } from '../../../core/services/notify.service';
import { Categoria, ErpPromocion, Producto } from '../../../models/erp.models';
import { modalLeave } from '../../shared/animations';

@Component({
  selector: 'app-erp-precios-promociones',
  standalone: false,
  templateUrl: './precios-promociones.component.html',
  styleUrls: ['./precios-promociones.component.scss'],
  animations: [modalLeave],
})
export class ErpPreciosPromocionesComponent implements OnInit {
  promociones: ErpPromocion[] = [];
  productos: Producto[] = [];
  categorias: Categoria[] = [];
  cargando = true;

  dialogOpen = false;
  promoEditando: ErpPromocion | null = null;
  form: { nombre: string; tipo: 'porcentaje' | 'monto_fijo'; valor: string; alcance: 'producto' | 'categoria' | 'todo'; id_producto: string; id_categorias: string; fecha_inicio: string; fecha_fin: string } = {
    nombre: '', tipo: 'porcentaje', valor: '', alcance: 'todo', id_producto: '', id_categorias: '', fecha_inicio: '', fecha_fin: '',
  };
  saving = false;
  error = '';

  constructor(private erpService: ErpService, private notify: NotifyService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.erpService.promociones$.subscribe(data => { this.promociones = data; this.cargando = false; this.cdr.detectChanges(); });
    this.erpService.cargarPromociones().subscribe();

    this.erpService.cargarProductos().subscribe(data => { this.productos = data; this.cdr.detectChanges(); });
    this.erpService.categorias$.subscribe(data => { this.categorias = data; this.cdr.detectChanges(); });
    this.erpService.cargarCategorias().subscribe();
  }

  alcanceLabel(p: ErpPromocion): string {
    if (p.producto) return p.producto.nombre;
    if (p.categoria) return 'Categoría: ' + p.categoria.nombre;
    return 'Todo el catálogo';
  }

  valorLabel(p: ErpPromocion): string {
    return p.tipo === 'porcentaje' ? `${p.valor}%` : `$${p.valor.toLocaleString()}`;
  }

  abrirNueva() {
    this.promoEditando = null;
    this.form = { nombre: '', tipo: 'porcentaje', valor: '', alcance: 'todo', id_producto: '', id_categorias: '', fecha_inicio: '', fecha_fin: '' };
    this.error = '';
    this.dialogOpen = true;
  }

  abrirEditar(p: ErpPromocion) {
    this.promoEditando = p;
    this.form = {
      nombre: p.nombre, tipo: p.tipo, valor: String(p.valor),
      alcance: p.id_producto ? 'producto' : p.id_categorias ? 'categoria' : 'todo',
      id_producto: p.id_producto ? String(p.id_producto) : '',
      id_categorias: p.id_categorias ? String(p.id_categorias) : '',
      fecha_inicio: p.fecha_inicio ?? '', fecha_fin: p.fecha_fin ?? '',
    };
    this.error = '';
    this.dialogOpen = true;
  }

  submit() {
    if (this.saving) return;
    if (!this.form.nombre.trim() || !this.form.valor) { this.error = 'Nombre y valor son obligatorios.'; return; }

    const data: Partial<ErpPromocion> = {
      nombre: this.form.nombre,
      tipo: this.form.tipo,
      valor: Number(this.form.valor),
      id_producto: this.form.alcance === 'producto' && this.form.id_producto ? Number(this.form.id_producto) : null,
      id_categorias: this.form.alcance === 'categoria' && this.form.id_categorias ? Number(this.form.id_categorias) : null,
      fecha_inicio: this.form.fecha_inicio || null,
      fecha_fin: this.form.fecha_fin || null,
    };

    this.saving = true;
    this.error = '';
    const peticion = this.promoEditando
      ? this.erpService.updatePromocion(this.promoEditando.id, data)
      : this.erpService.addPromocion(data);

    peticion.subscribe({
      next: () => { this.saving = false; this.dialogOpen = false; this.cdr.detectChanges(); },
      error: (err) => { this.saving = false; this.error = err?.error?.message || 'No se pudo guardar la promoción.'; this.cdr.detectChanges(); console.error(err); },
    });
  }

  toggle(p: ErpPromocion) {
    this.erpService.toggleActivoPromocion(p.id).subscribe({ next: () => this.cdr.detectChanges(), error: (err) => console.error(err) });
  }

  async eliminar(p: ErpPromocion) {
    const ok = await this.notify.confirm(`¿Eliminar la promoción "${p.nombre}"?`, { danger: true, confirmText: 'Eliminar' });
    if (!ok) return;

    this.erpService.deletePromocion(p.id).subscribe({
      next: () => { this.notify.success('Promoción eliminada'); this.cdr.detectChanges(); },
      error: (err) => { this.notify.error('No se pudo eliminar la promoción'); console.error(err); },
    });
  }
}
