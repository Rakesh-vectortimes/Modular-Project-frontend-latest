import { Injectable, signal } from '@angular/core';

@Injectable()
export class DropListRegistryService {
  private readonly _ids = signal<string[]>(['palette-list']);

  readonly ids = this._ids.asReadonly();

  register(id: string): void {
    this._ids.update((current) => (current.includes(id) ? current : [...current, id]));
  }

  unregister(id: string): void {
    if (id === 'palette-list') {
      return;
    }
    this._ids.update((current) => current.filter((item) => item !== id));
  }
}
