import { Injectable, signal } from '@angular/core';

export interface DebugEntry {
  timestamp: number;
  relativeTime: number; // ms since session start
  type: 'log' | 'warn' | 'error' | 'info' | 'debug';
  source: string;
  message: string;
  data?: any;
}

export interface DebugSession {
  id: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  entries: DebugEntry[];
  metadata: {
    nodeCount: number;
    connectionCount: number;
    executionMode: string;
  };
  summary: {
    totalEntries: number;
    errorCount: number;
    warningCount: number;
    executionSuccessful: boolean;
  };
}

export interface DebugDump {
  sessionInfo: {
    id: string;
    startTime: string; // ISO string
    endTime?: string; // ISO string
    duration: number;
    metadata: DebugSession['metadata'];
    summary: DebugSession['summary'];
  };
  events: Array<{
    index: number;
    timestamp: string; // ISO string
    relativeTime: number;
    type: string;
    source: string;
    message: string;
    data?: any;
  }>;
  rawSession: DebugSession; // Full raw data for advanced debugging
}

@Injectable({
  providedIn: 'root'
})
export class DebugService {
  private sessions = signal<DebugSession[]>([]);
  private currentSession = signal<DebugSession | null>(null);
  private originalConsole: {
    log: typeof console.log;
    warn: typeof console.warn;
    error: typeof console.error;
    info: typeof console.info;
    debug: typeof console.debug;
  };

  constructor() {
    // Store original console methods
    this.originalConsole = {
      log: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      info: console.info.bind(console),
      debug: console.debug.bind(console)
    };
  }

  startSession(metadata: { nodeCount: number; connectionCount: number; executionMode: string }): string {
    const sessionId = this.generateSessionId();
    const session: DebugSession = {
      id: sessionId,
      startTime: Date.now(),
      entries: [],
      metadata,
      summary: {
        totalEntries: 0,
        errorCount: 0,
        warningCount: 0,
        executionSuccessful: true
      }
    };

    this.currentSession.set(session);
    this.addEntry('info', 'DebugService', `Started debug session: ${sessionId}`, metadata);
    
    // Intercept console methods
    this.interceptConsole();

    return sessionId;
  }

  endSession(): DebugSession | null {
    const session = this.currentSession();
    if (!session) return null;

    session.endTime = Date.now();
    session.duration = session.endTime - session.startTime;
    this.addEntry('info', 'DebugService', `Ended debug session: ${session.id}`);
    
    // Store completed session
    const currentSessions = this.sessions();
    this.sessions.set([...currentSessions, session]);
    this.currentSession.set(null);

    // Restore original console methods
    this.restoreConsole();

    return session;
  }

  addEntry(type: DebugEntry['type'], source: string, message: string, data?: any): void {
    const session = this.currentSession();
    if (!session) return;

    const timestamp = Date.now();
    const entry: DebugEntry = {
      timestamp,
      relativeTime: timestamp - session.startTime,
      type,
      source,
      message,
      data
    };

    session.entries.push(entry);
    
    // Update summary
    session.summary.totalEntries++;
    if (type === 'error') {
      session.summary.errorCount++;
      session.summary.executionSuccessful = false;
    } else if (type === 'warn') {
      session.summary.warningCount++;
    }
  }

  private interceptConsole(): void {
    console.log = (...args: any[]) => {
      this.addEntry('log', 'Console', this.formatArgs(args), args);
      this.originalConsole.log(...args);
    };

    console.warn = (...args: any[]) => {
      this.addEntry('warn', 'Console', this.formatArgs(args), args);
      this.originalConsole.warn(...args);
    };

    console.error = (...args: any[]) => {
      this.addEntry('error', 'Console', this.formatArgs(args), args);
      this.originalConsole.error(...args);
    };

    console.info = (...args: any[]) => {
      this.addEntry('info', 'Console', this.formatArgs(args), args);
      this.originalConsole.info(...args);
    };

    console.debug = (...args: any[]) => {
      this.addEntry('debug', 'Console', this.formatArgs(args), args);
      this.originalConsole.debug(...args);
    };
  }

  private restoreConsole(): void {
    console.log = this.originalConsole.log;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    console.info = this.originalConsole.info;
    console.debug = this.originalConsole.debug;
  }

  private formatArgs(args: any[]): string {
    return args.map(arg => {
      if (typeof arg === 'string') return arg;
      if (typeof arg === 'object') return JSON.stringify(arg, null, 2);
      return String(arg);
    }).join(' ');
  }

