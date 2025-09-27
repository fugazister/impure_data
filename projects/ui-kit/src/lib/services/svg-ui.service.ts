import { Injectable, signal } from '@angular/core';
import { SVGPosition } from '../types';

export interface SVGComponentState {
  id: string;
  position: SVGPosition;
  selected: boolean;
  dragging: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SvgUIService {
  // Track all SVG components
  private components = signal<Map<string, SVGComponentState>>(new Map());
  
  // Current selection
  private selectedComponent = signal<string | null>(null);
  
  // Drag state
  private dragState = signal<{
    componentId: string | null;
    startPosition: SVGPosition | null;
    currentPosition: SVGPosition | null;
  }>({
    componentId: null,
    startPosition: null,
    currentPosition: null
  });

  /**
   * Register a new SVG component
   */
  registerComponent(id: string, initialPosition: SVGPosition = { x: 0, y: 0 }): void {
    const current = this.components();
    current.set(id, {
      id,
      position: initialPosition,
      selected: false,
      dragging: false
    });
    this.components.set(new Map(current));
  }

  /**
   * Unregister an SVG component
   */
  unregisterComponent(id: string): void {
    const current = this.components();
    current.delete(id);
    this.components.set(new Map(current));
    
    // Clear selection if this component was selected
    if (this.selectedComponent() === id) {
      this.selectedComponent.set(null);
    }
  }

  /**
   * Update component position
   */
  updatePosition(id: string, position: SVGPosition): void {
    const current = this.components();
    const component = current.get(id);
    if (component) {
      current.set(id, { ...component, position });
      this.components.set(new Map(current));
    }
  }

  /**
   * Select a component
   */
  selectComponent(id: string): void {
    const current = this.components();
    
    // Deselect all components first
    for (const [componentId, state] of current) {
      current.set(componentId, { ...state, selected: false });
    }
    
    // Select the target component
    const component = current.get(id);
    if (component) {
      current.set(id, { ...component, selected: true });
      this.selectedComponent.set(id);
    }
    
    this.components.set(new Map(current));
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    const current = this.components();
    
    for (const [componentId, state] of current) {
      current.set(componentId, { ...state, selected: false });
    }
    
    this.components.set(new Map(current));
    this.selectedComponent.set(null);
  }

  /**
   * Start dragging a component
   */
  startDrag(id: string, startPosition: SVGPosition): void {
    const current = this.components();
    const component = current.get(id);
    
    if (component) {
      current.set(id, { ...component, dragging: true });
      this.components.set(new Map(current));
      
      this.dragState.set({
        componentId: id,
        startPosition,
        currentPosition: startPosition
      });
    }
  }

  /**
   * Update drag position
   */
  updateDrag(currentPosition: SVGPosition): void {
    const drag = this.dragState();
    if (drag.componentId) {
      this.dragState.set({
        ...drag,
        currentPosition
      });
      
      // Update component position
      this.updatePosition(drag.componentId, currentPosition);
    }
  }

  /**
   * End dragging
   */
  endDrag(): void {
    const drag = this.dragState();
    
    if (drag.componentId) {
      const current = this.components();
      const component = current.get(drag.componentId);
      
      if (component) {
        current.set(drag.componentId, { ...component, dragging: false });
        this.components.set(new Map(current));
      }
    }
    
    this.dragState.set({
      componentId: null,
      startPosition: null,
      currentPosition: null
    });
  }

  /**
   * Get component state by id
   */
  getComponent(id: string): SVGComponentState | undefined {
    return this.components().get(id);
  }

  /**
   * Get all components
   */
  getAllComponents(): SVGComponentState[] {
    return Array.from(this.components().values());
  }

  /**
   * Get currently selected component
   */
  getSelectedComponent(): string | null {
    return this.selectedComponent();
  }

  /**
   * Get current drag state
   */
  getDragState() {
    return this.dragState();
  }

  /**
   * Convert screen coordinates to SVG coordinates
   * This is a simplified version - in practice, you'd need to account for
   * SVG viewBox, transformations, etc.
   */
  screenToSVG(screenX: number, screenY: number, svgElement: SVGSVGElement): SVGPosition {
    const rect = svgElement.getBoundingClientRect();
    return {
      x: screenX - rect.left,
      y: screenY - rect.top
    };
  }

  /**
   * Check if a point is within a rectangular bounds
   */
  isPointInBounds(point: SVGPosition, bounds: { x: number; y: number; width: number; height: number }): boolean {
    return (
      point.x >= bounds.x &&
      point.x <= bounds.x + bounds.width &&
      point.y >= bounds.y &&
      point.y <= bounds.y + bounds.height
    );
  }
}