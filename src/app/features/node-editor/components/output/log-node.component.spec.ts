import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { LogNodeComponent } from './log-node.component';
import { Node } from '../../../../core/node.model';
import { NodeTypeLibrary } from '../../../node-palette/node-library.service';

describe('LogNodeComponent', () => {
  let component: LogNodeComponent;
  let fixture: ComponentFixture<LogNodeComponent>;
  let mockNode: Node;

  beforeEach(async () => {
    // Initialize node types to ensure io.console is available
    NodeTypeLibrary.initialize();

    mockNode = {
      id: 'log-node-1',
      type: 'io.console',
      position: { x: 100, y: 100 },
      inputs: [
        { id: 'input-1', type: 'input', dataType: 'any', label: 'value', value: 'test input' }
      ],
      outputs: []
    };

    await TestBed.configureTestingModule({
      imports: [LogNodeComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(LogNodeComponent);
    component = fixture.componentInstance;
    component.node = mockNode;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Properties', () => {
    it('should calculate correct width based on content', () => {
      component.node = mockNode;
      const width = component.getWidth();
      expect(width).toBeGreaterThan(160); // Base minimum width
    });

    it('should calculate correct height for log node', () => {
      component.node = mockNode;
      const height = component.getHeight();
      expect(height).toBeGreaterThan(60); // Base height for header + output display
    });

    it('should return correct color from node library', () => {
      component.node = mockNode;
      const color = component.getColor();
      expect(color).toBe('#795548'); // Brown color for io.console from library
    });

    it('should return correct display name', () => {
      component.node = mockNode;
      const name = component.getDisplayName();
      expect(name).toBe('Console Log');
    });
  });

  describe('Input/Output Handling', () => {
    it('should get input value from node inputs', () => {
      component.node = mockNode;
      const inputValue = component.getInputValue();
      expect(inputValue).toBe('test input');
    });

    it('should return "no input" when no input value is set', () => {
      const nodeWithoutValue = {
        ...mockNode,
        inputs: [{ id: 'input-1', type: 'input' as const, dataType: 'any' as const, label: 'value', connected: false }]
      };
      component.node = nodeWithoutValue;
      const inputValue = component.getInputValue();
      expect(inputValue).toBe('no input');
    });

    it('should return "no input" when no inputs exist', () => {
      const nodeWithoutInputs = { ...mockNode, inputs: [] };
      component.node = nodeWithoutInputs;
      const inputValue = component.getInputValue();
      expect(inputValue).toBe('no input');
    });

    it('should return "connected value" when input is connected but no value is available', () => {
      const nodeWithConnectedInput = {
        ...mockNode,
        inputs: [{ id: 'input-1', type: 'input' as const, dataType: 'any' as const, label: 'value', connected: true }]
      };
      component.node = nodeWithConnectedInput;
      const inputValue = component.getInputValue();
      expect(inputValue).toBe('connected value');
    });

    it('should generate correct output display value', () => {
      component.node = mockNode;
      const outputValue = component.getOutputValue();
      expect(outputValue).toBe('console.log(test input)');
    });

    it('should display "console.log()" when no input is available', () => {
      const nodeWithoutValue = {
        ...mockNode,
        inputs: [{ id: 'input-1', type: 'input' as const, dataType: 'any' as const, label: 'value', connected: false }]
      };
      component.node = nodeWithoutValue;
      const outputValue = component.getOutputValue();
      expect(outputValue).toBe('console.log()');
    });

    it('should display "console.log(...)" when input is connected', () => {
      const nodeWithConnectedInput = {
        ...mockNode,
        inputs: [{ id: 'input-1', type: 'input' as const, dataType: 'any' as const, label: 'value', connected: true }]
      };
      component.node = nodeWithConnectedInput;
      const outputValue = component.getOutputValue();
      expect(outputValue).toBe('console.log(...)');
    });
  });

  describe('Execute Functionality', () => {
    it('should execute console.log with input value', () => {
      spyOn(console, 'log');
      component.node = mockNode;
      
      component.executeOutput();
      
      expect(console.log).toHaveBeenCalledWith('Node Output:', 'test input');
    });

    it('should handle execute click event', () => {
      spyOn(component, 'executeOutput');
      const mockEvent = new MouseEvent('click');
      spyOn(mockEvent, 'preventDefault');
      spyOn(mockEvent, 'stopPropagation');
      
      component.onExecuteClick(mockEvent);
      
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(component.executeOutput).toHaveBeenCalled();
    });
  });

  describe('Event Handlers', () => {
    it('should handle header mouse down', () => {
      spyOn(component, 'onNodeHeaderMouseDown');
      const mockEvent = new MouseEvent('mousedown');
      
      component.onHeaderMouseDown(mockEvent);
      
      expect(component.onNodeHeaderMouseDown).toHaveBeenCalledWith(mockEvent);
    });

    it('should handle node right click', () => {
      const mockEvent = new MouseEvent('contextmenu');
      spyOn(mockEvent, 'preventDefault');
      spyOn(mockEvent, 'stopPropagation');
      
      component.onNodeRightClick(mockEvent);
      
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('Different Input Types', () => {
    it('should handle string input values', () => {
      const nodeWithString = {
        ...mockNode,
        inputs: [{ id: 'input-1', type: 'input' as const, dataType: 'string' as const, label: 'value', value: 'Hello World' }]
      };
      component.node = nodeWithString;
      
      expect(component.getInputValue()).toBe('Hello World');
      expect(component.getOutputValue()).toBe('console.log(Hello World)');
    });

    it('should handle number input values', () => {
      const nodeWithNumber = {
        ...mockNode,
        inputs: [{ id: 'input-1', type: 'input' as const, dataType: 'number' as const, label: 'value', value: 42 }]
      };
      component.node = nodeWithNumber;
      
      expect(component.getInputValue()).toBe('42');
      expect(component.getOutputValue()).toBe('console.log(42)');
    });

    it('should handle boolean input values', () => {
      const nodeWithBoolean = {
        ...mockNode,
        inputs: [{ id: 'input-1', type: 'input' as const, dataType: 'boolean' as const, label: 'value', value: true }]
      };
      component.node = nodeWithBoolean;
      
      expect(component.getInputValue()).toBe('true');
      expect(component.getOutputValue()).toBe('console.log(true)');
    });

    it('should handle null input values', () => {
      const nodeWithNull = {
        ...mockNode,
        inputs: [{ id: 'input-1', type: 'input' as const, dataType: 'any' as const, label: 'value', value: null }]
      };
      component.node = nodeWithNull;
      
      expect(component.getInputValue()).toBe('null');
      expect(component.getOutputValue()).toBe('console.log(null)');
    });
  });

  describe('Integration with NodeTypeLibrary', () => {
    it('should work with registered io.console node type', () => {
      const consoleNodeType = NodeTypeLibrary.getNodeType('io.console');
      expect(consoleNodeType).toBeDefined();
      expect(consoleNodeType?.name).toBe('Console Log');
      expect(consoleNodeType?.color).toBe('#795548');
      expect(consoleNodeType?.category).toBe('io');
    });
  });
});