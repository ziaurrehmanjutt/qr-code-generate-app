import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GradientConfig, SUPPORTED_OPTIONS, gradientCss } from '../../services/qr.service';

const MAX_STOPS = 5;

/**
 * Edits one color: a solid color, or a linear / radial gradient with up to five color stops,
 * a direction, and a live preview. It never changes its inputs; it emits new values.
 */
@Component({
  selector: 'app-gradient-editor',
  templateUrl: 'gradient-editor.component.html',
  styleUrls: ['gradient-editor.component.scss'],
  standalone: false,
})
export class GradientEditorComponent {
  /** The solid color, used while the type is "Solid". */
  @Input() solid = '#000000';
  @Input() gradient!: GradientConfig;
  @Output() solidChange = new EventEmitter<string>();
  @Output() gradientChange = new EventEmitter<GradientConfig>();

  readonly presets = SUPPORTED_OPTIONS.gradientPresets;
  readonly quickColors = ['#000000', '#ffffff', '#0f7d70', '#e9785c', '#0163aa', '#6a11cb', '#2dd55b', '#e83e3e'];
  readonly directions = [0, 45, 90, 135, 180, 225, 270, 315];
  readonly maxStops = MAX_STOPS;

  get css(): string {
    return gradientCss(this.solid, this.gradient);
  }

  presetCss(colors: string[]): string {
    return gradientCss(this.solid, this.fromColors(colors, 'linear', 90));
  }

  percent(offset: number): number {
    return Math.round(offset * 100);
  }

  trackByIndex(index: number): number {
    return index;
  }

  setType(type: unknown): void {
    if (type === this.gradient.type) return;
    const next = { ...this.gradient, type: type as GradientConfig['type'] };
    // Starting a gradient from the current solid color keeps the code looking the same at first.
    if (this.gradient.type === 'none') next.stops = this.gradient.stops.map((stop, i) => (i === 0 ? { ...stop, color: this.solid } : stop));
    this.emit(next);
  }

  setStopColor(index: number, color: string): void {
    this.emit({ ...this.gradient, stops: this.gradient.stops.map((stop, i) => (i === index ? { ...stop, color } : stop)) });
  }

  setStopPercent(index: number, value: unknown): void {
    const offset = Math.min(100, Math.max(0, Number(value))) / 100;
    this.emit({ ...this.gradient, stops: this.gradient.stops.map((stop, i) => (i === index ? { ...stop, offset } : stop)) });
  }

  addStop(): void {
    if (this.gradient.stops.length >= MAX_STOPS) return;
    const sorted = [...this.gradient.stops].sort((a, b) => a.offset - b.offset);
    // Put the new color in the middle of the widest gap, starting from the nearest neighbour's color.
    let at = 0;
    let widest = -1;
    for (let i = 0; i < sorted.length - 1; i++) {
      const gap = sorted[i + 1].offset - sorted[i].offset;
      if (gap > widest) { widest = gap; at = i; }
    }
    const offset = (sorted[at].offset + sorted[at + 1].offset) / 2;
    this.emit({ ...this.gradient, stops: [...sorted.slice(0, at + 1), { offset, color: sorted[at].color }, ...sorted.slice(at + 1)] });
  }

  removeStop(index: number): void {
    if (this.gradient.stops.length <= 2) return;
    this.emit({ ...this.gradient, stops: this.gradient.stops.filter((_, i) => i !== index) });
  }

  reverse(): void {
    this.emit({ ...this.gradient, stops: this.gradient.stops.map((stop) => ({ ...stop, offset: 1 - stop.offset })) });
  }

  setRotation(value: unknown): void {
    this.emit({ ...this.gradient, rotation: Number(value) });
  }

  applyPreset(colors: string[]): void {
    const type = this.gradient.type === 'none' ? 'linear' : this.gradient.type;
    this.emit(this.fromColors(colors, type, this.gradient.rotation));
  }

  private fromColors(colors: string[], type: GradientConfig['type'], rotation: number): GradientConfig {
    const last = Math.max(1, colors.length - 1);
    return { type, rotation, stops: colors.map((color, i) => ({ offset: i / last, color })) };
  }

  private emit(gradient: GradientConfig): void {
    this.gradientChange.emit(gradient);
  }
}
