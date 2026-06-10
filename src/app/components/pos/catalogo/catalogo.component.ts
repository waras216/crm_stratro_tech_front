import { Component, Output, EventEmitter } from '@angular/core';

export interface ProductoPOS {
  id: number; nombre: string; precio: number; categoria: string; stock: number; imagen: string;
}

@Component({
  selector: 'app-pos-catalogo',
  standalone: false,
  templateUrl: './catalogo.component.html',
  styleUrls: ['./catalogo.component.scss'],
})
export class PosCatalogoComponent {
  @Output() agregar = new EventEmitter<ProductoPOS>();

  categoriaActiva = 'Todos';
  search = '';
  categorias = ['Todos', 'Bebidas', 'Comida', 'Snacks', 'Electrónica', 'Hogar'];

  productos: ProductoPOS[] = [
    { id: 1, nombre: 'Café Americano', precio: 45, categoria: 'Bebidas', stock: 100, imagen: '☕' },
    { id: 2, nombre: 'Jugo Natural', precio: 35, categoria: 'Bebidas', stock: 50, imagen: '🧃' },
    { id: 3, nombre: 'Agua Mineral', precio: 20, categoria: 'Bebidas', stock: 200, imagen: '💧' },
    { id: 4, nombre: 'Refresco', precio: 25, categoria: 'Bebidas', stock: 150, imagen: '🥤' },
    { id: 5, nombre: 'Hamburguesa', precio: 89, categoria: 'Comida', stock: 30, imagen: '🍔' },
    { id: 6, nombre: 'Pizza Slice', precio: 55, categoria: 'Comida', stock: 40, imagen: '🍕' },
    { id: 7, nombre: 'Ensalada César', precio: 75, categoria: 'Comida', stock: 25, imagen: '🥗' },
    { id: 8, nombre: 'Tacos (3)', precio: 65, categoria: 'Comida', stock: 45, imagen: '🌮' },
    { id: 9, nombre: 'Sándwich', precio: 52, categoria: 'Comida', stock: 35, imagen: '🥪' },
    { id: 10, nombre: 'Papas Fritas', precio: 30, categoria: 'Snacks', stock: 80, imagen: '🍟' },
    { id: 11, nombre: 'Galletas', precio: 25, categoria: 'Snacks', stock: 60, imagen: '🍪' },
    { id: 12, nombre: 'Barra Energética', precio: 35, categoria: 'Snacks', stock: 90, imagen: '🍫' },
    { id: 13, nombre: 'Audífonos BT', precio: 350, categoria: 'Electrónica', stock: 15, imagen: '🎧' },
    { id: 14, nombre: 'Cable USB-C', precio: 120, categoria: 'Electrónica', stock: 40, imagen: '🔌' },
    { id: 15, nombre: 'Mouse Wireless', precio: 280, categoria: 'Electrónica', stock: 20, imagen: '🖱️' },
    { id: 16, nombre: 'Vela Aromática', precio: 95, categoria: 'Hogar', stock: 35, imagen: '🕯️' },
    { id: 17, nombre: 'Taza Cerámica', precio: 65, categoria: 'Hogar', stock: 50, imagen: '🍵' },
    { id: 18, nombre: 'Planta Decorativa', precio: 150, categoria: 'Hogar', stock: 18, imagen: '🪴' },
  ];

  get filtrados() {
    return this.productos.filter(p =>
      (this.categoriaActiva === 'Todos' || p.categoria === this.categoriaActiva) &&
      p.nombre.toLowerCase().includes(this.search.toLowerCase())
    );
  }
}
