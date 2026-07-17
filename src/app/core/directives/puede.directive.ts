import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../auth/authservices';

/**
 * Muestra el elemento solo si el usuario tiene el permiso granular dado
 * ("recurso.accion") en el tenant activo. Uso:
 *   <button *appPuede="'leads.eliminar'" (click)="eliminar(l)">Eliminar</button>
 */
@Directive({
  selector: '[appPuede]',
  standalone: false,
})
export class PuedeDirective {
  private mostrado = false;

  constructor(
    private templateRef: TemplateRef<unknown>,
    private viewContainer: ViewContainerRef,
    private auth: AuthService,
  ) {}

  @Input() set appPuede(clave: string) {
    const puede = this.auth.tienePermiso(clave);

    if (puede && !this.mostrado) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.mostrado = true;
    } else if (!puede && this.mostrado) {
      this.viewContainer.clear();
      this.mostrado = false;
    }
  }
}
