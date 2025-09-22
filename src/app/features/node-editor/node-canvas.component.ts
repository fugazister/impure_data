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
    <div class="canvas-container" #canvasContainer>
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
              [attr.transform]="'translate(' + node.position.x + ',' + node.position.y + ')'"
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
                  y="30"
                  [attr.width]="getNodeWidth(node)"
                  [attr.height]="getNodeHeight(node) - 30"
                  fill="transparent"
                  stroke="none"
                  (click)="onNodeBodyClick($event, node)"
                  style="cursor: text;"
                />
              }
              
              <!-- Node title -->
              <text
                class="node-title"
                x="8"
                y="20"
                fill="white"
                font-family="Arial, sans-serif"
                font-size="12"
                font-weight="bold"
                style="pointer-events: none;"
              >
                {{ node.label || getNodeTypeName(node.type) }}
              </text>
              
              <!-- Move handle indicator -->
              <text
                class="move-indicator"
                [attr.x]="getNodeWidth(node) - 20"
                y="20"
                fill="rgba(255,255,255,0.6)"
                font-family="Arial, sans-serif"
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
                  font-family="Arial, sans-serif"
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
                    font-family="Arial, sans-serif"
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
                    font-family="Arial, sans-serif"
                    font-size="10"
                    text-anchor="end"
                  >
                    {{ output.label }}
                  </text>
                </g>
              }
              
              <!-- Inline Code Editor for Function Nodes -->
              @if (node && node.type === 'function' && editingNodeId() === node.id) {
                <foreignObject 
                  x="8" 
                  [attr.y]="35 + safeMax(getPortsLength(node.inputs), getPortsLength(node.outputs)) * 20 + 10"
                  [attr.width]="getNodeWidth(node) - 16" 
                  [attr.height]="120"
                >
                  <textarea
                    #codeEditor
                    class="code-editor"
                    [value]="node.customCode || '// Your function code here\\nreturn arg1;'"
                    (input)="onCodeChange($event, node.id)"
                    (blur)="onEditorBlur($event)"
                    (keydown)="onCodeEditorKeyDown($event)"
                    (click)="$event.stopPropagation()"
                    placeholder="// Your function code here&#10;return arg1;"
                    autofocus
                  ></textarea>
                </foreignObject>
              }
              
              <!-- Function Code Preview (when not editing) -->
              @if (node && node.type === 'function' && editingNodeId() !== node.id && node.customCode) {
                <text
                  x="8"
                  [attr.y]="35 + safeMax(getPortsLength(node.inputs), getPortsLength(node.outputs)) * 20 + 15"
                  fill="#666"
                  font-family="Monaco, Consolas, monospace"
                  font-size="9"
                  style="pointer-events: none; user-select: none;"
                >
                  {{ getCodePreview(node.customCode) }}
                </text>
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
          <div class="context-menu-item" (click)="createFunctionNode()">
            <span class="icon">⚡</span>
            <span class="label">Function Block</span>
          </div>
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
    
    .code-editor {
      width: 100%;
      height: 100%;
      border: 1px solid #4a5568;
      border-radius: 4px;
      background: #1a202c;
      color: #e2e8f0;
      font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
      font-size: 11px;
      padding: 8px;
      resize: none;
      outline: none;
      line-height: 1.4;
    }
    
    .code-editor:focus {
      border-color: #9C27B0;
      box-shadow: 0 0 0 2px rgba(156, 39, 176, 0.2);
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
  
  contextMenu = signal<{
    visible: boolean;
    x: number;
    y: number;
  }>({
    visible: false,
    x: 0,
    y: 0
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

  constructor(private nodeEditor: NodeEditorService) {}

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
        const canvasPos = this.screenToCanvas({
          x: event.clientX - svgRect.left,
          y: event.clientY - svgRect.top
        });
        
        this.nodeEditor.updateNodePosition(nodeId, canvasPos);
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
    this.hideContextMenu(); // Hide any existing menu
    
    const rect = this.canvasSvg.nativeElement.getBoundingClientRect();
    this.contextMenu.set({
      visible: true,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    });
  }

  hideContextMenu() {
    this.contextMenu.set({
      visible: false,
      x: 0,
      y: 0
    });
  }

  createFunctionNode() {
    const menu = this.contextMenu();
    if (!menu.visible) return;

    // Convert screen coordinates to canvas coordinates
    const canvasPosition = this.screenToCanvas({ x: menu.x, y: menu.y });
    
    // Create a new function node using the service
    const functionNode = this.nodeEditor.addNode('function', canvasPosition);
    
    // Update the node with all custom properties at once
    this.nodeEditor.updateNode(functionNode.id, {
      label: 'Custom Function',
      customCode: '// Your function code here\nreturn arg1;',
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

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
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

  // Code editing methods
  startEditing(nodeId: string): void {
    this.editingNodeId.set(nodeId);
    
    // Use requestAnimationFrame to ensure DOM is fully rendered
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const textarea = document.querySelector('.code-editor') as HTMLTextAreaElement;
        if (textarea) {
          textarea.focus();
          // Place cursor at the end
          textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }
      });
    });
  }

  finishEditing(): void {
    this.editingNodeId.set(null);
  }

  onEditorBlur(event: FocusEvent): void {
    // Add a small delay to prevent immediate blur when first focusing
    setTimeout(() => {
      // Only finish editing if the user actually clicked outside
      if (document.activeElement !== event.target) {
        this.finishEditing();
      }
    }, 100);
  }

  onCodeChange(event: Event, nodeId: string): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.nodeEditor.updateNode(nodeId, { customCode: textarea.value });
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

  getCodePreview(code: string): string {
    if (!code) return 'Double-click to edit';
    const firstLine = code.split('\n')[0].trim();
    return firstLine.length > 25 ? firstLine.substring(0, 25) + '...' : firstLine;
  }

  // Node events
  onNodeHeaderMouseDown(event: MouseEvent, node: Node) {
    event.stopPropagation();
    this.nodeEditor.selectNode(node.id);
    this.isDraggingNode.set(true);
    this.draggedNodeId.set(node.id);
    
    const svgRect = this.canvasSvg.nativeElement.getBoundingClientRect();
    this.dragStartPosition.set({
      x: event.clientX - svgRect.left,
      y: event.clientY - svgRect.top
    });
  }

  onNodeBodyClick(event: MouseEvent, node: Node) {
    event.stopPropagation();
    if (node.type === 'function') {
      this.nodeEditor.selectNode(node.id);
      this.startEditing(node.id);
    }
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
    
    // Add extra height for function nodes to accommodate code editor or preview
    if (node.type === 'function') {
      const isEditing = this.editingNodeId() === node.id;
      return baseHeight + (isEditing ? 130 : 25); // 130 for editor, 25 for preview
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