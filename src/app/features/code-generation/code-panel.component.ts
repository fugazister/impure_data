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
  executionOutput = signal<any[]>([]);
  executionErrors = signal<string[]>([]);
  
  generationResult = computed(() => {
    const nodes = this.nodeEditor.nodes();
    const connections = this.nodeEditor.connections();
    return this.codeGenerator.generateCode(nodes, connections);
  });

  hasErrors = computed(() => {
    return this.generationResult().errors.length > 0 || this.executionErrors().length > 0;
  });

  constructor(
    private nodeEditor: NodeEditorService,
    private codeGenerator: CodeGeneratorService,
    private projectManager: ProjectManagerService
  ) {}

  formatOutput(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return '[object Object]';
      }
    }
    return String(value);
  }
}