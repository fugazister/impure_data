import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodeEditorService } from '../services/node-editor.service';
import { CodeGeneratorService, CodeGenerationResult } from '../services/code-generator.service';
import { ProjectManagerService } from '../services/project-manager.service';

@Component({
  selector: 'app-code-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="code-panel">
      <div class="panel-header">
        <div class="panel-tabs">
          <button 
            class="tab-button"
            [class.active]="activeTab() === 'code'"
            (click)="setActiveTab('code')"
          >
            Generated Code
          </button>
          <button 
            class="tab-button"
            [class.active]="activeTab() === 'output'"
            (click)="setActiveTab('output')"
          >
            Output
          </button>
          <button 
            class="tab-button"
            [class.active]="activeTab() === 'errors'"
            (click)="setActiveTab('errors')"
            [class.has-errors]="generationResult().errors.length > 0"
          >
            Errors ({{ generationResult().errors.length }})
          </button>
        </div>
        
        <div class="panel-actions">
          <button 
            class="action-button"
            (click)="regenerateCode()"
            title="Regenerate Code"
          >
            🔄
          </button>
          <button 
            class="action-button"
            (click)="executeCode()"
            [disabled]="!generationResult().success"
            title="Execute Code"
          >
            ▶️
          </button>
          <button 
            class="action-button"
            (click)="exportCode()"
            [disabled]="!generationResult().success"
            title="Export as .js file"
          >
            💾
          </button>
          <button 
            class="action-button"
            (click)="copyCode()"
            [disabled]="!generationResult().success"
            title="Copy to Clipboard"
          >
            📋
          </button>
        </div>
      </div>
      
      <div class="panel-content">
        @if (activeTab() === 'code') {
          <div class="code-tab">
            @if (generationResult().success) {
              <pre class="code-block"><code [innerHTML]="highlightedCode()"></code></pre>
            } @else {
              <div class="error-message">
                <h4>Code Generation Failed</h4>
                <ul>
                  @for (error of generationResult().errors; track error) {
                    <li>{{ error }}</li>
                  }
                </ul>
              </div>
            }
          </div>
        }
        
        @if (activeTab() === 'output') {
          <div class="output-tab">
            <div class="output-header">
              <span>Execution Output</span>
              <button 
                class="action-button small"
                (click)="clearOutput()"
                title="Clear Output"
              >
                🗑️
              </button>
            </div>
            <div class="output-content">
              @if (executionOutput().length === 0) {
                <div class="no-output">No output yet. Execute the code to see results.</div>
              } @else {
                @for (output of executionOutput(); track $index) {
                  <div class="output-line">
                    <span class="output-index">{{ $index + 1 }}.</span>
                    <span class="output-value">{{ formatOutput(output) }}</span>
                  </div>
                }
              }
            </div>
          </div>
        }
        
        @if (activeTab() === 'errors') {
          <div class="errors-tab">
            @if (generationResult().errors.length === 0 && executionErrors().length === 0) {
              <div class="no-errors">✅ No errors found!</div>
            } @else {
              @if (generationResult().errors.length > 0) {
                <div class="error-section">
                  <h4>Code Generation Errors</h4>
                  <ul>
                    @for (error of generationResult().errors; track error) {
                      <li class="error-item">{{ error }}</li>
                    }
                  </ul>
                </div>
              }
              
              @if (executionErrors().length > 0) {
                <div class="error-section">
                  <h4>Execution Errors</h4>
                  <ul>
                    @for (error of executionErrors(); track error) {
                      <li class="error-item">{{ error }}</li>
                    }
                  </ul>
                </div>
              }
            }
            
            @if (generationResult().warnings.length > 0) {
              <div class="warning-section">
                <h4>Warnings</h4>
                <ul>
                  @for (warning of generationResult().warnings; track warning) {
                    <li class="warning-item">{{ warning }}</li>
                  }
                </ul>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .code-panel {
      width: 400px;
      height: 100%;
      background: white;
      border-left: 1px solid #dee2e6;
      display: flex;
      flex-direction: column;
    }
    
    .panel-header {
      padding: 12px;
      border-bottom: 1px solid #dee2e6;
      background: #f8f9fa;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .panel-tabs {
      display: flex;
      gap: 4px;
    }
    
    .tab-button {
      padding: 6px 12px;
      border: 1px solid #dee2e6;
      background: white;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.15s ease;
    }
    
    .tab-button:hover {
      background: #e9ecef;
    }
    
    .tab-button.active {
      background: #007acc;
      color: white;
      border-color: #007acc;
    }
    
    .tab-button.has-errors {
      color: #dc3545;
      border-color: #dc3545;
    }
    
    .tab-button.has-errors.active {
      background: #dc3545;
      color: white;
    }
    
    .panel-actions {
      display: flex;
      gap: 4px;
    }
    
    .action-button {
      padding: 6px 8px;
      border: 1px solid #dee2e6;
      background: white;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.15s ease;
    }
    
    .action-button:hover:not(:disabled) {
      background: #e9ecef;
    }
    
    .action-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .action-button.small {
      padding: 4px 6px;
      font-size: 10px;
    }
    
    .panel-content {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    
    .code-tab, .output-tab, .errors-tab {
      flex: 1;
      overflow: auto;
      padding: 12px;
    }
    
    .code-block {
      margin: 0;
      padding: 16px;
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.4;
      overflow: auto;
      white-space: pre;
    }
    
    .error-message {
      padding: 16px;
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 4px;
      color: #721c24;
    }
    
    .error-message h4 {
      margin: 0 0 8px 0;
      font-size: 14px;
    }
    
    .error-message ul {
      margin: 0;
      padding-left: 20px;
    }
    
    .output-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #dee2e6;
    }
    
    .output-content {
      font-family: 'Courier New', monospace;
      font-size: 12px;
    }
    
    .no-output, .no-errors {
      text-align: center;
      color: #6c757d;
      font-style: italic;
      padding: 32px;
    }
    
    .output-line {
      display: flex;
      margin-bottom: 4px;
      padding: 4px 8px;
      background: #f8f9fa;
      border-radius: 2px;
    }
    
    .output-index {
      color: #6c757d;
      margin-right: 8px;
      min-width: 20px;
    }
    
    .output-value {
      flex: 1;
      word-break: break-all;
    }
    
    .error-section, .warning-section {
      margin-bottom: 16px;
    }
    
    .error-section h4 {
      color: #dc3545;
      margin: 0 0 8px 0;
      font-size: 14px;
    }
    
    .warning-section h4 {
      color: #856404;
      margin: 0 0 8px 0;
      font-size: 14px;
    }
    
    .error-item {
      color: #dc3545;
      margin-bottom: 4px;
    }
    
    .warning-item {
      color: #856404;
      margin-bottom: 4px;
    }
    
    /* Syntax highlighting */
    .keyword { color: #0000ff; }
    .string { color: #008000; }
    .number { color: #ff8c00; }
    .comment { color: #808080; font-style: italic; }
    .function { color: #800080; }
  `]
})
export class CodePanelComponent {
  activeTab = signal<'code' | 'output' | 'errors'>('code');
  executionOutput = signal<any[]>([]);
  executionErrors = signal<string[]>([]);
  
  generationResult = computed(() => {
    const nodes = this.nodeEditor.nodes();
    const connections = this.nodeEditor.connections();
    return this.codeGenerator.generateCode(nodes, connections);
  });
  
  highlightedCode = computed(() => {
    return this.highlightJavaScript(this.generationResult().code);
  });

  constructor(
    private nodeEditor: NodeEditorService,
    private codeGenerator: CodeGeneratorService,
    private projectManager: ProjectManagerService
  ) {}

  setActiveTab(tab: 'code' | 'output' | 'errors'): void {
    this.activeTab.set(tab);
  }

  regenerateCode(): void {
    // Force recomputation by updating a dependency
    // The computed signal will automatically regenerate
  }

  executeCode(): void {
    const result = this.generationResult();
    if (!result.success) {
      return;
    }

    this.executionErrors.set([]);
    
    const executionResult = this.codeGenerator.executeCode(result.code);
    
    if (executionResult.success) {
      this.executionOutput.set(executionResult.output);
      this.setActiveTab('output');
    } else {
      this.executionErrors.set(executionResult.errors);
      this.setActiveTab('errors');
    }
  }

  exportCode(): void {
    const result = this.generationResult();
    if (!result.success) {
      return;
    }

    const project = this.nodeEditor.getProject();
    const filename = project.name.replace(/\s+/g, '_');
    
    try {
      this.projectManager.exportCodeAsJS(result.code, filename);
    } catch (error) {
      console.error('Failed to export code:', error);
    }
  }

  async copyCode(): Promise<void> {
    const result = this.generationResult();
    if (!result.success) {
      return;
    }

    try {
      await navigator.clipboard.writeText(result.code);
      // Could show a toast notification here
    } catch (error) {
      console.error('Failed to copy code:', error);
      // Fallback for older browsers
      this.fallbackCopyTextToClipboard(result.code);
    }
  }

  clearOutput(): void {
    this.executionOutput.set([]);
    this.executionErrors.set([]);
  }

  formatOutput(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return '[object Object]';
      }
    }
    return String(value);
  }

  private highlightJavaScript(code: string): string {
    // Basic syntax highlighting
    let highlighted = code;
    
    // Keywords
    const keywords = ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'true', 'false', 'null', 'undefined'];
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      highlighted = highlighted.replace(regex, `<span class="keyword">${keyword}</span>`);
    });
    
    // Strings
    highlighted = highlighted.replace(/"([^"]*)"/g, '<span class="string">"$1"</span>');
    highlighted = highlighted.replace(/'([^']*)'/g, '<span class="string">\'$1\'</span>');
    
    // Numbers
    highlighted = highlighted.replace(/\b(\d+\.?\d*)\b/g, '<span class="number">$1</span>');
    
    // Comments
    highlighted = highlighted.replace(/\/\/.*$/gm, '<span class="comment">$&</span>');
    highlighted = highlighted.replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>');
    
    return highlighted;
  }

  private fallbackCopyTextToClipboard(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
    } catch (err) {
      console.error('Fallback: Could not copy text: ', err);
    }
    
    document.body.removeChild(textArea);
  }
}