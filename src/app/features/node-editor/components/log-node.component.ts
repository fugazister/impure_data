import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseOutputNodeComponent } from './base-output-node.component';
import { NodeWrapperComponent } from './node-wrapper.component';

@Component({
  selector: 'app-log-node',
  standalone: true,
  imports: [CommonModule, NodeWrapperComponent],
  templateUrl: './log-node.component.html',
  styleUrl: './base-output-node.component.css',
  schemas: [NO_ERRORS_SCHEMA]
})
export class LogNodeComponent extends BaseOutputNodeComponent {

  override getOutputValue(): string {
    // For console.log, the output would be the logged value
    const inputValue = this.getInputValue();
    if (inputValue === 'no input') {
      return 'console.log()';
    }
    if (inputValue === 'connected value') {
      return 'console.log(...)';
    }
    return `console.log(${inputValue})`;
  }

  // Execute the console.log functionality
  executeOutput(): void {
    const inputValue = this.getInputValue();
    console.log('Node Output:', inputValue);
  }
}