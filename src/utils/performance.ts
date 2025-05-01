import { logger } from './logger';

interface PerformanceMetric {
  operation: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  metadata?: Record<string, any>;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly MAX_METRICS = 100;

  // Start timing an operation
  startOperation(operation: string, metadata?: Record<string, any>): number {
    const startTime = performance.now();
    logger.debug(`Starting operation: ${operation}`, { startTime, metadata });
    return startTime;
  }

  // End timing an operation and record metrics
  endOperation(operation: string, startTime: number, success: boolean, metadata?: Record<string, any>) {
    if (startTime < 0) return;

    const endTime = performance.now();
    const duration = endTime - startTime;

    const metric: PerformanceMetric = {
      operation,
      startTime,
      endTime,
      duration,
      success,
      metadata,
    };

    this.metrics.unshift(metric);
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.pop();
    }

    logger.debug(`Operation completed: ${operation}`, {
      duration,
      success,
      metadata,
    });

    // Alert if operation took too long
    if (duration > this.getThresholdForOperation(operation)) {
      logger.warn(`Operation ${operation} took longer than expected`, {
        duration,
        threshold: this.getThresholdForOperation(operation),
        metadata,
      });
    }
  }

  // Get all metrics
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // Get metrics for a specific operation
  getMetricsByOperation(operation: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.operation === operation);
  }

  // Calculate average duration for an operation
  getAverageDuration(operation: string): number {
    const metrics = this.getMetricsByOperation(operation);
    if (metrics.length === 0) return 0;

    const totalDuration = metrics.reduce((sum, metric) => sum + metric.duration, 0);
    return totalDuration / metrics.length;
  }

  // Calculate success rate for an operation
  getSuccessRate(operation: string): number {
    const metrics = this.getMetricsByOperation(operation);
    if (metrics.length === 0) return 0;

    const successfulOperations = metrics.filter(metric => metric.success).length;
    return successfulOperations / metrics.length;
  }

  // Get threshold for operation (in milliseconds)
  private getThresholdForOperation(operation: string): number {
    // Define thresholds for different operations
    const thresholds: Record<string, number> = {
      'auth.signIn': 2000,
      'auth.signUp': 3000,
      'auth.signOut': 1000,
      'auth.resetPassword': 1500,
      'auth.refreshToken': 1000,
      'auth.checkSession': 500,
      'storage.get': 100,
      'storage.set': 100,
      'default': 1000,
    };

    return thresholds[operation] || thresholds.default;
  }

  // Get performance report
  getPerformanceReport(): Record<string, any> {
    const operations = [...new Set(this.metrics.map(m => m.operation))];
    
    return operations.reduce((report, operation) => {
      report[operation] = {
        averageDuration: this.getAverageDuration(operation),
        successRate: this.getSuccessRate(operation),
        threshold: this.getThresholdForOperation(operation),
        sampleSize: this.getMetricsByOperation(operation).length,
      };
      return report;
    }, {} as Record<string, any>);
  }

  // Clear all metrics
  clearMetrics(): void {
    this.metrics = [];
    logger.debug('Performance metrics cleared');
  }
}

// Create a singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Higher-order function to measure performance of async operations
export const measureAsync = async <T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> => {
  const startTime = performanceMonitor.startOperation(operation, metadata);
  try {
    const result = await fn();
    performanceMonitor.endOperation(operation, startTime, true, metadata);
    return result;
  } catch (error) {
    performanceMonitor.endOperation(operation, startTime, false, {
      ...metadata,
      error,
    });
    throw error;
  }
};

// Higher-order function to measure performance of sync operations
export const measure = <T>(
  operation: string,
  fn: () => T,
  metadata?: Record<string, any>
): T => {
  const startTime = performanceMonitor.startOperation(operation, metadata);
  try {
    const result = fn();
    performanceMonitor.endOperation(operation, startTime, true, metadata);
    return result;
  } catch (error) {
    performanceMonitor.endOperation(operation, startTime, false, {
      ...metadata,
      error,
    });
    throw error;
  }
}; 