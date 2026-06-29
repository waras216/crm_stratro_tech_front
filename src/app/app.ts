import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App implements OnInit {
  showSwitcher = false;

  constructor(private router: Router) {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      this.showSwitcher = !e.url.startsWith('/auth');
    });
  }

  ngOnInit() {
    // Aplicar estilos guardados al iniciar la app
    const NICHO_COLORS: Record<string, string> = {
      hotel: '#f59e0b', restaurante: '#ef4444', almacen: '#3b82f6',
      farmacia: '#10b981', startup: '#8b5cf6', tienda: '#ec4899',
    };
    const session = JSON.parse(localStorage.getItem('crm_session') || 'null');
    const nichoColor = NICHO_COLORS[session?.nichoData?.nicho || ''];
    const accent = nichoColor || localStorage.getItem('colorAccent') || '#6366f1';
    const fontSize = localStorage.getItem('fontSize') || 'medium';
    const densidad = localStorage.getItem('densidad') || 'normal';
    const borderRadius = localStorage.getItem('borderRadius') || 'medium';
    const animaciones = localStorage.getItem('animaciones') !== 'false';

    const sizes: Record<string, string> = { small: '14px', medium: '16px', large: '18px' };
    const spacings: Record<string, string> = { compact: '0.25rem', normal: '0.5rem', comfortable: '0.75rem' };
    const radii: Record<string, string> = { none: '0', small: '0.375rem', medium: '0.75rem', large: '1.25rem' };

    document.documentElement.style.setProperty('--accent', accent);
    document.documentElement.style.setProperty('--base-font', sizes[fontSize]);
    document.documentElement.style.setProperty('--spacing', spacings[densidad]);
    document.documentElement.style.setProperty('--radius', radii[borderRadius]);
    document.documentElement.classList.toggle('no-animations', !animaciones);
  }
}
