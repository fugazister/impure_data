import { Component, signal, inject, ViewChild, computed } from '@angular/core';
import { NodeCanvasComponent } from './features/node-editor/node-canvas.component';
import { CodePanelComponent } from './features/code-generation/code-panel.component';
import { NodeEditorService } from './features/node-editor/node-editor.service';
import { CodeGeneratorService } from './features/code-generation/code-generator.service';
import { TriggerExecutorService, ExecutionContext } from './features/code-generation/trigger-executor.service';
import { DebugService } from './core/debug.service';

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
  private debugService = inject(DebugService);
  @ViewChild('codePanel') codePanel!: CodePanelComponent;
  
  constructor() {
    // Make debug functions globally available for easy console access
    (window as any).debugDump = () => {
      console.log('\n🐛 LATEST DEBUG DUMP:');
      console.log('='.repeat(80));
      console.log(this.debugService.dumpLatestSession());
      console.log('='.repeat(80));
    };
    
    (window as any).debugDumpAll = () => {
      console.log('\n🐛 ALL DEBUG SESSIONS:');
      console.log('='.repeat(80));
      console.log(this.debugService.dumpAllSessions());
      console.log('='.repeat(80));
    };

    // Structured dump functions that return JSON objects for Chrome DevTools
    (window as any).debugData = () => {
      const data = this.debugService.getLatestDump();
      console.log('🐛 Latest debug data (right-click to copy object):', data);
      return data;
    };

    (window as any).debugDataAll = () => {
      const data = this.debugService.getAllDumps();
      console.log('🐛 All debug data (right-click to copy object):', data);
      return data;
    };

    (window as any).debugDataCurrent = () => {
      const data = this.debugService.getDumpData();
      console.log('🐛 Current session data (right-click to copy object):', data);
      return data;
    };
    
    (window as any).debugClear = () => {
      this.debugService.clearSessions();
      console.log('🗑️ All debug sessions cleared');
    };
    
    console.log('🐛 Debug functions available:');
    console.log('  Text format (formatted output):');
    console.log('    debugDump() - Show latest debug session');
    console.log('    debugDumpAll() - Show all debug sessions');
    console.log('  Structured format (JSON objects for copying):');
    console.log('    debugData() - Get latest debug session data');
    console.log('    debugDataAll() - Get all debug sessions data');
    console.log('    debugDataCurrent() - Get current session data');
    console.log('  Utility:');
    console.log('    debugClear() - Clear all debug sessions');
  }
  
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
    const nodes = this.nodeEditorService.nodes();
    const connections = this.nodeEditorService.connections();
    
    // Start debug session
    const sessionId = this.debugService.startSession({
      nodeCount: nodes.length,
      connectionCount: connections.length,
      executionMode: this.nodeEditorService.currentMode()
    });

    this.debugService.log('App', 'executeCode() called - PD-style execution');
    this.debugService.log('App', `Found ${nodes.length} nodes and ${connections.length} connections`);
    
    // Clear previous execution results and add a test message
    if (this.codePanel) {
      this.codePanel.executionOutput.set([]);
      this.codePanel.executionErrors.set([]);
      this.debugService.log('App', 'Code panel found, cleared previous results');
    } else {
      this.debugService.error('App', 'Code panel not found!');
      this.debugService.endSession();
      return;
    }

    try {
      // First priority: Execute document triggers (like PD's loadbang)
      this.debugService.log('App', 'Executing document triggers');
      const triggerContext = this.triggerExecutorService.executeDocumentTriggers(nodes, connections);
      
      // If no document triggers, fall back to function nodes for backward compatibility
      let functionContext: ExecutionContext = { variables: new Map(), output: [], errors: [] };
      if (triggerContext.output.length <= 1) { // Only has the header
        this.debugService.log('App', 'No document triggers found, executing function nodes');
        functionContext = this.triggerExecutorService.executeFunctionNodes(nodes);
      } else {
        this.debugService.log('App', `Document triggers executed: ${triggerContext.output.length} output entries`);
      }

      // Combine results
      const allOutput = [...triggerContext.output, ...functionContext.output];
      const allErrors = [...triggerContext.errors, ...functionContext.errors];

      if (this.codePanel) {
        this.codePanel.executionOutput.set(allOutput);
        this.codePanel.executionErrors.set(allErrors);
        this.debugService.log('App', `Updated panel with results: ${allOutput.length} output entries, ${allErrors.length} errors`);
        
        if (allErrors.length > 0) {
          this.debugService.error('App', 'Execution completed with errors', allErrors);
        } else {
          this.debugService.log('App', 'Execution completed successfully');
        }
      }
    } catch (error) {
      this.debugService.error('App', 'Execution failed with exception', error);
    } finally {
      // End debug session and log dump
      const session = this.debugService.endSession();
      if (session) {
        console.log('\n' + '='.repeat(80));
        console.log('🐛 DEBUG DUMP:');
        console.log('='.repeat(80));
        console.log(this.debugService.dumpLatestSession());
        console.log('='.repeat(80) + '\n');
      }
    }
  }

  protected shouldShowCodePanel(): boolean {
    return this.showCodePanel();
  }
}
