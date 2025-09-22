import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodeEditorService } from '../node-editor/node-editor.service';
import { CodeGeneratorService, CodeGenerationResult } from './code-generator.service';
import { ProjectManagerService } from '../project-management/project-manager.service';

@Component({
  selector: 'app-code-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './code-panel.component.html',
  styleUrl: './code-panel.component.css'
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