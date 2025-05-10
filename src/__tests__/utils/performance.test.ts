import { PerformanceMonitor } from '../../utils/performance';

describe('PerformanceMonitor', () => {
  let performanceMonitor: PerformanceMonitor;
  let originalPerformanceNow: () => number;

  beforeEach(() => {
    performanceMonitor = new PerformanceMonitor();
    originalPerformanceNow = performance.now;
    let currentTime = 0;
    performance.now = jest.fn(() => currentTime += 100);
  });

  afterEach(() => {
    performance.now = originalPerformanceNow;
    jest.clearAllMocks();
  });

  it('tracks operation timing correctly', () => {
    const startTime = performanceMonitor.startOperation('test-operation');
    const metadata = { userId: '123' };
    
    performanceMonitor.endOperation('test-operation', startTime, true, metadata);
    
    const metrics = performanceMonitor.getMetrics();
    expect(metrics).toHaveLength(1);
    expect(metrics[0]).toEqual({
      operation: 'test-operation',
      startTime: expect.any(Number),
      endTime: expect.any(Number),
      duration: expect.any(Number),
      success: true,
      metadata: metadata,
    });
  });

  it('maintains metrics within size limit', () => {
    const maxMetrics = 100;
    
    for (let i = 0; i < maxMetrics + 10; i++) {
      const startTime = performanceMonitor.startOperation(`operation-${i}`);
      performanceMonitor.endOperation(`operation-${i}`, startTime, true);
    }
    
    const metrics = performanceMonitor.getMetrics();
    expect(metrics.length).toBeLessThanOrEqual(maxMetrics);
  });

  it('calculates average duration correctly', () => {
    const operation = 'test-operation';
    
    // Simulate three operations with different durations
    let startTime = performanceMonitor.startOperation(operation);
    performanceMonitor.endOperation(operation, startTime, true);
    
    startTime = performanceMonitor.startOperation(operation);
    performanceMonitor.endOperation(operation, startTime, true);
    
    startTime = performanceMonitor.startOperation(operation);
    performanceMonitor.endOperation(operation, startTime, true);
    
    const avgDuration = performanceMonitor.getAverageDuration(operation);
    expect(avgDuration).toBe(100); // Each operation takes 100ms in our mock
  });

  it('calculates success rate correctly', () => {
    const operation = 'test-operation';
    
    // Two successful operations and one failed
    let startTime = performanceMonitor.startOperation(operation);
    performanceMonitor.endOperation(operation, startTime, true);
    
    startTime = performanceMonitor.startOperation(operation);
    performanceMonitor.endOperation(operation, startTime, true);
    
    startTime = performanceMonitor.startOperation(operation);
    performanceMonitor.endOperation(operation, startTime, false);
    
    const successRate = performanceMonitor.getSuccessRate(operation);
    expect(successRate).toBe(2/3);
  });

  it('filters metrics by operation type', () => {
    const operation1 = 'operation-1';
    const operation2 = 'operation-2';
    
    let startTime = performanceMonitor.startOperation(operation1);
    performanceMonitor.endOperation(operation1, startTime, true);
    
    startTime = performanceMonitor.startOperation(operation2);
    performanceMonitor.endOperation(operation2, startTime, true);
    
    startTime = performanceMonitor.startOperation(operation1);
    performanceMonitor.endOperation(operation1, startTime, false);
    
    const operation1Metrics = performanceMonitor.getMetricsByOperation(operation1);
    expect(operation1Metrics.length).toBe(2);
    expect(operation1Metrics.every((metric) => metric.operation === operation1)).toBe(true);
  });

  it('clears metrics', () => {
    let startTime = performanceMonitor.startOperation('test-operation');
    performanceMonitor.endOperation('test-operation', startTime, true);
    
    performanceMonitor.clearMetrics();
    
    const metrics = performanceMonitor.getMetrics();
    expect(metrics).toHaveLength(0);
  });

  it('handles invalid operation end gracefully', () => {
    const invalidStartTime = -1;
    
    expect(() => {
      performanceMonitor.endOperation('invalid-operation', invalidStartTime, true);
    }).not.toThrow();
    
    const metrics = performanceMonitor.getMetrics();
    expect(metrics).toHaveLength(0);
  });
}); 