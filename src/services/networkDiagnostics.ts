import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";

export interface NetworkDiagnostics {
  timestamp: Date;
  domain: string;
  userAgent: string;
  isIframe: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  cookies: boolean;
  supabaseHealth: {
    client: boolean;
    auth: boolean;
    database: boolean;
    functions: boolean;
    latency: number;
  };
  authState: {
    hasSession: boolean;
    hasToken: boolean;
    tokenValid: boolean;
    userId?: string;
    email?: string;
  };
  networkInfo: {
    online: boolean;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  };
  dnsInfo: {
    supabaseReachable: boolean;
    dnsResolutionTime: number;
  };
}

export class NetworkDiagnosticsService {
  private static instance: NetworkDiagnosticsService;
  private diagnosticsHistory: NetworkDiagnostics[] = [];

  static getInstance(): NetworkDiagnosticsService {
    if (!NetworkDiagnosticsService.instance) {
      NetworkDiagnosticsService.instance = new NetworkDiagnosticsService();
    }
    return NetworkDiagnosticsService.instance;
  }

  async runComprehensiveDiagnostics(): Promise<NetworkDiagnostics> {
    logger.info('Starting comprehensive network diagnostics', null, 'NetworkDiagnostics');
    
    const startTime = performance.now();
    
    const diagnostics: NetworkDiagnostics = {
      timestamp: new Date(),
      domain: window.location.hostname,
      userAgent: navigator.userAgent,
      isIframe: window !== window.top,
      localStorage: this.testLocalStorage(),
      sessionStorage: this.testSessionStorage(),
      cookies: this.testCookies(),
      supabaseHealth: await this.testSupabaseHealth(),
      authState: await this.analyzeAuthState(),
      networkInfo: this.getNetworkInfo(),
      dnsInfo: await this.testDNSResolution()
    };

    const totalTime = performance.now() - startTime;
    logger.info(`Diagnostics completed in ${totalTime.toFixed(2)}ms`, diagnostics, 'NetworkDiagnostics');

    this.diagnosticsHistory.push(diagnostics);
    if (this.diagnosticsHistory.length > 10) {
      this.diagnosticsHistory.shift();
    }

    return diagnostics;
  }

  private testLocalStorage(): boolean {
    try {
      const testKey = 'test-local-storage';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      logger.warn('localStorage not available', error, 'NetworkDiagnostics');
      return false;
    }
  }

  private testSessionStorage(): boolean {
    try {
      const testKey = 'test-session-storage';
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
      return true;
    } catch (error) {
      logger.warn('sessionStorage not available', error, 'NetworkDiagnostics');
      return false;
    }
  }

  private testCookies(): boolean {
    try {
      document.cookie = 'test=1; path=/';
      const hasCookie = document.cookie.includes('test=1');
      document.cookie = 'test=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      return hasCookie;
    } catch (error) {
      logger.warn('Cookies not available', error, 'NetworkDiagnostics');
      return false;
    }
  }

  private async testSupabaseHealth(): Promise<NetworkDiagnostics['supabaseHealth']> {
    const healthCheck = {
      client: false,
      auth: false,
      database: false,
      functions: false,
      latency: 0
    };

    const startTime = performance.now();

    try {
      // Test client initialization
      healthCheck.client = !!supabase;
      logger.debug('Supabase client check', { client: healthCheck.client }, 'NetworkDiagnostics');

      // Test auth
      try {
        const { data: session } = await supabase.auth.getSession();
        healthCheck.auth = true;
        logger.debug('Supabase auth check', { auth: true, hasSession: !!session.session }, 'NetworkDiagnostics');
      } catch (error) {
        logger.warn('Supabase auth check failed', error, 'NetworkDiagnostics');
      }

      // Test database
      try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        healthCheck.database = !error;
        logger.debug('Supabase database check', { database: healthCheck.database, error }, 'NetworkDiagnostics');
      } catch (error) {
        logger.warn('Supabase database check failed', error, 'NetworkDiagnostics');
      }

      // Test edge functions
      try {
        const { data, error } = await supabase.functions.invoke('send-invitation-email', {
          body: { test: true, skipSend: true }
        });
        healthCheck.functions = !error;
        logger.debug('Supabase functions check', { functions: healthCheck.functions, error }, 'NetworkDiagnostics');
      } catch (error) {
        logger.warn('Supabase functions check failed', error, 'NetworkDiagnostics');
      }

      healthCheck.latency = performance.now() - startTime;
    } catch (error) {
      logger.error('Supabase health check failed', error, 'NetworkDiagnostics');
    }

