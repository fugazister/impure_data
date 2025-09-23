import { Component, ElementRef, ViewChild, AfterViewInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodeEditorService } from './node-editor.service';
import { NodeTypeLibrary } from '../node-palette/node-library.service';
import { Node, Connection, Position } from '../../core';

@Component({
  selector: 'app-node-canvas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="canvas-container" #canvasContainer [class.execution-mode]="!nodeEditor.isEditMode()" 
         (keydown)="onKeyDown($event)" tabindex="0">
      <!-- Execution Mode Overlay -->
      @if (!nodeEditor.isEditMode()) {
        <div class="execution-overlay">
          <div class="execution-indicator">
            <span class="execution-icon">⚡</span>
            <span class="execution-text">EXECUTION MODE</span>
            <span class="execution-subtitle">Read-only - editing disabled</span>
          </div>
        </div>
      }
      
      <svg 
        class="canvas-svg"
        #canvasSvg
        [attr.width]="canvasSize().width"
        [attr.height]="canvasSize().height"
        (mousedown)="onCanvasMouseDown($event)"
        (mousemove)="onCanvasMouseMove($event)"
        (mouseup)="onCanvasMouseUp($event)"
        (wheel)="onCanvasWheel($event)"
        (contextmenu)="onCanvasRightClick($event)"
      >
        <!-- Grid background -->
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        <!-- Connections -->
        <g class="connections" [attr.transform]="canvasTransform()">
          @for (connection of connections(); track connection.id) {
            <path
              [attr.d]="getConnectionPath(connection)"
              class="connection-line"
              [class.selected]="selectedConnection() === connection.id"
              (click)="selectConnection(connection.id)"
              stroke="#666"
              stroke-width="2"
              fill="none"
            />
          }
          
          <!-- Temporary connection while dragging -->
          @if (dragConnection()) {
            <path
              [attr.d]="getDragConnectionPath()"
              class="connection-line dragging"
              stroke="#007acc"
              stroke-width="2"
              fill="none"
              stroke-dasharray="5,5"
            />
          }
        </g>
        
        <!-- Nodes -->
        <g class="nodes" [attr.transform]="canvasTransform()">
          @for (node of nodes(); track node.id) {
            <g 
              class="node"
              [class.selected]="selectedNode()?.id === node.id"
              [class.editing]="editingNodeId() === node.id"
              [class.execution-mode]="!nodeEditor.isEditMode()"
              [attr.transform]="'translate(' + node.position.x + ',' + node.position.y + ')'"
              (contextmenu)="onNodeRightClick($event, node)"
            >
              <!-- Node background -->
              <rect
                class="node-background"
                [attr.width]="getNodeWidth(node)"
                [attr.height]="getNodeHeight(node)"
                [attr.fill]="getNodeColor(node)"
                rx="4"
                ry="4"
                stroke="#333"
                stroke-width="1"
              />
              
              <!-- Header area for moving (darker background) -->
              <rect
                class="node-header"
                [attr.width]="getNodeWidth(node)"
                height="30"
                fill="rgba(0,0,0,0.2)"
                rx="4"
                ry="4"
                stroke="none"
                (mousedown)="onNodeHeaderMouseDown($event, node)"
                style="cursor: move;"
              />
              
              <!-- Body area for editing (only for function nodes) -->
              @if (node && node.type === 'function') {
                <rect
                  class="node-body-edit-area"
                  x="0"
                  [attr.y]="35 + safeMax(getPortsLength(node.inputs), getPortsLength(node.outputs)) * 20 + 10"
                  [attr.width]="getNodeWidth(node)"
                  [attr.height]="editingNodeId() === node.id ? 120 : 60"
                  fill="rgba(255, 0, 0, 0.1)"
                  stroke="red"
                  stroke-width="1"
                  stroke-dasharray="2,2"
                  (click)="onNodeBodyClick($event, node)"
                  (mousedown)="onBodyAreaMouseDown($event, node)"
                  style="cursor: text; pointer-events: all;"
                />
              }
              
              <!-- Node title -->
              <text
                class="node-title"
                x="8"
                y="20"
                fill="white"
                font-family="JetBrains Mono, Fira Code, Monaco, Consolas, monospace"
                font-size="12"
                font-weight="bold"
                style="pointer-events: none;"
              >
                {{ getNodeDisplayName(node) }}
              </text>
              
              <!-- Move handle indicator -->
              <text
                class="move-indicator"
                [attr.x]="getNodeWidth(node) - 20"
                y="20"
                fill="rgba(255,255,255,0.6)"
                font-family="JetBrains Mono, Fira Code, Monaco, Consolas, monospace"
                font-size="10"
                style="pointer-events: none; user-select: none;"
              >
                ⋮⋮
              </text>
              
              <!-- Edit hint for function nodes -->
              @if (node && node.type === 'function' && editingNodeId() !== node.id) {
                <text
                  x="8"
                  [attr.y]="getNodeHeight(node) - 5"
                  fill="rgba(156, 39, 176, 0.7)"
                  font-family="JetBrains Mono, Fira Code, Monaco, Consolas, monospace"
                  font-size="8"
                  style="pointer-events: none; user-select: none;"
                >
                  Click body to edit
                </text>
              }
              
              <!-- Input ports -->
              @for (input of (node.inputs || []); track input.id; let i = $index) {
                <g class="port input-port" [attr.transform]="'translate(0,' + (35 + i * 20) + ')'">
                  <circle
                    [attr.cx]="0"
                    [attr.cy]="0"
                    r="4"
                    [attr.fill]="isPortConnected(node.id, input.id, 'input') ? '#007acc' : '#ccc'"
                    stroke="#333"
                    stroke-width="1"
                    (mousedown)="onPortMouseDown($event, node.id, input.id, 'input')"
                    (mouseup)="onPortMouseUp($event, node.id, input.id, 'input')"
                  />
                  <text
                    x="8"
                    y="3"
                    fill="#333"
                    font-family="JetBrains Mono, Fira Code, Monaco, Consolas, monospace"
                    font-size="10"
                  >
                    {{ input.label }}
                  </text>
                </g>
              }
              
              <!-- Output ports -->
              @for (output of (node.outputs || []); track output.id; let i = $index) {
                <g class="port output-port" [attr.transform]="'translate(' + getNodeWidth(node) + ',' + (35 + i * 20) + ')'">
                  <circle
                    [attr.cx]="0"
                    [attr.cy]="0"
                    r="4"
                    [attr.fill]="isPortConnected(node.id, output.id, 'output') ? '#007acc' : '#ccc'"
                    stroke="#333"
                    stroke-width="1"
                    (mousedown)="onPortMouseDown($event, node.id, output.id, 'output')"
                    (mouseup)="onPortMouseUp($event, node.id, output.id, 'output')"
                  />
                  <text
                    [attr.x]="-8"
                    y="3"
                    fill="#333"
                    font-family="JetBrains Mono, Fira Code, Monaco, Consolas, monospace"
                    font-size="10"
                    text-anchor="end"
                  >
                    {{ output.label }}
                  </text>
                </g>
              }
              
              <!-- Code Editor for Function Nodes (always visible) -->
              @if (node && node.type === 'function') {
                <!-- Function Name Input -->
                <foreignObject 
                  x="8" 
                  [attr.y]="35 + safeMax(getPortsLength(node.inputs), getPortsLength(node.outputs)) * 20 + 10"
                  [attr.width]="getNodeWidth(node) - 16" 
                  height="25"
                  style="pointer-events: none;"
                >
                  <input
                    class="function-name-input"
                    [class.editing]="editingNodeId() === node.id"
                    [value]="node.functionName || 'myFunction'"
                    (input)="onFunctionNameChange($event, node.id)"
                    (blur)="onFunctionNameBlur($event)"
                    (keydown)="onFunctionNameKeyDown($event)"
                    (click)="onFunctionNameClick($event, node)"
                    [readonly]="editingNodeId() !== node.id"
                    placeholder="Function name"
                    [style.pointer-events]="editingNodeId() === node.id ? 'all' : 'none'"
                  />
                </foreignObject>
                
                <!-- Function Code Editor -->
                <foreignObject 
                  x="8" 
                  [attr.y]="35 + safeMax(getPortsLength(node.inputs), getPortsLength(node.outputs)) * 20 + 35"
                  [attr.width]="getNodeWidth(node) - 16" 
                  [attr.height]="editingNodeId() === node.id ? 120 : 60"
                  style="pointer-events: none;"
                >
                  <textarea
                    #codeEditor
                    class="code-editor"
                    [class.editing]="editingNodeId() === node.id"
                    [value]="node.customCode || ''"
                    (input)="onCodeChange($event, node.id)"
                    (blur)="onEditorBlur($event)"
                    (keydown)="onCodeEditorKeyDown($event)"
                    (click)="onTextAreaClick($event, node)"
                    [readonly]="editingNodeId() !== node.id"
                    placeholder=""
                    [attr.autofocus]="editingNodeId() === node.id ? true : null"
                    [style.pointer-events]="editingNodeId() === node.id ? 'all' : 'none'"
                  ></textarea>
                </foreignObject>
                
                <!-- Argument Management Controls -->
                @if (editingNodeId() === node.id) {
                  <foreignObject 
                    x="8" 
                    [attr.y]="35 + safeMax(getPortsLength(node.inputs), getPortsLength(node.outputs)) * 20 + 160"
                    [attr.width]="getNodeWidth(node) - 16" 
                    height="30"
                    style="pointer-events: all;"
                  >
                    <div class="argument-controls" style="display: flex; gap: 5px; align-items: center; font-size: 12px;">
                      <span style="color: #888; font-family: monospace;">Args:</span>
                      <button 
                        type="button"
                        (click)="addFunctionArgument(node.id)"
                        style="background: #4CAF50; color: white; border: none; border-radius: 3px; width: 20px; height: 20px; font-size: 12px; cursor: pointer;"
                        title="Add argument"
                      >+</button>
                      <button 
                        type="button"
                        (click)="removeFunctionArgument(node.id)"
                        [disabled]="(node.inputs || []).length <= 1"
                        style="background: #f44336; color: white; border: none; border-radius: 3px; width: 20px; height: 20px; font-size: 12px; cursor: pointer; disabled:opacity: 0.5;"
                        title="Remove argument"
                      >−</button>
                      <span style="color: #888; font-family: monospace;">{{ (node.inputs || []).length }}</span>
                    </div>
                  </foreignObject>
                }
              }
            </g>
          }
        </g>
      </svg>
      
      <!-- Context Menu -->
      @if (contextMenu().visible) {
        <div 
          class="context-menu"
          [style.left.px]="contextMenu().x"
          [style.top.px]="contextMenu().y"
        >
          <!-- Node-specific menu (when right-clicking on a node) -->
          @if (contextMenu().nodeId) {
            <div class="context-menu-item" (click)="deleteNode(contextMenu().nodeId!)">
              <span class="icon">🗑️</span>
              <span class="label">Delete Node</span>
            </div>
          } @else {
            <!-- Canvas menu (when right-clicking on empty canvas) -->
            <div class="context-menu-item" (click)="createFunctionNode()">
              <span class="icon">⚡</span>
              <span class="label">Function Block</span>
            </div>
            <div class="context-menu-divider"></div>
            <div class="context-menu-item" (click)="createTriggerNode('trigger.document')">
              <span class="icon">📄</span>
              <span class="label">Document Trigger</span>
            </div>
            <div class="context-menu-item" (click)="createTriggerNode('trigger.bang')">
              <span class="icon">💥</span>
              <span class="label">Bang Trigger</span>
            </div>
            <div class="context-menu-divider"></div>
            <div class="context-menu-item" (click)="createDOMNode('dom.querySelector')">
              <span class="icon">🔍</span>
              <span class="label">Query Selector</span>
            </div>
            <div class="context-menu-item" (click)="createDOMNode('dom.innerHTML')">
              <span class="icon">📝</span>
              <span class="label">Set innerHTML</span>
            </div>
            <div class="context-menu-item" (click)="createDOMNode('dom.createElement')">
              <span class="icon">➕</span>
              <span class="label">Create Element</span>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .canvas-container {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #fafafa;
      position: relative;
      outline: none; /* Remove focus outline */
    }
    
    .canvas-container:focus {
      outline: none; /* Ensure no visible focus outline */
    }
    
    .canvas-svg {
      cursor: grab;
    }
    
    .canvas-svg:active {
      cursor: grabbing;
    }
    
    .node {
      cursor: default;
    }
    
    .node.selected .node-background {
      stroke: #007acc;
      stroke-width: 2;
    }
    
    .node.editing .node-background {
      stroke: #9C27B0;
      stroke-width: 2;
      stroke-dasharray: 5,5;
    }
    
    .node.editing .node-header {
      fill: rgba(156, 39, 176, 0.3) !important;
    }
    
    .node-background {
      filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.2));
    }
    
    .node-header {
      cursor: move !important;
      transition: all 0.2s ease;
    }
    
    .node-header:hover {
      fill: rgba(0,0,0,0.3) !important;
      stroke: rgba(255, 255, 255, 0.3);
      stroke-width: 1;
    }
    
    .node-body-edit-area {
      cursor: text !important;
      transition: all 0.2s ease;
      fill: rgba(33, 150, 243, 0.05);
    }
    
    .node-body-edit-area:hover {
      fill: rgba(156, 39, 176, 0.15) !important;
      stroke: rgba(156, 39, 176, 0.4);
      stroke-width: 1;
    }
    
    .node-title {
      pointer-events: none;
      user-select: none;
    }
    
    .move-indicator {
      opacity: 0.6;
      transition: opacity 0.2s ease;
    }
    
    .node-group:hover .move-indicator {
      opacity: 1;
    }
    
    .port circle {
      cursor: pointer;
    }
    
    .port circle:hover {
      r: 5;
    }
    
    .connection-line {
      cursor: pointer;
    }
    
    .connection-line:hover {
      stroke-width: 3;
    }
    
    .connection-line.selected {
      stroke: #007acc;
      stroke-width: 3;
    }
    
    .connection-line.dragging {
      pointer-events: none;
    }
    
    .context-menu {
      position: absolute;
      background: #2d3748;
      border: 1px solid #4a5568;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 1000;
      min-width: 180px;
      overflow: hidden;
    }
    
    .context-menu-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      color: #e2e8f0;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s ease;
    }
    
    .context-menu-item:hover {
      background: #4a5568;
    }
    
    .context-menu-item .icon {
      margin-right: 12px;
      font-size: 16px;
    }
    
    .context-menu-item .label {
      font-weight: 500;
    }
    
    .context-menu-divider {
      height: 1px;
      background: #4a5568;
      margin: 8px 0;
    }
    
    .code-editor {
      width: 100%;
      height: 100%;
      border: 1px solid #4a5568;
      border-radius: 4px;
      background: #1a202c;
      color: #e2e8f0;
      font-family: 'JetBrains Mono', 'Fira Code', 'Source Code Pro', 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
      font-size: 11px;
      padding: 8px;
      resize: none;
      outline: none;
      line-height: 1.4;
      min-height: 20px;
      overflow: hidden;
    }
    
    .code-editor.editing {
      height: 100%;
      overflow: auto;
    }
    
    .code-editor[readonly] {
      background: #2d3748;
      border-color: #4a5568;
      cursor: default;
      opacity: 0.9;
    }
    
    .code-editor:focus {
      border-color: #9C27B0;
      box-shadow: 0 0 0 2px rgba(156, 39, 176, 0.2);
    }

    .function-name-input {
      width: 100%;
      height: 20px;
      border: 1px solid #4a5568;
      border-radius: 4px;
      background: #1a202c;
      color: #e2e8f0;
      font-family: 'JetBrains Mono', 'Fira Code', 'Source Code Pro', 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
      font-size: 11px;
      font-weight: bold;
      padding: 2px 6px;
      outline: none;
      margin-bottom: 4px;
    }

    .function-name-input[readonly] {
      background: #2d3748;
      border-color: #4a5568;
      cursor: default;
      opacity: 0.9;
    }

    .function-name-input:focus {
      border-color: #9C27B0;
      box-shadow: 0 0 0 2px rgba(156, 39, 176, 0.2);
    }

    .function-name-input.editing {
      background: #1a202c;
      border-color: #9C27B0;
    }
    
    /* Execution Mode Styles */
    .canvas-container.execution-mode {
      position: relative;
    }
    
    .execution-overlay {
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 500;
      pointer-events: none;
    }
    
    .execution-indicator {
      background: rgba(255, 87, 34, 0.9);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 87, 34, 0.5);
      box-shadow: 0 4px 12px rgba(255, 87, 34, 0.3);
    }
    
    .execution-icon {
      font-size: 16px;
      animation: pulse 2s infinite;
    }
    
    .execution-text {
      font-weight: 600;
      font-size: 12px;
      letter-spacing: 0.5px;
    }
    
    .execution-subtitle {
      font-size: 10px;
      opacity: 0.8;
      margin-left: 8px;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
    
    /* Node styling in execution mode */
    .node.execution-mode .node-background {
      stroke: rgba(255, 87, 34, 0.5);
      stroke-width: 1;
      filter: drop-shadow(0 0 4px rgba(255, 87, 34, 0.2));
    }
    
    .node.execution-mode .node-header {
      cursor: default !important;
      opacity: 0.8;
    }
    
    .node.execution-mode .node-body-edit-area {
      cursor: default !important;
      opacity: 0.8;
    }
    
    .node.execution-mode .move-indicator {
      opacity: 0.3;
    }
    
    /* Disable hover effects in execution mode */
    .canvas-container.execution-mode .node-header:hover {
      fill: inherit !important;
      stroke: none !important;
    }
    
    .canvas-container.execution-mode .node-body-edit-area:hover {
      fill: inherit !important;
      stroke: none !important;
    }
  `]
})
export class NodeCanvasComponent implements AfterViewInit {
  @ViewChild('canvasContainer', { static: true }) canvasContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('canvasSvg', { static: true }) canvasSvg!: ElementRef<SVGElement>;

  canvasSize = signal({ width: 1200, height: 800 });
  
  private isDraggingCanvas = signal(false);
  private isDraggingNode = signal(false);
  private dragStartPosition = signal<Position>({ x: 0, y: 0 });
  private draggedNodeId = signal<string | null>(null);
  private dragNodeOffset = signal<Position>({ x: 0, y: 0 }); // Offset from node's top-left to mouse click point
  
  contextMenu = signal<{
    visible: boolean;
    x: number;
    y: number;
    nodeId?: string; // Add node context
  }>({
    visible: false,
    x: 0,
    y: 0,
    nodeId: undefined
  });
  
  editingNodeId = signal<string | null>(null);
  
  dragConnection = signal<{
    fromNodeId: string;
    fromPortId: string;
    fromPortType: 'input' | 'output';
    currentPosition: Position;
  } | null>(null);
  
  selectedConnection = signal<string | null>(null);

  nodes = computed(() => this.nodeEditor.nodes());
  connections = computed(() => this.nodeEditor.connections());
  selectedNode = computed(() => this.nodeEditor.selectedNode());
  
  canvasTransform = computed(() => {
    const offset = this.nodeEditor.getCanvasOffset();
    const zoom = this.nodeEditor.getZoom();
    return `translate(${offset.x}, ${offset.y}) scale(${zoom})`;
  });

  constructor(public nodeEditor: NodeEditorService) {}

  ngAfterViewInit() {
    this.updateCanvasSize();
    window.addEventListener('resize', () => this.updateCanvasSize());
  }

  private updateCanvasSize() {
    const container = this.canvasContainer.nativeElement;
    this.canvasSize.set({
      width: container.clientWidth,
      height: container.clientHeight
    });
  }

  // Canvas events
  onCanvasMouseDown(event: MouseEvent) {
    // Focus the canvas container to enable keyboard events
    const container = this.canvasContainer.nativeElement;
    container.focus();
    
    this.hideContextMenu(); // Hide context menu on any click
    
    if (event.target === this.canvasSvg.nativeElement || (event.target as Element).classList.contains('grid')) {
      this.isDraggingCanvas.set(true);
      this.dragStartPosition.set({ x: event.clientX, y: event.clientY });
      this.nodeEditor.selectNode(null);
      this.selectedConnection.set(null);
      event.preventDefault();
    }
  }

  onCanvasMouseMove(event: MouseEvent) {
    if (this.isDraggingCanvas()) {
      const startPos = this.dragStartPosition();
      const deltaX = event.clientX - startPos.x;
      const deltaY = event.clientY - startPos.y;
      
      const currentOffset = this.nodeEditor.getCanvasOffset();
      this.nodeEditor.setCanvasOffset({
        x: currentOffset.x + deltaX,
        y: currentOffset.y + deltaY
      });
      
      this.dragStartPosition.set({ x: event.clientX, y: event.clientY });
    } else if (this.isDraggingNode()) {
      const nodeId = this.draggedNodeId();
      if (nodeId) {
        const svgRect = this.canvasSvg.nativeElement.getBoundingClientRect();
        const mouseCanvasPos = this.screenToCanvas({
          x: event.clientX - svgRect.left,
          y: event.clientY - svgRect.top
        });
        
        // Apply the drag offset to get the correct node position
        const dragOffset = this.dragNodeOffset();
        const newNodePosition = {
          x: mouseCanvasPos.x - dragOffset.x,
          y: mouseCanvasPos.y - dragOffset.y
        };
        
        this.nodeEditor.updateNodePosition(nodeId, newNodePosition);
      }
    } else if (this.dragConnection()) {
      const svgRect = this.canvasSvg.nativeElement.getBoundingClientRect();
      const canvasPos = this.screenToCanvas({
        x: event.clientX - svgRect.left,
        y: event.clientY - svgRect.top
      });
      
      const dragConn = this.dragConnection();
      if (dragConn) {
        this.dragConnection.set({
          ...dragConn,
          currentPosition: canvasPos
        });
      }
    }
  }

  onCanvasMouseUp(event: MouseEvent) {
    this.isDraggingCanvas.set(false);
    this.isDraggingNode.set(false);
    this.draggedNodeId.set(null);
    this.dragNodeOffset.set({ x: 0, y: 0 }); // Reset drag offset
    this.dragConnection.set(null);
  }

  onCanvasWheel(event: WheelEvent) {
    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const currentZoom = this.nodeEditor.getZoom();
    this.nodeEditor.setZoom(currentZoom * zoomFactor);
  }

  onCanvasRightClick(event: MouseEvent) {
    event.preventDefault();
    
    // Only show context menu in edit mode
    if (!this.nodeEditor.isEditMode()) {
      return;
    }
    
    this.hideContextMenu(); // Hide any existing menu
    
    const rect = this.canvasSvg.nativeElement.getBoundingClientRect();
    this.contextMenu.set({
      visible: true,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      nodeId: undefined // Canvas context
    });
  }

  onNodeRightClick(event: MouseEvent, node: Node) {
    event.preventDefault();
    event.stopPropagation(); // Prevent canvas right-click
    
    // Only show context menu in edit mode
    if (!this.nodeEditor.isEditMode()) {
      return;
    }
    
    // Select the node
    this.nodeEditor.selectNode(node.id);
    
    this.hideContextMenu(); // Hide any existing menu
    
    const rect = this.canvasSvg.nativeElement.getBoundingClientRect();
    this.contextMenu.set({
      visible: true,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      nodeId: node.id // Node context
    });
  }

  hideContextMenu() {
    this.contextMenu.set({
      visible: false,
      x: 0,
      y: 0,
      nodeId: undefined
    });
  }

  createFunctionNode() {
    // Only allow node creation in edit mode
    if (!this.nodeEditor.isEditMode()) {
      this.hideContextMenu();
      return;
    }
    
    const menu = this.contextMenu();
    if (!menu.visible) return;

    // Convert screen coordinates to canvas coordinates
    const canvasPosition = this.screenToCanvas({ x: menu.x, y: menu.y });
    
    // Create a new function node using the service
    const functionNode = this.nodeEditor.addNode('function', canvasPosition);
    
    // Generate unique function name based on node ID
    const uniqueFunctionName = this.generateUniqueFunctionName(functionNode.id);
    
    // Update the node with all custom properties at once
    this.nodeEditor.updateNode(functionNode.id, {
      label: 'Custom Function',
      functionName: uniqueFunctionName,
      customCode: '',
      inputs: [
        {
          id: this.generateId(),
          type: 'input',
          dataType: 'any',
          label: 'arg1',
          connected: false
        }
      ],
      outputs: [
        {
          id: this.generateId(),
          type: 'output',
          dataType: 'any',
          label: 'result',
          connected: false
        }
      ]
    });

    this.hideContextMenu();
    
    // Automatically start editing the new function node after ensuring DOM update
    setTimeout(() => {
      this.startEditing(functionNode.id);
    }, 20);
  }

  createTriggerNode(triggerType: string) {
    // Only allow node creation in edit mode
    if (!this.nodeEditor.isEditMode()) {
      this.hideContextMenu();
      return;
    }
    
    const menu = this.contextMenu();
    if (!menu.visible) return;

    // Convert screen coordinates to canvas coordinates
    const canvasPosition = this.screenToCanvas({ x: menu.x, y: menu.y });
    
    // Create a new trigger node using the service
    const triggerNode = this.nodeEditor.addNode(triggerType, canvasPosition);
    
    this.hideContextMenu();
  }

  createDOMNode(domType: string) {
    // Only allow node creation in edit mode
    if (!this.nodeEditor.isEditMode()) {
      this.hideContextMenu();
      return;
    }
    
    const menu = this.contextMenu();
    if (!menu.visible) return;

    // Convert screen coordinates to canvas coordinates
    const canvasPosition = this.screenToCanvas({ x: menu.x, y: menu.y });
    
    // Create a new DOM node using the service
    const domNode = this.nodeEditor.addNode(domType, canvasPosition);
    
    this.hideContextMenu();
  }

  deleteNode(nodeId: string) {
    // Only allow deletion in edit mode
    if (!this.nodeEditor.isEditMode()) {
      this.hideContextMenu();
      return;
    }
    
    // Remove the node (this also removes all connections involving this node)
    this.nodeEditor.removeNode(nodeId);
    
    // Clear selection if the deleted node was selected
    if (this.selectedNode()?.id === nodeId) {
      this.nodeEditor.selectNode(null);
    }
    
    // Stop editing if the deleted node was being edited
    if (this.editingNodeId() === nodeId) {
      this.editingNodeId.set(null);
    }
    
    this.hideContextMenu();
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private generateUniqueFunctionName(nodeId: string): string {
    // Create a readable function name from the node ID
    // Remove any non-alphanumeric characters and ensure it starts with a letter
    const cleanId = nodeId.replace(/[^a-zA-Z0-9]/g, '');
    const functionName = cleanId.length > 0 && /^[a-zA-Z]/.test(cleanId) 
      ? `func_${cleanId}` 
      : `func_${this.generateId()}`;
    
    return functionName;
  }

  // Safe helper for template calculations
  public safeMax(a: number, b: number): number {
    if (typeof a !== 'number' || isNaN(a)) a = 0;
    if (typeof b !== 'number' || isNaN(b)) b = 0;
    return Math.max(a, b);
  }

  public getPortsLength(ports: any[]): number {
    return Array.isArray(ports) ? ports.length : 0;
  }

  // Function argument management
  addFunctionArgument(nodeId: string): void {
    const node = this.nodeEditor.nodes().find((n: any) => n.id === nodeId);
    if (!node || node.type !== 'function') return;

    const currentInputs = node.inputs || [];
    const newArgNumber = currentInputs.length + 1;
    
    const newInput = {
      id: this.generateId(),
      type: 'input' as const,
      dataType: 'any' as const,
      label: `arg${newArgNumber}`,
      connected: false
    };

    this.nodeEditor.updateNode(nodeId, {
      inputs: [...currentInputs, newInput]
    });
  }

  removeFunctionArgument(nodeId: string): void {
    const node = this.nodeEditor.nodes().find((n: any) => n.id === nodeId);
    if (!node || node.type !== 'function') return;

    const currentInputs = node.inputs || [];
    if (currentInputs.length <= 1) return; // Keep at least one argument

    // Remove the last input port
    const updatedInputs = currentInputs.slice(0, -1);
    
    this.nodeEditor.updateNode(nodeId, {
      inputs: updatedInputs
    });

    // Also remove any connections to the removed port
    const lastPortId = currentInputs[currentInputs.length - 1]?.id;
    if (lastPortId) {
      const connections = this.nodeEditor.connections();
      const connectionsToRemove = connections.filter((conn: any) => 
        conn.targetPortId === lastPortId
      );
      
      connectionsToRemove.forEach((conn: any) => {
        this.nodeEditor.removeConnection(conn.id);
      });
    }
  }

  // Code editing methods
  startEditing(nodeId: string, focusTarget: 'name' | 'code' = 'code'): void {
    console.log('startEditing called for node:', nodeId);
    
    // Only allow editing in edit mode
    if (!this.nodeEditor.isEditMode()) {
      console.log('Not in edit mode, cannot start editing');
      return;
    }
    
    console.log('Setting editing node ID to:', nodeId);
    this.editingNodeId.set(nodeId);
    
    // Use requestAnimationFrame to ensure DOM is fully rendered
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (focusTarget === 'name') {
          console.log('Looking for function name input to focus...');
          const functionNameInput = document.querySelector('.function-name-input.editing') as HTMLInputElement;
          if (functionNameInput) {
            console.log('Focusing function name input');
            functionNameInput.focus();
            functionNameInput.select(); // Select all text for easy editing
          } else {
            console.log('No function name input found');
          }
        } else {
          console.log('Looking for textarea to focus...');
          
          // Try multiple approaches to find the textarea
          // Approach 1: Find by attribute or data
          let textarea = document.querySelector(`textarea[data-node-id="${nodeId}"]`) as HTMLTextAreaElement;
          
          // Approach 2: Find the editing textarea specifically  
          if (!textarea) {
            textarea = document.querySelector('.code-editor.editing') as HTMLTextAreaElement;
            console.log('Found textarea by .editing class:', !!textarea);
          }
          
          // Approach 3: Find all textareas and match by index
          if (!textarea) {
            const textareas = document.querySelectorAll('.code-editor');
            console.log('Found textareas:', textareas.length);
            
            const nodes = this.nodeEditor.nodes().filter(n => n.type === 'function');
            const nodeIndex = nodes.findIndex(node => node.id === nodeId);
            console.log('Function node index:', nodeIndex, 'for node ID:', nodeId);
            
            if (textareas[nodeIndex]) {
              textarea = textareas[nodeIndex] as HTMLTextAreaElement;
              console.log('Found textarea at index:', nodeIndex);
            }
          }
          
          if (textarea) {
            console.log('Focusing textarea');
            textarea.focus();
            // Place cursor at the end
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
          } else {
            console.log('No textarea found for node:', nodeId);
          }
        }
      });
    });
  }

  finishEditing(): void {
    console.log('finishEditing called, current editing node:', this.editingNodeId());
    this.editingNodeId.set(null);
  }

  onEditorBlur(event: FocusEvent): void {
    console.log('onEditorBlur called, current editing node:', this.editingNodeId());
    
    // Don't process blur if we're not editing anything
    if (!this.editingNodeId()) {
      console.log('No editing node, ignoring blur');
      return;
    }
    
    // Check if focus is moving to another editable element in the same node
    setTimeout(() => {
      const activeElement = document.activeElement;
      const isMovingToFunctionName = activeElement && activeElement.classList.contains('function-name-input');
      
      // If focus moved to function name input in edit mode, don't finish editing
      if (isMovingToFunctionName && this.editingNodeId()) {
        console.log('Focus moved to function name input, staying in edit mode');
        return;
      }
      
      // Double-check we're still editing (might have been cleared by another event)
      if (!this.editingNodeId()) {
        console.log('Editing already finished, ignoring delayed blur');
        return;
      }
      
      console.log('Finishing editing due to blur');
      this.finishEditing();
    }, 150);
  }

  onCodeChange(event: Event, nodeId: string): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.nodeEditor.updateNode(nodeId, { customCode: textarea.value });
  }

  onFunctionNameChange(event: Event, nodeId: string): void {
    const input = event.target as HTMLInputElement;
    this.nodeEditor.updateNode(nodeId, { functionName: input.value });
  }

  onFunctionNameBlur(event: FocusEvent): void {
    console.log('onFunctionNameBlur called, current editing node:', this.editingNodeId());
    
    // Don't process blur if we're not editing anything
    if (!this.editingNodeId()) {
      return;
    }
    
    // Check if focus is moving to another editable element in the same node
    setTimeout(() => {
      const activeElement = document.activeElement;
      const isMovingToCodeEditor = activeElement && activeElement.classList.contains('code-editor');
      
      // If focus moved to code editor in edit mode, don't finish editing
      if (isMovingToCodeEditor && this.editingNodeId()) {
        console.log('Focus moved to code editor, staying in edit mode');
        return;
      }
      
      // Double-check we're still editing
      if (!this.editingNodeId()) {
        return;
      }
      
      console.log('Finishing editing due to function name blur');
      this.finishEditing();
    }, 150);
  }

  onFunctionNameKeyDown(event: KeyboardEvent): void {
    // Handle Escape to finish editing
    if (event.key === 'Escape') {
      this.finishEditing();
      event.preventDefault();
    }
    // Handle Enter to move to code editor
    else if (event.key === 'Enter') {
      event.preventDefault();
      // Find the code editor and focus it
      setTimeout(() => {
        const codeEditor = document.querySelector('.code-editor.editing') as HTMLTextAreaElement;
        if (codeEditor) {
          codeEditor.focus();
        }
      }, 50);
    }
  }

  onFunctionNameClick(event: MouseEvent, node: Node): void {
    event.stopPropagation(); // Always stop propagation for input clicks
    
    const target = event.target as HTMLInputElement;
    
    // If input is readonly (not editing), start editing with focus on name
    if (target && target.readOnly && this.editingNodeId() !== node.id) {
      // Only allow editing in edit mode
      if (!this.nodeEditor.isEditMode()) {
        return;
      }
      
      // Select the node and start editing with focus on function name
      this.nodeEditor.selectNode(node.id);
      
      // Finish editing other nodes first
      if (this.editingNodeId() && this.editingNodeId() !== node.id) {
        this.finishEditing();
      }
      
      // Start editing this node with focus on name input
      setTimeout(() => {
        this.startEditing(node.id, 'name');
      }, 50);
    }
    // If we're already editing this node but clicked on name input, just focus it
    else if (this.editingNodeId() === node.id && target && !target.readOnly) {
      // Input is already editable, just ensure it has focus
      setTimeout(() => {
        if (target.focus && typeof target.focus === 'function') {
          target.focus();
        }
        if (target.select && typeof target.select === 'function') {
          target.select();
        }
      }, 10);
    }
  }

  onCodeEditorKeyDown(event: KeyboardEvent): void {
    // Handle Escape to finish editing
    if (event.key === 'Escape') {
      this.finishEditing();
      event.preventDefault();
    }
    // Handle Tab for indentation
    else if (event.key === 'Tab') {
      event.preventDefault();
      const textarea = event.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      // Insert tab character
      textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
      
      // Move cursor
      textarea.selectionStart = textarea.selectionEnd = start + 2;
      
      // Trigger change event
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    // Only handle key events in edit mode
    if (!this.nodeEditor.isEditMode()) {
      return;
    }

    // Handle Delete and Backspace for selected nodes
    if ((event.key === 'Delete' || event.key === 'Backspace')) {
      const selectedNode = this.selectedNode();
      if (selectedNode && !this.editingNodeId()) { // Don't delete if editing code
        event.preventDefault();
        this.deleteNode(selectedNode.id);
      }
    }

    // Handle Escape to clear selection and hide context menu
    if (event.key === 'Escape') {
      this.nodeEditor.selectNode(null);
      this.hideContextMenu();
      this.finishEditing();
      event.preventDefault();
    }
  }

  getCodePreview(code: string): string {
    if (!code) return 'Double-click to edit';
    const firstLine = code.split('\n')[0].trim();
    return firstLine.length > 25 ? firstLine.substring(0, 25) + '...' : firstLine;
  }

  // Node events
  onNodeHeaderMouseDown(event: MouseEvent, node: Node) {
    event.stopPropagation();
    
    // Only allow moving nodes in edit mode
    if (!this.nodeEditor.isEditMode()) {
      return;
    }
    
    this.nodeEditor.selectNode(node.id);
    this.isDraggingNode.set(true);
    this.draggedNodeId.set(node.id);
    
    const svgRect = this.canvasSvg.nativeElement.getBoundingClientRect();
    const mouseCanvasPos = this.screenToCanvas({
      x: event.clientX - svgRect.left,
      y: event.clientY - svgRect.top
    });
    
    // Calculate offset from node's top-left corner to mouse position
    this.dragNodeOffset.set({
      x: mouseCanvasPos.x - node.position.x,
      y: mouseCanvasPos.y - node.position.y
    });
    
    this.dragStartPosition.set({
      x: event.clientX - svgRect.left,
      y: event.clientY - svgRect.top
    });
  }

  onNodeBodyClick(event: MouseEvent, node: Node) {
    console.log('onNodeBodyClick called for node:', node.id, 'type:', node.type);
    console.log('Current editing node:', this.editingNodeId());
    console.log('Is edit mode:', this.nodeEditor.isEditMode());
    
    event.stopPropagation();
    
    // Only allow editing in edit mode
    if (!this.nodeEditor.isEditMode()) {
      console.log('Not in edit mode, exiting');
      return;
    }
    
    if (node.type === 'function') {
      console.log('Function node clicked, starting edit process');
      // Always start editing when clicking on function body, regardless of selection state
      this.nodeEditor.selectNode(node.id);
      
      // If already editing this node, don't restart
      if (this.editingNodeId() === node.id) {
        console.log('Already editing this node, skipping');
        return;
      }
      
      // Finish editing other nodes first
      if (this.editingNodeId() && this.editingNodeId() !== node.id) {
        console.log('Finishing editing other node:', this.editingNodeId());
        this.finishEditing();
      }
      
      // Start editing this node
      console.log('Starting to edit node:', node.id);
      setTimeout(() => {
        this.startEditing(node.id);
      }, 50);
    }
  }

  onTextAreaClick(event: MouseEvent, node: Node) {
    console.log('onTextAreaClick called for node:', node.id);
    console.log('Textarea readonly:', (event.target as HTMLTextAreaElement).readOnly);
    console.log('Current editing node:', this.editingNodeId());
    
    // If textarea is readonly (not editing), start editing
    if ((event.target as HTMLTextAreaElement).readOnly && this.editingNodeId() !== node.id) {
      console.log('Readonly textarea clicked, starting edit mode');
      event.stopPropagation();
      this.onNodeBodyClick(event, node);
    } else {
      console.log('Textarea is already editable or editing this node');
      event.stopPropagation(); // Always stop propagation for textarea clicks
    }
  }

  onBodyAreaMouseDown(event: MouseEvent, node: Node) {
    console.log('onBodyAreaMouseDown called for node:', node.id);
    console.log('Mouse event:', event.type, 'at', event.clientX, event.clientY);
    // Don't prevent default here, let the click event fire normally
  }

  // Legacy method - keeping for compatibility with ports
  onNodeMouseDown(event: MouseEvent, node: Node) {
    // This will be used for ports and other node interactions
    event.stopPropagation();
    this.nodeEditor.selectNode(node.id);
  }

  // Port events
  onPortMouseDown(event: MouseEvent, nodeId: string, portId: string, portType: 'input' | 'output') {
    event.stopPropagation();
    
    if (portType === 'output') {
      const svgRect = this.canvasSvg.nativeElement.getBoundingClientRect();
      const canvasPos = this.screenToCanvas({
        x: event.clientX - svgRect.left,
        y: event.clientY - svgRect.top
      });
      
      this.dragConnection.set({
        fromNodeId: nodeId,
        fromPortId: portId,
        fromPortType: portType,
        currentPosition: canvasPos
      });
    }
  }

  onPortMouseUp(event: MouseEvent, nodeId: string, portId: string, portType: 'input' | 'output') {
    event.stopPropagation();
    
    const dragConn = this.dragConnection();
    if (dragConn && portType === 'input') {
      // Create connection from output to input
      if (dragConn.fromPortType === 'output' && dragConn.fromNodeId !== nodeId) {
        this.nodeEditor.addConnection(
          dragConn.fromNodeId,
          dragConn.fromPortId,
          nodeId,
          portId
        );
      }
    }
    
    this.dragConnection.set(null);
  }

  // Connection events
  selectConnection(connectionId: string) {
    this.selectedConnection.set(connectionId);
  }

  // Utility methods
  private screenToCanvas(screenPos: Position): Position {
    const offset = this.nodeEditor.getCanvasOffset();
    const zoom = this.nodeEditor.getZoom();
    
    return {
      x: (screenPos.x - offset.x) / zoom,
      y: (screenPos.y - offset.y) / zoom
    };
  }

  getNodeWidth(node: Node): number {
    if (!node) return 120;
    return Math.max(120, this.safeMax(this.getPortsLength(node.inputs), this.getPortsLength(node.outputs)) * 80 + 40);
  }

  getNodeHeight(node: Node): number {
    if (!node) return 60;
    const baseHeight = 30 + this.safeMax(this.getPortsLength(node.inputs), this.getPortsLength(node.outputs)) * 20 + 10;
    
    // Add extra height for function nodes to accommodate function name input and code editor
    if (node.type === 'function') {
      const isEditing = this.editingNodeId() === node.id;
      return baseHeight + (isEditing ? 155 : 95); // 155 for editing (25 for name + 130 for code), 95 for read-only (25 for name + 70 for code)
    }
    
    return baseHeight;
  }

  getNodeColor(node: Node): string {
    const nodeType = NodeTypeLibrary.getNodeType(node.type);
    return nodeType?.color || '#666';
  }

  getNodeTypeName(typeId: string): string {
    const nodeType = NodeTypeLibrary.getNodeType(typeId);
    return nodeType?.name || 'Unknown';
  }

  getNodeDisplayName(node: Node): string {
    // For function nodes, use the custom function name if available
    if (node.type === 'function' && node.functionName) {
      return node.functionName;
    }
    // Fall back to label or type name
    return node.label || this.getNodeTypeName(node.type);
  }

  isPortConnected(nodeId: string, portId: string, type: 'input' | 'output'): boolean {
    return this.nodeEditor.isPortConnected(nodeId, portId, type);
  }

  getConnectionPath(connection: Connection): string {
    const fromNode = this.nodes().find(n => n.id === connection.fromNodeId);
    const toNode = this.nodes().find(n => n.id === connection.toNodeId);
    
    if (!fromNode || !toNode) return '';

    const fromPort = fromNode.outputs.find(p => p.id === connection.fromPortId);
    const toPort = toNode.inputs.find(p => p.id === connection.toPortId);
    
    if (!fromPort || !toPort) return '';

    const fromPortIndex = fromNode.outputs.indexOf(fromPort);
    const toPortIndex = toNode.inputs.indexOf(toPort);

    const startX = fromNode.position.x + this.getNodeWidth(fromNode);
    const startY = fromNode.position.y + 35 + fromPortIndex * 20;
    const endX = toNode.position.x;
    const endY = toNode.position.y + 35 + toPortIndex * 20;

    return this.createBezierPath(
      { x: startX, y: startY },
      { x: endX, y: endY }
    );
  }

  getDragConnectionPath(): string {
    const dragConn = this.dragConnection();
    if (!dragConn) return '';

    const fromNode = this.nodes().find(n => n.id === dragConn.fromNodeId);
    if (!fromNode) return '';

    const fromPort = fromNode.outputs.find(p => p.id === dragConn.fromPortId);
    if (!fromPort) return '';

    const fromPortIndex = fromNode.outputs.indexOf(fromPort);
    const startX = fromNode.position.x + this.getNodeWidth(fromNode);
    const startY = fromNode.position.y + 35 + fromPortIndex * 20;

    return this.createBezierPath(
      { x: startX, y: startY },
      dragConn.currentPosition
    );
  }

  private createBezierPath(start: Position, end: Position): string {
    const controlOffset = Math.abs(end.x - start.x) / 2;
    const cp1x = start.x + controlOffset;
    const cp1y = start.y;
    const cp2x = end.x - controlOffset;
    const cp2y = end.y;

    return `M ${start.x} ${start.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${end.x} ${end.y}`;
  }
}