  private generateSessionId(): string {
    return `debug_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  }

  // Public API methods
  getCurrentSession(): DebugSession | null {
    return this.currentSession();
  }

  getAllSessions(): DebugSession[] {
    return this.sessions();
  }

  getLatestSession(): DebugSession | null {
    const sessions = this.sessions();
    return sessions.length > 0 ? sessions[sessions.length - 1] : null;
  }

  clearSessions(): void {
    this.sessions.set([]);
  }

  // Debug dump functions
  dumpCurrentSession(): string {
    const session = this.currentSession();
    return session ? this.formatSessionDump(session) : 'No active debug session';
  }

  dumpLatestSession(): string {
    const session = this.getLatestSession();
    return session ? this.formatSessionDump(session) : 'No debug sessions available';
  }

  dumpAllSessions(): string {
    const sessions = this.sessions();
    if (sessions.length === 0) return 'No debug sessions available';

    return sessions.map(session => this.formatSessionDump(session)).join('\n\n' + '='.repeat(80) + '\n\n');
  }

  private formatSessionDump(session: DebugSession): string {
    const duration = session.endTime ? (session.endTime - session.startTime) : (Date.now() - session.startTime);
    const lines: string[] = [];

    lines.push(`🐛 DEBUG SESSION: ${session.id}`);
    lines.push(`📅 Started: ${new Date(session.startTime).toISOString()}`);
    lines.push(`⏱️  Duration: ${duration}ms`);
    lines.push(`🔗 Metadata: ${JSON.stringify(session.metadata, null, 2)}`);
    lines.push(`📝 Entries: ${session.entries.length}`);
    lines.push('─'.repeat(50));

    session.entries.forEach((entry, index) => {
      const relativeTime = entry.timestamp - session.startTime;
      const typeEmoji = this.getTypeEmoji(entry.type);
      
      lines.push(`[${String(index + 1).padStart(3, '0')}] +${String(relativeTime).padStart(6, '0')}ms ${typeEmoji} ${entry.source}`);
      lines.push(`     ${entry.message}`);
      
      if (entry.data && entry.type === 'error') {
        lines.push(`     💥 Error Data: ${JSON.stringify(entry.data, null, 6)}`);
      } else if (entry.data && typeof entry.data === 'object' && Object.keys(entry.data).length > 0) {
        lines.push(`     📊 Data: ${JSON.stringify(entry.data, null, 6)}`);
      }
      lines.push('');
    });

    return lines.join('\n');
  }

  private getTypeEmoji(type: DebugEntry['type']): string {
    switch (type) {
      case 'log': return '📄';
      case 'warn': return '⚠️';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      case 'debug': return '🔍';
      default: return '📝';
    }
  }

  // Structured dump methods that return JSON objects for Chrome DevTools
  getDumpData(): DebugDump | null {
    const session = this.currentSession();
    if (!session) return null;

    return {
      sessionInfo: {
        id: session.id,
        startTime: new Date(session.startTime).toISOString(),
        endTime: session.endTime ? new Date(session.endTime).toISOString() : undefined,
        duration: session.endTime ? (session.endTime - session.startTime) : (Date.now() - session.startTime),
        metadata: session.metadata,
        summary: session.summary
      },
      events: session.entries.map((entry, index) => ({
        index,
        timestamp: new Date(entry.timestamp).toISOString(),
        relativeTime: entry.relativeTime,
        type: entry.type,
        source: entry.source,
        message: entry.message,
        data: entry.data
      })),
      rawSession: session
    };
  }

  getLatestDump(): DebugDump | null {
    const session = this.getLatestSession();
    if (!session) return null;

    return {
      sessionInfo: {
        id: session.id,
        startTime: new Date(session.startTime).toISOString(),
        endTime: session.endTime ? new Date(session.endTime).toISOString() : undefined,
        duration: session.endTime ? (session.endTime - session.startTime) : (Date.now() - session.startTime),
        metadata: session.metadata,
        summary: session.summary
      },
      events: session.entries.map((entry, index) => ({
        index,
        timestamp: new Date(entry.timestamp).toISOString(),
        relativeTime: entry.relativeTime,
        type: entry.type,
        source: entry.source,
        message: entry.message,
        data: entry.data
      })),
      rawSession: session
    };
  }

  getAllDumps(): DebugDump[] {
    return this.sessions().map(session => ({
      sessionInfo: {
        id: session.id,
        startTime: new Date(session.startTime).toISOString(),
        endTime: session.endTime ? new Date(session.endTime).toISOString() : undefined,
        duration: session.endTime ? (session.endTime - session.startTime) : (Date.now() - session.startTime),
        metadata: session.metadata,
        summary: session.summary
      },
      events: session.entries.map((entry, index) => ({
        index,
        timestamp: new Date(entry.timestamp).toISOString(),
        relativeTime: entry.relativeTime,
        type: entry.type,
        source: entry.source,
        message: entry.message,
        data: entry.data
      })),
      rawSession: session
    }));
  }

  // Utility method to add custom debug entries
  log(source: string, message: string, data?: any): void {
    this.addEntry('log', source, message, data);
  }

  warn(source: string, message: string, data?: any): void {
    this.addEntry('warn', source, message, data);
  }

  error(source: string, message: string, data?: any): void {
    this.addEntry('error', source, message, data);
  }

  info(source: string, message: string, data?: any): void {
    this.addEntry('info', source, message, data);
  }

  debug(source: string, message: string, data?: any): void {
    this.addEntry('debug', source, message, data);
  }
}