import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { OutputNodeComponent } from './output-node.component';
import { NodeTypeLibrary } from '../../node-palette/node-library.service';

describe('OutputNodeComponent', () => {
  let component: OutputNodeComponent;
  let fixture: ComponentFixture<OutputNodeComponent>;

  beforeEach(async () => {
    // Initialize node types to ensure output.text is available
    NodeTypeLibrary.initialize();

    await TestBed.configureTestingModule({
      imports: [OutputNodeComponent],
      providers: [provideZonelessChangeDetection()],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(OutputNodeComponent);
    component = fixture.componentInstance;
    
    // Set up a basic node
    component.node = {
      id: 'test-output-node',
      type: 'output.text',
      position: { x: 0, y: 0 },
      inputs: [
        {
          id: 'input1',
          type: 'input',
          dataType: 'any',
          label: 'text',
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

  describe('getOutputValue', () => {
    it('should return "text: (empty)" when no input', () => {
      component.node.inputs = [];
      const result = component.getOutputValue();
      expect(result).toBe('text: (empty)');
    });

    it('should return "text: (...)" when connected but no value', () => {
      component.node.inputs[0].connected = true;
      component.node.inputs[0].value = undefined;
      const result = component.getOutputValue();
      expect(result).toBe('text: (...)');
    });

    it('should return actual text value when available', () => {
      component.node.inputs[0].value = 'Hello World';
      const result = component.getOutputValue();
      expect(result).toBe('text: Hello World');
    });
  });

  describe('executeOutput', () => {
    it('should create and display output popup', () => {
      spyOn(document, 'createElement').and.returnValue({
        style: {},
        innerHTML: '',
        remove: jasmine.createSpy('remove')
      } as any);
      spyOn(document.body, 'appendChild');
      
      component.node.inputs[0].value = 'Test message';
      
      component.executeOutput();
      
      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(document.body.appendChild).toHaveBeenCalled();
    });

    it('should handle empty input', () => {
      spyOn(document, 'createElement').and.returnValue({
        style: {},
        innerHTML: '',
        remove: jasmine.createSpy('remove')
      } as any);
      spyOn(document.body, 'appendChild');
      
      component.node.inputs = [];
      
      expect(() => component.executeOutput()).not.toThrow();
      expect(document.createElement).toHaveBeenCalledWith('div');
    });
  });

  describe('getColor', () => {
    it('should return the node type color from library', () => {
      const color = component.getColor();
      expect(color).toBe('#FF9800'); // Orange color for output.text from library
    });
  });

  describe('getDisplayName', () => {
    it('should return the node type name from library', () => {
      const name = component.getDisplayName();
      expect(name).toBe('Text Output');
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

    it('should return actual value when available', () => {
      component.node.inputs[0].value = 'Sample text';
      const result = component.getInputValue();
      expect(result).toBe('Sample text');
    });
  });

  describe('onExecuteClick', () => {
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

  describe('integration with NodeTypeLibrary', () => {
    it('should work with registered output.text node type', () => {
      const textOutputNodeType = NodeTypeLibrary.getNodeType('output.text');
      expect(textOutputNodeType).toBeDefined();
      expect(textOutputNodeType!.name).toBe('Text Output');
      expect(textOutputNodeType!.category).toBe('io');
      expect(textOutputNodeType!.color).toBe('#FF9800');
    });
  });
});