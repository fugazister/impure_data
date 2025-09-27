import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  SvgButtonComponent,
  SvgPortComponent,
  SvgInputComponent,
  SvgPanelComponent,
  SvgUIService,
  SVGPosition 
} from '../index';

/**
 * Demo component showing how to use SVG UI Kit components
 * within an SVG canvas context
 */
@Component({
  selector: 'app-svg-ui-demo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SvgButtonComponent,
    SvgPortComponent,
    SvgInputComponent,
    SvgPanelComponent
  ],
  template: `
    <div class="demo-container">
      <h2>SVG UI Kit Demo</h2>
      <p>Interactive SVG components within canvas context:</p>
      
      <svg width="800" height="600" viewBox="0 0 800 600" class="demo-canvas">
        
        <!-- Sample Node 1 -->
        <svg:g svg-panel
          [width]="220"
          [height]="120"
          [position]="{ x: 50, y: 50 }"
          variant="primary"
          title="Input Node"
          [shadow]="true">
          
          <!-- Input field -->
          <svg:g svg-input
            size="medium"
            variant="default"
            [position]="{ x: 10, y: 20 }"
            [width]="150"
            placeholder="Enter value..."
            [(ngModel)]="inputValue">
          </svg:g>
          
          <!-- Execute button -->
          <svg:g svg-button
            variant="primary"
            size="sm"
            [position]="{ x: 170, y: 18 }"
            (onClick)="executeNode()">
            Run
          </svg:g>
          
          <!-- Output port -->
          <svg:g svg-port
            portId="node1-output"
            type="output"
            [position]="{ x: 220, y: 35 }"
            label="Result"
            [connected]="false"
            (onMouseDown)="startConnection($event)">
          </svg:g>
          
        </svg:g>
        
        <!-- Sample Node 2 -->
        <svg:g svg-panel
          [width]="200"
          [height]="100"
          [position]="{ x: 350, y: 80 }"
          variant="success"
          title="Process Node"
          [shadow]="true">
          
          <!-- Input port -->
          <svg:g svg-port
            portId="node2-input"
            type="input"
            [position]="{ x: -6, y: 30 }"
            label="Input"
            [connected]="false"
            (onMouseUp)="endConnection($event)">
          </svg:g>
          
          <!-- Status display -->
          <svg:text x="20" y="35" font-size="11" fill="#333">
            Status: {{ nodeStatus() }}
          </svg:text>
          
          <!-- Toggle button -->
          <svg:g svg-button
            variant="ghost"
            size="sm"
            [position]="{ x: 120, y: 25 }"
            (onClick)="toggleStatus()">
            Toggle
          </svg:g>
          
          <!-- Output port -->
          <svg:g svg-port
            portId="node2-output"
            type="output"
            [position]="{ x: 200, y: 30 }"
            label="Output"
            [connected]="true"
            (onMouseDown)="startConnection($event)">
          </svg:g>
          
        </svg:g>
        
        <!-- Control Panel -->
        <svg:g svg-panel
          [width]="180"
          [height]="200"
          [position]="{ x: 600, y: 50 }"
          variant="default"
          title="Controls"
          [showCloseButton]="true"
          [shadow]="true">
          
          <!-- Button showcase -->
          <svg:text x="10" y="20" font-size="10" fill="#666">Button Variants:</svg:text>
          
          <svg:g svg-button variant="primary" size="xs" [position]="{ x: 10, y: 35 }">Primary</svg:g>
          <svg:g svg-button variant="secondary" size="xs" [position]="{ x: 90, y: 35 }">Secondary</svg:g>
          
          <svg:g svg-button variant="success" size="xs" [position]="{ x: 10, y: 60 }">Success</svg:g>
          <svg:g svg-button variant="warning" size="xs" [position]="{ x: 90, y: 60 }">Warning</svg:g>
          
          <svg:g svg-button variant="danger" size="xs" [position]="{ x: 10, y: 85 }">Danger</svg:g>
          <svg:g svg-button variant="ghost" size="xs" [position]="{ x: 90, y: 85 }">Ghost</svg:g>
          
          <!-- Input showcase -->
          <svg:text x="10" y="125" font-size="10" fill="#666">Input Field:</svg:text>
          
          <svg:g svg-input
            size="small"
            variant="primary"
            [position]="{ x: 10, y: 140 }"
            [width]="120"
            placeholder="Test input...">
          </svg:g>
          
        </svg:g>
        
        <!-- Connection line (demo) -->
        <svg:line 
          x1="270" y1="85" 
          x2="344" y2="110" 
          stroke="#4CAF50" 
          stroke-width="2"
          stroke-dasharray="5,5">
        </svg:line>
        
        <!-- Port connection indicator -->
        <svg:circle cx="270" cy="85" r="4" fill="#4CAF50" />
        <svg:circle cx="344" cy="110" r="4" fill="#4CAF50" />
        
      </svg>
      
      <div class="demo-info">
        <h3>Current State:</h3>
        <ul>
          <li>Input Value: "{{ inputValue() }}"</li>
          <li>Node Status: {{ nodeStatus() }}</li>
          <li>Selected Component: {{ selectedComponent() || 'None' }}</li>
        </ul>
        
        <h3>Available Actions:</h3>
        <ul>
          <li>Click buttons to trigger actions</li>
          <li>Type in input fields</li>
          <li>Drag connection ports (mock implementation)</li>
          <li>Toggle node status</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .demo-container {
      padding: 20px;
      max-width: 1000px;
      margin: 0 auto;
    }
    
    .demo-canvas {
      border: 2px solid #ddd;
      border-radius: 8px;
      background: #f9f9f9;
      display: block;
      margin: 20px 0;
    }
    
    .demo-info {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
      margin-top: 20px;
    }
    
    .demo-info h3 {
      margin-top: 0;
      color: #333;
    }
    
    .demo-info ul {
      margin: 10px 0;
    }
    
    .demo-info li {
      margin: 5px 0;
      color: #666;
    }
  `]
})
export class SvgUIDemoComponent {
  inputValue = signal('Hello SVG!');
  nodeStatus = signal('Ready');
  selectedComponent = signal<string | null>(null);

  constructor(private svgUI: SvgUIService) {
    // Register demo components
    this.svgUI.registerComponent('demo-node-1', { x: 50, y: 50 });
    this.svgUI.registerComponent('demo-node-2', { x: 350, y: 80 });
  }

  executeNode(): void {
    console.log('🚀 Execute node with value:', this.inputValue());
    this.nodeStatus.set('Processing...');
    
    // Simulate async processing
    setTimeout(() => {
      this.nodeStatus.set('Complete');
    }, 1000);
  }

  toggleStatus(): void {
    const current = this.nodeStatus();
    this.nodeStatus.set(current === 'Ready' ? 'Active' : 'Ready');
  }

  startConnection(event: { event: MouseEvent; portId: string; portType: string }): void {
    console.log('🔗 Start connection from port:', event.portId, 'type:', event.portType);
    // In a real implementation, you'd start the connection drawing process
  }

  endConnection(event: { event: MouseEvent; portId: string; portType: string }): void {
    console.log('🔗 End connection at port:', event.portId, 'type:', event.portType);
    // In a real implementation, you'd complete the connection
  }
}