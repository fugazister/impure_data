import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodeTypeLibrary } from './node-library.service';
import { NodeEditorService } from '../node-editor/node-editor.service';
import { NodeType } from '../../core';

@Component({
  selector: 'app-node-palette',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="palette-container">
      <div class="palette-header">
        <h3>Node Library</h3>
        <input
          type="text"
          placeholder="Search nodes..."
          class="search-input"
          [value]="searchTerm()"
          (input)="onSearchInput($event)"
        />
      </div>
      
      <div class="palette-content">
        @for (category of categories(); track category) {
          <div class="category-section">
            <div 
              class="category-header"
              [class.expanded]="isCategoryExpanded(category)"
              (click)="toggleCategory(category)"
            >
              <span class="category-icon">
                {{ isCategoryExpanded(category) ? '▼' : '▶' }}
              </span>
              <span class="category-name">{{ getCategoryDisplayName(category) }}</span>
              <span class="category-count">({{ getNodeTypesForCategory(category).length }})</span>
            </div>
            
            @if (isCategoryExpanded(category)) {
              <div class="category-nodes">
                @for (nodeType of getNodeTypesForCategory(category); track nodeType.id) {
                  <div
                    class="node-item"
                    [style.border-left-color]="nodeType.color"
                    draggable="true"
                    (dragstart)="onNodeDragStart($event, nodeType)"
                    (click)="addNodeToCanvas(nodeType)"
                  >
                    <div class="node-item-header">
                      <span class="node-name">{{ nodeType.name }}</span>
                    </div>
                    <div class="node-description">{{ nodeType.description }}</div>
                    <div class="node-ports">
                      @if (nodeType.defaultInputs.length > 0) {
                        <div class="port-info">
                          <span class="port-label">In:</span>
                          <span class="port-types">
                            @for (input of nodeType.defaultInputs; track input.label; let i = $index) {
                              {{ input.label }}@if (i < nodeType.defaultInputs.length - 1) {, }
                            }
                          </span>
                        </div>
                      }
                      @if (nodeType.defaultOutputs.length > 0) {
                        <div class="port-info">
                          <span class="port-label">Out:</span>
                          <span class="port-types">
                            @for (output of nodeType.defaultOutputs; track output.label; let i = $index) {
                              {{ output.label }}@if (i < nodeType.defaultOutputs.length - 1) {, }
                            }
                          </span>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .palette-container {
      width: 300px;
      height: 100%;
      background: #f8f9fa;
      border-right: 1px solid #dee2e6;
      display: flex;
      flex-direction: column;
    }
    
    .palette-header {
      padding: 16px;
      border-bottom: 1px solid #dee2e6;
      background: white;
    }
    
    .palette-header h3 {
      margin: 0 0 12px 0;
      font-size: 16px;
      font-weight: 600;
      color: #343a40;
    }
    
    .search-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.15s ease-in-out;
    }
    
    .search-input:focus {
      border-color: #007acc;
      box-shadow: 0 0 0 0.2rem rgba(0, 123, 204, 0.25);
    }
    
    .palette-content {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }
    
    .category-section {
      margin-bottom: 8px;
    }
    
    .category-header {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      background: white;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.15s ease;
    }
    
    .category-header:hover {
      background: #e9ecef;
    }
    
    .category-header.expanded {
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
      border-bottom: none;
    }
    
    .category-icon {
      margin-right: 8px;
      font-size: 12px;
      color: #6c757d;
    }
    
    .category-name {
      flex: 1;
      font-weight: 500;
      color: #495057;
    }
    
    .category-count {
      font-size: 12px;
      color: #6c757d;
    }
    
    .category-nodes {
      border: 1px solid #dee2e6;
      border-top: none;
      border-bottom-left-radius: 4px;
      border-bottom-right-radius: 4px;
      background: white;
    }
    
    .node-item {
      padding: 12px;
      border-left: 4px solid #6c757d;
      border-bottom: 1px solid #f1f3f4;
      cursor: pointer;
      transition: background-color 0.15s ease;
    }
    
    .node-item:last-child {
      border-bottom: none;
    }
    
    .node-item:hover {
      background: #f8f9fa;
    }
    
    .node-item:active {
      background: #e9ecef;
    }
    
    .node-item-header {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
    }
    
    .node-name {
      font-weight: 500;
      color: #343a40;
      font-size: 14px;
    }
    
    .node-description {
      font-size: 12px;
      color: #6c757d;
      margin-bottom: 8px;
    }
    
    .node-ports {
      font-size: 11px;
    }
    
    .port-info {
      margin-bottom: 2px;
    }
    
    .port-label {
      color: #495057;
      font-weight: 500;
      margin-right: 4px;
    }
    
    .port-types {
      color: #6c757d;
    }
    
    /* Drag feedback */
    .node-item[draggable="true"] {
      user-select: none;
    }
    
    .node-item:hover[draggable="true"] {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
  `]
})
export class NodePaletteComponent {
  searchTerm = signal('');
  private expandedCategories = signal<Set<string>>(new Set(['math', 'data']));
  
  categories = computed(() => {
    const allCategories: NodeType['category'][] = ['math', 'logic', 'control', 'data', 'function', 'io'];
    const searchTermLower = this.searchTerm().toLowerCase();
    
    if (searchTermLower) {
      return allCategories.filter(category => 
        this.getNodeTypesForCategory(category).length > 0
      );
    }
    
    return allCategories;
  });

  constructor(private nodeEditor: NodeEditorService) {}

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  toggleCategory(category: string): void {
    const expanded = this.expandedCategories();
    const newExpanded = new Set(expanded);
    
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    
    this.expandedCategories.set(newExpanded);
  }

  isCategoryExpanded(category: string): boolean {
    return this.expandedCategories().has(category);
  }

  getCategoryDisplayName(category: string): string {
    const names: Record<string, string> = {
      'math': 'Math',
      'logic': 'Logic',
      'control': 'Control Flow',
      'data': 'Data',
      'function': 'Functions',
      'io': 'Input/Output'
    };
    return names[category] || category;
  }

  getNodeTypesForCategory(category: NodeType['category']): NodeType[] {
    const nodeTypes = NodeTypeLibrary.getNodeTypesByCategory(category);
    const searchTermLower = this.searchTerm().toLowerCase();
    
    if (searchTermLower) {
      return nodeTypes.filter(nodeType =>
        nodeType.name.toLowerCase().includes(searchTermLower) ||
        nodeType.description.toLowerCase().includes(searchTermLower)
      );
    }
    
    return nodeTypes;
  }

  onNodeDragStart(event: DragEvent, nodeType: NodeType): void {
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/json', JSON.stringify({
        type: 'node',
        nodeTypeId: nodeType.id
      }));
      event.dataTransfer.effectAllowed = 'copy';
    }
  }

  addNodeToCanvas(nodeType: NodeType): void {
    // Add node at center of canvas view
    const canvasOffset = this.nodeEditor.getCanvasOffset();
    const zoom = this.nodeEditor.getZoom();
    
    // Calculate center position relative to canvas
    const centerX = (-canvasOffset.x + 400) / zoom; // Approximate center
    const centerY = (-canvasOffset.y + 300) / zoom;
    
    // Add some randomness to avoid overlapping nodes
    const randomOffset = {
      x: (Math.random() - 0.5) * 100,
      y: (Math.random() - 0.5) * 100
    };
    
    this.nodeEditor.addNode(nodeType.id, {
      x: centerX + randomOffset.x,
      y: centerY + randomOffset.y
    });
  }
}