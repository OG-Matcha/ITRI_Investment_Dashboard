import { ref, computed, watch } from 'vue'
import type { ChartConfig, AxisOption, ChartType } from '~/types'

export function useChartConfig() {
  // 圖表配置狀態
  const chartConfigs = ref<Record<ChartType, ChartConfig>>({
    'ge-matrix': {
      xAxis: 'total_funding_usd',
      yAxis: 'founded_year',
      title: 'GE 矩陣分析',
      width: 800,
      height: 600
    },
    'risk-quadrant': {
      xAxis: 'total_funding_usd',
      yAxis: 'num_funding_rounds',
      title: '風險象限分析',
      width: 600,
      height: 500
    },
    'bubble-chart': {
      xAxis: 'total_funding_usd',
      yAxis: 'founded_year',
      bubbleSize: 'num_funding_rounds',
      title: '公司氣泡圖分析',
      width: 800,
      height: 600
    }
  })

  // 當前活躍的圖表類型
  const activeChartType = ref<ChartType>('ge-matrix')

  // 取得當前圖表配置
  const currentConfig = computed(() => chartConfigs.value[activeChartType.value])

  // 更新圖表配置
  const updateChartConfig = (chartType: ChartType, config: Partial<ChartConfig>) => {
    chartConfigs.value[chartType] = {
      ...chartConfigs.value[chartType],
      ...config
    }
  }

  // 設定軸線
  const setAxis = (chartType: ChartType, axisType: 'xAxis' | 'yAxis' | 'bubbleSize', value: string) => {
    updateChartConfig(chartType, { [axisType]: value })
  }

  // 設定圖表尺寸
  const setChartSize = (chartType: ChartType, width: number, height: number) => {
    updateChartConfig(chartType, { width, height })
  }

  // 設定圖表標題
  const setChartTitle = (chartType: ChartType, title: string) => {
    updateChartConfig(chartType, { title })
  }

  // 切換圖表類型
  const switchChartType = (chartType: ChartType) => {
    activeChartType.value = chartType
  }

  // 重置圖表配置
  const resetChartConfig = (chartType: ChartType) => {
    const defaultConfigs: Record<ChartType, ChartConfig> = {
      'ge-matrix': {
        xAxis: 'total_funding_usd',
        yAxis: 'founded_year',
        title: 'GE 矩陣分析',
        width: 800,
        height: 600
      },
      'risk-quadrant': {
        xAxis: 'total_funding_usd',
        yAxis: 'num_funding_rounds',
        title: '風險象限分析',
        width: 600,
        height: 500
      },
      'bubble-chart': {
        xAxis: 'total_funding_usd',
        yAxis: 'founded_year',
        bubbleSize: 'num_funding_rounds',
        title: '公司氣泡圖分析',
        width: 800,
        height: 600
      }
    }
    
    chartConfigs.value[chartType] = defaultConfigs[chartType]
  }

  // 取得圖表配置摘要
  const configSummary = computed(() => {
    const config = currentConfig.value
    return {
      chartType: activeChartType.value,
      xAxis: config.xAxis,
      yAxis: config.yAxis,
      bubbleSize: config.bubbleSize,
      title: config.title,
      dimensions: `${config.width}x${config.height}`
    }
  })

  // 驗證圖表配置
  const validateConfig = (config: ChartConfig): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    if (!config.xAxis || config.xAxis.trim() === '') {
      errors.push('X 軸不能為空')
    }
    
    if (!config.yAxis || config.yAxis.trim() === '') {
      errors.push('Y 軸不能為空')
    }
    
    if (config.width && config.width <= 0) {
      errors.push('寬度必須大於 0')
    }
    
    if (config.height && config.height <= 0) {
      errors.push('高度必須大於 0')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // 匯出圖表配置
  const exportConfig = (chartType: ChartType) => {
    const config = chartConfigs.value[chartType]
    const dataStr = JSON.stringify(config, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `${chartType}-config.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // 匯入圖表配置
  const importConfig = (chartType: ChartType, configData: string) => {
    try {
      const config = JSON.parse(configData)
      const validation = validateConfig(config)
      
      if (validation.isValid) {
        chartConfigs.value[chartType] = config
        return { success: true }
      } else {
        return { success: false, errors: validation.errors }
      }
    } catch (error) {
      return { success: false, errors: ['配置檔案格式錯誤'] }
    }
  }

  // 監聽配置變化
  watch(chartConfigs, (newConfigs) => {
    // 可以在這裡添加配置變化的處理邏輯
  }, { deep: true })

  return {
    // 狀態
    chartConfigs: readonly(chartConfigs),
    activeChartType: readonly(activeChartType),
    currentConfig,
    configSummary,
    
    // 方法
    updateChartConfig,
    setAxis,
    setChartSize,
    setChartTitle,
    switchChartType,
    resetChartConfig,
    validateConfig,
    exportConfig,
    importConfig
  }
}
