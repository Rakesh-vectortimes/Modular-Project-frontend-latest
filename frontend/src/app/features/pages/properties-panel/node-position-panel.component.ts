import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PositionSchema } from '../../../core/models/page-component-node.model';

@Component({
  selector: 'app-node-position-panel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './node-position-panel.component.html',
  styleUrl: './node-position-panel.component.scss',
})
export class NodePositionPanelComponent {
  readonly position = input.required<PositionSchema>();
  readonly positionChange = output<PositionSchema>();

  protected fieldValue(field: keyof Pick<PositionSchema, 'x' | 'y' | 'w' | 'h'>): number {
    return this.position()[field];
  }

  protected setField(
    field: keyof Pick<PositionSchema, 'x' | 'y' | 'w' | 'h'>,
    value: string | number,
  ): void {
    const num = Number(value);
    this.positionChange.emit({
      ...this.position(),
      [field]: Number.isFinite(num) ? num : 0,
    });
  }
}
