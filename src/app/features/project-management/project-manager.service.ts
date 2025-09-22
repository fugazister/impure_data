import { Injectable } from '@angular/core';
import { Project, Node, Connection, Port } from '../../core';

@Injectable({
  providedIn: 'root'
})
export class ProjectManagerService {
  private readonly STORAGE_KEY = 'impure_data_projects';
  private readonly CURRENT_PROJECT_KEY = 'impure_data_current_project';

  saveProject(project: Project): void {
    try {
      const projects = this.getAllProjects();
      const existingIndex = projects.findIndex(p => p.id === project.id);
      
      if (existingIndex >= 0) {
        projects[existingIndex] = { ...project, metadata: { ...project.metadata, modified: new Date() } };
      } else {
        projects.push(project);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects));
      localStorage.setItem(this.CURRENT_PROJECT_KEY, project.id);
    } catch (error) {
      console.error('Failed to save project:', error);
      throw new Error('Failed to save project to local storage');
    }
  }

  loadProject(projectId: string): Project | null {
    try {
      const projects = this.getAllProjects();
      return projects.find(p => p.id === projectId) || null;
    } catch (error) {
      console.error('Failed to load project:', error);
      return null;
    }
  }

  getAllProjects(): Project[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load projects:', error);
      return [];
    }
  }

  deleteProject(projectId: string): void {
    try {
      const projects = this.getAllProjects();
      const filteredProjects = projects.filter(p => p.id !== projectId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredProjects));
      
      // If this was the current project, clear it
      const currentProjectId = localStorage.getItem(this.CURRENT_PROJECT_KEY);
      if (currentProjectId === projectId) {
        localStorage.removeItem(this.CURRENT_PROJECT_KEY);
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw new Error('Failed to delete project');
    }
  }

  exportProjectAsJSON(project: Project): void {
    try {
      const dataStr = JSON.stringify(project, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `${project.name.replace(/\s+/g, '_')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Failed to export project:', error);
      throw new Error('Failed to export project as JSON');
    }
  }

  exportCodeAsJS(code: string, filename: string = 'generated_code'): void {
    try {
      const dataBlob = new Blob([code], { type: 'application/javascript' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `${filename}.js`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Failed to export code:', error);
      throw new Error('Failed to export code as JavaScript file');
    }
  }

  importProjectFromJSON(jsonString: string): Project {
    try {
      const project: Project = JSON.parse(jsonString);
      
      // Validate the project structure
      if (!this.isValidProject(project)) {
        throw new Error('Invalid project structure');
      }
      
      // Generate new ID to avoid conflicts
      project.id = this.generateId();
      project.metadata.modified = new Date();
      
      return project;
    } catch (error) {
      console.error('Failed to import project:', error);
      throw new Error('Failed to import project from JSON');
    }
  }

  importProjectFromFile(file: File): Promise<Project> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const project = this.importProjectFromJSON(content);
          resolve(project);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }

  getCurrentProjectId(): string | null {
    return localStorage.getItem(this.CURRENT_PROJECT_KEY);
  }

  setCurrentProjectId(projectId: string): void {
    localStorage.setItem(this.CURRENT_PROJECT_KEY, projectId);
  }

  createNewProject(name: string, description?: string): Project {
    return {
      id: this.generateId(),
      name,
      description,
      nodes: [],
      connections: [],
      metadata: {
        created: new Date(),
        modified: new Date(),
        version: '1.0.0'
      }
    };
  }

  duplicateProject(project: Project, newName?: string): Project {
    const duplicated: Project = {
      ...project,
      id: this.generateId(),
      name: newName || `${project.name} (Copy)`,
      metadata: {
        ...project.metadata,
        created: new Date(),
        modified: new Date()
      }
    };

    // Generate new IDs for all nodes and connections to avoid conflicts
    const nodeIdMap = new Map<string, string>();
    
    duplicated.nodes = duplicated.nodes.map((node: Node) => {
      const newNodeId = this.generateId();
      nodeIdMap.set(node.id, newNodeId);
      
      return {
        ...node,
        id: newNodeId,
        inputs: node.inputs.map((input: Port) => ({ ...input, id: this.generateId() })),
        outputs: node.outputs.map((output: Port) => ({ ...output, id: this.generateId() }))
      };
    });

    duplicated.connections = duplicated.connections.map((connection: Connection) => ({
      ...connection,
      id: this.generateId(),
      fromNodeId: nodeIdMap.get(connection.fromNodeId) || connection.fromNodeId,
      toNodeId: nodeIdMap.get(connection.toNodeId) || connection.toNodeId
    }));

    return duplicated;
  }

  private isValidProject(project: any): project is Project {
    return (
      project &&
      typeof project.id === 'string' &&
      typeof project.name === 'string' &&
      Array.isArray(project.nodes) &&
      Array.isArray(project.connections) &&
      project.metadata &&
      project.metadata.created &&
      project.metadata.modified &&
      project.metadata.version
    );
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  // Storage management
  clearAllProjects(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.CURRENT_PROJECT_KEY);
    } catch (error) {
      console.error('Failed to clear projects:', error);
      throw new Error('Failed to clear all projects');
    }
  }

  getStorageStats(): { totalProjects: number; totalSize: number } {
    try {
      const projects = this.getAllProjects();
      const totalSize = new Blob([localStorage.getItem(this.STORAGE_KEY) || '']).size;
      
      return {
        totalProjects: projects.length,
        totalSize
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return { totalProjects: 0, totalSize: 0 };
    }
  }
}