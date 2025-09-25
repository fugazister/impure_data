import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseOutputNodeComponent } from './base-output-node.component';
import { NodeWrapperComponent } from './node-wrapper.component';

@Component({
  selector: 'app-output-node',
  standalone: true,
  imports: [CommonModule, NodeWrapperComponent],
  templateUrl: './output-node.component.html',
  styleUrl: './base-output-node.component.css',
  schemas: [NO_ERRORS_SCHEMA]
})
export class OutputNodeComponent extends BaseOutputNodeComponent {

  getOutputValue(): string {
    // For plain text output, just show the text value
    const inputValue = this.getInputValue();
    if (inputValue === 'no input') {
      return 'text: (empty)';
    }
    if (inputValue === 'connected value') {
      return 'text: (...)';
    }
    return `text: ${inputValue}`;
  }

  // Execute the plain text output functionality
  executeOutput(): void {
    const inputValue = this.getInputValue();
    
    // Create a temporary element to display the output
    const outputElement = document.createElement('div');
    outputElement.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border: 2px solid #333;
      border-radius: 8px;
      padding: 16px 24px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 400px;
      word-wrap: break-word;
    `;
    
    outputElement.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px; color: #333;">Text Output</div>
      <div style="background: #f5f5f5; padding: 8px; border-radius: 4px; font-family: monospace;">${inputValue}</div>
      <div style="text-align: right; margin-top: 12px;">
        <button onclick="this.parentElement.parentElement.remove()" 
                style="background: #4CAF50; color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer;">
          Close
        </button>
      </div>
    `;
    
    document.body.appendChild(outputElement);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (document.body.contains(outputElement)) {
        document.body.removeChild(outputElement);
      }
    }, 5000);
  }
}