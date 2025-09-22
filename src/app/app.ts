import { Component, signal } from '@angular/core';
import { NodeCanvasComponent } from './features/node-editor/node-canvas.component';
import { CodePanelComponent } from './features/code-generation/code-panel.component';

@Component({
  selector: 'app-root',
  imports: [NodeCanvasComponent, CodePanelComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Impure Data - Visual JavaScript Editor');
  protected readonly codeHelpVisible = signal(false);

  protected toggleCodeHelp(): void {
    this.codeHelpVisible.set(!this.codeHelpVisible());
  }
}
