/**
 * 全域錯誤處理工具
 */

export interface ErrorInfo {
  message: string
  code?: string
  stack?: string
  timestamp: Date
  context?: Record<string, any>
}

export class AppError extends Error {
  public code: string
  public context?: Record<string, any>
  public timestamp: Date

  constructor(message: string, code: string = 'UNKNOWN_ERROR', context?: Record<string, any>) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.context = context
    this.timestamp = new Date()
  }
}

/**
 * 錯誤處理器類別
 */
export class ErrorHandler {
  private static instance: ErrorHandler
  private errorLog: ErrorInfo[] = []
  private maxLogSize = 100

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  /**
   * 處理錯誤
   */
  public handleError(error: Error | AppError, context?: Record<string, any>): ErrorInfo {
    const errorInfo: ErrorInfo = {
      message: error.message,
      code: error instanceof AppError ? error.code : 'UNKNOWN_ERROR',
      stack: error.stack,
      timestamp: new Date(),
      context: context || (error instanceof AppError ? error.context : undefined)
    }

    this.errorLog.push(errorInfo)
    
    // 限制日誌大小
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize)
    }

    // 在開發環境中輸出錯誤
    if (process.env.NODE_ENV === 'development') {
      console.error('Error handled:', errorInfo)
    }

    return errorInfo
  }

  /**
   * 取得錯誤日誌
   */
  public getErrorLog(): ErrorInfo[] {
    return [...this.errorLog]
  }

  /**
   * 清除錯誤日誌
   */
  public clearErrorLog(): void {
    this.errorLog = []
  }

  /**
   * 建立自定義錯誤
   */
  public createError(message: string, code: string, context?: Record<string, any>): AppError {
    return new AppError(message, code, context)
  }
}

/**
 * 資料載入錯誤
 */
export class DataLoadError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'DATA_LOAD_ERROR', context)
    this.name = 'DataLoadError'
  }
}

/**
 * 圖表渲染錯誤
 */
export class ChartRenderError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'CHART_RENDER_ERROR', context)
    this.name = 'ChartRenderError'
  }
}

/**
 * 篩選錯誤
 */
export class FilterError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'FILTER_ERROR', context)
    this.name = 'FilterError'
  }
}

/**
 * 驗證錯誤
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', context)
    this.name = 'ValidationError'
  }
}

/**
 * 全域錯誤處理器實例
 */
export const errorHandler = ErrorHandler.getInstance()

/**
 * 錯誤邊界處理
 */
export function withErrorBoundary<T extends (...args: any[]) => any>(
  fn: T,
  errorContext?: Record<string, any>
): T {
  return ((...args: any[]) => {
    try {
      return fn(...args)
    } catch (error) {
      const errorInfo = errorHandler.handleError(error as Error, errorContext)
      throw new AppError(
        `Function execution failed: ${errorInfo.message}`,
        'FUNCTION_ERROR',
        { originalError: errorInfo, context: errorContext }
      )
    }
  }) as T
}

/**
 * 非同步錯誤處理
 */
export async function withAsyncErrorBoundary<T>(
  fn: () => Promise<T>,
  errorContext?: Record<string, any>
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    const errorInfo = errorHandler.handleError(error as Error, errorContext)
    throw new AppError(
      `Async function execution failed: ${errorInfo.message}`,
      'ASYNC_FUNCTION_ERROR',
      { originalError: errorInfo, context: errorContext }
    )
  }
}

/**
 * 重試機制
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxRetries) {
        throw lastError
      }

      // 等待後重試
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }

  throw lastError!
}