    return healthCheck;
  }

  private async analyzeAuthState(): Promise<NetworkDiagnostics['authState']> {
    const authState: NetworkDiagnostics['authState'] = {
      hasSession: false,
      hasToken: false,
      tokenValid: false
    };

    try {
      const { data: session } = await supabase.auth.getSession();
      authState.hasSession = !!session.session;
      authState.hasToken = !!session.session?.access_token;
      authState.userId = session.session?.user?.id;
      authState.email = session.session?.user?.email;

      if (session.session?.access_token) {
        // Test token validity by making a simple authenticated request
        try {
          const { error } = await supabase.from('profiles').select('id').limit(1);
          authState.tokenValid = !error;
        } catch (error) {
          logger.warn('Token validation failed', error, 'NetworkDiagnostics');
        }
      }

      logger.debug('Auth state analysis', authState, 'NetworkDiagnostics');
    } catch (error) {
      logger.error('Auth state analysis failed', error, 'NetworkDiagnostics');
    }

    return authState;
  }

  private getNetworkInfo(): NetworkDiagnostics['networkInfo'] {
    const networkInfo: NetworkDiagnostics['networkInfo'] = {
      online: navigator.onLine
    };

    // @ts-ignore - NetworkInformation API
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      networkInfo.effectiveType = connection.effectiveType;
      networkInfo.downlink = connection.downlink;
      networkInfo.rtt = connection.rtt;
    }

    logger.debug('Network info', networkInfo, 'NetworkDiagnostics');
    return networkInfo;
  }

  private async testDNSResolution(): Promise<NetworkDiagnostics['dnsInfo']> {
    const dnsInfo = {
      supabaseReachable: false,
      dnsResolutionTime: 0
    };

    const startTime = performance.now();
    
    try {
      // Test DNS resolution by making a simple request to Supabase
      const response = await fetch('https://qdpktyyvqejdpxiegooe.supabase.co/rest/v1/', {
        method: 'HEAD',
        mode: 'no-cors'
      });
      dnsInfo.supabaseReachable = true;
      dnsInfo.dnsResolutionTime = performance.now() - startTime;
      logger.debug('DNS resolution successful', dnsInfo, 'NetworkDiagnostics');
    } catch (error) {
      dnsInfo.dnsResolutionTime = performance.now() - startTime;
      logger.warn('DNS resolution failed', { ...dnsInfo, error }, 'NetworkDiagnostics');
    }

    return dnsInfo;
  }

  getHistoricalDiagnostics(): NetworkDiagnostics[] {
    return [...this.diagnosticsHistory];
  }

  async testEdgeFunctionDirect(functionName: string, payload: any): Promise<any> {
    logger.info(`Testing edge function directly: ${functionName}`, payload, 'NetworkDiagnostics');

    const startTime = performance.now();
    
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { ...payload, debugMode: true }
      });

      const duration = performance.now() - startTime;
      logger.info(`Edge function test completed in ${duration.toFixed(2)}ms`, { data, error }, 'NetworkDiagnostics');

      return { data, error, duration };
    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error(`Edge function test failed after ${duration.toFixed(2)}ms`, error, 'NetworkDiagnostics');
      return { error, duration };
    }
  }
}

export const networkDiagnostics = NetworkDiagnosticsService.getInstance();