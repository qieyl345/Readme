import { create } from 'zustand'
import type { Property, PropertiesState, SearchFilters, PropertiesResponse } from '@/types/property'
import type { SearchBoxState } from '@/types/searchbox'
import { PropertiesApiClient } from '@/utils/propertiesApiClient'

interface PropertiesActions {
  // Search box actions
  setIsWhereOpen: (isOpen: boolean) => void
  setIsDurationOpen: (isOpen: boolean) => void
  setIsTypeOpen: (isOpen: boolean) => void
  setWhereValue: (value: string) => void
  setTypeValue: (value: string) => void
  setMonthCount: (count: number) => void
  setYearCount: (count: number) => void
  incrementMonth: () => void
  decrementMonth: () => void
  incrementYear: () => void
  decrementYear: () => void
  getDurationText: () => string
  getTypeText: () => string
  handleLocationSelect: (location: { name: string }) => void
  handleTypeSelect: (type: { name: string }) => void
  resetSearchBox: () => void

  // Properties actions
  loadProperties: (filters?: SearchFilters) => Promise<void>
  searchProperties: (filters: SearchFilters) => Promise<void>
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  addProperty: (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateProperty: (id: string, updates: Partial<Property>) => Promise<void>
  deleteProperty: (id: string) => Promise<void>
  getPropertyById: (id: string) => Property | undefined
  logPropertyView: (propertyId: string) => Promise<Property | null>
  clearFilters: () => void
}

type PropertiesStore = SearchBoxState & PropertiesState & PropertiesActions & {
  searchFilters: SearchFilters
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  mapData: {
    latMean: number
    longMean: number
    depth: number
  } | null 
}

const usePropertiesStore = create<PropertiesStore>((set, get) => ({
  // Search box state
  isWhereOpen: false,
  isDurationOpen: false,
  isTypeOpen: false,
  whereValue: '',
  typeValue: '',
  monthCount: 1,
  yearCount: 0,

  // Properties state
  properties: [],
  filteredProperties: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
  mapData: null,
  searchFilters: {
    page: 1,
    limit: 10,
  },

  // Search box actions
  setIsWhereOpen: (isWhereOpen: boolean) => set({ isWhereOpen }),
  setIsDurationOpen: (isDurationOpen: boolean) => set({ isDurationOpen }),
  setIsTypeOpen: (isTypeOpen: boolean) => set({ isTypeOpen }),
  setWhereValue: (whereValue: string) => set({ whereValue }),
  setTypeValue: (typeValue: string) => set({ typeValue }),
  setMonthCount: (monthCount: number) => set({ monthCount }),
  setYearCount: (yearCount: number) => set({ yearCount }),

  incrementMonth: () => {
    const { monthCount } = get()
    if (monthCount < 11) {
      set({ monthCount: monthCount + 1 })
    } else {
      set({ monthCount: 0, yearCount: get().yearCount + 1 })
    }
  },

  decrementMonth: () => {
    const { monthCount, yearCount } = get()
    if (monthCount > 0) {
      set({ monthCount: monthCount - 1 })
    } else if (yearCount > 0) {
      set({ monthCount: 11, yearCount: yearCount - 1 })
    }
  },

  incrementYear: () => {
    set({ yearCount: get().yearCount + 1 })
  },

  decrementYear: () => {
    const { yearCount } = get()
    if (yearCount > 0) {
      set({ yearCount: yearCount - 1 })
    }
  },

  getDurationText: () => {
    const { monthCount, yearCount } = get()
    if (yearCount === 0 && monthCount === 1) {
      return '1 month'
    } else if (yearCount === 0) {
      return `${monthCount} months`
    } else if (monthCount === 0) {
      return yearCount === 1 ? '1 year' : `${yearCount} years`
    } else {
      const yearText = yearCount === 1 ? '1 year' : `${yearCount} years`
      const monthText = monthCount === 1 ? '1 month' : `${monthCount} months`
      return `${yearText} ${monthText}`
    }
  },

  getTypeText: () => {
    const { typeValue } = get()
    return typeValue || 'Property type'
  },

  handleLocationSelect: (location: { name: string }) => {
    set({
      whereValue: location.name,
      isWhereOpen: false,
    })
  },

  handleTypeSelect: (type: { name: string }) => {
    set({
      typeValue: type.name,
      isTypeOpen: false,
    })
  },

  resetSearchBox: () => set({
    isWhereOpen: false,
    isDurationOpen: false,
    isTypeOpen: false,
    whereValue: '',
    typeValue: '',
    monthCount: 1,
    yearCount: 0,
  }),

  // Properties actions
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),

  loadProperties: async (filters?: SearchFilters) => {
    const { setLoading, setError } = get()
    setLoading(true)
    setError(null)

    try {
      // Build query parameters
      const params = new URLSearchParams()
      
      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.limit) params.append('limit', filters.limit.toString())
      if (filters?.type) params.append('type', filters.type)
      if (filters?.city) params.append('city', filters.city)
      if (filters?.available !== undefined) params.append('available', filters.available.toString())
      if (filters?.minPrice) params.append('minPrice', filters.minPrice.toString())
      if (filters?.maxPrice) params.append('maxPrice', filters.maxPrice.toString())
      if (filters?.bedrooms) params.append('bedrooms', filters.bedrooms.toString())

      // FIX: Use 127.0.0.1 to avoid localhost IPv4/IPv6 ambiguity on Windows
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:5000';
      const queryString = params.toString();
      const url = queryString 
        ? `${API_BASE}/api/properties?${queryString}` 
        : `${API_BASE}/api/properties`;
        
      console.log('Fetching properties from:', url);

      // FIX: Check for token to enable personalized data (like favorites)
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add token if user is logged in
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: PropertiesResponse = await response.json()

      if (result.success) {
        set({
          properties: result.data.properties,
          filteredProperties: result.data.properties,
          pagination: result.data.pagination,
          mapData: result.data.maps || null, 
          searchFilters: filters || get().searchFilters,
        })
      } else {
        setError('Failed to load properties')
      }
    } catch (error) {
      console.error('Error loading properties:', error)
      setError('Failed to load properties. Please try again.')
    } finally {
      setLoading(false)
    }
  },

  searchProperties: async (filters: SearchFilters) => {
    await get().loadProperties(filters)
  },

  addProperty: async (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProperty: Property = {
      ...property,
      id: `prop_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    set(state => ({
      properties: [...state.properties, newProperty],
      filteredProperties: [...state.filteredProperties, newProperty],
    }))
  },

  updateProperty: async (id: string, updates: Partial<Property>) => {
    set(state => ({
      properties: state.properties.map(p => 
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      ),
      filteredProperties: state.filteredProperties.map(p => 
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      ),
    }))
  },

  deleteProperty: async (id: string) => {
    set(state => ({
      properties: state.properties.filter(p => p.id !== id),
      filteredProperties: state.filteredProperties.filter(p => p.id !== id),
    }))
  },

  getPropertyById: (id: string) => {
    const { properties } = get()
    return properties.find(p => p.id === id)
  },

  logPropertyView: async (propertyId: string) => {
    try {
      const response = await PropertiesApiClient.logPropertyView(propertyId)
      
      if (response.success && response.data.property) {
        const updatedProperty = response.data.property
        
        set(state => ({
          properties: state.properties.map(p => 
            p.id === propertyId ? updatedProperty : p
          ),
          filteredProperties: state.filteredProperties.map(p => 
            p.id === propertyId ? updatedProperty : p
          ),
        }))
        
        return updatedProperty
      }
      
      return null
    } catch (error) {
      console.error('Error logging property view:', error)
      get().setError('Failed to log property view')
      return null
    }
  },

  clearFilters: () => {
    const { properties } = get()
    set({
      searchFilters: {},
      filteredProperties: properties,
    })
  },
}))

export default usePropertiesStore