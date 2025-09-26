import { ViewContainerRef, ComponentRef, Type } from '@angular/core';
import { NodeFactoryService } from './node-factory.service';
import { FunctionNodeComponent } from './components/function/function-node.component';
import { SimpleNodeComponent } from './components/simple/simple-node.component';
import { BaseNodeComponent } from './components/base/base-node.component';
import { Node } from '../../core/node.model';

describe('NodeFactoryService', () => {
  let service: NodeFactoryService;
  let mockViewContainerRef: jasmine.SpyObj<ViewContainerRef>;
  let mockComponentRef: jasmine.SpyObj<ComponentRef<any>>;

  beforeEach(() => {
    // Create service instance directly
    service = new NodeFactoryService();
    
    // Create mock ViewContainerRef
    mockViewContainerRef = jasmine.createSpyObj('ViewContainerRef', ['createComponent']);
    
    // Create mock ComponentRef
    mockComponentRef = jasmine.createSpyObj('ComponentRef', ['setInput']);
    mockViewContainerRef.createComponent.and.returnValue(mockComponentRef);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createNodeComponent', () => {
    it('should create a component for function nodes', () => {
      const functionNode: Node = {
        id: 'func-1',
        type: 'function',
        position: { x: 0, y: 0 },
        inputs: [{ id: 'in1', label: 'x', type: 'input', dataType: 'number' }],
        outputs: [{ id: 'out1', label: 'result', type: 'output', dataType: 'number' }]
      };

      const result = service.createNodeComponent(functionNode, mockViewContainerRef);

      expect(mockViewContainerRef.createComponent).toHaveBeenCalledTimes(1);
      expect(mockComponentRef.setInput).toHaveBeenCalledWith('node', functionNode);
      expect(result).toBe(mockComponentRef);
    });

    it('should create a component for non-function nodes', () => {
      const simpleNode: Node = {
        id: 'simple-1',
        type: 'trigger.document',
        position: { x: 100, y: 100 },
        inputs: [],
        outputs: [{ id: 'out1', label: 'trigger', type: 'output', dataType: 'trigger' }]
      };

      const result = service.createNodeComponent(simpleNode, mockViewContainerRef);

      expect(mockViewContainerRef.createComponent).toHaveBeenCalledTimes(1);
      expect(mockComponentRef.setInput).toHaveBeenCalledWith('node', simpleNode);
      expect(result).toBe(mockComponentRef);
    });

    it('should set additional inputs when provided', () => {
      const node: Node = {
        id: 'test-1',
        type: 'function',
        position: { x: 0, y: 0 },
        inputs: [],
        outputs: []
      };

      const additionalInputs = {
        isSelected: true,
        isEditing: false,
        canvasTransform: 'scale(1.2)'
      };

      service.createNodeComponent(node, mockViewContainerRef, additionalInputs);

      expect(mockComponentRef.setInput).toHaveBeenCalledWith('node', node);
      expect(mockComponentRef.setInput).toHaveBeenCalledWith('isSelected', true);
      expect(mockComponentRef.setInput).toHaveBeenCalledWith('isEditing', false);
      expect(mockComponentRef.setInput).toHaveBeenCalledWith('canvasTransform', 'scale(1.2)');
    });

    it('should handle nodes with unknown types', () => {
      const unknownNode: Node = {
        id: 'unknown-1',
        type: 'unknown.type',
        position: { x: 0, y: 0 },
        inputs: [],
        outputs: []
      };

      const result = service.createNodeComponent(unknownNode, mockViewContainerRef);

      expect(mockViewContainerRef.createComponent).toHaveBeenCalledTimes(1);
      expect(mockComponentRef.setInput).toHaveBeenCalledWith('node', unknownNode);
      expect(result).toBe(mockComponentRef);
    });
  });

  describe('registerNodeComponent', () => {
    it('should register a new node component type', () => {
      class CustomNodeComponent extends BaseNodeComponent {
        getWidth() { return 200; }
        getHeight() { return 100; }
        getColor() { return '#custom'; }
      }

      service.registerNodeComponent('custom', CustomNodeComponent);

      expect(service.hasComponentForNodeType('custom')).toBe(true);
      expect(service.getRegisteredNodeTypes()).toContain('custom');
    });

    it('should allow overriding existing node component types', () => {
      class AlternativeFunctionComponent extends BaseNodeComponent {
        getWidth() { return 300; }
        getHeight() { return 150; }
        getColor() { return '#alternative'; }
      }

      service.registerNodeComponent('function', AlternativeFunctionComponent);

      expect(service.hasComponentForNodeType('function')).toBe(true);
    });
  });

  describe('getRegisteredNodeTypes', () => {
    it('should return all registered node types', () => {
      const types = service.getRegisteredNodeTypes();
      
      expect(types).toContain('function');
      expect(types.length).toBeGreaterThanOrEqual(1);
    });

    it('should return updated list after registering new types', () => {
      class CustomComponent extends BaseNodeComponent {
        getWidth() { return 100; }
        getHeight() { return 50; }
        getColor() { return '#test'; }
      }

      const initialTypes = service.getRegisteredNodeTypes();
      service.registerNodeComponent('test-type', CustomComponent);
      const updatedTypes = service.getRegisteredNodeTypes();

      expect(updatedTypes.length).toBe(initialTypes.length + 1);
      expect(updatedTypes).toContain('test-type');
    });
  });

  describe('hasComponentForNodeType', () => {
    it('should return true for registered node types', () => {
      expect(service.hasComponentForNodeType('function')).toBe(true);
    });

    it('should return false for unregistered node types', () => {
      expect(service.hasComponentForNodeType('nonexistent')).toBe(false);
    });

    it('should return true after registering a new type', () => {
      class NewComponent extends BaseNodeComponent {
        getWidth() { return 100; }
        getHeight() { return 50; }
        getColor() { return '#new'; }
      }

      expect(service.hasComponentForNodeType('new-type')).toBe(false);
      service.registerNodeComponent('new-type', NewComponent);
      expect(service.hasComponentForNodeType('new-type')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty node type', () => {
      const node: Node = {
        id: 'test-1',
        type: '',
        position: { x: 0, y: 0 },
        inputs: [],
        outputs: []
      };

      const result = service.createNodeComponent(node, mockViewContainerRef);

      expect(mockViewContainerRef.createComponent).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockComponentRef);
    });

    it('should handle case-sensitive node types', () => {
      const node: Node = {
        id: 'test-1',
        type: 'Function', // Capital F - different from 'function'
        position: { x: 0, y: 0 },
        inputs: [],
        outputs: []
      };

      const result = service.createNodeComponent(node, mockViewContainerRef);

      expect(mockViewContainerRef.createComponent).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockComponentRef);
    });
  });

  describe('error handling', () => {
    it('should propagate errors from ViewContainerRef.createComponent', () => {
      const node: Node = {
        id: 'test-1',
        type: 'function',
        position: { x: 0, y: 0 },
        inputs: [],
        outputs: []
      };

      mockViewContainerRef.createComponent.and.throwError('Component creation failed');

      expect(() => {
        service.createNodeComponent(node, mockViewContainerRef);
      }).toThrowError('Component creation failed');
    });

    it('should propagate errors from setInput', () => {
      const node: Node = {
        id: 'test-1',
        type: 'function',
        position: { x: 0, y: 0 },
        inputs: [],
        outputs: []
      };

      mockComponentRef.setInput.and.throwError('Input setting failed');

      expect(() => {
        service.createNodeComponent(node, mockViewContainerRef);
      }).toThrowError('Input setting failed');
    });
  });

  describe('integration scenarios', () => {
    it('should handle multiple sequential component creations', () => {
      const nodes: Node[] = [
        { id: 'func-1', type: 'function', position: { x: 0, y: 0 }, inputs: [], outputs: [] },
        { id: 'trigger-1', type: 'trigger.document', position: { x: 100, y: 0 }, inputs: [], outputs: [] },
        { id: 'dom-1', type: 'dom.querySelector', position: { x: 200, y: 0 }, inputs: [], outputs: [] }
      ];

      nodes.forEach(node => {
        service.createNodeComponent(node, mockViewContainerRef);
      });

      expect(mockViewContainerRef.createComponent).toHaveBeenCalledTimes(3);
    });

    it('should maintain registration state across operations', () => {
      class CustomComponent extends BaseNodeComponent {
        getWidth() { return 100; }
        getHeight() { return 50; }
        getColor() { return '#custom'; }
      }

      // Register and verify
      service.registerNodeComponent('custom', CustomComponent);
      expect(service.hasComponentForNodeType('custom')).toBe(true);

      // Create components and verify registration persists
      const customNode: Node = { id: 'custom-1', type: 'custom', position: { x: 0, y: 0 }, inputs: [], outputs: [] };
      const functionNode: Node = { id: 'func-1', type: 'function', position: { x: 100, y: 0 }, inputs: [], outputs: [] };

      service.createNodeComponent(customNode, mockViewContainerRef);
      service.createNodeComponent(functionNode, mockViewContainerRef);

      expect(mockViewContainerRef.createComponent).toHaveBeenCalledTimes(2);
      expect(service.hasComponentForNodeType('custom')).toBe(true);
      expect(service.hasComponentForNodeType('function')).toBe(true);
    });
  });
});