import { Component, signal } from '@angular/core';
import { NodeCanvasComponent } from './components/node-canvas.component';
import { NodePaletteComponent } from './components/node-palette.component';
import { CodePanelComponent } from './components/code-panel.component';

@Component({
  selector: 'app-root',
  imports: [NodeCanvasComponent, NodePaletteComponent, CodePanelComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Impure Data - Visual JavaScript Editor');
}
