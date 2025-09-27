import { Component, ElementRef, ViewChild, AfterViewInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NodeEditorService } from './node-editor.service';
import { NodeTypeLibrary } from '../node-palette/node-library.service';
import { Node, Connection, Position } from '../../core';
import { SvgInputComponent, SvgButtonComponent } from 'ui-kit';

@Component({
  selector: 'app-node-canvas',
  standalone: true,
  imports: [CommonModule, FormsModule, SvgInputComponent],
  templateUrl: './node-canvas.component.html',
  styleUrl: './node-canvas.component.css'
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
  editingFunctionName = signal<string | null>(null);
  editingArguments = signal<string | null>(null);
  
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

  createTextOutputNode() {
    // Only allow creation in edit mode
    if (!this.nodeEditor.isEditMode()) {
      this.hideContextMenu();
      return;
    }
    
    const menu = this.contextMenu();
    if (!menu.visible) return;

    // Convert screen coordinates to canvas coordinates
    const canvasPosition = this.screenToCanvas({ x: menu.x, y: menu.y });
    
    // Create a new text output node using the service
    const textOutputNode = this.nodeEditor.addNode('output.text', canvasPosition);
    
    // Set a default input value to show something meaningful
    if (textOutputNode.inputs && textOutputNode.inputs.length > 0) {
      this.nodeEditor.updateNode(textOutputNode.id, {
        inputs: [{
          ...textOutputNode.inputs[0],
          value: 'Sample text'
        }]
      });
    }
    
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

  // New function UI methods
  toggleFunctionNameEdit(nodeId: string): void {
    if (this.editingFunctionName() === nodeId) {
      this.editingFunctionName.set(null);
    } else {
      this.editingFunctionName.set(nodeId);
    }
  }

  onFunctionNameEditEnd(): void {
    this.editingFunctionName.set(null);
  }

  toggleArgumentsEdit(nodeId: string): void {
    if (this.editingArguments() === nodeId) {
      this.editingArguments.set(null);
    } else {
      this.editingArguments.set(nodeId);
    }
  }

  closeArgumentsEdit(): void {
    this.editingArguments.set(null);
  }

  onArgumentNameChange(event: Event, nodeId: string, index: number): void {
    const target = event.target as HTMLInputElement;
    const newName = target.value;
    
    const node = this.nodeEditor.nodes().find((n: any) => n.id === nodeId);
    if (!node || !node.inputs) return;

    const updatedInputs = [...node.inputs];
    if (updatedInputs[index]) {
      updatedInputs[index] = { ...updatedInputs[index], label: newName };
      this.nodeEditor.updateNode(nodeId, { inputs: updatedInputs });
    }
  }

  addArgument(nodeId: string): void {
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

  removeArgument(nodeId: string, index: number): void {
    const node = this.nodeEditor.nodes().find((n: any) => n.id === nodeId);
    if (!node || node.type !== 'function') return;

    const currentInputs = node.inputs || [];
    if (currentInputs.length <= 1 || index < 0 || index >= currentInputs.length) return;

    // Remove the input at the specified index
    const updatedInputs = currentInputs.filter((_: any, i: number) => i !== index);
    
    // Remove any connections to the removed port
    const removedPortId = currentInputs[index]?.id;
    if (removedPortId) {
      const connections = this.nodeEditor.connections();
      const connectionsToRemove = connections.filter((conn: any) => 
        conn.targetPortId === removedPortId
      );
      
      connectionsToRemove.forEach((conn: any) => {
        this.nodeEditor.removeConnection(conn.id);
      });
    }

    this.nodeEditor.updateNode(nodeId, {
      inputs: updatedInputs
    });
  }

  /**
   * Get the dynamic height of a function node's header
   * This method can be used both internally and in templates
   */
  getFunctionHeaderHeight(node: any): number {
    if (node.type !== 'function') {
      return 30; // Regular node header height
    }
    
    // Function header components:
    // - Main header area: 40px (inline layout with drag handle + function name + buttons)
    // - Arguments editor (if open): 100px
    let headerHeight = 40; // Updated base function header height for inline layout
    
    if (this.editingArguments() === node.id) {
      headerHeight += 100; // Add arguments editor height
    }
    
    return headerHeight;
  }

  /**
   * Get the Y position where the function body should start relative to the node's coordinate system
   * This is used for positioning the function-body group in the hierarchical structure
   */
  getFunctionBodyY(node: any): number {
    if (node.type !== 'function') {
      // For non-function nodes, use the old calculation
      const baseY = 35 + this.safeMax(this.getPortsLength(node.inputs), this.getPortsLength(node.outputs)) * 20;
      return baseY + 10;
    }
    
    // For function nodes with hierarchical structure:
    // Start after the ports area (ports start at Y=35 and are 20px apart)
    const portsY = 35 + this.safeMax(this.getPortsLength(node.inputs), this.getPortsLength(node.outputs)) * 20;
    
    // Add the dynamic header height (this is independent of ports)
    const headerHeight = this.getFunctionHeaderHeight(node);
    
    // Return position where body should start
    return Math.max(portsY, headerHeight) + 5; // 5px gap
  }

  /**
   * Get the height of the function body area based on editing state
   * This includes padding around the code editor
   */
  getFunctionBodyHeight(node: any): number {
    return this.editingNodeId() === node.id ? 130 : 70;
  }

  /**
   * Get the height of the code editor area based on editing state
   */
  getCodeEditorHeight(node: any): number {
    return this.editingNodeId() === node.id ? 120 : 60;
  }

  /**
   * @deprecated Use getFunctionBodyY() for hierarchical positioning
   * Keep this for backward compatibility with non-hierarchical code
   */
  getCodeEditorY(node: any): number {
    return this.getFunctionBodyY(node);
  }

  // Port styling methods
  getInputPortFill(node: any, input: any): string {
    if (node.type === 'function' && (node.inputs || []).length > 1) {
      return '#666'; // Disabled color for multi-argument functions
    }
    return this.isPortConnected(node.id, input.id, 'input') ? '#007acc' : '#ccc';
  }

  getInputPortStroke(node: any): string {
    if (node.type === 'function' && (node.inputs || []).length > 1) {
      return '#444'; // Disabled stroke for multi-argument functions
    }
    return '#333';
  }

  getInputPortTextColor(node: any): string {
    if (node.type === 'function' && (node.inputs || []).length > 1) {
      return '#888'; // Muted text for multi-argument functions
    }
    return '#333';
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

  updateNodeFunctionName(nodeId: string, functionName: string): void {
    this.nodeEditor.updateNode(nodeId, { functionName });
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
    event.preventDefault(); // Prevent text selection during drag operations
    
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
    event.preventDefault(); // Prevent text selection during drag operations
    
    const dragConn = this.dragConnection();
    if (dragConn && portType === 'input') {
      // Create connection from output to input
      if (dragConn.fromPortType === 'output' && dragConn.fromNodeId !== nodeId) {
        // Check if target node is a function with multiple arguments
        const targetNode = this.nodeEditor.nodes().find((n: any) => n.id === nodeId);
        if (targetNode && targetNode.type === 'function' && (targetNode.inputs || []).length > 1) {
          // Prevent connection to function nodes with multiple arguments
          console.warn('Cannot connect to function nodes with multiple arguments');
          this.dragConnection.set(null);
          return;
        }
        
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
    if (!node) return 240; // Increased minimum width for inline header
    
    if (node.type === 'function') {
      // For function nodes, calculate adaptive width based on header content
      const dragAreaWidth = 120;
      const nameAreaWidth = this.getFunctionNameWidth(node);
      const buttonsWidth = 50;
      const padding = 16; // 8px on each side
      
      const headerContentWidth = dragAreaWidth + nameAreaWidth + buttonsWidth + padding;
      const portsWidth = this.safeMax(this.getPortsLength(node.inputs), this.getPortsLength(node.outputs)) * 80 + 40;
      
      return Math.max(240, headerContentWidth, portsWidth); // 240px minimum (120+120)
    }
    
    return Math.max(120, this.safeMax(this.getPortsLength(node.inputs), this.getPortsLength(node.outputs)) * 80 + 40);
  }

  getFunctionNameWidth(node: Node): number {
    if (!node || node.type !== 'function') return 120;
    
    const functionName = node.functionName || 'Unnamed Function';
    
    // Estimate text width based on character count (rough approximation)
    // Using monospace font, approximately 7 pixels per character
    const estimatedTextWidth = functionName.length * 7 + 8; // +8 for padding
    
    // Ensure minimum width of 120px, but allow expansion for longer names
    const minWidth = 120;
    const maxWidth = 300; // Reasonable maximum to prevent excessive width
    
    return Math.max(minWidth, Math.min(maxWidth, estimatedTextWidth));
  }

  getNodeHeight(node: Node): number {
    if (!node) return 60;
    const baseHeight = 30 + this.safeMax(this.getPortsLength(node.inputs), this.getPortsLength(node.outputs)) * 20 + 10;
    
    // Add extra height for function nodes using dynamic header height calculation
    if (node.type === 'function') {
      const headerHeight = this.getFunctionHeaderHeight(node);
      const codeAreaHeight = this.editingNodeId() === node.id ? 130 : 70;
      const gap = 10; // Gap between header and code area
      
      return baseHeight + headerHeight + codeAreaHeight + gap;
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