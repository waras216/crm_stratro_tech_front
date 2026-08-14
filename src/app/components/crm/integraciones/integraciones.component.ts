import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CrmService } from '../../../core/services/crm-service';
import { NotifyService } from '../../../core/services/notify.service';
import { Integracion } from '../../../models/crm.models';

@Component({ selector: 'app-integraciones', standalone: false, templateUrl: './integraciones.component.html', styleUrls: ['./integraciones.component.scss'] })
export class IntegracionesComponent implements OnInit, OnDestroy {
  integraciones: Integracion[] = [];
  selected: Integracion | null = null;
  cargando = false;

  tipoConfig: Record<string, { icon: string; color: string; bg: string }> = {
    whatsapp:      { icon: '💬', color: '#16a34a', bg: '#dcfce7' },
    email:         { icon: '✉️', color: '#dc2626', bg: '#fee2e2' },
    calendario:    { icon: '📅', color: '#2563eb', bg: '#dbeafe' },
    almacenamiento:{ icon: '💾', color: '#ca8a04', bg: '#fef9c3' },
    otro:          { icon: '🔌', color: '#64748b', bg: '#f1f5f9' },
  };

  estadoConfig: Record<string, { icon: string; color: string; label: string }> = {
    conectada:    { icon: '✅', color: '#16a34a', label: 'Conectada' },
    desconectada: { icon: '⭕', color: '#94a3b8', label: 'Desconectada' },
    error:        { icon: '⚠️', color: '#dc2626', label: 'Error' },
  };

  conectandoCalendario = false;

  constructor(
    private crm: CrmService,
    private cdr: ChangeDetectorRef,
    private notify: NotifyService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.cargar();

    const params = this.route.snapshot.queryParamMap;
    if (params.get('conectado') === 'calendario') this.notify.success('Google Calendar conectado correctamente.');
    if (params.get('error')) this.notify.error('No se pudo completar la conexión. Intenta de nuevo.');
  }

  /** Solo "calendario" usa OAuth; el resto sigue con el toggle simple. */
  esOAuth(integ: Integracion): boolean { return integ.tipo === 'calendario'; }
  /** "almacenamiento" refleja config de plataforma, no se prende/apaga a mano (ver IntegracionController). */
  esGestionadaPorSistema(integ: Integracion): boolean { return integ.tipo === 'almacenamiento'; }
  /** "whatsapp" se conecta escaneando un QR (WhatsApp Web casero, ver Baileys), no con el toggle simple. */
  esQr(integ: Integracion): boolean { return integ.tipo === 'whatsapp'; }

  // WhatsApp (Baileys) -- QR
  dialogWhatsappOpen = false;
  cargandoWhatsapp = false;
  qrWhatsapp: string | null = null;
  estadoWhatsapp = 'sin_iniciar';
  private pollWhatsapp: ReturnType<typeof setInterval> | null = null;

  abrirWhatsapp() {
    this.dialogWhatsappOpen = true;
    this.cargandoWhatsapp = true;
    this.qrWhatsapp = null;
    this.crm.iniciarWhatsappBaileys().subscribe({
      next: res => { this.aplicarEstadoWhatsapp(res); this.cargandoWhatsapp = false; this.cdr.detectChanges(); this.iniciarPollWhatsapp(); },
      error: () => { this.cargandoWhatsapp = false; this.notify.error('No se pudo iniciar la conexión con WhatsApp. Verifica que el servicio esté corriendo.'); this.cdr.detectChanges(); },
    });
  }

  private iniciarPollWhatsapp() {
    this.detenerPollWhatsapp();
    this.pollWhatsapp = setInterval(() => {
      this.crm.estadoWhatsappBaileys().subscribe({
        next: res => {
          this.aplicarEstadoWhatsapp(res);
          if (res.status === 'conectado') { this.detenerPollWhatsapp(); this.cargar(); }
          this.cdr.detectChanges();
        },
      });
    }, 2500);
  }

  private aplicarEstadoWhatsapp(res: { status: string; qr: string | null }) {
    this.estadoWhatsapp = res.status;
    if (res.qr) this.qrWhatsapp = res.qr;
  }

  private detenerPollWhatsapp() {
    if (this.pollWhatsapp) { clearInterval(this.pollWhatsapp); this.pollWhatsapp = null; }
  }

  cerrarWhatsapp() {
    this.dialogWhatsappOpen = false;
    this.detenerPollWhatsapp();
  }

  desconectarWhatsapp() {
    this.crm.desconectarWhatsappBaileys().subscribe({
      next: () => { this.notify.success('WhatsApp desconectado.'); this.cerrarWhatsapp(); this.cargar(); },
      error: () => { this.notify.error('No se pudo desconectar.'); },
    });
  }

  ngOnDestroy() { this.detenerPollWhatsapp(); }

  manejarClickModal(integ: Integracion) {
    if (this.esOAuth(integ) && integ.estado !== 'conectada') {
      this.conectarCalendario();
      return;
    }
    if (this.esQr(integ)) {
      this.closeConfig();
      if (integ.estado === 'conectada') this.desconectarWhatsapp(); else this.abrirWhatsapp();
      return;
    }
    this.toggle(integ.id);
    this.closeConfig();
  }

  conectarCalendario() {
    if (this.conectandoCalendario) return;
    this.conectandoCalendario = true;
    this.crm.conectarGoogleCalendar().subscribe({
      next: res => { window.location.href = res.url; },
      error: () => { this.conectandoCalendario = false; this.notify.error('No se pudo iniciar la conexión con Google Calendar.'); this.cdr.detectChanges(); },
    });
  }

  cargar() {
    this.cargando = true;
    this.crm.cargarIntegraciones().subscribe({
      next: res => { this.integraciones = res.data ?? []; this.cargando = false; this.cdr.detectChanges(); },
      error: () => { this.cargando = false; this.cdr.detectChanges(); }
    });
  }

  toggle(id: number) { this.crm.toggleIntegracion(id).subscribe(() => this.cargar()); }
  openConfig(integ: Integracion) { this.selected = integ; }
  closeConfig() { this.selected = null; }

  private static readonly CLAVES_SENSIBLES = ['access_token', 'refresh_token'];

  configEntries(integ: Integracion): {k: string; v: string}[] {
    if (!integ.configuracion) return [];
    return Object.entries(integ.configuracion)
      .filter(([k, v]) => v && v.trim() !== '' && !IntegracionesComponent.CLAVES_SENSIBLES.includes(k))
      .map(([k, v]) => ({ k, v: v as string }));
  }

  getIntegById(id: number) { return this.integraciones.find(i => i.id === id); }
}
