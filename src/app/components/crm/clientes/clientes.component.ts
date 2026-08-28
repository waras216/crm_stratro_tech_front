import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CrmService } from '../../../core/services/crm-service';
import { NotifyService } from '../../../core/services/notify.service';
import { Cliente, Contacto } from '../../../models/crm.models';
import { ViewMode } from '../../shared/view-toggle/view-toggle.component';

const VIEW_MODE_KEY = 'crm_clientes_view';

@Component({ selector: 'app-clientes', standalone: false, templateUrl: './clientes.component.html', styleUrls: ['./clientes.component.scss'] })
export class ClientesComponent implements OnInit {
  clientes: Cliente[] = [];
  search = ''; filterTipo = 'todos'; dialogOpen = false; editingCliente: Cliente | null = null;
  cargando = false;
  formError = '';
  viewMode: ViewMode = (localStorage.getItem(VIEW_MODE_KEY) as ViewMode) || 'grid';

  paginaActual = 1;
  totalPaginas = 1;
  total        = 0;

  sectorOptions = ['Tecnología', 'Software', 'Fintech', 'Consultoría', 'Retail', 'Salud', 'Educación', 'Manufactura', 'Freelance', 'Otro'];
  form = { nombre: '', telefono: '', email: '', direccion: '', sector_empresarial: 'Tecnología', tipo: 'empresa' as Cliente['tipo'] };

  // Detalle de cliente
  detalleOpen = false;
  detalleCargando = false;
  clienteDetalle: Cliente | null = null;
  detalleTab: 'leads' | 'oportunidades' | 'actividades' | 'contactos' | 'compras' = 'leads';

  constructor(private crm: CrmService, private cdr: ChangeDetectorRef, private notify: NotifyService, private route: ActivatedRoute) {}

  ngOnInit() {
    // Llega con ?q= desde un resultado de la búsqueda global del shell.
    const q = this.route.snapshot.queryParamMap.get('q');
    if (q) { this.search = q; this.viewMode = 'table'; }
    this.cargar();
  }

  cargar() {
    this.cargando = true;
    // Flush inmediato: si "cargando" queda en `true` sin pasar por un chequeo de Angular,
    // un signal-write ajeno (p. ej. un toast) puede disparar un chequeo global que lo agarra
    // en ese estado transitorio nunca visto antes, y Angular tira NG0100 en modo dev.
    this.cdr.detectChanges();
    const tipo = this.filterTipo === 'todos' ? '' : this.filterTipo;
    this.crm.cargarClientes(this.paginaActual, this.search, tipo).subscribe({
      next: res => {
        this.clientes     = res?.data ?? [];
        this.total        = res?.total ?? 0;
        this.totalPaginas = res?.last_page ?? 1;
        this.cargando     = false;
        this.cdr.detectChanges();
      },
      error: () => { this.cargando = false; this.cdr.detectChanges(); }
    });
  }

  // El filtro por texto/tipo ya lo hace el backend (paginado) — este getter
  // queda solo para no tener que renombrar `filtered` en toda la plantilla.
  get filtered() { return this.clientes; }

  setViewMode(mode: ViewMode) { this.viewMode = mode; localStorage.setItem(VIEW_MODE_KEY, mode); }

  onSearchChange() { this.paginaActual = 1; this.selectedIds.clear(); this.cargar(); }
  onFiltroChange() { this.paginaActual = 1; this.selectedIds.clear(); this.cargar(); }
  paginar(p: number) { if (p < 1 || p > this.totalPaginas) return; this.paginaActual = p; this.selectedIds.clear(); this.cargar(); }

  // Selección en bloque (página actual)
  selectedIds = new Set<number>();
  get allSelected() { return this.clientes.length > 0 && this.clientes.every(c => this.selectedIds.has(c.id_cliente)); }
  get bulkLabel() { const n = this.selectedIds.size; return `${n} cliente${n === 1 ? '' : 's'} seleccionado${n === 1 ? '' : 's'}`; }

  toggleSelect(id: number, event: Event) {
    event.stopPropagation();
    if (this.selectedIds.has(id)) this.selectedIds.delete(id); else this.selectedIds.add(id);
  }

  toggleSelectAll() {
    if (this.allSelected) this.selectedIds.clear();
    else this.clientes.forEach(c => this.selectedIds.add(c.id_cliente));
  }

  clearSelection() { this.selectedIds.clear(); }

  async bulkDelete() {
    const n = this.selectedIds.size;
    const ok = await this.notify.confirm(`¿Eliminar ${n} cliente${n === 1 ? '' : 's'}? Esta acción no se puede deshacer.`, { danger: true, confirmText: 'Eliminar' });
    if (!ok) return;
    forkJoin(Array.from(this.selectedIds).map(id => this.crm.deleteCliente(id))).subscribe({
      next: () => {
        this.selectedIds.clear();
        this.cdr.detectChanges();
        this.cargar();
        this.notify.success(`${n} cliente${n === 1 ? '' : 's'} eliminado${n === 1 ? '' : 's'}`);
      },
      error: () => this.notify.error('No se pudieron eliminar algunos clientes'),
    });
  }

