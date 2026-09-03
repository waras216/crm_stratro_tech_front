import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CrmService } from '../../../core/services/crm-service';
import { NotifyService } from '../../../core/services/notify.service';
import { Integracion } from '../../../models/crm.models';
import { environment } from '../../../../environments/environment';

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
    sitio_web:     { icon: '🌐', color: '#0369a1', bg: '#e0f2fe' },
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
  /** "sitio_web" abre un panel propio (URL + Analytics + snippet del formulario) en vez del diálogo genérico de solo lectura. */
  esSitioWeb(integ: Integracion): boolean { return integ.tipo === 'sitio_web'; }

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
  openConfig(integ: Integracion) {
    if (this.esSitioWeb(integ)) { this.abrirSitioWeb(integ); return; }
    this.selected = integ;
  }
  closeConfig() { this.selected = null; }

  // Sitio Web -- formulario web-to-lead
  dialogSitioWebOpen = false;
  sitioWebIntegracion: Integracion | null = null;
  sitioWebForm = { url_sitio: '', google_analytics_id: '' };
  guardandoSitioWeb = false;
  regenerandoToken = false;

  abrirSitioWeb(integ: Integracion) {
    this.sitioWebIntegracion = integ;
    this.sitioWebForm = {
      url_sitio: integ.configuracion?.['url_sitio'] ?? '',
      google_analytics_id: integ.configuracion?.['google_analytics_id'] ?? '',
    };
    this.mostrarToken = false;
    this.dialogSitioWebOpen = true;
  }

  cerrarSitioWeb() { this.dialogSitioWebOpen = false; this.sitioWebIntegracion = null; this.mostrarToken = false; }

  get sitioWebToken(): string { return this.sitioWebIntegracion?.configuracion?.['token'] ?? ''; }

  mostrarToken = false;
  toggleMostrarToken() { this.mostrarToken = !this.mostrarToken; }

  get sitioWebTokenEnmascarado(): string {
    const t = this.sitioWebToken;
    if (!t) return '';
    return this.mostrarToken ? t : `••••••••••••${t.slice(-4)}`;
  }

  get sitioWebEndpoint(): string {
    return `${environment.apiUrl}/public/formularios/${this.sitioWebToken}/leads`;
  }

  /** Snippet HTML+JS listo para pegar en un bloque "HTML personalizado" de WordPress (o cualquier sitio) — funciona standalone, sin plugins. */
  get sitioWebSnippet(): string {
    return `<form id="strato-lead-form">
  <input type="text" name="nombre" placeholder="Tu nombre" required>
  <input type="email" name="email" placeholder="Tu email" required>
  <input type="tel" name="telefono" placeholder="Tu teléfono">
  <textarea name="mensaje" placeholder="¿En qué te ayudamos?"></textarea>
  <!-- Honeypot anti-spam: se oculta con CSS, un humano nunca lo llena -->
  <input type="text" name="_gotcha" style="display:none" tabindex="-1" autocomplete="off">
  <button type="submit">Enviar</button>
  <p id="strato-lead-form-msg"></p>
</form>
<script>
document.getElementById('strato-lead-form').addEventListener('submit', function (e) {
  e.preventDefault();
  var form = e.target, msg = document.getElementById('strato-lead-form-msg');
  var data = Object.fromEntries(new FormData(form));
  fetch('${this.sitioWebEndpoint}', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(function (r) { return r.json(); }).then(function () {
    msg.textContent = '¡Gracias! Te contactaremos pronto.';
    form.reset();
  }).catch(function () {
    msg.textContent = 'No se pudo enviar, intenta de nuevo.';
  });
});
</script>`;
  }

  guardarSitioWeb() {
    if (!this.sitioWebIntegracion) return;
    this.guardandoSitioWeb = true;
    this.crm.actualizarConfiguracionIntegracion(this.sitioWebIntegracion.id, this.sitioWebForm).subscribe({
      next: updated => {
        this.guardandoSitioWeb = false;
        this.sitioWebIntegracion = updated;
        this.notify.success('Configuración guardada.');
        this.cargar();
      },
      error: () => { this.guardandoSitioWeb = false; this.notify.error('No se pudo guardar la configuración.'); this.cdr.detectChanges(); },
    });
  }

  async regenerarToken() {
    if (!this.sitioWebIntegracion) return;
    const ok = await this.notify.confirm('¿Regenerar el token del formulario? El snippet que ya pegaste en tu sitio dejará de funcionar hasta que lo reemplaces por el nuevo.', { danger: true, confirmText: 'Regenerar' });
    if (!ok) return;
    this.regenerandoToken = true;
    this.crm.regenerarTokenIntegracion(this.sitioWebIntegracion.id).subscribe({
      next: updated => { this.regenerandoToken = false; this.sitioWebIntegracion = updated; this.notify.success('Token regenerado.'); this.cargar(); },
      error: () => { this.regenerandoToken = false; this.notify.error('No se pudo regenerar el token.'); this.cdr.detectChanges(); },
    });
  }

  toggleSitioWeb() {
    if (!this.sitioWebIntegracion) return;
    this.toggle(this.sitioWebIntegracion.id);
    const activando = this.sitioWebIntegracion.estado !== 'conectada';
    this.sitioWebIntegracion = { ...this.sitioWebIntegracion, estado: activando ? 'conectada' : 'desconectada' };
  }

  copiar(texto: string, etiqueta: string) {
    navigator.clipboard.writeText(texto).then(
      () => this.notify.success(`${etiqueta} copiado al portapapeles.`),
      () => this.notify.error('No se pudo copiar. Selecciónalo y copia manualmente.'),
    );
  }

  private static readonly CLAVES_SENSIBLES = ['access_token', 'refresh_token', 'token'];

  configEntries(integ: Integracion): {k: string; v: string}[] {
    if (!integ.configuracion) return [];
    return Object.entries(integ.configuracion)
      .filter(([k, v]) => v && v.trim() !== '' && !IntegracionesComponent.CLAVES_SENSIBLES.includes(k))
      .map(([k, v]) => ({ k, v: v as string }));
  }

  getIntegById(id: number) { return this.integraciones.find(i => i.id === id); }
}
