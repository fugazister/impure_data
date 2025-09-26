import { Injectable, ComponentRef, ViewContainerRef, Type } from '@angular/core';
import { Node } from '../../core';
import { BaseNodeComponent } from './components/base/base-node.component';
import { FunctionNodeComponent } from './components/function/function-node.component';
import { SimpleNodeComponent } from './components/simple/simple-node.component';
import { LogNodeComponent } from './components/output/log-node.component';
import { OutputNodeComponent } from './components/output/output-node.component';

export interface NodeComponentInfo {
  component: ComponentRef<BaseNodeComponent>;
  type: string;
}

/**
 * Factory service for creating appropriate node components based on node type
 * This eliminates the need for template conditionals and promotes better separation of concerns
 */
@Injectable({
  providedIn: 'root'
})
export class NodeFactoryService {
  
  private nodeTypeComponentMap = new Map<string, Type<BaseNodeComponent>>([
    ['function', FunctionNodeComponent as Type<BaseNodeComponent>],
    ['io.console', LogNodeComponent as Type<BaseNodeComponent>],
    ['output.text', OutputNodeComponent as Type<BaseNodeComponent>],
    // Add more node types as we create their components
  ]);

  /**
   * Create a node component based on the node type
   */
  createNodeComponent(
    node: Node, 
    viewContainer: ViewContainerRef, 
    inputs?: { [key: string]: any }
  ): ComponentRef<BaseNodeComponent> {
    const componentType = this.getComponentTypeForNode(node);
    const componentRef = viewContainer.createComponent(componentType);
    
    // Set required inputs
    componentRef.setInput('node', node);
    
    // Set optional inputs if provided
    if (inputs) {
      Object.entries(inputs).forEach(([key, value]) => {
        componentRef.setInput(key, value);
      });
    }
    
    return componentRef;
  }

  /**
   * Get the appropriate component type for a given node
   */
  private getComponentTypeForNode(node: Node): Type<BaseNodeComponent> {
    const componentType = this.nodeTypeComponentMap.get(node.type);
    
    if (componentType) {
      return componentType;
    }
    
    // Default to SimpleNodeComponent for unknown node types
    return SimpleNodeComponent as Type<BaseNodeComponent>;
  }

  /**
   * Register a new node type component
   */
  registerNodeComponent(nodeType: string, componentType: Type<BaseNodeComponent>): void {
    this.nodeTypeComponentMap.set(nodeType, componentType);
  }

  /**
   * Get all registered node types
   */
  getRegisteredNodeTypes(): string[] {
    return Array.from(this.nodeTypeComponentMap.keys());
  }

  /**
   * Check if a node type has a registered component
   */
  hasComponentForNodeType(nodeType: string): boolean {
    return this.nodeTypeComponentMap.has(nodeType);
  }
}