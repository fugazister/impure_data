import { Component, signal, inject, ViewChild, computed } from '@angular/core';
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
  @ViewChild('codePanel') codePanel!: CodePanelComponent;
  
  protected readonly title = signal('Impure Data - Visual JavaScript Editor');
  
  // Computed signal for better reactivity
  protected readonly showCodePanel = computed(() => {
    // Don't show panel if ViewChild isn't ready yet
    if (!this.codePanel) return false;
    
    // Don't show panel if there are no nodes (completely empty canvas)
    const nodes = this.nodeEditorService.nodes();
    if (nodes.length === 0) return false;
    
    // Check if there's any meaningful content to show
    const hasExecutionOutput = this.codePanel.executionOutput().length > 0;
    const hasExecutionErrors = this.codePanel.executionErrors().length > 0;
    const hasGenerationErrors = this.codePanel.generationResult().errors.length > 0;
    const hasWarnings = this.codePanel.generationResult().warnings.length > 0;
    
    return hasExecutionOutput || hasExecutionErrors || hasGenerationErrors || hasWarnings;
  });

  protected toggleCodeHelp(): void {
    // No longer needed - panel shows automatically
  }

  protected isEditMode(): boolean {
    return this.nodeEditorService.isEditMode();
  }

  protected toggleMode(): void {
    this.nodeEditorService.toggleMode();
  }

  protected shouldShowCodePanel(): boolean {
    return this.showCodePanel();
  }
}
