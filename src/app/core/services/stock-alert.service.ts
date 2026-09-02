import { Injectable } from '@angular/core';
import { Producto } from '../../models/erp.models';

/**
 * Reglas de alerta de stock compartidas por todos los módulos que venden o
 * administran productos (terminales POS por nicho, catálogo genérico y el
 * panel de Inventario en ERP), para que el mismo producto se vea "sin stock"
 * o "stock bajo" en cualquier pantalla donde aparezca.
 */
@Injectable({ providedIn: 'root' })
export class StockAlertService {
  sinStock(p: Producto): boolean {
    return p.controla_stock !== false && p.stock <= 0;
  }

  stockBajo(p: Producto): boolean {
    return p.controla_stock !== false && p.stock > 0 && p.stock <= p.stock_minimo;
  }

  /** Sin stock o por debajo del mínimo: el universo que debe mostrarse en un panel de alertas. */
  requiereAlerta(p: Producto): boolean {
    return p.controla_stock !== false && p.stock <= p.stock_minimo;
  }

  filtrarConAlerta(productos: Producto[]): Producto[] {
    return productos.filter(p => this.requiereAlerta(p));
  }

  /** Unidades disponibles para vender/consumir ahora mismo (sin límite si el producto no controla stock). */
  disponible(p: Producto): number {
    return p.controla_stock === false ? Infinity : Math.max(0, p.stock);
  }
}
