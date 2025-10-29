// 能源儲能投資資料介面定義
export interface EnergyStorageData {
  // 公司基本資訊
  name: string
  org_name: string
  legal_name?: string
  homepage_url?: string
  cb_url?: string

  // 產業分類
  Industry: string
  SubIndustry: string // 支援逗號分隔的多值
  ProductServiceType: string // 支援逗號分隔的多值
  category_list?: string
  category_groups_list?: string

  // 地理位置
  country_code?: string
  country_name: string
  country_name_full?: string
  region?: string
  city?: string

  // 投資資訊
  investment_type: string
  total_funding_usd: number
  raised_amount_usd?: number
  num_funding_rounds: number
  funding_year: number
  announced_on?: string
  last_funding_on?: string
  rank: number

  // 公司狀態
  status: string
  founded_on?: string
  founded_year: number
  employee_count?: number
  closed_on?: string

  // 估值資訊
  post_money_valuation_usd?: number
  post_money_valuation?: string
  Post_Money_Value?: string

  // 投資者資訊
  investor_name?: string
  investor_type?: string
  investor_types?: string
  is_lead_investor?: string
  investor_count?: number

  // 特殊狀態
  Unicorn?: string
  went_public_on?: string
  went_public_year?: number
  stock_symbol?: string
  acquired_on?: string
  acquirer_name?: string
}

// 圖表配置介面
export interface ChartConfig {
  xAxis: string
  yAxis: string
  bubbleSize?: string
  title: string
  width?: number
  height?: number
}

// 篩選選項介面
export interface FilterOptions {
  subIndustries: string[]
  productServiceTypes: string[]
  countries?: string[]
  investmentTypes?: string[]
  foundedYearRange?: [number, number]
  fundingYearRange?: [number, number]
}

// GE 矩陣分類結果
export interface GEMatrixResult {
  highHigh: EnergyStorageData[]
  highMedium: EnergyStorageData[]
  highLow: EnergyStorageData[]
  mediumHigh: EnergyStorageData[]
  mediumMedium: EnergyStorageData[]
  mediumLow: EnergyStorageData[]
  lowHigh: EnergyStorageData[]
  lowMedium: EnergyStorageData[]
  lowLow: EnergyStorageData[]
  xThresholds: AxisThresholds
  yThresholds: AxisThresholds
}

// 風險象限分類結果
export interface RiskQuadrantResult {
  highRiskHighReturn: EnergyStorageData[]
  highRiskLowReturn: EnergyStorageData[]
  lowRiskHighReturn: EnergyStorageData[]
  lowRiskLowReturn: EnergyStorageData[]
}

// 圖表資料點
export interface ChartDataPoint {
  x: number
  y: number
  size?: number
  label: string
  data: EnergyStorageData
}

// 統計資訊
export interface Statistics {
  totalRecords: number
  totalFunding: number
  averageFunding: number
  topCountries: Array<{ country: string; count: number }>
  topIndustries: Array<{ industry: string; count: number }>
}

// 軸線選項
export interface AxisOption {
  value: string
  label: string
  type: 'financial' | 'technical' | 'geographic' | 'temporal'
}

// 圖表類型
export type ChartType = 'ge-matrix' | 'risk-quadrant' | 'bubble-chart' | 'geo-analysis'

// 響應式斷點
export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

// 地理分析相關類型
export interface CountryData {
  name: string
  companyCount: number
  totalFunding: number
  averageFunding: number
  maxFunding: number
  companies: EnergyStorageData[]
  industries: Array<{ name: string; count: number }>
  fundingRounds: Array<{ name: string; count: number }>
}

export interface GeoAnalysisResult {
  countries: CountryData[]
  totalCountries: number
  totalCompanies: number
  totalFunding: number
  averageFunding: number
  topCountries: Array<{ country: string; count: number; funding: number }>
  topIndustries: Array<{ industry: string; count: number }>
}

export type DataField = 'companyCount' | 'totalFunding' | 'averageFunding' | 'maxFunding'
export type ColorScheme = 'blues' | 'greens' | 'reds' | 'purples' | 'oranges'
