import { Injectable, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export type ModuleId = 'crm' | 'erp' | 'pos';
export type ErpTab = 'dashboard' | 'finanzas' | 'compras' | 'ventas' | 'inventario' | 'fabricacion' | 'scm' | 'rrhh' | 'crm' | 'proyectos' | 'reportes';
export type PosTab = 'terminal' | 'historial';

export interface ModuleConfig {
  id: ModuleId;
  label: string;
  accent: string;
  sidebarGradient: string;
  sidebarShadow: string;
  sidebarGlow: string;
  textMuted: string;
  activeBg: string;
  activeGradient: string;
  activeShadow: string;
  borderColor: string;
  icon: string;
  defaultPath: string;
}

export interface FutureModule {
  id: string;
  label: string;
  icon: string;
}

export interface SidebarNavItem {
  label: string;
  svg: string;
  route?: string;
  erpTab?: ErpTab;
  posTab?: PosTab;
  badge?: number;
}

export interface SidebarSection {
  label?: string;
  items: SidebarNavItem[];
}

const S = (path: string) =>
  `<svg width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">${path}</svg>`;

const MOD_ICON = (path: string) =>
  `<svg width="18" height="18" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">${path}</svg>`;

const FUTURE_ICON = (path: string) =>
  `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">${path}</svg>`;

export const MODULES: ModuleConfig[] = [
  {
    id: 'crm',
    label: 'CRM',
    accent: '#6366f1',
    sidebarGradient: 'linear-gradient(180deg,#0f0a2e 0%,#1a1452 40%,#251b6e 100%)',
    sidebarShadow: '4px 0 40px rgba(15,10,46,.5)',
    sidebarGlow: 'radial-gradient(circle,#818cf8 0%,transparent 70%)',
    textMuted: 'rgba(165,180,252,.7)',
    activeBg: 'linear-gradient(135deg,rgba(99,102,241,.2),rgba(139,92,246,.12))',
    activeGradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    activeShadow: '0 4px 16px rgba(99,102,241,.5)',
    borderColor: 'rgba(129,140,248,.12)',
    icon: MOD_ICON(`<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`),
    defaultPath: '/crm/dashboard',
  },
  {
    id: 'erp',
    label: 'ERP',
    accent: '#f59e0b',
    sidebarGradient: 'linear-gradient(180deg,#451a03 0%,#78350f 40%,#92400e 100%)',
    sidebarShadow: '4px 0 40px rgba(120,53,15,.5)',
    sidebarGlow: 'radial-gradient(circle,#f59e0b 0%,transparent 70%)',
    textMuted: 'rgba(252,211,77,.7)',
    activeBg: 'linear-gradient(135deg,rgba(245,158,11,.18),rgba(217,119,6,.1))',
    activeGradient: 'linear-gradient(135deg,#f59e0b,#d97706)',
    activeShadow: '0 4px 16px rgba(245,158,11,.5)',
    borderColor: 'rgba(245,158,11,.12)',
    icon: MOD_ICON(`<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>`),
    defaultPath: '/erp',
  },
  {
    id: 'pos',
    label: 'POS',
    accent: '#10b981',
    sidebarGradient: 'linear-gradient(180deg,#022c22 0%,#064e3b 40%,#065f46 100%)',
    sidebarShadow: '4px 0 40px rgba(6,78,59,.5)',
    sidebarGlow: 'radial-gradient(circle,#10b981 0%,transparent 70%)',
    textMuted: 'rgba(167,243,208,.7)',
    activeBg: 'linear-gradient(135deg,rgba(16,185,129,.18),rgba(5,150,105,.1))',
    activeGradient: 'linear-gradient(135deg,#10b981,#059669)',
    activeShadow: '0 4px 16px rgba(16,185,129,.5)',
    borderColor: 'rgba(16,185,129,.12)',
    icon: MOD_ICON(`<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>`),
    defaultPath: '/pos',
  },
];

export const FUTURE_MODULES: FutureModule[] = [
  { id: 'hotel',      label: 'Hotelería',   icon: FUTURE_ICON(`<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>`) },
  { id: 'restaurant', label: 'Restaurantes',icon: FUTURE_ICON(`<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>`) },
  { id: 'warehouse',  label: 'Almacenes',   icon: FUTURE_ICON(`<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>`) },
  { id: 'bi',         label: 'BI Analytics',icon: FUTURE_ICON(`<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>`) },
];

const CRM_SIDEBAR: SidebarSection[] = [
  {
    items: [
      { label: 'Dashboard',     svg: S(`<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>`), route: '/crm/dashboard' },
    ],
  },
  {
    label: 'Ventas',
    items: [
      { label: 'Leads',          svg: S(`<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>`),                                                                                                                                     route: '/crm/leads' },
      { label: 'Oportunidades',  svg: S(`<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>`),                                                                              route: '/crm/oportunidades' },
      { label: 'Clientes',       svg: S(`<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>`),                                                                                                     route: '/crm/clientes' },
    ],
  },
  {
    label: 'Actividades',
    items: [
      { label: 'Actividades',    svg: S(`<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>`),                      route: '/crm/actividades' },
      { label: 'Marketing',      svg: S(`<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>`),                                                          route: '/crm/marketing' },
      { label: 'Automatizar',    svg: S(`<circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/>`),                     route: '/crm/automatizar' },
    ],
  },
  {
    label: 'Análisis',
    items: [
      { label: 'Reportes',       svg: S(`<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>`),                                                                   route: '/crm/reportes' },
      { label: 'Integraciones',  svg: S(`<rect x="2" y="2" width="6" height="6"/><rect x="16" y="2" width="6" height="6"/><rect x="2" y="16" width="6" height="6"/><path d="M5 8v12h12V8"/><path d="M5 5h14"/>`),                  route: '/crm/integraciones' },
    ],
  },
];

const ERP_SIDEBAR: SidebarSection[] = [
  {
    items: [
      { label: 'Dashboard',    svg: S(`<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>`), erpTab: 'dashboard' },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { label: 'Finanzas',     svg: S(`<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>`),                                                                                              erpTab: 'finanzas' },
      { label: 'Compras',      svg: S(`<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>`),                                                             erpTab: 'compras' },
      { label: 'Ventas',       svg: S(`<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>`), erpTab: 'ventas' },
      { label: 'Inventario',   svg: S(`<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>`),                                                                           erpTab: 'inventario' },
    ],
  },
  {
    label: 'Producción',
    items: [
      { label: 'Fabricación',  svg: S(`<circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/>`),                               erpTab: 'fabricacion' },
      { label: 'SCM',          svg: S(`<path d="M21 10H7"/><path d="M21 6H3"/><path d="M21 14H3"/><path d="M21 18H7"/>`),                                                                                                                     erpTab: 'scm' },
      { label: 'Proyectos',    svg: S(`<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="9" y2="15"/><line x1="12" y1="9" x2="12" y2="15"/><line x1="15" y1="9" x2="15" y2="15"/>`),                              erpTab: 'proyectos' },
    ],
  },
  {
    label: 'Administración',
    items: [
      { label: 'RR.HH.',       svg: S(`<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`),                               erpTab: 'rrhh' },
      { label: 'CRM',          svg: S(`<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>`),                                      erpTab: 'crm' },
    ],
  },
  {
    label: 'Análisis',
    items: [
      { label: 'Reportes',     svg: S(`<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>`),                                                                                erpTab: 'reportes' },
    ],
  },
];

// Tabs del ERP que no aplican por nicho — mismo criterio que el filtro de
// módulos en Erp/DashboardController::resumen (backend), mantener sincronizados.
// "Fabricación": ninguno de estos nichos produce/manufactura.
// "SCM" (envíos y logística a distribuidores/clientes): no aplica a servicios
// en sitio como hotel/restaurante/farmacia — sí a almacen y tienda (e-commerce).
// "startup" es un negocio de software/servicio: no tiene inventario físico,
// no compra mercancía a proveedores, no fabrica ni despacha envíos.
const ERP_TABS_OCULTOS_POR_NICHO: Partial<Record<string, ErpTab[]>> = {
  restaurante: ['fabricacion', 'scm'],
  hotel: ['fabricacion', 'scm'],
  farmacia: ['fabricacion', 'scm'],
  tienda: ['fabricacion'],
  startup: ['inventario', 'compras', 'fabricacion', 'scm'],
};

// Label del tab "Ventas" del ERP con el término operativo del nicho.
const ERP_VENTAS_LABEL_POR_NICHO: Partial<Record<string, string>> = {
  restaurante: 'Comandas',
  hotel: 'Reservas',
  farmacia: 'Dispensario',
};

export function erpVentasLabel(nicho?: string): string {
  return (nicho && ERP_VENTAS_LABEL_POR_NICHO[nicho]) || 'Ventas';
}

const POS_SIDEBAR: SidebarSection[] = [
  {
    items: [
      { label: 'Terminal de Venta', svg: S(`<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>`), posTab: 'terminal' },
      { label: 'Historial',         svg: S(`<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`),                                                              posTab: 'historial' },
    ],
  },
];

@Injectable({ providedIn: 'root' })
export class ModuleService {
  readonly modules = MODULES;
  readonly futureModules = FUTURE_MODULES;

  private _activeModule = signal<ModuleConfig>(MODULES[0]);
  readonly activeModule = this._activeModule.asReadonly();

  readonly erpTab$ = new BehaviorSubject<ErpTab>('dashboard');
  readonly posTab$ = new BehaviorSubject<PosTab>('terminal');

  private lastRoutes = new Map<string, string>([
    ['crm', '/crm/dashboard'],
    ['erp', '/erp'],
    ['pos', '/pos'],
  ]);

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => this.syncFromUrl(e.urlAfterRedirects));
  }

  private syncFromUrl(url: string) {
    const mod = MODULES.find(m => url.startsWith('/' + m.id));
    if (mod) {
      this._activeModule.set(mod);
      this.lastRoutes.set(mod.id, url);
    }
  }

  switchTo(moduleId: ModuleId) {
    const mod = MODULES.find(m => m.id === moduleId);
    if (!mod || mod.id === this._activeModule().id) return;
    this._activeModule.set(mod);
    const target = this.lastRoutes.get(moduleId) ?? mod.defaultPath;
    this.router.navigate([target]);
  }

  setErpTab(tab: ErpTab) { this.erpTab$.next(tab); }
  setPosTab(tab: PosTab) { this.posTab$.next(tab); }

  getSidebar(moduleId: ModuleId, nicho?: string): SidebarSection[] {
    switch (moduleId) {
      case 'crm': return CRM_SIDEBAR;
      case 'erp': return this.buildErpSidebar(nicho);
      case 'pos': return POS_SIDEBAR;
    }
  }

  private buildErpSidebar(nicho?: string): SidebarSection[] {
    const ocultos = (nicho && ERP_TABS_OCULTOS_POR_NICHO[nicho]) || [];
    const labelVentas = erpVentasLabel(nicho);

    return ERP_SIDEBAR
      .map(section => ({
        ...section,
        items: section.items
          .filter(item => !item.erpTab || !ocultos.includes(item.erpTab))
          .map(item => item.erpTab === 'ventas' ? { ...item, label: labelVentas } : item),
      }))
      .filter(section => section.items.length > 0);
  }
}
