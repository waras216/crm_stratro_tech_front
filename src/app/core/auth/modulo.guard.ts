import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { AuthService } from './authservices';

type ModuloId = 'crm' | 'erp' | 'pos';

@Injectable({ providedIn: 'root' })
export class ModuloGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const modulo = route.data['modulo'] as ModuloId;

    // Un cajero (soloPos, ver AuthService) solo puede entrar a /pos, sin
    // importar qué módulos tenga contratados el tenant.
    if (this.auth.session?.soloPos && modulo !== 'pos') {
      this.router.navigate(['/pos']);
      return false;
    }

    const modulos = this.auth.session?.nichoData?.modulos;

    if (!modulos || modulos[modulo] !== false) return true;

    const orden: ModuloId[] = ['crm', 'erp', 'pos'];
    const destino = orden.find(m => modulos[m]);
    this.router.navigate([destino ? `/${destino}` : '/configuracion']);
    return false;
  }
}
