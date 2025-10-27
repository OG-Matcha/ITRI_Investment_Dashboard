/**
 * 效能優化工具
 */

export interface PerformanceMetrics {
  name: string
  startTime: number
  endTime?: number
  duration?: number
  memoryUsage?: number
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, PerformanceMetrics> = new Map()
  private observers: PerformanceObserver[] = []

  private constructor() {
    this.setupPerformanceObserver()
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * 開始效能監控
   */
  public startTiming(name: string): void {
    const startTime = performance.now()
    const memoryUsage = this.getMemoryUsage()
    
    this.metrics.set(name, {
      name,
      startTime,
      memoryUsage
    })
  }

  /**
   * 結束效能監控
   */
  public endTiming(name: string): PerformanceMetrics | null {
    const metric = this.metrics.get(name)
    if (!metric) {
      console.warn(`Performance metric "${name}" not found`)
      return null
    }

    const endTime = performance.now()
    const duration = endTime - metric.startTime
    const finalMemoryUsage = this.getMemoryUsage()

    const finalMetric: PerformanceMetrics = {
      ...metric,
      endTime,
      duration,
      memoryUsage: finalMemoryUsage
    }

    this.metrics.set(name, finalMetric)
    return finalMetric
  }

  /**
   * 取得效能指標
   */
  public getMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values())
  }

  /**
   * 清除效能指標
   */
  public clearMetrics(): void {
    this.metrics.clear()
  }

  /**
   * 取得記憶體使用量
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize
    }
    return 0
  }

  /**
   * 設定效能觀察器
   */
  private setupPerformanceObserver(): void {
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            console.log('Performance entry:', entry)
          }
        })
        
        observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] })
        this.observers.push(observer)
      } catch (error) {
        console.warn('PerformanceObserver not supported:', error)
      }
    }
  }

  /**
   * 清理觀察器
   */
  public cleanup(): void {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

/**
 * 效能監控器實例
 */
export const performanceMonitor = PerformanceMonitor.getInstance()

/**
 * 防抖函數
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * 節流函數
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * 記憶化函數
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>()

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args)
    
    if (cache.has(key)) {
      return cache.get(key)!
    }

    const result = func(...args)
    cache.set(key, result)
    return result
  }) as T
}

/**
 * 懶載入工具
 */
export class LazyLoader {
  private loadedModules = new Map<string, any>()
  private loadingPromises = new Map<string, Promise<any>>()

  /**
   * 懶載入模組
   */
  public async load<T>(moduleName: string, loader: () => Promise<T>): Promise<T> {
    // 如果已經載入，直接返回
    if (this.loadedModules.has(moduleName)) {
      return this.loadedModules.get(moduleName)
    }

    // 如果正在載入，等待載入完成
    if (this.loadingPromises.has(moduleName)) {
      return this.loadingPromises.get(moduleName)
    }

    // 開始載入
    const promise = loader().then(module => {
      this.loadedModules.set(moduleName, module)
      this.loadingPromises.delete(moduleName)
      return module
    })

    this.loadingPromises.set(moduleName, promise)
    return promise
  }

  /**
   * 預載入模組
   */
  public async preload<T>(moduleName: string, loader: () => Promise<T>): Promise<void> {
    if (!this.loadedModules.has(moduleName) && !this.loadingPromises.has(moduleName)) {
      await this.load(moduleName, loader)
    }
  }

  /**
   * 清除快取
   */
  public clearCache(): void {
    this.loadedModules.clear()
    this.loadingPromises.clear()
  }
}

/**
 * 懶載入器實例
 */
export const lazyLoader = new LazyLoader()

/**
 * 效能快取工具
 */
export class PerformanceCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  /**
   * 設定快取
   */
  public set(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  /**
   * 取得快取
   */
  public get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    // 檢查是否過期
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data as T
  }

  /**
   * 清除快取
   */
  public clear(): void {
    this.cache.clear()
  }

  /**
   * 清除過期快取
   */
  public cleanup(): void {
    const now = Date.now()
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

/**
 * 效能快取實例
 */
export const performanceCache = new PerformanceCache()

/**
 * 效能優化裝飾器
 */
export function performanceTiming(name: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value

    descriptor.value = function (...args: any[]) {
      performanceMonitor.startTiming(name)
      
      try {
        const result = method.apply(this, args)
        
        // 處理非同步函數
        if (result instanceof Promise) {
          return result.finally(() => {
            performanceMonitor.endTiming(name)
          })
        }
        
        performanceMonitor.endTiming(name)
        return result
      } catch (error) {
        performanceMonitor.endTiming(name)
        throw error
      }
    }
  }
}

/**
 * 批次處理工具
 */
export class BatchProcessor<T> {
  private batch: T[] = []
  private batchSize: number
  private processor: (items: T[]) => void | Promise<void>
  private timeout: NodeJS.Timeout | null = null
  private flushTimeout: number

  constructor(
    processor: (items: T[]) => void | Promise<void>,
    batchSize: number = 10,
    flushTimeout: number = 1000
  ) {
    this.processor = processor
    this.batchSize = batchSize
    this.flushTimeout = flushTimeout
  }

  /**
   * 添加項目到批次
   */
  public add(item: T): void {
    this.batch.push(item)

    if (this.batch.length >= this.batchSize) {
      this.flush()
    } else if (!this.timeout) {
      this.timeout = setTimeout(() => this.flush(), this.flushTimeout)
    }
  }

  /**
   * 立即處理批次
   */
  public flush(): void {
    if (this.batch.length === 0) {
      return
    }

    const items = [...this.batch]
    this.batch = []

    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }

    this.processor(items)
  }
}
