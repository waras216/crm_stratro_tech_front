import { precioConDescuento, ErpPromocion, Producto } from './erp.models';

const producto = (over: Partial<Producto> = {}): Producto => ({
  id_productos: 1, id_categorias: 10, nombre: 'test', precio: 25, precio_compra: 10, stock: 5, stock_minimo: 1, ...over,
});

const promo = (over: Partial<ErpPromocion> = {}): ErpPromocion => ({
  id: 1, nombre: 'promo', tipo: 'porcentaje', valor: 15, activo: true, ...over,
});

describe('precioConDescuento', () => {
  it('sin promociones devuelve el precio de lista', () => {
    expect(precioConDescuento(producto(), [])).toBe(25);
  });

  it('aplica descuento por producto específico', () => {
    const p = promo({ id_producto: 1 });
    expect(precioConDescuento(producto(), [p])).toBe(21.25);
  });

  it('aplica descuento por categoría cuando no hay producto específico', () => {
    const p = promo({ id_categorias: 10, tipo: 'monto_fijo', valor: 5 });
    expect(precioConDescuento(producto(), [p])).toBe(20);
  });

  it('aplica "todo el catálogo" cuando no tiene producto ni categoría', () => {
    expect(precioConDescuento(producto(), [promo()])).toBe(21.25);
  });

  it('ignora promociones inactivas', () => {
    expect(precioConDescuento(producto(), [promo({ activo: false })])).toBe(25);
  });

  it('ignora promociones fuera de vigencia', () => {
    const vencida = promo({ fecha_fin: '2000-01-01' });
    expect(precioConDescuento(producto(), [vencida])).toBe(25);
  });

  it('ignora promociones de otro producto/categoría', () => {
    const otra = promo({ id_producto: 999 });
    expect(precioConDescuento(producto(), [otra])).toBe(25);
  });

  it('con varias promociones vigentes, aplica la de mayor descuento', () => {
    const chica = promo({ valor: 5 });
    const grande = promo({ valor: 30 });
    expect(precioConDescuento(producto(), [chica, grande])).toBe(17.5);
  });

  it('nunca devuelve un precio negativo', () => {
    const p = promo({ tipo: 'monto_fijo', valor: 100 });
    expect(precioConDescuento(producto(), [p])).toBe(0);
  });
});
