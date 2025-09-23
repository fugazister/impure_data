import { Component, signal, inject, ViewChild, computed } from '@angular/core';
import { NodeCanvasComponent } from './features/node-editor/node-canvas.component';
import { CodePanelComponent } from './features/code-generation/code-panel.component';
import { NodeEditorService } from './features/node-editor/node-editor.service';
import { CodeGeneratorService } from './features/code-generation/code-generator.service';
import { TriggerExecutorService, ExecutionContext } from './features/code-generation/trigger-executor.service';

@Component({
  selector: 'app-root',
  imports: [NodeCanvasComponent, CodePanelComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private nodeEditorService = inject(NodeEditorService);
  private codeGeneratorService = inject(CodeGeneratorService);
  private triggerExecutorService = inject(TriggerExecutorService);
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
    console.log('executeCode() called - PD-style execution');
    const nodes = this.nodeEditorService.nodes();
    const connections = this.nodeEditorService.connections();
    console.log('All nodes:', nodes);
    console.log('All connections:', connections);
    
    // Clear previous execution results and add a test message
    if (this.codePanel) {
      this.codePanel.executionOutput.set([]);
      this.codePanel.executionErrors.set([]);
      console.log('Code panel found, cleared previous results');
    } else {
      console.log('Code panel not found!');
      return;
    }

    // First priority: Execute document triggers (like PD's loadbang)
    const triggerContext = this.triggerExecutorService.executeDocumentTriggers(nodes, connections);
    
    // If no document triggers, fall back to function nodes for backward compatibility
    let functionContext: ExecutionContext = { variables: new Map(), output: [], errors: [] };
    if (triggerContext.output.length <= 1) { // Only has the header
      functionContext = this.triggerExecutorService.executeFunctionNodes(nodes);
    }

    // Combine results
    const allOutput = [...triggerContext.output, ...functionContext.output];
    const allErrors = [...triggerContext.errors, ...functionContext.errors];

    if (this.codePanel) {
      this.codePanel.executionOutput.set(allOutput);
      this.codePanel.executionErrors.set(allErrors);
      console.log('Updated panel with results:', { output: allOutput, errors: allErrors });
    }
  }

  protected shouldShowCodePanel(): boolean {
    return this.showCodePanel();
  }
}
