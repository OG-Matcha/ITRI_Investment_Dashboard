import { ref, computed, watch } from 'vue'
import type { EnergyStorageData, FilterOptions } from '~/types'
import { parseMultiValueField } from '~/utils/dataParser'

export function useFiltering(originalData: Ref<EnergyStorageData[]>, instanceId?: string) {
  // 篩選狀態 - 使用實例 ID 來確保每個組件有獨立的篩選狀態
  const filters = ref<FilterOptions>({
    subIndustries: [],
    productServiceTypes: [],
    countries: [],
    investmentTypes: [],
    foundedYearRange: undefined,
    fundingYearRange: undefined
  })

  // 篩選後的資料
  const filteredData = ref<EnergyStorageData[]>([])

  // 篩選邏輯
  const applyFilters = (data: EnergyStorageData[], filterOptions: FilterOptions): EnergyStorageData[] => {
    return data.filter(item => {
      // 子產業篩選
      if (filterOptions.subIndustries.length > 0) {
        const itemIndustries = parseMultiValueField(item.SubIndustry)
        const hasMatchingIndustry = filterOptions.subIndustries.some(selectedIndustry =>
          itemIndustries.some(industry => 
            industry.toLowerCase().includes(selectedIndustry.toLowerCase())
          )
        )
        if (!hasMatchingIndustry) return false
      }

      // 產品服務類型篩選
      if (filterOptions.productServiceTypes.length > 0) {
        const itemTypes = parseMultiValueField(item.ProductServiceType)
        const hasMatchingType = filterOptions.productServiceTypes.some(selectedType =>
          itemTypes.some(type => 
            type.toLowerCase().includes(selectedType.toLowerCase())
          )
        )
        if (!hasMatchingType) return false
      }

      // 國家篩選
      if (filterOptions.countries && filterOptions.countries.length > 0) {
        if (!filterOptions.countries.includes(item.country_name)) return false
      }

      // 投資類型篩選
      if (filterOptions.investmentTypes && filterOptions.investmentTypes.length > 0) {
        if (!filterOptions.investmentTypes.includes(item.investment_type)) return false
      }

      // 成立年份範圍篩選
      if (filterOptions.foundedYearRange) {
        const [minYear, maxYear] = filterOptions.foundedYearRange
        if (item.founded_year < minYear || item.founded_year > maxYear) return false
      }

      // 募資年份範圍篩選
      if (filterOptions.fundingYearRange) {
        const [minYear, maxYear] = filterOptions.fundingYearRange
        if (item.funding_year < minYear || item.funding_year > maxYear) return false
      }

      return true
    })
  }

  // 更新篩選後的資料
  const updateFilteredData = () => {
    console.log('🔍 useFiltering - 更新篩選資料')
    console.log('🔍 useFiltering - 原始資料長度:', originalData.value.length)
    console.log('🔍 useFiltering - 篩選條件:', filters.value)
    
    const filtered = applyFilters(originalData.value, filters.value)
    filteredData.value = filtered
    
    console.log('✅ useFiltering - 篩選後資料長度:', filtered.length)
  }

  // 設定篩選條件
  const setFilters = (newFilters: Partial<FilterOptions>) => {
    filters.value = { ...filters.value, ...newFilters }
  }

  // 清除所有篩選
  const clearFilters = () => {
    filters.value = {
      subIndustries: [],
      productServiceTypes: [],
      countries: [],
      investmentTypes: [],
      foundedYearRange: undefined,
      fundingYearRange: undefined
    }
  }

  // 清除特定篩選
  const clearFilter = (filterType: keyof FilterOptions) => {
    if (filterType === 'subIndustries') {
      filters.value.subIndustries = []
    } else if (filterType === 'productServiceTypes') {
      filters.value.productServiceTypes = []
    } else if (filterType === 'countries') {
      filters.value.countries = []
    } else if (filterType === 'investmentTypes') {
      filters.value.investmentTypes = []
    } else if (filterType === 'foundedYearRange') {
      filters.value.foundedYearRange = undefined
    } else if (filterType === 'fundingYearRange') {
      filters.value.fundingYearRange = undefined
    }
  }

  // 切換篩選選項
  const toggleFilter = (filterType: keyof FilterOptions, value: string) => {
    if (filterType === 'subIndustries') {
      const current = filters.value.subIndustries
      const index = current.indexOf(value)
      if (index > -1) {
        current.splice(index, 1)
      } else {
        current.push(value)
      }
    } else if (filterType === 'productServiceTypes') {
      const current = filters.value.productServiceTypes
      const index = current.indexOf(value)
      if (index > -1) {
        current.splice(index, 1)
      } else {
        current.push(value)
      }
    } else if (filterType === 'countries') {
      const current = filters.value.countries || []
      const index = current.indexOf(value)
      if (index > -1) {
        current.splice(index, 1)
      } else {
        current.push(value)
      }
    } else if (filterType === 'investmentTypes') {
      const current = filters.value.investmentTypes || []
      const index = current.indexOf(value)
      if (index > -1) {
        current.splice(index, 1)
      } else {
        current.push(value)
      }
    }
  }

  // 檢查是否有活躍篩選
  const hasActiveFilters = computed(() => {
    return filters.value.subIndustries.length > 0 ||
           filters.value.productServiceTypes.length > 0 ||
           (filters.value.countries && filters.value.countries.length > 0) ||
           (filters.value.investmentTypes && filters.value.investmentTypes.length > 0) ||
           filters.value.foundedYearRange !== undefined ||
           filters.value.fundingYearRange !== undefined
  })

  // 取得篩選摘要
  const filterSummary = computed(() => {
    const summary: string[] = []
    
    if (filters.value.subIndustries.length > 0) {
      summary.push(`子產業: ${filters.value.subIndustries.length} 項`)
    }
    
    if (filters.value.productServiceTypes.length > 0) {
      summary.push(`產品服務: ${filters.value.productServiceTypes.length} 項`)
    }
    
    if (filters.value.countries && filters.value.countries.length > 0) {
      summary.push(`國家: ${filters.value.countries.length} 項`)
    }
    
    if (filters.value.investmentTypes && filters.value.investmentTypes.length > 0) {
      summary.push(`投資類型: ${filters.value.investmentTypes.length} 項`)
    }
    
    if (filters.value.foundedYearRange) {
      const [min, max] = filters.value.foundedYearRange
      summary.push(`成立年份: ${min}-${max}`)
    }
    
    if (filters.value.fundingYearRange) {
      const [min, max] = filters.value.fundingYearRange
      summary.push(`募資年份: ${min}-${max}`)
    }
    
    return summary
  })

  // 監聽原始資料和篩選條件變化
  watch([originalData, filters], () => {
    updateFilteredData()
  }, { immediate: true, deep: true })

  return {
    // 狀態
    filters: readonly(filters),
    filteredData,
    hasActiveFilters,
    filterSummary,
    
    // 方法
    setFilters,
    clearFilters,
    clearFilter,
    toggleFilter,
    updateFilteredData
  }
}
