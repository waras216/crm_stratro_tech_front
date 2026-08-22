import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { RolService } from '../../../core/services/rol.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { NotifyService } from '../../../core/services/notify.service';
import { Rol, PermisoCatalogo, Usuario } from '../../../models/crm.models';
import { modalLeave } from '../../shared/animations';

@Component({
  selector: 'app-roles',
  standalone: false,
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss'],
  animations: [modalLeave],
})
export class RolesComponent implements OnInit {
  roles: Rol[] = [];
  catalogo: PermisoCatalogo = {};
  recursos: string[] = [];
  usuarios: Usuario[] = [];
  cargando = false;
  error = '';

  expandidoId: number | null = null;
  guardandoId: number | null = null;

  dialogOpen = false;
  editando: Rol | null = null;
  form = { nombre: '', descripcion: '', permisos: new Set<string>() };
  errorDialog = '';
  guardandoDialog = false;

  constructor(
    private rolService: RolService,
    private usuarioService: UsuarioService,
    private location: Location,
    private notify: NotifyService,
  ) {}

  ngOnInit() {
    this.cargar();
    this.usuarioService.cargarUsuarios().subscribe({ next: usuarios => this.usuarios = usuarios });
    this.rolService.cargarPermisos().subscribe({
      next: catalogo => { this.catalogo = catalogo; this.recursos = Object.keys(catalogo).sort(); },
    });
  }

  goBack() { this.location.back(); }

  cargar() {
    this.cargando = true;
    this.error = '';
    this.rolService.cargarRoles().subscribe({
      next: roles => { this.roles = roles; this.cargando = false; },
      error: err => { this.error = err?.error?.message || 'No se pudieron cargar los roles'; this.cargando = false; },
    });
  }

  toggleDetalle(rol: Rol) {
    this.expandidoId = this.expandidoId === rol.id_rol ? null : rol.id_rol;
  }

  openNuevo() {
    this.editando = null;
    this.form = { nombre: '', descripcion: '', permisos: new Set<string>() };
    this.errorDialog = '';
    this.dialogOpen = true;
  }

  openEditar(rol: Rol) {
    if (rol.es_sistema) return;
    this.editando = rol;
    this.form = { nombre: rol.nombre, descripcion: rol.descripcion || '', permisos: new Set(rol.permisos) };
    this.errorDialog = '';
    this.dialogOpen = true;
  }

  togglePermiso(clave: string) {
    if (this.form.permisos.has(clave)) this.form.permisos.delete(clave);
    else this.form.permisos.add(clave);
  }

  toggleRecursoCompleto(recurso: string) {
    const claves = (this.catalogo[recurso] || []).map(p => p.clave);
    const todasMarcadas = claves.every(c => this.form.permisos.has(c));
    claves.forEach(c => todasMarcadas ? this.form.permisos.delete(c) : this.form.permisos.add(c));
  }

  guardarDialog() {
    if (!this.form.nombre.trim()) { this.errorDialog = 'El nombre es obligatorio.'; return; }
    if (this.form.permisos.size === 0) { this.errorDialog = 'Selecciona al menos un permiso.'; return; }

    this.errorDialog = '';
    this.guardandoDialog = true;
    const payload = { nombre: this.form.nombre, descripcion: this.form.descripcion, permisos: Array.from(this.form.permisos) };

    const obs = this.editando
      ? this.rolService.actualizarRol(this.editando.id_rol, payload)
      : this.rolService.crearRol(payload);

    obs.subscribe({
      next: () => {
        this.guardandoDialog = false;
        this.dialogOpen = false;
        this.notify.success(this.editando ? 'Rol actualizado' : 'Rol creado');
        this.cargar();
      },
      error: err => {
        this.guardandoDialog = false;
        this.errorDialog = err?.error?.message || 'No se pudo guardar el rol.';
        this.notify.error(this.errorDialog);
      },
    });
  }

  async eliminar(rol: Rol) {
    if (rol.es_sistema) return;
    const ok = await this.notify.confirm(`¿Eliminar el rol "${rol.nombre}"?`, { danger: true, confirmText: 'Eliminar' });
    if (!ok) return;

    this.error = '';
    this.rolService.eliminarRol(rol.id_rol).subscribe({
      next: () => {
        if (this.expandidoId === rol.id_rol) this.expandidoId = null;
        this.notify.success('Rol eliminado');
      },
      error: err => {
        this.error = err?.error?.message || 'No se pudo eliminar el rol';
        this.notify.error(this.error);
      },
    });
  }

  tieneUsuario(rol: Rol, usuario: Usuario): boolean {
    return rol.usuarios_ids.includes(usuario.id_usuario);
  }

  toggleUsuario(rol: Rol, usuario: Usuario) {
    this.guardandoId = rol.id_rol;
    const asignado = this.tieneUsuario(rol, usuario);

    const obs = asignado
      ? this.rolService.quitarUsuario(rol.id_rol, usuario.id_usuario)
      : this.rolService.asignarUsuario(rol.id_rol, usuario.id_usuario);

    obs.subscribe({
      next: () => {
        rol.usuarios_ids = asignado
          ? rol.usuarios_ids.filter(id => id !== usuario.id_usuario)
          : [...rol.usuarios_ids, usuario.id_usuario];
        rol.usuarios_count = rol.usuarios_ids.length;
        this.guardandoId = null;
      },
      error: err => { this.error = err?.error?.message || 'No se pudo actualizar la asignación'; this.guardandoId = null; },
    });
  }
}
