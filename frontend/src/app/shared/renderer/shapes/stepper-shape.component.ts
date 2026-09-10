import { Component, input } from '@angular/core';

import { listProp, numberProp, RenderNode } from '../render-node.model';

@Component({
  selector: 'app-stepper-shape',
  standalone: true,
  template: `
    <div class="stepper">
      @for (step of steps(); track $index; let i = $index; let last = $last) {
        <div class="step">
          <div class="circle" [class.done]="i < activeStep()" [class.active]="i === activeStep()">
            {{ i + 1 }}
          </div>
          <span class="step-label">{{ step }}</span>
        </div>
        @if (!last) {
          <div class="connector" [class.done]="i < activeStep()"></div>
        }
      }
    </div>
  `,
  styles: `
    .stepper {
      display: flex;
      align-items: flex-start;
      width: 100%;
    }
    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
    }
    .circle {
      width: 1.75rem;
      height: 1.75rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e5e7eb;
      color: #6b7280;
      font-size: 0.75rem;
      font-weight: 600;
      flex-shrink: 0;
    }
    .circle.active {
      background: #17a2b8;
      color: #fff;
    }
    .circle.done {
      background: #0f766e;
      color: #fff;
    }
    .step-label {
      font-size: 0.6875rem;
      color: #4b5563;
      white-space: nowrap;
    }
    .connector {
      flex: 1;
      height: 2px;
      background: #e5e7eb;
      margin: 0.875rem 0.25rem 0;
      min-width: 1rem;
    }
    .connector.done {
      background: #0f766e;
    }
  `,
})
export class StepperShapeComponent {
  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected steps(): string[] {
    const steps = listProp(this.node().props, 'steps');
    return steps.length ? steps : ['Step 1'];
  }

  protected activeStep(): number {
    return numberProp(this.node().props, 'activeStep', 0);
  }
}
