import { Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subject, interval } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../core/auth/authservices';
import { ThemeService } from '../../core/theme.service';
import { ModuleService, SidebarNavItem, ErpTab, PosTab, erpVentasLabel } from '../../core/services/module.service';
import { CrmService } from '../../core/services/crm-service';
import { NotifyService } from '../../core/services/notify.service';
import { NichoService } from '../../core/services/nicho.service';
import { RouterOutlet } from '@angular/router';
import { sidebarLeave, dropdownLeave, routeFade } from '../shared/animations';

@Component({
  selector: 'app-shell-layout',
  standalone: false,
  templateUrl: './shell-layout.component.html',
  styleUrls: ['./shell-layout.component.scss'],
  animations: [sidebarLeave, dropdownLeave, routeFade],
})
export class ShellLayoutComponent implements OnInit, OnDestroy {
  collapsed = false;
  mobileOpen = false;
  userName = '';
  userEmail = '';
  subiendoFoto = false;
  currentUrl = '';
  activeErpTab: ErpTab = 'dashboard';
  activePosTab: PosTab = 'terminal';

  showSearch = false;
  showNotifPanel = false;
  showUserMenu = false;
  searchQuery = '';

  notifications: { id: number; icon: string; title: string; desc: string; time: string; unread: boolean }[] = [];

  private notifIcons: Record<string, string> = {
    success: '🎉', warning: '⚠️', info: '🔔', error: '⛔',
  };

  private destroy$ = new Subject<void>();
  private knownNotifIds = new Set<number>();
  private audioCtx: AudioContext | null = null;

  get darkMode() { return this.theme.isDark; }
  get activeModule() { return this.module.activeModule(); }
  get sidebarSections() { return this.module.getSidebar(this.activeModule.id, this.nicho.nicho); }
  /** Primeros 3 accesos del sidebar del módulo activo, para la bottom tab bar de mobile. */
  get quickNavItems(): SidebarNavItem[] {
    return this.sidebarSections.flatMap(s => s.items).slice(0, 3);
  }
  get isConfigRoute() {
    return this.currentUrl.startsWith('/configuracion')
      || this.currentUrl.startsWith('/admin/empresas')
      || this.currentUrl.startsWith('/admin/planes')
      || this.currentUrl.startsWith('/admin/roles');
  }
  get logo(): string | null { return this.auth.session?.foto_perfil ?? null; }

  constructor(
    public module: ModuleService,
    public auth: AuthService,
    public theme: ThemeService,
    public nicho: NichoService,
    private router: Router,
    private sanitizer: DomSanitizer,
    private crm: CrmService,
    private cdr: ChangeDetectorRef,
    private notify: NotifyService,
  ) {}

  get companyName(): string {
    return (this.auth.session as any)?.empresa || 'Mi Empresa';
  }

  ngOnInit() {
    const s = this.auth.session;
    this.userName = (s as any)?.nombre ?? 'Usuario';
    this.userEmail = (s as any)?.email ?? '';
    this.collapsed = localStorage.getItem('sidebarCompacto') === 'true';

    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      takeUntil(this.destroy$),
    ).subscribe(e => {
      this.currentUrl = e.urlAfterRedirects;
      this.mobileOpen = false;
    });
    this.currentUrl = this.router.url;

    this.module.erpTab$.pipe(takeUntil(this.destroy$)).subscribe(t => this.activeErpTab = t);
    this.module.posTab$.pipe(takeUntil(this.destroy$)).subscribe(t => this.activePosTab = t);

    // Self-heal a stale cached session (e.g. onboarding completed on another device).
    this.auth.refreshSession().subscribe();

