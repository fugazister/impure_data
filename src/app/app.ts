import { Component, signal, inject } from '@angular/core';
import { NodeCanvasComponent } from './features/node-editor/node-canvas.component';
import { CodePanelComponent } from './features/code-generation/code-panel.component';
import { NodeEditorService } from './features/node-editor/node-editor.service';

@Component({
  selector: 'app-root',
  imports: [NodeCanvasComponent, CodePanelComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private nodeEditorService = inject(NodeEditorService);
  
  protected readonly title = signal('Impure Data - Visual JavaScript Editor');
  protected readonly codeHelpVisible = signal(false);

  protected toggleCodeHelp(): void {
    this.codeHelpVisible.set(!this.codeHelpVisible());
  }

  protected isEditMode(): boolean {
    return this.nodeEditorService.isEditMode();
  }

  protected toggleMode(): void {
    this.nodeEditorService.toggleMode();
  }
}
