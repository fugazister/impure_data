import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, Component } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { BaseOutputNodeComponent } from './base-output-node.component';
import { NodeTypeLibrary } from '../../../node-palette/node-library.service';

// Create a concrete implementation for testing the abstract class
@Component({
  selector: 'test-output-node',
  standalone: true,
  template: '<div>Test</div>',
  schemas: [NO_ERRORS_SCHEMA]
})
class TestOutputNodeComponent extends BaseOutputNodeComponent {
  override getOutputValue(): string {
    return 'test output';
  }

  executeOutput(): void {
    // Test implementation
  }
}

describe('BaseOutputNodeComponent', () => {
  let component: TestOutputNodeComponent;
  let fixture: ComponentFixture<TestOutputNodeComponent>;

  beforeEach(async () => {
    // Initialize node types
    NodeTypeLibrary.initialize();

    await TestBed.configureTestingModule({
      imports: [TestOutputNodeComponent],
      providers: [provideZonelessChangeDetection()],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(TestOutputNodeComponent);
    component = fixture.componentInstance;
    
    // Set up a basic node
    component.node = {
      id: 'test-base-output-node',
      type: 'output.test',
      position: { x: 0, y: 0 },
      inputs: [
        {
          id: 'input1',
          type: 'input',
          dataType: 'any',
          label: 'value',
          value: undefined
        }
      ],
      outputs: []
    };

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getWidth', () => {
    it('should return minimum width based on content', () => {
      const width = component.getWidth();
      expect(width).toBeGreaterThanOrEqual(160);
    });

    it('should adjust width based on output value length', () => {
      // Mock a longer output value
      spyOn(component, 'getOutputValue').and.returnValue('This is a very long output value that should increase width');
      const width = component.getWidth();
      expect(width).toBeGreaterThan(200);
    });
  });

  describe('getHeight', () => {
    it('should return base height plus ports height', () => {
      const height = component.getHeight();
      expect(height).toBe(80); // 60 base + 1 input * 20
    });

    it('should adjust height based on number of inputs', () => {
      component.node.inputs = [
        { id: 'input1', type: 'input', dataType: 'any', label: 'value1' },
        { id: 'input2', type: 'input', dataType: 'any', label: 'value2' }
      ];
      const height = component.getHeight();
      expect(height).toBe(100); // 60 base + 2 inputs * 20
    });
  });

  describe('getColor', () => {
    it('should return default color when node type not found', () => {
      component.node.type = 'unknown.type';
      const color = component.getColor();
      expect(color).toBe('#795548');
    });
  });

  describe('getDisplayName', () => {
    it('should return default name when node type not found', () => {
      component.node.type = 'unknown.type';
      const name = component.getDisplayName();
      expect(name).toBe('Output Node');
    });
  });

  describe('getInputValue', () => {
    it('should return "no input" when no inputs', () => {
      component.node.inputs = [];
      const result = component.getInputValue();
      expect(result).toBe('no input');
    });

    it('should return "connected value" when connected but no value', () => {
      component.node.inputs[0].connected = true;
      component.node.inputs[0].value = undefined;
      const result = component.getInputValue();
      expect(result).toBe('connected value');
    });

    it('should return "no input" when not connected and no value', () => {
      component.node.inputs[0].connected = false;
      component.node.inputs[0].value = undefined;
      const result = component.getInputValue();
      expect(result).toBe('no input');
    });

    it('should return string value when available', () => {
      component.node.inputs[0].value = 'test value';
      const result = component.getInputValue();
      expect(result).toBe('test value');
    });

    it('should convert non-string values to string', () => {
      component.node.inputs[0].value = 42;
      const result = component.getInputValue();
      expect(result).toBe('42');
    });
  });

  describe('event handlers', () => {
    it('should handle header mouse down', () => {
      spyOn(component, 'onNodeHeaderMouseDown');
      const mockEvent = new MouseEvent('mousedown');
      
      component.onHeaderMouseDown(mockEvent);
      
      expect(component.onNodeHeaderMouseDown).toHaveBeenCalledWith(mockEvent);
    });

    it('should handle right click', () => {
      const mockEvent = new MouseEvent('contextmenu');
      spyOn(mockEvent, 'preventDefault');
      spyOn(mockEvent, 'stopPropagation');
      
      component.onNodeRightClick(mockEvent);
      
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should handle execute click', () => {
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
});