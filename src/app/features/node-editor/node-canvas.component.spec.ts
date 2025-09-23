import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement, signal } from '@angular/core';

import { NodeCanvasComponent } from './node-canvas.component';
import { NodeEditorService } from './node-editor.service';
import { Node, Position } from '../../core';

describe('NodeCanvasComponent', () => {
  let component: NodeCanvasComponent;
  let fixture: ComponentFixture<NodeCanvasComponent>;
  let nodeEditorService: jasmine.SpyObj<NodeEditorService>;
  let mockNode: Node;

  beforeEach(async () => {
    // Create mock signals
    const mockNodes = signal<Node[]>([]);
    const mockConnections = signal<any[]>([]);
    const mockSelectedNode = signal<Node | null>(null);
    const mockIsEditMode = signal<boolean>(true);

    // Create a spy object for NodeEditorService
    const nodeEditorSpy = jasmine.createSpyObj('NodeEditorService', [
      'addNode',
      'updateNode',
      'removeNode',
      'selectNode',
      'updateNodePosition',
      'addConnection',
      'isPortConnected',
      'getCanvasOffset',
      'getZoom',
      'setCanvasOffset',
      'setZoom'
    ]);

    // Add signal properties
    (nodeEditorSpy as any).nodes = mockNodes;
    (nodeEditorSpy as any).connections = mockConnections;
    (nodeEditorSpy as any).selectedNode = mockSelectedNode;
    (nodeEditorSpy as any).isEditMode = mockIsEditMode;

    // Setup default return values for methods
    nodeEditorSpy.getCanvasOffset.and.returnValue({ x: 0, y: 0 });
    nodeEditorSpy.getZoom.and.returnValue(1);
    nodeEditorSpy.isPortConnected.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [NodeCanvasComponent],
      providers: [
        { provide: NodeEditorService, useValue: nodeEditorSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NodeCanvasComponent);
    component = fixture.componentInstance;
    nodeEditorService = TestBed.inject(NodeEditorService) as jasmine.SpyObj<NodeEditorService>;

    // Create a mock function node
    mockNode = {
      id: 'test-node-1',
      type: 'function',
      label: 'Test Function',
      position: { x: 100, y: 100 },
      customCode: 'return arg1 * 2;',
      inputs: [{
        id: 'input-1',
        type: 'input',
        dataType: 'number',
        label: 'arg1',
        connected: false
      }],
      outputs: [{
        id: 'output-1',
        type: 'output',
        dataType: 'number',
        label: 'result',
        connected: false
      }]
    };

    fixture.detectChanges();


  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Edit Mode Functionality', () => {
    beforeEach(() => {
      // Setup node editor signals to return our mock node
      (nodeEditorService as any).nodes.set([mockNode]);
      fixture.detectChanges();
    });

    it('should start editing when clicking on function node body', async () => {
      // Arrange
      const nodeBodyArea = fixture.debugElement.query(By.css('.node-body-edit-area'));
      expect(nodeBodyArea).toBeTruthy();

      // Act
      nodeBodyArea.nativeElement.click();
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for setTimeout in onNodeBodyClick

      // Assert
      expect(component.editingNodeId()).toBe(mockNode.id);
      expect(nodeEditorService.selectNode).toHaveBeenCalledWith(mockNode.id);
    });

    it('should focus textarea when starting edit mode', async () => {
      // Arrange
      spyOn(document, 'querySelector').and.callThrough();
      
      // Act
      component.startEditing(mockNode.id);
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); // Wait for requestAnimationFrames

      // Assert
      expect(component.editingNodeId()).toBe(mockNode.id);
      expect(document.querySelector).toHaveBeenCalledWith('.code-editor.editing');
    });

    it('should finish editing on blur event', async () => {
      // Arrange
      component.editingNodeId.set(mockNode.id);

      
      const textarea = fixture.debugElement.query(By.css('.code-editor'));
      expect(textarea).toBeTruthy();

      // Act
      const blurEvent = new FocusEvent('blur');
      component.onEditorBlur(blurEvent);
      await new Promise(resolve => setTimeout(resolve, 200)); // Wait for setTimeout delay

      // Assert
      expect(component.editingNodeId()).toBe(null);
    });

    it('should re-enter edit mode when clicking back on function body after blur', async () => {
      // This is the main test case for the reported issue
      
      // Step 1: Start editing
      const nodeBodyArea = fixture.debugElement.query(By.css('.node-body-edit-area'));
      nodeBodyArea.nativeElement.click();
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(component.editingNodeId()).toBe(mockNode.id);

      // Step 2: Simulate blur (clicking outside)
      const blurEvent = new FocusEvent('blur');
      component.onEditorBlur(blurEvent);
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(component.editingNodeId()).toBe(null);

      // Step 3: Click back on function body
 // Update DOM after editing state change
      const nodeBodyAreaAfterBlur = fixture.debugElement.query(By.css('.node-body-edit-area'));
      nodeBodyAreaAfterBlur.nativeElement.click();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert: Should be editing again
      expect(component.editingNodeId()).toBe(mockNode.id);
      expect(nodeEditorService.selectNode).toHaveBeenCalledTimes(2); // Once for each click
    });

    it('should not start editing when not in edit mode', () => {
      // Arrange
      nodeEditorService.isEditMode.and.returnValue(false);
      
      // Act
      const nodeBodyArea = fixture.debugElement.query(By.css('.node-body-edit-area'));
      nodeBodyArea.nativeElement.click();

      // Assert
      expect(component.editingNodeId()).toBe(null);
      expect(nodeEditorService.selectNode).not.toHaveBeenCalled();
    });

    it('should finish editing when pressing Escape', () => {
      // Arrange
      component.editingNodeId.set(mockNode.id);

      // Act
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(escapeEvent, 'preventDefault');
      component.onCodeEditorKeyDown(escapeEvent);

      // Assert
      expect(component.editingNodeId()).toBe(null);
      expect(escapeEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Node Creation', () => {
    it('should create function node at context menu position', () => {
      // Arrange
      const menuPosition = { x: 200, y: 150 };
      component.contextMenu.set({
        visible: true,
        x: menuPosition.x,
        y: menuPosition.y
      });
      
      const mockCreatedNode = { ...mockNode, id: 'new-node' };
      nodeEditorService.addNode.and.returnValue(mockCreatedNode);

      // Act
      component.createFunctionNode();

      // Assert
      expect(nodeEditorService.addNode).toHaveBeenCalledWith('function', jasmine.any(Object));
      expect(nodeEditorService.updateNode).toHaveBeenCalledWith(mockCreatedNode.id, jasmine.objectContaining({
        label: 'Custom Function',
        customCode: '',
        inputs: jasmine.any(Array),
        outputs: jasmine.any(Array)
      }));
    });
  });

  describe('Node Deletion', () => {
    it('should delete node and clear selection', () => {
      // Arrange
      nodeEditorService.selectedNode.and.returnValue(mockNode);
      component.editingNodeId.set(mockNode.id);

      // Act
      component.deleteNode(mockNode.id);

      // Assert
      expect(nodeEditorService.removeNode).toHaveBeenCalledWith(mockNode.id);
      expect(nodeEditorService.selectNode).toHaveBeenCalledWith(null);
      expect(component.editingNodeId()).toBe(null);
    });

    it('should delete selected node on Delete key press', () => {
      // Arrange
      nodeEditorService.selectedNode.and.returnValue(mockNode);
      spyOn(component, 'deleteNode');

      // Act
      const deleteEvent = new KeyboardEvent('keydown', { key: 'Delete' });
      spyOn(deleteEvent, 'preventDefault');
      component.onKeyDown(deleteEvent);

      // Assert
      expect(component.deleteNode).toHaveBeenCalledWith(mockNode.id);
      expect(deleteEvent.preventDefault).toHaveBeenCalled();
    });

    it('should not delete node when editing code', () => {
      // Arrange
      nodeEditorService.selectedNode.and.returnValue(mockNode);
      component.editingNodeId.set(mockNode.id);
      spyOn(component, 'deleteNode');

      // Act
      const deleteEvent = new KeyboardEvent('keydown', { key: 'Delete' });
      component.onKeyDown(deleteEvent);

      // Assert
      expect(component.deleteNode).not.toHaveBeenCalled();
    });
  });

  describe('Context Menu', () => {
    it('should show context menu on right click', () => {
      // Arrange
      const canvasSvg = fixture.debugElement.query(By.css('.canvas-svg'));
      
      // Act
      const rightClickEvent = new MouseEvent('contextmenu', {
        clientX: 150,
        clientY: 200
      });
      spyOn(rightClickEvent, 'preventDefault');
      canvasSvg.nativeElement.dispatchEvent(rightClickEvent);
      
      // Assert
      expect(rightClickEvent.preventDefault).toHaveBeenCalled();
      expect(component.contextMenu().visible).toBe(true);
    });

    it('should hide context menu on canvas click', () => {
      // Arrange
      component.contextMenu.set({ visible: true, x: 100, y: 100 });

      // Act
      const clickEvent = new MouseEvent('mousedown');
      Object.defineProperty(clickEvent, 'target', { value: fixture.debugElement.query(By.css('.canvas-svg')).nativeElement });
      component.onCanvasMouseDown(clickEvent);

      // Assert
      expect(component.contextMenu().visible).toBe(false);
    });
  });

  describe('Canvas Navigation', () => {
    it('should pan canvas on drag', () => {
      // Arrange
      const canvasSvg = fixture.debugElement.query(By.css('.canvas-svg'));
      const startPosition = { x: 100, y: 100 };
      const endPosition = { x: 150, y: 120 };

      // Act - Start drag
      const mouseDownEvent = new MouseEvent('mousedown', {
        clientX: startPosition.x,
        clientY: startPosition.y
      });
      Object.defineProperty(mouseDownEvent, 'target', { value: canvasSvg.nativeElement });
      component.onCanvasMouseDown(mouseDownEvent);

      // Act - Move
      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: endPosition.x,
        clientY: endPosition.y
      });
      component.onCanvasMouseMove(mouseMoveEvent);

      // Assert
      expect(nodeEditorService.setCanvasOffset).toHaveBeenCalledWith({
        x: endPosition.x - startPosition.x,
        y: endPosition.y - startPosition.y
      });
    });

    it('should zoom on wheel event', () => {
      // Arrange
      const wheelEvent = new WheelEvent('wheel', { deltaY: -100 });
      spyOn(wheelEvent, 'preventDefault');

      // Act
      component.onCanvasWheel(wheelEvent);

      // Assert
      expect(wheelEvent.preventDefault).toHaveBeenCalled();
      expect(nodeEditorService.setZoom).toHaveBeenCalledWith(1.1); // zoom in
    });
  });

  describe('Code Editor', () => {
    it('should update node code on input change', () => {
      // Arrange
      const newCode = 'return arg1 + 1;';
      const inputEvent = {
        target: { value: newCode }
      } as any;

      // Act
      component.onCodeChange(inputEvent, mockNode.id);

      // Assert
      expect(nodeEditorService.updateNode).toHaveBeenCalledWith(mockNode.id, {
        customCode: newCode
      });
    });

    it('should handle Tab key for indentation', () => {
      // Arrange
      const textarea = document.createElement('textarea');
      textarea.value = 'function test() {\nreturn 1;\n}';
      textarea.selectionStart = 18; // Position after '{'
      textarea.selectionEnd = 18;
      
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      spyOn(tabEvent, 'preventDefault');
      spyOn(textarea, 'dispatchEvent');
      
      Object.defineProperty(tabEvent, 'target', { value: textarea });

      // Act
      component.onCodeEditorKeyDown(tabEvent);

      // Assert
      expect(tabEvent.preventDefault).toHaveBeenCalled();
      expect(textarea.value).toContain('  '); // Should contain indentation
      expect(textarea.dispatchEvent).toHaveBeenCalled();
    });
  });

  describe('Execution Mode', () => {
    it('should not allow editing in execution mode', () => {
      // Arrange
      nodeEditorService.isEditMode.and.returnValue(false);


      // Act
      component.startEditing(mockNode.id);

      // Assert
      expect(component.editingNodeId()).toBe(null);
    });

    it('should not show context menu in execution mode', () => {
      // Arrange
      nodeEditorService.isEditMode.and.returnValue(false);
      
      // Act
      const rightClickEvent = new MouseEvent('contextmenu');
      spyOn(rightClickEvent, 'preventDefault');
      component.onCanvasRightClick(rightClickEvent);

      // Assert
      expect(component.contextMenu().visible).toBe(false);
    });
  });
});