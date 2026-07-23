import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ModuleService, ModuleId, ModuleConfig, FutureModule } from '../../core/services/module.service';
import { AuthService } from '../../core/auth/authservices';

@Component({
  selector: 'app-switcher',
  standalone: false,
  templateUrl: './app-switcher.component.html',
  styleUrls: ['./app-switcher.component.scss'],
})
export class AppSwitcherComponent implements OnInit, OnDestroy {
  open = false;
  isConfigRoute = false;

  private destroy$ = new Subject<void>();

  constructor(
    private moduleService: ModuleService,
    private sanitizer: DomSanitizer,
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.isConfigRoute = this.router.url.startsWith('/configuracion');
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      takeUntil(this.destroy$),
    ).subscribe(e => {
      this.isConfigRoute = e.urlAfterRedirects.startsWith('/configuracion');
    });
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

  get activeModule(): ModuleConfig   { return this.moduleService.activeModule(); }
  get modules(): ModuleConfig[]       { return this.moduleService.modules; }
  get futureModules(): FutureModule[] { return this.moduleService.futureModules; }
  get companyName(): string           { return (this.auth.session as any)?.empresa || 'Mi Empresa'; }
  get logo(): string | null           { return this.auth.session?.logo ?? null; }

  isActive(id: ModuleId): boolean { return !this.isConfigRoute && this.activeModule.id === id; }

  navigate(id: ModuleId) {
    this.moduleService.switchTo(id);
    this.open = false;
  }

  toggle() { this.open = !this.open; }

  goToConfig() { this.router.navigate(['/configuracion']); this.open = false; }

  safe(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
