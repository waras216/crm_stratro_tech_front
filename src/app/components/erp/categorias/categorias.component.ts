import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ErpService } from '../../../core/services/erp-service';
import { NotifyService } from '../../../core/services/notify.service';
import { Categoria } from '../../../models/erp.models';
import { modalLeave } from '../../shared/animations';

@Component({
  selector: 'app-erp-categorias',
  standalone: false,
  templateUrl: './categorias.component.html',
  styleUrls: ['./categorias.component.scss'],
  animations: [modalLeave],
})
export class ErpCategoriasComponent implements OnInit {
  categorias: Categoria[] = [];
  cargando = true;

  dialogOpen = false;
  categoriaForm = { nombre: '', descripcion: '' };
  categoriaEditando: Categoria | null = null;
  categoriaError = '';
  categoriaSaving = false;

  constructor(private erpService: ErpService, private notify: NotifyService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.erpService.categorias$.subscribe(data => { this.categorias = data; this.cargando = false; this.cdr.detectChanges(); });
    this.erpService.cargarCategorias().subscribe();
  }

  abrirNueva() {
    this.categoriaForm = { nombre: '', descripcion: '' };
    this.categoriaEditando = null;
    this.categoriaError = '';
    this.dialogOpen = true;
  }

  abrirEditar(c: Categoria) {
    this.categoriaEditando = c;
    this.categoriaForm = { nombre: c.nombre, descripcion: c.descripcion ?? '' };
    this.categoriaError = '';
    this.dialogOpen = true;
  }

  guardarCategoria() {
    if (this.categoriaSaving) return;
    if (!this.categoriaForm.nombre) { this.categoriaError = 'El nombre es obligatorio.'; return; }

    this.categoriaSaving = true;
    this.categoriaError = '';

    const data = { nombre: this.categoriaForm.nombre, descripcion: this.categoriaForm.descripcion || undefined };
    const peticion = this.categoriaEditando
      ? this.erpService.updateCategoria(this.categoriaEditando.id_categoria, data)
      : this.erpService.addCategoria(data);

    peticion.subscribe({
      next: () => {
        this.categoriaSaving = false;
        this.dialogOpen = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.categoriaSaving = false;
        this.categoriaError = 'No se pudo guardar la categoría. Intenta de nuevo.';
        this.cdr.detectChanges();
        console.error(err);
      },
    });
  }

  async eliminarCategoria(c: Categoria) {
    const ok = await this.notify.confirm(`¿Eliminar la categoría "${c.nombre}"?`, { danger: true, confirmText: 'Eliminar' });
    if (!ok) return;

    this.erpService.deleteCategoria(c.id_categoria).subscribe({
      next: () => { this.notify.success('Categoría eliminada'); this.cdr.detectChanges(); },
      error: (err) => { this.notify.error('No se pudo eliminar la categoría'); console.error(err); },
    });
  }
}
