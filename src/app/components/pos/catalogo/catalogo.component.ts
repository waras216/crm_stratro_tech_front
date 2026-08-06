import { ChangeDetectorRef, Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { Producto } from '../../../models/erp.models';

/** Alias histórico: el catálogo del POS usa el inventario real (Producto). */
export type ProductoPOS = Producto;

@Component({
  selector: 'app-pos-catalogo',
  standalone: false,
  templateUrl: './catalogo.component.html',
  styleUrls: ['./catalogo.component.scss'],
})
export class PosCatalogoComponent implements OnInit {
  @Output() agregar = new EventEmitter<ProductoPOS>();

  categoriaActiva = 'Todos';
  search = '';
  cargando = false;
  productos: ProductoPOS[] = [];

  constructor(private erpService: ErpService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.cargando = true;
    this.erpService.cargarInventario().subscribe({
      next: productos => {
        this.productos = productos.filter(p => p.activo !== false);
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => { this.cargando = false; this.cdr.detectChanges(); },
    });
  }

  get categorias(): string[] {
    const nombres = new Set(this.productos.map(p => p.categoria?.nombre).filter((n): n is string => !!n));
    return ['Todos', ...nombres];
  }

  get filtrados() {
    return this.productos.filter(p =>
      (this.categoriaActiva === 'Todos' || p.categoria?.nombre === this.categoriaActiva) &&
      p.nombre.toLowerCase().includes(this.search.toLowerCase())
    );
  }
}