    this.cargarNotificaciones(false);
    interval(20000).pipe(takeUntil(this.destroy$)).subscribe(() => this.cargarNotificaciones(true));
  }

  private cargarNotificaciones(detectarNuevas: boolean) {
    this.crm.cargarNotificaciones().subscribe({
      next: res => {
        const lista = res ?? [];
        if (detectarNuevas) {
          const hayNuevas = lista.some(n => !n.leida && !this.knownNotifIds.has(n.id_notificacion));
          if (hayNuevas) this.playNotifSound();
        }
        this.knownNotifIds = new Set(lista.map(n => n.id_notificacion));
        this.notifications = lista.map(n => ({
          id: n.id_notificacion,
          icon: this.notifIcons[n.tipo] ?? '🔔',
          title: n.titulo,
          desc: n.mensaje ?? '',
          time: this.tiempoRelativo(n.created_at),
          unread: !n.leida,
        }));
        this.cdr.detectChanges();
      },
    });
  }

  private playNotifSound() {
    try {
      this.audioCtx ??= new AudioContext();
      const ctx = this.audioCtx;
      const now = ctx.currentTime;
      [880, 1320].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const start = now + i * 0.1;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.2);
      });
    } catch {
      // audio unavailable (e.g. autoplay policy) — ignore silently
    }
  }

  private tiempoRelativo(fecha?: string): string {
    if (!fecha) return '';
    const diffMs = Date.now() - new Date(fecha).getTime();
    const min = Math.floor(diffMs / 60000);
    if (min < 1) return 'ahora';
    if (min < 60) return `hace ${min} min`;
    const horas = Math.floor(min / 60);
    if (horas < 24) return `hace ${horas}h`;
    const dias = Math.floor(horas / 24);
    return `hace ${dias}d`;
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  safe(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  onNavigate(item: SidebarNavItem) {
    if (item.route) {
      this.router.navigate([item.route]);
    } else if (item.erpTab) {
      this.module.setErpTab(item.erpTab);
    } else if (item.posTab) {
      this.module.setPosTab(item.posTab);
    }
    this.mobileOpen = false;
  }

  isItemActive(item: SidebarNavItem): boolean {
    if (item.route) return this.currentUrl === item.route || this.currentUrl.startsWith(item.route + '/');
    if (item.erpTab) return this.activeErpTab === item.erpTab;
    if (item.posTab) return this.activePosTab === item.posTab;
    return false;
  }

  getPageTitle(): string {
    if (this.activeModule.id === 'erp') return this.erpLabel(this.activeErpTab);
    if (this.activeModule.id === 'pos') return this.posLabel(this.activePosTab);
    const parts = this.currentUrl.split('/').filter(Boolean);
    if (parts.length >= 2) return parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
    return this.activeModule.label;
  }

  private erpLabel(tab: ErpTab): string {
    if (tab === 'ventas') return erpVentasLabel(this.nicho.nicho);
    const m: Record<ErpTab, string> = {
      dashboard: 'Dashboard', finanzas: 'Finanzas', compras: 'Compras',
      ventas: 'Ventas', facturacion: 'Facturación', inventario: 'Inventario', fabricacion: 'Fabricación',
      scm: 'Supply Chain', rrhh: 'Recursos Humanos', crm: 'CRM', proyectos: 'Proyectos',
      reportes: 'Reportes',
    };
    return m[tab] ?? tab;
  }

  private posLabel(tab: PosTab): string {
    return tab === 'terminal' ? 'Terminal de Venta' : 'Historial de Ventas';
  }

  toggleSearch()    { this.showSearch = !this.showSearch; this.showNotifPanel = false; this.showUserMenu = false; }
  toggleNotif() {
    this.showNotifPanel = !this.showNotifPanel;
    this.showSearch = false;
    this.showUserMenu = false;
    if (this.showNotifPanel) this.cargarNotificaciones(false);
  }
  toggleUserMenu()  { this.showUserMenu = !this.showUserMenu; this.showSearch = false; this.showNotifPanel = false; }
  closeAll()        { this.showSearch = false; this.showNotifPanel = false; this.showUserMenu = false; }

  onFotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.notify.error('Selecciona un archivo de imagen válido.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.notify.error('La imagen no puede pesar más de 2MB.');
      return;
    }

    this.subiendoFoto = true;
    this.auth.subirFotoPerfil(file).subscribe(ok => {
      this.subiendoFoto = false;
      if (ok) {
        this.showUserMenu = false;
        this.notify.success('Tu foto de perfil se actualizó.');
      } else {
        this.notify.error('No pudimos subir tu foto. Intenta de nuevo.');
      }
    });
  }

  async eliminarFotoPerfil() {
    const ok = await this.notify.confirm('¿Quitar tu foto de perfil?', { confirmText: 'Quitar' });
    if (!ok) return;
    this.auth.eliminarFotoPerfil().subscribe(success => {
      if (success) {
        this.showUserMenu = false;
        this.notify.success('Foto de perfil eliminada.');
      } else {
        this.notify.error('No pudimos quitar tu foto. Intenta de nuevo.');
      }
    });
  }
  markAllRead() {
    this.notifications.forEach(n => n.unread = false);
    this.crm.marcarTodasNotificacionesLeidas().subscribe();
  }
  markOneRead(id: number) {
    const n = this.notifications.find(x => x.id === id);
    if (!n || !n.unread) return;
    n.unread = false;
    this.crm.marcarNotificacionLeida(id).subscribe();
  }
  get unreadCount() { return this.notifications.filter(n => n.unread).length; }

  goToConfig()      { this.router.navigate(['/configuracion']); this.closeAll(); }
  goToPlanes()      { this.router.navigate(['/admin/planes']); this.closeAll(); }
  goToEmpresas()    { this.router.navigate(['/admin/empresas']); this.closeAll(); }
  goToRoles()       { this.router.navigate(['/admin/roles']); this.closeAll(); }
  goToSuscripcion() { this.router.navigate(['/configuracion/suscripcion']); this.closeAll(); }

  cambiarEmpresa(idTenant: number) {
    if (idTenant === this.auth.session?.id_tenant) { this.closeAll(); return; }
    this.auth.cambiarEmpresa(idTenant).subscribe(ok => {
      if (ok) { window.location.href = '/crm/dashboard'; }
    });
    this.closeAll();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent) {
    // TODO: implementar búsqueda real antes de reactivar
    // if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); this.toggleSearch(); }
    if (e.key === 'Escape') this.closeAll();
  }

  // ── Swipe para abrir/cerrar el drawer en mobile ──
  // Solo con touchstart/touchend (sin touchmove ni preventDefault) a propósito:
  // así nunca compite con el scroll vertical normal ni con el scroll horizontal
  // de las tablas de ERP (overflow-x-auto) — si no fue un gesto horizontal claro
  // y de suficiente distancia, no pasa nada.
  private swipeStartX = 0;
  private swipeStartY = 0;
  private swipeTracking = false;

  @HostListener('touchstart', ['$event'])
  onTouchStart(e: TouchEvent) {
    if (window.innerWidth > 768) { this.swipeTracking = false; return; }
    const t = e.touches[0];
    this.swipeStartX = t.clientX;
    this.swipeStartY = t.clientY;
    // Trackeamos si el drawer ya está abierto (se puede cerrar deslizando desde
    // cualquier punto) o si el toque arranca pegado al borde izquierdo (abre
    // el drawer, como el swipe-back nativo de iOS/Android).
    this.swipeTracking = this.mobileOpen || t.clientX < 20;
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(e: TouchEvent) {
    if (!this.swipeTracking) return;
    this.swipeTracking = false;
    const t = e.changedTouches[0];
    const dx = t.clientX - this.swipeStartX;
    const dy = t.clientY - this.swipeStartY;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (!this.mobileOpen && dx > 0) this.mobileOpen = true;
    else if (this.mobileOpen && dx < 0) this.mobileOpen = false;
  }

  toggleTheme() { this.theme.toggle(); }

  async logout() {
    const ok = await this.notify.confirm('¿Cerrar sesión?', { confirmText: 'Cerrar sesión' });
    if (!ok) return;
    this.auth.logout();
  }

  /** Clave de animación para el fade del <router-outlet>: cambia solo cuando cambia la ruta activa. */
  prepareRoute(outlet: RouterOutlet): string {
    return outlet?.isActivated ? (outlet.activatedRoute.routeConfig?.path ?? '') : '';
  }
}