  resetForm() { this.form = { nombre: '', telefono: '', email: '', direccion: '', sector_empresarial: 'Tecnología', tipo: 'empresa' }; this.editingCliente = null; this.formError = ''; }
  openNew() { this.resetForm(); this.dialogOpen = true; }

  handleEdit(c: Cliente) {
    this.editingCliente = c;
    this.form = { nombre: c.nombre, telefono: c.telefono ?? '', email: c.email ?? '', direccion: c.direccion ?? '', sector_empresarial: c.sector_empresarial ?? '', tipo: c.tipo };
    this.formError = '';
    this.dialogOpen = true;
  }

  handleSubmit() {
    if (!this.form.nombre.trim()) { this.formError = 'El nombre o razón social es obligatorio.'; return; }
    const obs = this.editingCliente
      ? this.crm.updateCliente(this.editingCliente.id_cliente, this.form)
      : this.crm.addCliente(this.form);
    obs.subscribe({
      next: () => { this.dialogOpen = false; this.resetForm(); this.cargar(); },
      error: err => { this.formError = err.error?.message ?? 'Error al guardar el cliente'; this.cdr.detectChanges(); },
    });
  }

  async deleteCliente(id: number) {
    const ok = await this.notify.confirm('¿Eliminar este cliente? Esta acción no se puede deshacer.', { danger: true, confirmText: 'Eliminar' });
    if (!ok) return;
    this.crm.deleteCliente(id).subscribe({
      next: () => { this.cargar(); this.notify.success('Cliente eliminado'); },
      error: () => { this.notify.error('No se pudo eliminar el cliente'); },
    });
  }

  closeDialog() { this.dialogOpen = false; this.resetForm(); }

  abrirDetalle(c: Cliente) {
    this.detalleOpen = true;
    this.detalleCargando = true;
    this.clienteDetalle = null;
    this.detalleTab = 'leads';
    this.crm.verCliente(c.id_cliente).subscribe({
      next: res => { this.clienteDetalle = res; this.detalleCargando = false; this.cdr.detectChanges(); },
      error: () => { this.detalleCargando = false; this.cdr.detectChanges(); },
    });
  }

  cerrarDetalle() { this.detalleOpen = false; this.clienteDetalle = null; }

  private refrescarDetalle() {
    if (!this.clienteDetalle) return;
    this.crm.verCliente(this.clienteDetalle.id_cliente).subscribe({
      next: res => { this.clienteDetalle = res; this.cdr.detectChanges(); },
    });
  }

  // Contactos (dentro del detalle de cliente)
  contactoDialogOpen = false;
  editingContacto: Contacto | null = null;
  contactoForm = { nombre: '', apellido_p: '', email: '', telefono: '', cargo: '', principal: false };
  contactoFormError = '';

  resetContactoForm() {
    this.contactoForm = { nombre: '', apellido_p: '', email: '', telefono: '', cargo: '', principal: false };
    this.editingContacto = null;
    this.contactoFormError = '';
  }

  openNewContacto() { this.resetContactoForm(); this.contactoDialogOpen = true; }

  handleEditContacto(ct: Contacto) {
    this.editingContacto = ct;
    this.contactoForm = {
      nombre: ct.nombre, apellido_p: ct.apellido_p ?? '', email: ct.email ?? '',
      telefono: ct.telefono ?? '', cargo: ct.cargo ?? '', principal: !!ct.principal,
    };
    this.contactoFormError = '';
    this.contactoDialogOpen = true;
  }

  handleSubmitContacto() {
    if (!this.contactoForm.nombre.trim()) { this.contactoFormError = 'El nombre del contacto es obligatorio.'; return; }
    if (!this.clienteDetalle) return;
    const obs = this.editingContacto
      ? this.crm.updateContacto(this.editingContacto.id_contacto, this.contactoForm)
      : this.crm.addContacto({ ...this.contactoForm, id_cliente: this.clienteDetalle.id_cliente });
    obs.subscribe({
      next: () => { this.contactoDialogOpen = false; this.resetContactoForm(); this.refrescarDetalle(); },
      error: err => { this.contactoFormError = err.error?.message ?? 'Error al guardar el contacto'; this.cdr.detectChanges(); },
    });
  }

  async deleteContacto(id: number) {
    const ok = await this.notify.confirm('¿Eliminar este contacto? Esta acción no se puede deshacer.', { danger: true, confirmText: 'Eliminar' });
    if (!ok) return;
    this.crm.deleteContacto(id).subscribe({
      next: () => { this.refrescarDetalle(); this.notify.success('Contacto eliminado'); },
      error: () => this.notify.error('No se pudo eliminar el contacto'),
    });
  }

  closeContactoDialog() { this.contactoDialogOpen = false; this.resetContactoForm(); }
}
