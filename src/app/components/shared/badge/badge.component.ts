import { Component, Input } from '@angular/core';

export type BadgeColor = 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate' | 'blue';

@Component({
  selector: 'app-badge',
  standalone: false,
  templateUrl: './badge.component.html',
})
export class BadgeComponent {
  @Input() color: BadgeColor = 'slate';
  @Input() dot = false;
}
