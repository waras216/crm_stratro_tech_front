import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface DateRange {
  desde: string | null;
  hasta: string | null;
}

@Component({
  selector: 'app-date-range',
  standalone: false,
  templateUrl: './date-range.component.html',
})
export class DateRangeComponent {
  @Input() desde: string | null = null;
  @Input() hasta: string | null = null;
  @Output() rangeChange = new EventEmitter<DateRange>();

  presets = [
    { label: '7 días', dias: 7 },
    { label: '30 días', dias: 30 },
    { label: '90 días', dias: 90 },
  ];
  activePreset: number | 'todo' | 'custom' = 'todo';

  applyPreset(dias: number) {
    const hasta = new Date();
    const desde = new Date();
    desde.setDate(desde.getDate() - (dias - 1));
    this.desde = this.toIso(desde);
    this.hasta = this.toIso(hasta);
    this.activePreset = dias;
    this.emit();
  }

  clear() {
    this.desde = null;
    this.hasta = null;
    this.activePreset = 'todo';
    this.emit();
  }

  onCustomChange(field: 'desde' | 'hasta', value: string) {
    this[field] = value || null;
    this.activePreset = 'custom';
    this.emit();
  }

  private toIso(d: Date) { return d.toISOString().slice(0, 10); }
  private emit() { this.rangeChange.emit({ desde: this.desde, hasta: this.hasta }); }
}
