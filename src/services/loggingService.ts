type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: Date;
  context?: string;
}

class LoggingService {
  private isDevelopment = import.meta.env.DEV;
  private minLogLevel: LogLevel = this.isDevelopment ? 'debug' : 'error';

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    return levels[level] >= levels[this.minLogLevel];
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const context = entry.context ? `[${entry.context}]` : '';
    return `${timestamp} ${entry.level.toUpperCase()} ${context} ${entry.message}`;
  }

  debug(message: string, data?: any, context?: string): void {
    if (!this.shouldLog('debug')) return;
    
    const entry: LogEntry = { level: 'debug', message, data, timestamp: new Date(), context };
    console.log(this.formatMessage(entry), data || '');
  }

  info(message: string, data?: any, context?: string): void {
    if (!this.shouldLog('info')) return;
    
    const entry: LogEntry = { level: 'info', message, data, timestamp: new Date(), context };
    console.info(this.formatMessage(entry), data || '');
  }

  warn(message: string, data?: any, context?: string): void {
    if (!this.shouldLog('warn')) return;
    
    const entry: LogEntry = { level: 'warn', message, data, timestamp: new Date(), context };
    console.warn(this.formatMessage(entry), data || '');
  }

  error(message: string, error?: Error | any, context?: string): void {
    if (!this.shouldLog('error')) return;
    
    const entry: LogEntry = { level: 'error', message, data: error, timestamp: new Date(), context };
    console.error(this.formatMessage(entry), error || '');
  }
}

export const logger = new LoggingService();