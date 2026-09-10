import { Component } from '@angular/core';

@Component({
  selector: 'app-publish-home',
  standalone: true,
  template: `
    <div class="home">
      <h1>Published App</h1>
      <p>Open a live app at <code>/app/:softwareId</code></p>
      <p class="hint">Example: <code>/app/1</code></p>
    </div>
  `,
  styles: `
    .home {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      color: #374151;
      text-align: center;
      padding: 2rem;
    }
    h1 {
      margin: 0;
      font-size: 1.5rem;
    }
    p {
      margin: 0;
    }
    code {
      padding: 0.125rem 0.375rem;
      background: #f3f4f6;
      border-radius: 4px;
      font-size: 0.875rem;
    }
    .hint {
      color: #6b7280;
      font-size: 0.875rem;
    }
  `,
})
export class PublishHomeComponent {}
