import { Component, signal, inject, ViewChild, computed } from '@angular/core';
import { NodeCanvasComponent } from './features/node-editor/node-canvas.component';
import { CodePanelComponent } from './features/code-generation/code-panel.component';
import { NodeEditorService } from './features/node-editor/node-editor.service';
import { CodeGeneratorService } from './features/code-generation/code-generator.service';

@Component({
  selector: 'app-root',
  imports: [NodeCanvasComponent, CodePanelComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private nodeEditorService = inject(NodeEditorService);
  private codeGeneratorService = inject(CodeGeneratorService);
  @ViewChild('codePanel') codePanel!: CodePanelComponent;
  
  protected readonly title = signal('Impure Data - Visual JavaScript Editor');
  
  // Force show panel in execution mode
  private forceShowPanel = signal(false);
  
  // Computed signal for better reactivity
  protected readonly showCodePanel = computed(() => {
    // Force show if we're in execution mode and have forced it
    if (this.forceShowPanel()) return true;
    
    // Don't show panel if ViewChild isn't ready yet
    if (!this.codePanel) return false;
    
    // Don't show panel if there are no nodes (completely empty canvas)
    const nodes = this.nodeEditorService.nodes();
    if (nodes.length === 0) return false;
    
    // Always show panel in execution mode if there are function nodes
    if (this.nodeEditorService.isExecutionMode()) {
      const hasFunctionNodes = nodes.some(node => node.type === 'function');
      if (hasFunctionNodes) return true;
    }
    
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
    console.log('toggleMode() called, current mode:', this.nodeEditorService.currentMode());
    this.nodeEditorService.toggleMode();
    console.log('After toggle, new mode:', this.nodeEditorService.currentMode());
    
    // Execute function nodes when switching to execution mode
    if (this.nodeEditorService.isExecutionMode()) {
      console.log('Switched to execution mode, executing code...');
      this.forceShowPanel.set(true);
      // Use setTimeout to ensure ViewChild is ready
      setTimeout(() => {
        this.executeCode();
      }, 100);
    } else {
      console.log('Switched to edit mode');
      this.forceShowPanel.set(false);
    }
  }

  private executeCode(): void {
    console.log('executeCode() called');
    const nodes = this.nodeEditorService.nodes();
    console.log('All nodes:', nodes);
    const functionNodes = nodes.filter(node => node.type === 'function' && node.customCode);
    console.log('Function nodes with code:', functionNodes);
    
    // Clear previous execution results and add a test message
    if (this.codePanel) {
      this.codePanel.executionOutput.set(['=== CODE EXECUTION STARTED ===']);
      this.codePanel.executionErrors.set([]);
      console.log('Code panel found, cleared previous results');
    } else {
      console.log('Code panel not found!');
      return;
    }
    
    if (functionNodes.length === 0) {
      this.codePanel.executionOutput.set([
        '=== CODE EXECUTION STARTED ===',
        'No function nodes with code found'
      ]);
      return;
    }
    
    // Execute each function node separately for proof of concept
    functionNodes.forEach(node => {
      console.log('Processing node:', node.id, 'with code:', node.customCode);
      if (node.customCode && node.customCode.trim()) {
        const result = this.codeGeneratorService.executeCode(node.customCode);
        console.log('Execution result:', result);
        
        if (this.codePanel) {
          if (result.success) {
            // Add output with node identification
            const currentOutput = this.codePanel.executionOutput();
            this.codePanel.executionOutput.set([
              ...currentOutput,
              `--- Node: ${node.label || 'Function'} ---`,
              ...result.output
            ]);
            console.log('Added output to panel');
          } else {
            // Add errors with node identification
            const currentErrors = this.codePanel.executionErrors();
            this.codePanel.executionErrors.set([
              ...currentErrors,
              `Error in ${node.label || 'Function'}: ${result.errors.join(', ')}`
            ]);
            console.log('Added errors to panel');
          }
        }
      }
    });
  }

  protected shouldShowCodePanel(): boolean {
    return this.showCodePanel();
  }
}
