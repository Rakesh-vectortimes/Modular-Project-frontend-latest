import { Injectable, signal } from '@angular/core';

export interface RuntimeToast {
  id: number;
  message: string;
  tone: 'success' | 'error' | 'info';
}

let toastIdCounter = 0;

/**
 * Lightweight toast/notification queue for Run mode — gives actions like
 * "Submit this form" or a new "Show a message" button action visible
 * feedback instead of only logging errors to the console.
 */
@Injectable({ providedIn: 'root' })
export class RuntimeToastService {
  private readonly _toasts = signal<RuntimeToast[]>([]);

  readonly toasts = this._toasts.asReadonly();

  show(message: string, tone: RuntimeToast['tone'] = 'info', durationMs = 3500): void {
    toastIdCounter += 1;
    const id = toastIdCounter;
    this._toasts.update((current) => [...current, { id, message, tone }]);
    setTimeout(() => this.dismiss(id), durationMs);
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error');
  }

  dismiss(id: number): void {
    this._toasts.update((current) => current.filter((t) => t.id !== id));
  }
}
