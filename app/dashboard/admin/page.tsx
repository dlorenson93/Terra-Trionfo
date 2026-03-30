'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { WINES } from '@/data/wines'
import { PRODUCERS } from '@/data/producers'
import {
  deriveAnalysisFreshness,
  FRESHNESS_LABEL,
  FRESHNESS_BADGE_CLASS,
  type AnalysisFreshness,
} from '@/lib/deriveAnalysisFreshness'
import {
  RESOLUTION_LABEL,
  RESOLUTION_BADGE_CLASS,
  type RecommendationResolutionStatus,
} from '@/lib/deriveResolutionStatus'
import {
  EFFECTIVENESS_LABEL,
  EFFECTIVENESS_BADGE_CLASS,
  EFFECTIVENESS_ICON,
  type EffectivenessDelta,
} from '@/lib/deriveEffectivenessDelta'

interface Stats {
  totalVendors: number
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  pendingCompanies: number
  pendingProducts: number
  recentOrders: any[]
}

interface Company {
  id: string
  name: string
  contactEmail: string
  status: string
  contentStatus: string
  isFoundingProducer: boolean
  owner: { name: string }
  createdAt: string
  _count?: { products: number }
}

interface Product {
  id: string
  slug?: string | null
  name: string
  category: string
  retailPriceCents: number
  inventory: number
  status: string
  contentStatus: string
  commerceModel: 'MARKETPLACE' | 'WHOLESALE' | 'HYBRID'
  listingOwner: 'VENDOR' | 'TERRA'
  isFeatured: boolean
  isFoundingWine: boolean
  isLimitedAllocation: boolean
  company: { name: string }
  // Release intelligence state — written back by /api/admin/release-optimization
  releaseMonitorStatus?: string | null
  exposureTier?: string | null
  lastRecommendationAt?: string | null
  // Recommendation workflow
  recommendationStatus?: string | null
  recommendationActionType?: string | null
  recommendationNotes?: string | null
  lastRecommendationReviewedAt?: string | null
  lastRecommendationActionedAt?: string | null
  // Recommendation resolution
  recommendationResolutionStatus?: string | null
  lastRecommendationResolvedAt?: string | null
  // Recommendation effectiveness
  preActionSignalScore?: number | null
  postActionSignalScore?: number | null
  effectivenessDelta?: string | null
  effectivenessReason?: string | null
  effectivenessLastComputedAt?: string | null
}

interface RecommendationHistoryEvent {
  id:                      string
  previousStatus:          string | null
  newStatus:               string
  previousActionType:      string | null
  newActionType:           string | null
  note:                    string | null
  releaseMonitorStatus:    string | null
  exposureTier:            string | null
  previousResolutionStatus: string | null
  newResolutionStatus:     string | null
  preActionSignalScore:    number | null
  postActionSignalScore:   number | null
  effectivenessDelta:      string | null
  createdAt:               string
  changedBy:               { id: string; name: string; email: string }
}

interface RestaurantWineAdmin {
  id: string
  servingType: string
  product: { id: string; name: string; vintage?: number | null; category: string }
}

interface Restaurant {
  id: string
  name: string
  slug: string
  city: string
  state: string
  cuisineType?: string | null
  priceRange?: string | null
  status: string
  contentStatus: string
  isFeatured: boolean
  wines: RestaurantWineAdmin[]
}

interface DeliveryZone {
  id: string
  name: string
  code: string
  description?: string | null
  isActive: boolean
}

interface DeliveryRoute {
  id: string
  zoneId: string
  zone: { id: string; name: string; code: string }
  deliveryDay: number
  deliveryDayName: string
  isActive: boolean
}

interface PickupScheduleAdmin {
  id: string
  locationId: string
  location: { id: string; name: string; city: string; state: string }
  pickupDay: number
  pickupDayName: string
  isActive: boolean
}

interface PickupLocationAdmin {
  id: string
  name: string
  city: string
  state: string
}

interface Customer {
  id: string
  name: string | null
  email: string
  createdAt: string
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  ageVerificationStatus?: 'UNVERIFIED' | 'ELIGIBLE' | 'INELIGIBLE' | null
  ageVerifiedAt?: string | null
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'products' | 'restaurants' | 'fulfillment' | 'portfolio-pricing' | 'customers' | 'release-intelligence'>('overview')
  const [fulfillmentSubTab, setFulfillmentSubTab] = useState<'zones' | 'routes' | 'schedules'>('zones')

  // Inline product edit state
  const [editingProduct, setEditingProduct] = useState<{
    id: string
    commerceModel: string
    listingOwner: string
    retailPriceDollars: string
    inventory: string
    isFeatured: boolean
    isFoundingWine: boolean
    isLimitedAllocation: boolean
  } | null>(null)

  // Fulfillment ops state
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([])
  const [deliveryRoutes, setDeliveryRoutes] = useState<DeliveryRoute[]>([])
  const [pickupSchedules, setPickupSchedules] = useState<PickupScheduleAdmin[]>([])
  const [pickupLocationsList, setPickupLocationsList] = useState<PickupLocationAdmin[]>([])
  const [newRouteForm, setNewRouteForm] = useState({ zoneId: '', deliveryDay: '' })
  const [newScheduleForm, setNewScheduleForm] = useState({ locationId: '', pickupDay: '' })
  const [showNewRestaurantForm, setShowNewRestaurantForm] = useState(false)
  const [newRestaurantForm, setNewRestaurantForm] = useState({
    name: '', slug: '', address: '', city: '', state: 'MA', zipCode: '',
    website: '', cuisineType: '', priceRange: '', description: '',
  })
  const [assignWinePanel, setAssignWinePanel] = useState<{ restaurantId: string; restaurantName: string } | null>(null)
  const [wineAssignForm, setWineAssignForm] = useState({ productId: '', servingType: 'BOTTLE_LIST', notes: '' })

  // Company management state
  const [showNewCompanyForm, setShowNewCompanyForm] = useState(false)
  const [newCompanyForm, setNewCompanyForm] = useState({
    name: '', contactEmail: '', region: '', country: 'Italy', phone: '', website: '', bio: '', description: '',
  })

  // Wine import state
  const [importingWineId, setImportingWineId] = useState<string | null>(null)
  const [importingAll, setImportingAll] = useState(false)

  // Customer edit state
  const [editingCustomer, setEditingCustomer] = useState<{
    id: string
    name: string
    firstName: string
    lastName: string
    email: string
    phone: string
  } | null>(null)
  const [syncingPriceId, setSyncingPriceId] = useState<string | null>(null)
  const [syncingAllPrices, setSyncingAllPrices] = useState(false)

  // Release intelligence state
  const [releaseIntelligence, setReleaseIntelligence] = useState<any>(null)
  const [loadingIntelligence, setLoadingIntelligence] = useState(false)
  // Per-product intel run state
  const [runningIntelId, setRunningIntelId] = useState<string | null>(null)
  const [runningAllIntel, setRunningAllIntel] = useState(false)
  // Recommendation workflow action state
  const [updatingRecId, setUpdatingRecId] = useState<string | null>(null)
  // Recommendation history state — keyed by productId
  const [recHistory, setRecHistory] = useState<Record<string, RecommendationHistoryEvent[]>>({})
  const [loadingHistoryId, setLoadingHistoryId] = useState<string | null>(null)
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null)
  // Resolution outcome state
  const [updatingResolutionId, setUpdatingResolutionId] = useState<string | null>(null)
  const [runningFollowupCheck, setRunningFollowupCheck] = useState(false)
  // Effectiveness rollups state (Release Intel tab)
  const [effectivenessRollups, setEffectivenessRollups] = useState<any>(null)
  const [loadingRollups, setLoadingRollups] = useState(false)
  // Bias governance state (Release Intel tab)
  const [biasGovernance, setBiasGovernance] = useState<any>(null)
  const [loadingGovernance, setLoadingGovernance] = useState(false)
  const [updatingGovernance, setUpdatingGovernance] = useState(false)
  // Calibration rollups state (Release Intel tab)
  const [calibrationRollups, setCalibrationRollups] = useState<any>(null)
  const [loadingCalibration, setLoadingCalibration] = useState(false)
  // Allocation planning state (Release Intel tab)
  const [allocationPlanning, setAllocationPlanning] = useState<any>(null)
  const [loadingPlanning, setLoadingPlanning] = useState(false)
  // Planning decisions state (Phase 13 — decision capture)
  const [planningDecisions, setPlanningDecisions] = useState<Record<string, any>>({})
  const [loadingDecisions, setLoadingDecisions] = useState(false)
  const [decisionsLoaded, setDecisionsLoaded] = useState(false)
  const [overridingProductId, setOverridingProductId] = useState<string | null>(null)
  const [overrideForm, setOverrideForm] = useState({ allocationSizing: '', releaseTiming: '', rolloutMode: '', notes: '' })
  // Phase 14 — execution tracking state
  const [executingDecisionId, setExecutingDecisionId] = useState<string | null>(null)
  const [executionForm, setExecutionForm] = useState({ allocationSizing: '', releaseTiming: '', rolloutMode: '', notes: '' })
  // Phase 15 — decision quality analytics state
  const [decisionQuality, setDecisionQuality] = useState<any>(null)
  const [loadingDecisionQuality, setLoadingDecisionQuality] = useState(false)
  // Phase 16 — predictive planning enrichment
  const [predictivePlanning, setPredictivePlanning] = useState<any>(null)
  const [loadingPredictivePlanning, setLoadingPredictivePlanning] = useState(false)
  // Phase 17 — scenario planning
  const [scenarioData, setScenarioData] = useState<any>(null)
  const [loadingScenarios, setLoadingScenarios] = useState(false)
  const [expandedScenarios, setExpandedScenarios] = useState<Set<string>>(new Set())
  // Phase 18 — strategy pattern library
  const [strategyPatterns, setStrategyPatterns] = useState<any>(null)
  const [loadingPatterns, setLoadingPatterns] = useState(false)

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
      return
    }
    if (session.user.role !== 'ADMIN') {
      router.push('/')
      return
    }
    fetchData()
  }, [session])

  // Lazy-load release intelligence only when the tab is first opened
  useEffect(() => {
    if (activeTab === 'release-intelligence' && !releaseIntelligence && !loadingIntelligence) {
      fetchReleaseIntelligence()
    }
    if (activeTab === 'release-intelligence' && !effectivenessRollups && !loadingRollups) {
      fetchEffectivenessRollups()
    }
    if (activeTab === 'release-intelligence' && !biasGovernance && !loadingGovernance) {
      fetchBiasGovernance()
    }
    if (activeTab === 'release-intelligence' && !calibrationRollups && !loadingCalibration) {
      fetchCalibrationRollups()
    }
    if (activeTab === 'release-intelligence' && !allocationPlanning && !loadingPlanning) {
      fetchAllocationPlanning()
    }
    if (activeTab === 'release-intelligence' && !decisionsLoaded && !loadingDecisions) {
      fetchPlanningDecisions()
    }
    if (activeTab === 'release-intelligence' && !decisionQuality && !loadingDecisionQuality) {
      fetchDecisionQuality()
    }
    if (activeTab === 'release-intelligence' && !predictivePlanning && !loadingPredictivePlanning) {
      fetchPredictivePlanning()
    }
    if (activeTab === 'release-intelligence' && !scenarioData && !loadingScenarios) {
      fetchScenarios()
    }
    if (activeTab === 'release-intelligence' && !strategyPatterns && !loadingPatterns) {
      fetchStrategyPatterns()
    }
  }, [activeTab])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [statsRes, companiesRes, productsRes, restaurantsRes, zonesRes, routesRes, schedulesRes, pickupLocsRes, customersRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/companies'),
        fetch('/api/products'),
        fetch('/api/restaurants'),
        fetch('/api/delivery-zones'),
        fetch('/api/delivery-routes'),
        fetch('/api/pickup-schedules'),
        fetch('/api/pickup-locations'),
        fetch('/api/admin/customers'),
      ])

      setStats(await statsRes.json())
      const companiesData = await companiesRes.json()
      setCompanies(Array.isArray(companiesData) ? companiesData : [])
      const productsData = await productsRes.json()
      setProducts(Array.isArray(productsData) ? productsData : [])
      const restaurantsData = await restaurantsRes.json()
      setRestaurants(Array.isArray(restaurantsData) ? restaurantsData : [])
      const zonesData = await zonesRes.json()
      setDeliveryZones(Array.isArray(zonesData) ? zonesData : [])
      const routesData = await routesRes.json()
      setDeliveryRoutes(Array.isArray(routesData) ? routesData : [])
      const schedulesData = await schedulesRes.json()
      setPickupSchedules(Array.isArray(schedulesData) ? schedulesData : [])
      const pickupLocsData = await pickupLocsRes.json()
      setPickupLocationsList(Array.isArray(pickupLocsData) ? pickupLocsData : [])
      const customersData = await customersRes.json()
      setCustomers(Array.isArray(customersData) ? customersData : [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchReleaseIntelligence = async () => {
    setLoadingIntelligence(true)
    try {
      const res = await fetch('/api/admin/release-optimization')
      if (res.ok) {
        setReleaseIntelligence(await res.json())
      }
    } catch (error) {
      console.error('Error fetching release intelligence:', error)
    } finally {
      setLoadingIntelligence(false)
    }
  }

  const fetchEffectivenessRollups = async () => {
    setLoadingRollups(true)
    try {
      const res = await fetch('/api/admin/effectiveness-rollups')
      if (res.ok) {
        const data = await res.json()
        setEffectivenessRollups(data)
        // Governance is bundled in the rollups response — keep them in sync
        if (data.governance) setBiasGovernance(data.governance)
      }
    } catch (error) {
      console.error('Error fetching effectiveness rollups:', error)
    } finally {
      setLoadingRollups(false)
    }
  }

  const fetchCalibrationRollups = async () => {
    setLoadingCalibration(true)
    try {
      const res = await fetch('/api/admin/calibration-rollups')
      if (res.ok) {
        const data = await res.json()
        setCalibrationRollups(data)
      }
    } catch (error) {
      console.error('Error fetching calibration rollups:', error)
    } finally {
      setLoadingCalibration(false)
    }
  }

  const fetchAllocationPlanning = async () => {
    setLoadingPlanning(true)
    try {
      const res = await fetch('/api/admin/allocation-planning')
      if (res.ok) setAllocationPlanning(await res.json())
    } catch (error) {
      console.error('Error fetching allocation planning:', error)
    } finally {
      setLoadingPlanning(false)
    }
  }

  const fetchPlanningDecisions = async () => {
    setLoadingDecisions(true)
    try {
      const res = await fetch('/api/admin/planning-decisions')
      if (res.ok) {
        const rows: any[] = await res.json()
        // Build latest-per-product map (rows ordered newest-first from API)
        const map: Record<string, any> = {}
        for (const row of rows) {
          if (!map[row.productId]) map[row.productId] = row
        }
        setPlanningDecisions(map)
        setDecisionsLoaded(true)
      }
    } catch (error) {
      console.error('Error fetching planning decisions:', error)
    } finally {
      setLoadingDecisions(false)
    }
  }

  const submitPlanningDecision = async (
    plan: any,
    decisionStatus: 'ACCEPTED' | 'OVERRIDDEN' | 'DEFERRED',
    override?: { allocationSizing: string; releaseTiming: string; rolloutMode: string; notes: string },
  ) => {
    const body = {
      productId:                   plan.productId,
      decisionStatus,
      recommendedAllocationSizing: plan.allocationSizing,
      recommendedReleaseTiming:    plan.releaseTiming,
      recommendedRolloutMode:      plan.rolloutMode,
      recommendedPlanConfidence:   plan.planConfidence,
      signalScoreAtDecision:       plan.signalScore   ?? null,
      inventoryAtDecision:         plan.inventory     ?? null,
      selectedAllocationSizing:    decisionStatus === 'ACCEPTED' ? plan.allocationSizing : (override?.allocationSizing ?? null),
      selectedReleaseTiming:       decisionStatus === 'ACCEPTED' ? plan.releaseTiming    : (override?.releaseTiming    ?? null),
      selectedRolloutMode:         decisionStatus === 'ACCEPTED' ? plan.rolloutMode      : (override?.rolloutMode      ?? null),
      planningDecisionNotes:       override?.notes ?? null,
    }
    try {
      const res = await fetch('/api/admin/planning-decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const newDecision = await res.json()
        setPlanningDecisions(prev => ({ ...prev, [plan.productId]: newDecision }))
        setOverridingProductId(null)
      }
    } catch (error) {
      console.error('Error submitting planning decision:', error)
    }
  }

  const submitExecution = async (
    decisionId: string,
    productId: string,
    executionStatus: 'EXECUTED' | 'PARTIAL' | 'DEVIATED' | 'NOT_EXECUTED',
    actuals?: { allocationSizing: string; releaseTiming: string; rolloutMode: string; notes: string },
  ) => {
    const body = {
      executionStatus,
      executedAllocationSizing: executionStatus === 'NOT_EXECUTED' ? null : (actuals?.allocationSizing ?? null),
      executedReleaseTiming:    executionStatus === 'NOT_EXECUTED' ? null : (actuals?.releaseTiming    ?? null),
      executedRolloutMode:      executionStatus === 'NOT_EXECUTED' ? null : (actuals?.rolloutMode      ?? null),
      executionNotes:           actuals?.notes ?? null,
    }
    try {
      const res = await fetch(`/api/admin/planning-decisions/${decisionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const updated = await res.json()
        setPlanningDecisions(prev => ({ ...prev, [productId]: updated }))
        setExecutingDecisionId(null)
      }
    } catch (error) {
      console.error('Error submitting execution:', error)
    }
  }

  const fetchDecisionQuality = async () => {
    setLoadingDecisionQuality(true)
    try {
      const res = await fetch('/api/admin/decision-quality')
      if (res.ok) setDecisionQuality(await res.json())
    } catch (error) {
      console.error('Error fetching decision quality:', error)
    } finally {
      setLoadingDecisionQuality(false)
    }
  }

  const fetchPredictivePlanning = async () => {
    setLoadingPredictivePlanning(true)
    try {
      const res = await fetch('/api/admin/predictive-planning')
      if (res.ok) setPredictivePlanning(await res.json())
    } catch (error) {
      console.error('Error fetching predictive planning:', error)
    } finally {
      setLoadingPredictivePlanning(false)
    }
  }

  const fetchScenarios = async () => {
    setLoadingScenarios(true)
    try {
      const res = await fetch('/api/admin/scenario-planning')
      if (res.ok) setScenarioData(await res.json())
    } catch (error) {
      console.error('Error fetching scenario planning:', error)
    } finally {
      setLoadingScenarios(false)
    }
  }

  const fetchStrategyPatterns = async () => {
    setLoadingPatterns(true)
    try {
      const res = await fetch('/api/admin/strategy-patterns')
      if (res.ok) setStrategyPatterns(await res.json())
    } catch (error) {
      console.error('Error fetching strategy patterns:', error)
    } finally {
      setLoadingPatterns(false)
    }
  }

  const toggleScenario = (productId: string) => {
    setExpandedScenarios(prev => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }

  const fetchBiasGovernance = async () => {
    setLoadingGovernance(true)
    try {
      const res = await fetch('/api/admin/bias-governance')
      if (res.ok) setBiasGovernance(await res.json())
    } catch (error) {
      console.error('Error fetching bias governance:', error)
    } finally {
      setLoadingGovernance(false)
    }
  }

  const updateBiasGovernance = async (patch: { biasEnabled?: boolean; biasMode?: string }) => {
    setUpdatingGovernance(true)
    try {
      const res = await fetch('/api/admin/bias-governance', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(patch),
      })
      if (res.ok) setBiasGovernance(await res.json())
    } catch (error) {
      console.error('Error updating bias governance:', error)
    } finally {
      setUpdatingGovernance(false)
    }
  }

  const runIntelForProduct = async (productId: string) => {
    setRunningIntelId(productId)
    try {
      await fetch(`/api/admin/intelligence/run/${productId}`, { method: 'POST' })
      fetchData()
    } catch (error) {
      console.error('Error running intelligence for product:', error)
    } finally {
      setRunningIntelId(null)
    }
  }

  const runAllIntel = async () => {
    if (!confirm('Refresh intelligence for all approved products?')) return
    setRunningAllIntel(true)
    try {
      await fetch('/api/admin/intelligence/run-all', { method: 'POST' })
      fetchData()
      if (releaseIntelligence) fetchReleaseIntelligence()
    } catch (error) {
      console.error('Error running bulk intelligence:', error)
    } finally {
      setRunningAllIntel(false)
    }
  }

  const updateRecommendation = async (
    productId: string,
    recommendationStatus: 'OPEN' | 'REVIEWED' | 'ACTIONED' | 'DISMISSED',
    opts?: { recommendationActionType?: string; recommendationNotes?: string },
  ) => {
    setUpdatingRecId(productId)
    try {
      // When actioning, snapshot the current bias-adjusted confidence from
      // release-intelligence data so calibration can compare outcomes later
      let confidenceSnapshot: {
        baseConfidenceScore?: number
        adjustedConfidenceScore?: number
        biasApplied?: boolean
        biasMultiplier?: number
      } = {}
      if (recommendationStatus === 'ACTIONED' && releaseIntelligence?.recommendations) {
        const matchRec = (releaseIntelligence.recommendations as any[]).find(
          (r) => r.productId === productId,
        )
        if (matchRec) {
          confidenceSnapshot = {
            baseConfidenceScore:     matchRec.baseConfidenceScore,
            adjustedConfidenceScore: matchRec.adjustedConfidenceScore,
            biasApplied:             matchRec.biasApplied,
            biasMultiplier:          matchRec.biasMultiplier,
          }
        }
      }
      await fetch(`/api/admin/recommendations/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendationStatus, ...opts, ...confidenceSnapshot }),
      })
      // Invalidate history cache so next expand re-fetches
      setRecHistory(prev => { const n = { ...prev }; delete n[productId]; return n })
      fetchData()
    } catch (error) {
      console.error('Error updating recommendation:', error)
    } finally {
      setUpdatingRecId(null)
    }
  }

  const updateResolution = async (
    productId: string,
    resolutionStatus: RecommendationResolutionStatus,
  ) => {
    setUpdatingResolutionId(productId)
    try {
      await fetch(`/api/admin/recommendations/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendationResolutionStatus: resolutionStatus }),
      })
      setRecHistory(prev => { const n = { ...prev }; delete n[productId]; return n })
      fetchData()
    } catch (error) {
      console.error('Error updating resolution:', error)
    } finally {
      setUpdatingResolutionId(null)
    }
  }

  const runFollowupCheck = async () => {
    if (!confirm('Run automated follow-up check for all ACTIONED products?')) return
    setRunningFollowupCheck(true)
    try {
      await fetch('/api/admin/recommendations/run-followup-check', { method: 'POST' })
      fetchData()
    } catch (error) {
      console.error('Error running follow-up check:', error)
    } finally {
      setRunningFollowupCheck(false)
    }
  }

  const fetchRecommendationHistory = async (productId: string) => {
    // Toggle off if already expanded
    if (expandedHistoryId === productId) {
      setExpandedHistoryId(null)
      return
    }
    setExpandedHistoryId(productId)
    // Only fetch if not already cached
    if (recHistory[productId]) return
    setLoadingHistoryId(productId)
    try {
      const res = await fetch(`/api/admin/recommendations/${productId}/history`)
      if (res.ok) {
        const data = await res.json()
        setRecHistory(prev => ({ ...prev, [productId]: data }))
      }
    } catch (error) {
      console.error('Error fetching recommendation history:', error)
    } finally {
      setLoadingHistoryId(null)
    }
  }

  const updateCompanyStatus = async (companyId: string, status: string) => {
    try {
      await fetch(`/api/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      fetchData()
    } catch (error) {
      console.error('Error updating company:', error)
    }
  }

  const updateProductStatus = async (productId: string, status: string) => {
    try {
      await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      fetchData()
    } catch (error) {
      console.error('Error updating product:', error)
    }
  }

  const updateContentStatus = async (productId: string, contentStatus: string) => {
    try {
      await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentStatus }),
      })
      fetchData()
    } catch (error) {
      console.error('Error updating content status:', error)
    }
  }

  const updateCompanyContentStatus = async (companyId: string, contentStatus: string) => {
    try {
      await fetch(`/api/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentStatus }),
      })
      fetchData()
    } catch (error) {
      console.error('Error updating company content status:', error)
    }
  }

  const editProduct = (prod: Product) => {
    setEditingProduct({
      id: prod.id,
      commerceModel: prod.commerceModel,
      listingOwner: prod.listingOwner,
      retailPriceDollars: (prod.retailPriceCents / 100).toFixed(2),
      inventory: String(prod.inventory),
      isFeatured: prod.isFeatured,
      isFoundingWine: prod.isFoundingWine,
      isLimitedAllocation: prod.isLimitedAllocation,
    })
  }

  const saveProductEdit = async () => {
    if (!editingProduct) return
    const retailPriceCents = Math.round(parseFloat(editingProduct.retailPriceDollars) * 100)
    if (isNaN(retailPriceCents) || retailPriceCents <= 0) return
    const inventory = parseInt(editingProduct.inventory)
    if (isNaN(inventory) || inventory < 0) return
    try {
      await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commerceModel: editingProduct.commerceModel,
          listingOwner: editingProduct.listingOwner,
          retailPriceCents,
          inventory,
          isFeatured: editingProduct.isFeatured,
          isFoundingWine: editingProduct.isFoundingWine,
          isLimitedAllocation: editingProduct.isLimitedAllocation,
        }),
      })
      setEditingProduct(null)
      fetchData()
    } catch (error) {
      console.error('Error editing product:', error)
    }
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      fetchData()
    } catch (error) {
      console.error('Error updating order status:', error)
    }
  }

  const updateAgeVerification = async (userId: string, ageVerificationStatus: string) => {
    try {
      await fetch(`/api/admin/customers/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ageVerificationStatus }),
      })
      fetchData()
    } catch (error) {
      console.error('Error updating age verification:', error)
    }
  }

  const updateCompanyFoundingStatus = async (companyId: string, isFoundingProducer: boolean) => {
    try {
      await fetch(`/api/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFoundingProducer }),
      })
      fetchData()
    } catch (error) {
      console.error('Error updating founding status:', error)
    }
  }

  const createCompany = async () => {
    const { name, contactEmail } = newCompanyForm
    if (!name.trim() || !contactEmail.trim()) {
      alert('Name and contact email are required')
      return
    }
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newCompanyForm, status: 'APPROVED' }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Failed to create company')
        return
      }
      setShowNewCompanyForm(false)
      setNewCompanyForm({ name: '', contactEmail: '', region: '', country: 'Italy', phone: '', website: '', bio: '', description: '' })
      fetchData()
    } catch (error) {
      console.error('Error creating company:', error)
    }
  }

  const importWine = async (wine: (typeof WINES)[0]) => {
    const producer = PRODUCERS.find((p) => p.id === wine.producerId)
    const isFoundingWine = producer?.collection === 'classical' ? true : false
    setImportingWineId(wine.id)
    try {
      const res = await fetch('/api/admin/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: wine.id,
          slug: wine.slug,
          name: wine.displayName,
          description: wine.description,
          type: wine.type,
          appellation: wine.appellation,
          region: wine.region,
          producerId: wine.producerId,
          internalWholesalePriceEUR: wine.internalWholesalePriceEUR,
          consumerPurchasePriceUSD: wine.consumerPurchasePriceUSD,
          isFoundingWine,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Import failed')
        return
      }
      fetchData()
    } catch {
      alert('Network error importing wine')
    } finally {
      setImportingWineId(null)
    }
  }

  const updateCustomerProfile = async () => {
    if (!editingCustomer) return
    try {
      const res = await fetch(`/api/admin/customers/${editingCustomer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingCustomer.name,
          firstName: editingCustomer.firstName,
          lastName: editingCustomer.lastName,
          email: editingCustomer.email,
          phone: editingCustomer.phone,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Failed to update customer')
        return
      }
      setEditingCustomer(null)
      fetchData()
    } catch {
      alert('Network error updating customer')
    }
  }

  const syncPriceToDB = async (wine: (typeof WINES)[0]) => {
    const dbProduct = products.find((p) => p.slug === wine.slug || p.slug === wine.id)
    if (!dbProduct) { alert(`${wine.displayName} is not yet in the database. Import it first from the Products tab.`); return }
    setSyncingPriceId(wine.id)
    try {
      await fetch(`/api/products/${dbProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retailPriceCents: Math.round(wine.consumerPurchasePriceUSD * 100) }),
      })
      fetchData()
    } catch {
      alert('Network error syncing price')
    } finally {
      setSyncingPriceId(null)
    }
  }

  const syncAllPricesToDB = async () => {
    const inDB = WINES.filter((w) => products.find((p) => p.slug === w.slug || p.slug === w.id))
    if (inDB.length === 0) { alert('No portfolio wines are in the database yet. Import them from the Products tab first.'); return }
    if (!confirm(`Sync computed consumer prices for ${inDB.length} wines to the database?`)) return
    setSyncingAllPrices(true)
    try {
      for (const wine of inDB) {
        const dbProduct = products.find((p) => p.slug === wine.slug || p.slug === wine.id)!
        await fetch(`/api/products/${dbProduct.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ retailPriceCents: Math.round(wine.consumerPurchasePriceUSD * 100) }),
        })
      }
      fetchData()
    } catch {
      alert('Error syncing prices')
    } finally {
      setSyncingAllPrices(false)
    }
  }

  const importAllMissingWines = async () => {    const missing = WINES.filter((w) => !products.find((p) => p.slug === w.slug || p.slug === w.id))
    if (missing.length === 0) { alert('All wines are already in the database.'); return }
    if (!confirm(`Import ${missing.length} missing wine(s) to the database?`)) return
    setImportingAll(true)
    try {
      for (const wine of missing) {
        const producer = PRODUCERS.find((p) => p.id === wine.producerId)
        const isFoundingWine = producer?.collection === 'classical' ? true : false
        await fetch('/api/admin/products/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: wine.id, slug: wine.slug, name: wine.displayName, description: wine.description,
            type: wine.type, appellation: wine.appellation, region: wine.region,
            producerId: wine.producerId, internalWholesalePriceEUR: wine.internalWholesalePriceEUR,
            consumerPurchasePriceUSD: wine.consumerPurchasePriceUSD, isFoundingWine,
          }),
        })
      }
      fetchData()
    } catch {
      alert('Error during bulk import')
    } finally {
      setImportingAll(false)
    }
  }

  const deleteCompany = async (companyId: string, companyName: string) => {
    if (!confirm(`Delete "${companyName}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/companies/${companyId}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Failed to delete company')
        return
      }
      fetchData()
    } catch (error) {
      console.error('Error deleting company:', error)
    }
  }

  const updateRestaurantStatus = async (restaurantId: string, status: string) => {
    try {
      await fetch(`/api/restaurants/${restaurantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      fetchData()
    } catch (error) {
      console.error('Error updating restaurant status:', error)
    }
  }

  const updateRestaurantContentStatus = async (restaurantId: string, contentStatus: string) => {
    try {
      await fetch(`/api/restaurants/${restaurantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentStatus }),
      })
      fetchData()
    } catch (error) {
      console.error('Error updating restaurant content status:', error)
    }
  }

  const toggleRestaurantFeatured = async (restaurantId: string, isFeatured: boolean) => {
    try {
      await fetch(`/api/restaurants/${restaurantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured }),
      })
      fetchData()
    } catch (error) {
      console.error('Error toggling featured status:', error)
    }
  }

  const createRestaurant = async () => {
    const { name, slug, address, city, state, zipCode } = newRestaurantForm
    if (!name || !slug || !address || !city || !state || !zipCode) {
      alert('Name, slug, address, city, state, and zip are required')
      return
    }
    try {
      const res = await fetch('/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRestaurantForm),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Failed to create restaurant')
        return
      }
      setShowNewRestaurantForm(false)
      setNewRestaurantForm({ name: '', slug: '', address: '', city: '', state: 'MA', zipCode: '', website: '', cuisineType: '', priceRange: '', description: '' })
      fetchData()
    } catch (error) {
      console.error('Error creating restaurant:', error)
    }
  }

  const assignWine = async () => {
    if (!assignWinePanel || !wineAssignForm.productId) return
    try {
      const res = await fetch(`/api/restaurants/${assignWinePanel.restaurantId}/wines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wineAssignForm),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Failed to assign wine')
        return
      }
      setWineAssignForm({ productId: '', servingType: 'BOTTLE_LIST', notes: '' })
      fetchData()
    } catch (error) {
      console.error('Error assigning wine:', error)
    }
  }

  const removeWine = async (restaurantId: string, productId: string) => {
    try {
      await fetch(`/api/restaurants/${restaurantId}/wines?productId=${productId}`, { method: 'DELETE' })
      fetchData()
    } catch (error) {
      console.error('Error removing wine:', error)
    }
  }

  // ── Fulfillment operations helpers ─────────────────────────────────────
  const toggleZoneActive = async (zoneId: string, isActive: boolean) => {
    try {
      await fetch(`/api/delivery-zones/${zoneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })
      fetchData()
    } catch (error) {
      console.error('Error updating zone:', error)
    }
  }

  const toggleRouteActive = async (routeId: string, isActive: boolean) => {
    try {
      await fetch(`/api/delivery-routes/${routeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })
      fetchData()
    } catch (error) {
      console.error('Error updating route:', error)
    }
  }

  const deleteRoute = async (routeId: string) => {
    if (!confirm('Delete this delivery route?')) return
    try {
      await fetch(`/api/delivery-routes/${routeId}`, { method: 'DELETE' })
      fetchData()
    } catch (error) {
      console.error('Error deleting route:', error)
    }
  }

  const createRoute = async () => {
    if (!newRouteForm.zoneId || newRouteForm.deliveryDay === '') return
    try {
      const res = await fetch('/api/delivery-routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zoneId: newRouteForm.zoneId, deliveryDay: parseInt(newRouteForm.deliveryDay) }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Failed to create route')
        return
      }
      setNewRouteForm({ zoneId: '', deliveryDay: '' })
      fetchData()
    } catch (error) {
      console.error('Error creating route:', error)
    }
  }

  const toggleScheduleActive = async (scheduleId: string, isActive: boolean) => {
    try {
      await fetch(`/api/pickup-schedules/${scheduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })
      fetchData()
    } catch (error) {
      console.error('Error updating schedule:', error)
    }
  }

  const deleteSchedule = async (scheduleId: string) => {
    if (!confirm('Delete this pickup schedule?')) return
    try {
      await fetch(`/api/pickup-schedules/${scheduleId}`, { method: 'DELETE' })
      fetchData()
    } catch (error) {
      console.error('Error deleting schedule:', error)
    }
  }

  const createSchedule = async () => {
    if (!newScheduleForm.locationId || newScheduleForm.pickupDay === '') return
    try {
      const res = await fetch('/api/pickup-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId: newScheduleForm.locationId, pickupDay: parseInt(newScheduleForm.pickupDay) }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Failed to create schedule')
        return
      }
      setNewScheduleForm({ locationId: '', pickupDay: '' })
      fetchData()
    } catch (error) {
      console.error('Error creating schedule:', error)
    }
  }

  // Editorial labels for content status
  const contentStatusLabel = (status: string) => {
    switch (status) {
      case 'LIVE': return 'Publicly Introduced'
      case 'READY': return 'Intro Pending'
      case 'IN_REVIEW': return 'Under Review'
      default: return 'Draft'
    }
  }

  const contentStatusStyle = (status: string) => {
    switch (status) {
      case 'LIVE': return 'bg-green-50 text-green-800 border border-green-200'
      case 'READY': return 'bg-blue-50 text-blue-800 border border-blue-200'
      case 'IN_REVIEW': return 'bg-amber-50 text-amber-800 border border-amber-200'
      default: return 'bg-gray-50 text-gray-600 border border-gray-200'
    }
  }

  // render
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow bg-parchment-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-7 h-7 border-2 border-olive-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-olive-500">Loading dashboard…</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-parchment-50">
      <Header />

      <main className="flex-grow">
        {/* Page header */}
        <div className="bg-olive-900 px-6 py-7">
          <div className="max-w-7xl mx-auto flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-olive-400 mb-1">Terra Trionfo</p>
              <h1 className="text-2xl font-serif font-bold text-parchment-100">Operations Dashboard</h1>
            </div>
            {stats && (stats.pendingCompanies > 0 || stats.pendingProducts > 0) && (
              <div className="flex gap-2 pt-1">
                {stats.pendingCompanies > 0 && (
                  <button
                    onClick={() => setActiveTab('companies')}
                    className="text-xs px-3 py-1.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors"
                  >
                    {stats.pendingCompanies} {stats.pendingCompanies === 1 ? 'company' : 'companies'} pending
                  </button>
                )}
                {stats.pendingProducts > 0 && (
                  <button
                    onClick={() => setActiveTab('products')}
                    className="text-xs px-3 py-1.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors"
                  >
                    {stats.pendingProducts} {stats.pendingProducts === 1 ? 'product' : 'products'} pending
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sticky navigation */}
        <div className="bg-white border-b border-olive-200 sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-6">
            <nav className="flex items-center overflow-x-auto">
              {([
                { key: 'overview',               label: 'Overview' },
                { key: 'companies',              label: 'Companies',  badge: stats?.pendingCompanies  },
                { key: 'products',               label: 'Products',   badge: stats?.pendingProducts   },
                { key: 'customers',              label: 'Customers' },
                'divider',
                { key: 'restaurants',            label: 'Restaurants' },
                'divider',
                { key: 'portfolio-pricing',      label: 'Pricing' },
                { key: 'release-intelligence',   label: 'Release Intel' },
                'divider',
                { key: 'fulfillment',            label: 'Fulfillment' },
              ] as const).map((item, i) => {
                if (item === 'divider') {
                  return <div key={`sep-${i}`} className="w-px h-5 bg-olive-200 mx-2 flex-shrink-0" />
                }
                const tab = item as { key: string; label: string; badge?: number }
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`relative flex items-center gap-1.5 px-4 py-[14px] text-sm font-medium whitespace-nowrap transition-colors border-b-2 flex-shrink-0 ${
                      activeTab === tab.key
                        ? 'text-olive-900 border-olive-800'
                        : 'text-olive-500 border-transparent hover:text-olive-800'
                    }`}
                  >
                    {tab.label}
                    {tab.badge != null && tab.badge > 0 && (
                      <span className="text-[9px] font-bold bg-amber-500 text-white rounded-full w-4 h-4 flex items-center justify-center leading-none">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Product edit modal */}
        {editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md mx-4 shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-olive-200">
                <h2 className="text-base font-serif font-bold text-olive-900">Edit Product</h2>
                <button onClick={() => setEditingProduct(null)} className="text-olive-400 hover:text-olive-800 text-lg leading-none transition-colors">✕</button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Retail Price (USD)</label>
                    <input
                      type="number" step="0.01" min="0.01"
                      className="input-field"
                      value={editingProduct.retailPriceDollars}
                      onChange={(e) => setEditingProduct((p) => p ? { ...p, retailPriceDollars: e.target.value } : null)}
                    />
                  </div>
                  <div>
                    <label className="label">Inventory (units)</label>
                    <input
                      type="number" min="0"
                      className="input-field"
                      value={editingProduct.inventory}
                      onChange={(e) => setEditingProduct((p) => p ? { ...p, inventory: e.target.value } : null)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Commerce Model</label>
                    <select
                      className="input-field"
                      value={editingProduct.commerceModel}
                      onChange={(e) => setEditingProduct((p) => p ? { ...p, commerceModel: e.target.value } : null)}
                    >
                      <option value="MARKETPLACE">Marketplace</option>
                      <option value="WHOLESALE">Wholesale</option>
                      <option value="HYBRID">Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Listing Owner</label>
                    <select
                      className="input-field"
                      value={editingProduct.listingOwner}
                      onChange={(e) => setEditingProduct((p) => p ? { ...p, listingOwner: e.target.value } : null)}
                    >
                      <option value="VENDOR">Vendor</option>
                      <option value="TERRA">Terra</option>
                    </select>
                  </div>
                </div>
                <div className="border border-olive-200 bg-parchment-50 p-3 space-y-2">
                  <p className="text-xs font-medium text-olive-500 uppercase tracking-wider mb-2">Flags</p>
                  {([
                    { key: 'isFeatured',        label: 'Featured on storefront' },
                    { key: 'isFoundingWine',     label: 'Founding wine' },
                    { key: 'isLimitedAllocation', label: 'Limited allocation' },
                  ] as const).map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-olive-700"
                        checked={editingProduct[key]}
                        onChange={(e) => setEditingProduct((p) => p ? { ...p, [key]: e.target.checked } : null)}
                      />
                      <span className="text-sm text-olive-800">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 px-6 py-4 border-t border-olive-200 bg-parchment-50">
                <button onClick={saveProductEdit} className="flex-1 py-2.5 bg-olive-800 text-parchment-100 text-sm font-medium hover:bg-olive-900 transition-colors">
                  Save Changes
                </button>
                <button onClick={() => setEditingProduct(null)} className="px-5 py-2.5 border border-olive-300 text-olive-700 text-sm hover:bg-parchment-100 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-6 py-8">

          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Vendors',  value: stats.totalVendors,              alert: stats.pendingCompanies > 0 ? `${stats.pendingCompanies} pending` : null },
                  { label: 'Products', value: stats.totalProducts,             alert: stats.pendingProducts  > 0 ? `${stats.pendingProducts} pending`  : null },
                  { label: 'Orders',   value: stats.totalOrders,               alert: null },
                  { label: 'Revenue',  value: `$${stats.totalRevenue.toFixed(2)}`, alert: null },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white border border-olive-200 p-5">
                    <p className="text-xs font-medium text-olive-500 uppercase tracking-wider mb-2">{stat.label}</p>
                    <p className="text-3xl font-serif font-bold text-olive-900">{stat.value}</p>
                    {stat.alert && <p className="text-xs text-amber-600 mt-1.5">{stat.alert}</p>}
                  </div>
                ))}
              </div>
              <div className="bg-white border border-olive-200 p-6">
                <h2 className="text-base font-semibold text-olive-900 mb-4">Recent Orders</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-olive-200">
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Order ID</th>
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Customer</th>
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Total</th>
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Status</th>
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Date</th>
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(stats.recentOrders) ? stats.recentOrders.map((order) => (
                        <tr key={order.id} className="border-b border-olive-100 last:border-0">
                          <td className="py-3 text-sm font-mono text-olive-500">{order.id.slice(0, 8)}</td>
                          <td className="py-3 text-sm text-olive-800">{order.user.name}</td>
                          <td className="py-3 text-sm font-medium text-olive-900">${order.total.toFixed(2)}</td>
                          <td className="py-3"><span className={`badge badge-${order.status.toLowerCase()}`}>{order.status}</span></td>
                          <td className="py-3 text-sm text-olive-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td className="py-3">
                            <div className="flex gap-1 flex-wrap">
                              {order.status === 'PENDING' && (
                                <button onClick={() => updateOrderStatus(order.id, 'CONFIRMED')} className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200">Confirm</button>
                              )}
                              {order.status === 'CONFIRMED' && (
                                <button onClick={() => updateOrderStatus(order.id, 'SHIPPED')} className="text-xs px-2 py-1 bg-indigo-100 text-indigo-800 rounded hover:bg-indigo-200">Mark Shipped</button>
                              )}
                              {order.status === 'SHIPPED' && (
                                <button onClick={() => updateOrderStatus(order.id, 'DELIVERED')} className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200">Mark Delivered</button>
                              )}
                              {!['DELIVERED', 'CANCELLED'].includes(order.status) && (
                                <button onClick={() => updateOrderStatus(order.id, 'CANCELLED')} className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100">Cancel</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )) : null}
                    </tbody>
                  </table>
                  {(!stats.recentOrders || stats.recentOrders.length === 0) && (
                    <p className="text-sm text-olive-400 text-center py-8">No orders yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Customers Tab */}
          {activeTab === 'customers' && (
            <div className="bg-white border border-olive-200 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-olive-900">Consumer Accounts</h2>
                <p className="text-sm text-olive-400">{customers.length} registered</p>
              </div>

              {/* Inline edit form */}
              {editingCustomer && (
                <div className="border border-olive-200 bg-parchment-50 p-5 mb-6">
                  <h3 className="text-sm font-semibold text-olive-900 mb-4">Edit Customer</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label">Display Name</label>
                      <input className="input-field" value={editingCustomer.name}
                        onChange={(e) => setEditingCustomer((s) => s && { ...s, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Email</label>
                      <input className="input-field" type="email" value={editingCustomer.email}
                        onChange={(e) => setEditingCustomer((s) => s && { ...s, email: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">First Name</label>
                      <input className="input-field" value={editingCustomer.firstName}
                        onChange={(e) => setEditingCustomer((s) => s && { ...s, firstName: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Last Name</label>
                      <input className="input-field" value={editingCustomer.lastName}
                        onChange={(e) => setEditingCustomer((s) => s && { ...s, lastName: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Phone</label>
                      <input className="input-field" value={editingCustomer.phone}
                        onChange={(e) => setEditingCustomer((s) => s && { ...s, phone: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button onClick={updateCustomerProfile} className="text-sm px-5 py-2 bg-olive-700 text-parchment-100 hover:bg-olive-800 transition-colors">Save Changes</button>
                    <button onClick={() => setEditingCustomer(null)} className="text-sm px-4 py-2 border border-olive-300 text-olive-700 hover:bg-parchment-100 transition-colors">Cancel</button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-olive-200">
                      <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Name / Email</th>
                      <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Phone</th>
                      <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Profile</th>
                      <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Age Verification</th>
                      <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Verified At</th>
                      <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Joined</th>
                      <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-sm text-olive-400">
                          No consumer accounts yet.
                        </td>
                      </tr>
                    ) : customers.map((c) => (
                      <tr key={c.id} className={`border-b border-olive-100 last:border-0 ${editingCustomer?.id === c.id ? 'bg-parchment-50' : ''}`}>
                        <td className="py-3">
                          <p className="text-sm font-medium text-olive-900">
                            {c.firstName || c.lastName
                              ? [c.firstName, c.lastName].filter(Boolean).join(' ')
                              : c.name || '—'}
                          </p>
                          <p className="text-xs text-olive-500">{c.email}</p>
                        </td>
                        <td className="py-3 text-sm text-olive-700">{c.phone || '—'}</td>
                        <td className="py-3">
                          {(c.firstName || c.lastName) ? (
                            <span className="text-[10px] font-medium px-2 py-0.5 bg-green-50 text-green-700 border border-green-200">Complete</span>
                          ) : (
                            <span className="text-[10px] font-medium px-2 py-0.5 bg-parchment-100 text-olive-400 border border-olive-200">Incomplete</span>
                          )}
                        </td>
                        <td className="py-3">
                          {c.ageVerificationStatus === 'ELIGIBLE' && (
                            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-green-100 text-green-800">
                              21+ Eligible
                            </span>
                          )}
                          {c.ageVerificationStatus === 'INELIGIBLE' && (
                            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-red-100 text-red-800">
                              Ineligible
                            </span>
                          )}
                          {(!c.ageVerificationStatus || c.ageVerificationStatus === 'UNVERIFIED') && (
                            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-sm bg-parchment-200 text-olive-500">
                              Unverified
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-sm text-olive-600">
                          {c.ageVerifiedAt
                            ? new Date(c.ageVerifiedAt).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="py-3 text-sm text-olive-600">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3">
                          <div className="flex gap-1 flex-wrap">
                            <button
                              onClick={() => setEditingCustomer({
                                id: c.id,
                                name: c.name || '',
                                firstName: c.firstName || '',
                                lastName: c.lastName || '',
                                email: c.email,
                                phone: c.phone || '',
                              })}
                              className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                            >Edit</button>
                            {c.ageVerificationStatus !== 'ELIGIBLE' && (
                              <button
                                onClick={() => updateAgeVerification(c.id, 'ELIGIBLE')}
                                className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
                              >✓ Verify 21+</button>
                            )}
                            {c.ageVerificationStatus === 'ELIGIBLE' && (
                              <button
                                onClick={() => updateAgeVerification(c.id, 'UNVERIFIED')}
                                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                              >Reset</button>
                            )}
                            {c.ageVerificationStatus !== 'INELIGIBLE' && (
                              <button
                                onClick={() => updateAgeVerification(c.id, 'INELIGIBLE')}
                                className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100"
                              >Flag Ineligible</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Companies Tab */}
          {activeTab === 'companies' && (
            <div className="space-y-6">
              {/* Add Company panel */}
              <div className="bg-white border border-olive-200 p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-base font-semibold text-olive-900">Producer Companies</h2>
                    <p className="text-sm text-olive-400 mt-0.5">
                      {companies.length} {companies.length === 1 ? 'company' : 'companies'} · Content status controls public producer visibility
                    </p>
                  </div>
                  <button
                    onClick={() => setShowNewCompanyForm(!showNewCompanyForm)}
                    className="text-sm px-4 py-2 bg-olive-700 text-parchment-100 hover:bg-olive-800 transition-colors"
                  >
                    {showNewCompanyForm ? 'Cancel' : '+ Add Company'}
                  </button>
                </div>

                {showNewCompanyForm && (
                  <div className="border border-olive-200 bg-parchment-50 p-5 mb-6">
                    <h3 className="text-sm font-semibold text-olive-900 mb-4">New Producer Company</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="label">Producer Name *</label>
                        <input className="input-field" placeholder="e.g. Stroppiana" value={newCompanyForm.name}
                          onChange={(e) => setNewCompanyForm((f) => ({ ...f, name: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label">Contact Email *</label>
                        <input className="input-field" type="email" placeholder="contact@producer.com" value={newCompanyForm.contactEmail}
                          onChange={(e) => setNewCompanyForm((f) => ({ ...f, contactEmail: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label">Region</label>
                        <input className="input-field" placeholder="e.g. Piemonte, Tuscany" value={newCompanyForm.region}
                          onChange={(e) => setNewCompanyForm((f) => ({ ...f, region: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label">Country</label>
                        <input className="input-field" value={newCompanyForm.country}
                          onChange={(e) => setNewCompanyForm((f) => ({ ...f, country: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label">Phone</label>
                        <input className="input-field" placeholder="+39 …" value={newCompanyForm.phone}
                          onChange={(e) => setNewCompanyForm((f) => ({ ...f, phone: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label">Website</label>
                        <input className="input-field" placeholder="https://" value={newCompanyForm.website}
                          onChange={(e) => setNewCompanyForm((f) => ({ ...f, website: e.target.value }))} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="label">Short Bio</label>
                        <textarea className="input-field" rows={2} placeholder="Brief producer description…" value={newCompanyForm.bio}
                          onChange={(e) => setNewCompanyForm((f) => ({ ...f, bio: e.target.value }))} />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button onClick={createCompany} className="text-sm px-5 py-2 bg-olive-700 text-parchment-100 hover:bg-olive-800 transition-colors">
                        Create Company
                      </button>
                      <button onClick={() => setShowNewCompanyForm(false)} className="text-sm px-4 py-2 border border-olive-300 text-olive-700 hover:bg-parchment-100 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-olive-200">
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Company</th>
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Owner</th>
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Email</th>
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Products</th>
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Status</th>
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Editorial</th>
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companies.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-sm text-olive-400">No companies yet. Add one above.</td>
                        </tr>
                      )}
                      {Array.isArray(companies) ? companies.map((company) => (
                        <tr key={company.id} className="border-b border-olive-100 last:border-0">
                          <td className="py-3 text-sm font-medium text-olive-900">
                            <div className="flex items-center gap-2">
                              {company.name}
                              {company.isFoundingProducer && (
                                <span className="text-[9px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 uppercase tracking-wider">Founding</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 text-sm text-olive-800">{company.owner.name}</td>
                          <td className="py-3 text-sm text-olive-600">{company.contactEmail}</td>
                          <td className="py-3 text-sm text-olive-500 tabular-nums">{company._count?.products ?? 0}</td>
                          <td className="py-3">
                            <span className={`badge badge-${company.status.toLowerCase()}`}>{company.status}</span>
                          </td>
                          <td className="py-3">
                            <span className={`text-[10px] font-medium px-2 py-0.5 ${contentStatusStyle(company.contentStatus ?? 'DRAFT')}`}>
                              {contentStatusLabel(company.contentStatus ?? 'DRAFT')}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex gap-1 flex-wrap">
                              {company.status === 'PENDING' && (
                                <>
                                  <button onClick={() => updateCompanyStatus(company.id, 'APPROVED')} className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200">Approve</button>
                                  <button onClick={() => updateCompanyStatus(company.id, 'REJECTED')} className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200">Reject</button>
                                </>
                              )}
                              {company.status === 'APPROVED' && (
                                <button onClick={() => updateCompanyStatus(company.id, 'REJECTED')} className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100">Revoke</button>
                              )}
                              {company.status === 'REJECTED' && (
                                <button onClick={() => updateCompanyStatus(company.id, 'APPROVED')} className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200">Re-approve</button>
                              )}
                              {company.contentStatus !== 'LIVE' && (
                                <>
                                  {company.contentStatus === 'DRAFT' && <button onClick={() => updateCompanyContentStatus(company.id, 'IN_REVIEW')} className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded hover:bg-amber-200">Mark Under Review</button>}
                                  {company.contentStatus === 'IN_REVIEW' && <button onClick={() => updateCompanyContentStatus(company.id, 'READY')} className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200">Mark Intro Pending</button>}
                                  {(company.contentStatus === 'READY' || company.contentStatus === 'IN_REVIEW') && <button onClick={() => updateCompanyContentStatus(company.id, 'LIVE')} className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">Introduce Publicly</button>}
                                </>
                              )}
                              {company.contentStatus === 'LIVE' && (
                                <button onClick={() => updateCompanyContentStatus(company.id, 'READY')} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Withdraw</button>
                              )}
                              <button
                                onClick={() => updateCompanyFoundingStatus(company.id, !company.isFoundingProducer)}
                                className={`text-xs px-2 py-1 rounded hover:opacity-80 transition-opacity ${
                                  company.isFoundingProducer
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {company.isFoundingProducer ? '★ Founding' : '☆ Set Founding'}
                              </button>
                              <button
                                onClick={() => deleteCompany(company.id, company.name)}
                                className="text-xs px-2 py-1 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100"
                                title={company._count?.products ? `${company._count.products} products must be removed first` : 'Delete company'}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (() => {
            const portfolioRows = WINES.map(w => ({
              wine: w,
              dbProduct: products.find(p => p.slug === w.slug || p.slug === w.id),
              producer: PRODUCERS.find(p => p.id === w.producerId),
            }))
            const inDbCount      = portfolioRows.filter(x => x.dbProduct).length
            const approvedCount  = portfolioRows.filter(x => x.dbProduct?.status === 'APPROVED').length
            const pendingCount   = portfolioRows.filter(x => x.dbProduct?.status === 'PENDING').length
            const notInDbCount   = WINES.length - inDbCount
            const monitorColors: Record<string, string> = {
              HIGH_DEMAND:         'bg-emerald-50 text-emerald-800 border border-emerald-200',
              NEEDS_REVIEW:        'bg-amber-50 text-amber-800 border border-amber-200',
              ALLOCATION_PRESSURE: 'bg-red-50 text-red-700 border border-red-200',
              UPCOMING_INTEREST:   'bg-blue-50 text-blue-700 border border-blue-200',
              UNDERPERFORMING:     'bg-gray-50 text-gray-500 border border-gray-200',
              STABLE:              'bg-parchment-50 text-olive-500 border border-olive-200',
            }
            const tierColors: Record<string, string> = {
              PRIORITY: 'text-violet-700',
              LIMITED:  'text-amber-700',
              STANDARD: 'text-sky-600',
              LOW:      'text-gray-400',
            }
            return (
              <div className="space-y-4">
                {/* Header card */}
                <div className="bg-white border border-olive-200 p-5">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-olive-400 mb-1">Catalog Management</p>
                      <h2 className="text-2xl font-serif font-bold text-olive-900">Portfolio Wines</h2>
                    </div>
                    <button
                      onClick={importAllMissingWines}
                      disabled={importingAll}
                      className="shrink-0 text-sm px-4 py-2 bg-olive-700 text-parchment-100 hover:bg-olive-800 disabled:opacity-50 transition-colors"
                    >
                      {importingAll ? 'Importing…' : 'Import All Missing'}
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {([
                      ['Total in Catalog', WINES.length,    'text-olive-900'],
                      ['Imported to DB',   inDbCount,       'text-sky-700'],
                      ['Approved',         approvedCount,   'text-emerald-700'],
                      ['Pending Review',   pendingCount,    'text-amber-700'],
                    ] as const).map(([label, count, color]) => (
                      <div key={label} className="border border-olive-100 bg-parchment-50 px-4 py-3">
                        <p className={`text-2xl font-serif font-bold ${color}`}>{count}</p>
                        <p className="text-[10px] font-medium text-olive-400 uppercase tracking-wider mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Table card */}
                <div className="bg-white border border-olive-200">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[960px]">
                      <thead>
                        <tr className="border-b border-olive-200 bg-parchment-50/60 text-left">
                          <th className="px-4 py-3 text-[10px] font-medium text-olive-500 uppercase tracking-wider">Wine</th>
                          <th className="px-4 py-3 text-[10px] font-medium text-olive-500 uppercase tracking-wider whitespace-nowrap">Estate</th>
                          <th className="px-4 py-3 text-[10px] font-medium text-olive-500 uppercase tracking-wider whitespace-nowrap">Price</th>
                          <th className="px-4 py-3 text-[10px] font-medium text-olive-500 uppercase tracking-wider">Inv.</th>
                          <th className="px-4 py-3 text-[10px] font-medium text-olive-500 uppercase tracking-wider whitespace-nowrap">DB Status</th>
                          <th className="px-4 py-3 text-[10px] font-medium text-olive-500 uppercase tracking-wider">Editorial</th>
                          <th className="px-4 py-3 text-[10px] font-medium text-olive-500 uppercase tracking-wider">Intel</th>
                          <th className="px-4 py-3 text-[10px] font-medium text-olive-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-olive-100">
                        {portfolioRows.map(({ wine, dbProduct, producer }) => (
                          <tr
                            key={wine.id}
                            className={!dbProduct ? 'bg-gray-50/50' : undefined}
                          >
                            {/* Wine */}
                            <td className="px-4 py-3 max-w-[220px]">
                              <p className="text-sm font-semibold text-olive-900 leading-snug">{wine.displayName}</p>
                              <p className="text-[10px] text-olive-400 mt-0.5">{wine.type} · {wine.appellation ?? wine.region}</p>
                              {dbProduct && (dbProduct.isFeatured || dbProduct.isLimitedAllocation || dbProduct.isFoundingWine) && (
                                <div className="flex gap-1 mt-1.5 flex-wrap">
                                  {dbProduct.isFeatured        && <span className="text-[8px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1 py-0.5 uppercase tracking-wider">Featured</span>}
                                  {dbProduct.isLimitedAllocation && <span className="text-[8px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-1 py-0.5 uppercase tracking-wider">Limited</span>}
                                  {dbProduct.isFoundingWine    && <span className="text-[8px] font-semibold text-olive-700 bg-olive-50 border border-olive-200 px-1 py-0.5 uppercase tracking-wider">Founding</span>}
                                </div>
                              )}
                            </td>
                            {/* Estate (producer + region merged) */}
                            <td className="px-4 py-3">
                              <p className="text-sm text-olive-800">{producer?.name ?? wine.producerId}</p>
                              <p className="text-[10px] text-olive-400 mt-0.5">{wine.region}</p>
                            </td>
                            {/* Price */}
                            <td className="px-4 py-3 text-sm font-medium text-olive-900 tabular-nums whitespace-nowrap">
                              ${wine.consumerPurchasePriceUSD.toFixed(2)}
                            </td>
                            {/* Inventory */}
                            <td className="px-4 py-3 text-sm text-olive-600 tabular-nums">
                              {dbProduct ? dbProduct.inventory : <span className="text-olive-200">—</span>}
                            </td>
                            {/* DB Status */}
                            <td className="px-4 py-3">
                              {dbProduct ? (
                                <span className={`badge badge-${dbProduct.status.toLowerCase()}`}>{dbProduct.status}</span>
                              ) : (
                                <span className="text-[10px] font-medium px-2 py-0.5 bg-gray-100 text-gray-400 border border-gray-200">Not in DB</span>
                              )}
                            </td>
                            {/* Editorial */}
                            <td className="px-4 py-3">
                              {dbProduct ? (
                                <span className={`text-[10px] font-medium px-2 py-0.5 ${contentStatusStyle(dbProduct.contentStatus ?? 'DRAFT')}`}>
                                  {contentStatusLabel(dbProduct.contentStatus ?? 'DRAFT')}
                                </span>
                              ) : (
                                <span className="text-olive-200">—</span>
                              )}
                            </td>
                            {/* Intel */}
                            <td className="px-4 py-3">
                              {dbProduct && (() => {
                                const freshness = deriveAnalysisFreshness(dbProduct.lastRecommendationAt)
                                const canRun = dbProduct.status === 'APPROVED' && (freshness === 'NEVER_RUN' || freshness === 'STALE' || freshness === 'AGING')
                                const recStatus = dbProduct.recommendationStatus
                                const resolutionStatus = dbProduct.recommendationResolutionStatus as RecommendationResolutionStatus | null | undefined
                                const hasRec = !!dbProduct.releaseMonitorStatus
                                const isUpdating = updatingRecId === dbProduct.id
                                const isUpdatingResolution = updatingResolutionId === dbProduct.id
                                const recStatusColors: Record<string, string> = {
                                  OPEN:      'bg-sky-50 text-sky-700 border border-sky-200',
                                  REVIEWED:  'bg-violet-50 text-violet-700 border border-violet-200',
                                  ACTIONED:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
                                  DISMISSED: 'bg-gray-50 text-gray-500 border border-gray-200',
                                }
                                return (
                                  <div className="flex flex-col gap-1.5">
                                    {/* Row 1: monitor status + tier */}
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {dbProduct.releaseMonitorStatus ? (
                                        <span className={`text-[9px] font-medium px-1.5 py-0.5 leading-tight ${monitorColors[dbProduct.releaseMonitorStatus] ?? 'bg-white text-olive-400 border border-olive-200'}`}>
                                          {dbProduct.releaseMonitorStatus.replace(/_/g, ' ')}
                                        </span>
                                      ) : (
                                        <span className="text-[9px] text-olive-300 italic">No status</span>
                                      )}
                                      {dbProduct.exposureTier && (
                                        <span className={`text-[9px] font-semibold uppercase tracking-wider ${tierColors[dbProduct.exposureTier] ?? 'text-olive-400'}`}>
                                          {dbProduct.exposureTier}
                                        </span>
                                      )}
                                    </div>
                                    {/* Row 2: freshness + run button */}
                                    <div className="flex items-center gap-1.5">
                                      <span className={`text-[9px] px-1.5 py-0.5 ${FRESHNESS_BADGE_CLASS[freshness]}`}>
                                        {FRESHNESS_LABEL[freshness]}
                                      </span>
                                      {canRun && (
                                        <button
                                          onClick={() => runIntelForProduct(dbProduct.id)}
                                          disabled={runningIntelId === dbProduct.id}
                                          className="text-[9px] px-1.5 py-0.5 bg-olive-100 text-olive-700 hover:bg-olive-200 disabled:opacity-50 transition-colors"
                                        >
                                          {runningIntelId === dbProduct.id ? '…' : '⚡ Run'}
                                        </button>
                                      )}
                                    </div>
                                    {/* Row 3: recommendation workflow (only when a status exists) */}
                                    {hasRec && (
                                      <div className="flex flex-col gap-1 pt-0.5 border-t border-olive-100">
                                        {recStatus && (
                                          <span className={`text-[9px] font-medium px-1.5 py-0.5 w-fit ${recStatusColors[recStatus] ?? 'bg-gray-50 text-gray-400 border border-gray-200'}`}>
                                            {recStatus}
                                          </span>
                                        )}
                                        <div className="flex gap-1 flex-wrap">
                                          {(!recStatus || recStatus === 'OPEN') && (
                                            <button
                                              onClick={() => updateRecommendation(dbProduct.id, 'REVIEWED')}
                                              disabled={isUpdating}
                                              className="text-[9px] px-1.5 py-0.5 bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 disabled:opacity-50 transition-colors"
                                            >
                                              {isUpdating ? '…' : '✓ Review'}
                                            </button>
                                          )}
                                          {(recStatus === 'OPEN' || recStatus === 'REVIEWED') && (
                                            <button
                                              onClick={() => updateRecommendation(dbProduct.id, 'ACTIONED', { recommendationActionType: 'MAINTAIN' })}
                                              disabled={isUpdating}
                                              className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                                            >
                                              {isUpdating ? '…' : '↑ Actioned'}
                                            </button>
                                          )}
                                          {recStatus !== 'DISMISSED' && recStatus !== 'ACTIONED' && (
                                            <button
                                              onClick={() => updateRecommendation(dbProduct.id, 'DISMISSED')}
                                              disabled={isUpdating}
                                              className="text-[9px] px-1.5 py-0.5 bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                                            >
                                              {isUpdating ? '…' : '✕'}
                                            </button>
                                          )}
                                          {(recStatus === 'ACTIONED' || recStatus === 'DISMISSED') && (
                                            <button
                                              onClick={() => updateRecommendation(dbProduct.id, 'OPEN')}
                                              disabled={isUpdating}
                                              className="text-[9px] px-1.5 py-0.5 bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100 disabled:opacity-50 transition-colors"
                                            >
                                              {isUpdating ? '…' : '↺ Reopen'}
                                            </button>
                                          )}
                                        </div>
                                        {/* Row 4: resolution outcome (only when ACTIONED) */}
                                        {recStatus === 'ACTIONED' && (() => {
                                          const effDelta = dbProduct.effectivenessDelta as EffectivenessDelta | null | undefined
                                          const preScore  = dbProduct.preActionSignalScore
                                          const postScore = dbProduct.postActionSignalScore
                                          const effReason = dbProduct.effectivenessReason
                                          return (
                                          <div className="flex flex-col gap-1 pt-0.5 border-t border-olive-100">
                                            <p className="text-[8px] font-medium text-olive-400 uppercase tracking-wider">Outcome</p>
                                            {resolutionStatus ? (
                                              <span className={`text-[9px] font-medium px-1.5 py-0.5 w-fit ${RESOLUTION_BADGE_CLASS[resolutionStatus] ?? 'bg-gray-50 text-gray-400 border border-gray-200'}`}>
                                                {RESOLUTION_LABEL[resolutionStatus]}
                                              </span>
                                            ) : (
                                              <span className="text-[9px] text-olive-300 italic">Not assessed</span>
                                            )}
                                            {/* Effectiveness delta */}
                                            {effDelta ? (
                                              <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-1">
                                                  <span className={`text-[9px] font-medium px-1.5 py-0.5 ${EFFECTIVENESS_BADGE_CLASS[effDelta] ?? 'bg-gray-50 text-gray-400 border border-gray-200'}`}>
                                                    {EFFECTIVENESS_ICON[effDelta]} {EFFECTIVENESS_LABEL[effDelta]}
                                                  </span>
                                                  {preScore != null && postScore != null && (
                                                    <span className="text-[8px] text-olive-400">
                                                      {preScore} → {postScore} pts
                                                    </span>
                                                  )}
                                                </div>
                                                {effReason && (
                                                  <p className="text-[8px] text-olive-400 italic leading-tight max-w-[200px]" title={effReason}>
                                                    {effReason.length > 80 ? effReason.slice(0, 80) + '…' : effReason}
                                                  </p>
                                                )}
                                              </div>
                                            ) : (
                                              <span className="text-[8px] text-olive-300 italic">Effectiveness not yet measured — run follow-up check</span>
                                            )}
                                            <div className="flex gap-1 flex-wrap">
                                              {resolutionStatus !== 'IMPROVING' && (
                                                <button
                                                  onClick={() => updateResolution(dbProduct.id, 'IMPROVING')}
                                                  disabled={isUpdatingResolution}
                                                  className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 disabled:opacity-50 transition-colors"
                                                >
                                                  {isUpdatingResolution ? '…' : '↗ Improving'}
                                                </button>
                                              )}
                                              {resolutionStatus !== 'RESOLVED' && (
                                                <button
                                                  onClick={() => updateResolution(dbProduct.id, 'RESOLVED')}
                                                  disabled={isUpdatingResolution}
                                                  className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                                                >
                                                  {isUpdatingResolution ? '…' : '✓ Resolved'}
                                                </button>
                                              )}
                                              {resolutionStatus !== 'REQUIRES_FOLLOW_UP' && (
                                                <button
                                                  onClick={() => updateResolution(dbProduct.id, 'REQUIRES_FOLLOW_UP')}
                                                  disabled={isUpdatingResolution}
                                                  className="text-[9px] px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50 transition-colors"
                                                >
                                                  {isUpdatingResolution ? '…' : '⚑ Follow-up'}
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                          )
                                        })()}
                                        {/* History toggle */}
                                        <button
                                          onClick={() => fetchRecommendationHistory(dbProduct.id)}
                                          className="text-[9px] text-olive-400 hover:text-olive-600 underline underline-offset-2 transition-colors self-start"
                                        >
                                          {expandedHistoryId === dbProduct.id ? '▲ Hide history' : '▼ View history'}
                                        </button>
                                        {/* History panel */}
                                        {expandedHistoryId === dbProduct.id && (
                                          <div className="mt-1 border-t border-olive-100 pt-1.5">
                                            {loadingHistoryId === dbProduct.id ? (
                                              <p className="text-[9px] text-olive-300 italic">Loading…</p>
                                            ) : !recHistory[dbProduct.id] || recHistory[dbProduct.id].length === 0 ? (
                                              <p className="text-[9px] text-olive-300 italic">No history yet</p>
                                            ) : (
                                              <ol className="space-y-1.5">
                                                {recHistory[dbProduct.id].map((event) => {
                                                  const statusColors: Record<string, string> = {
                                                    OPEN:      'text-sky-700',
                                                    REVIEWED:  'text-violet-700',
                                                    ACTIONED:  'text-emerald-700',
                                                    DISMISSED: 'text-gray-500',
                                                  }
                                                  const ts = new Date(event.createdAt)
                                                  const dateStr = ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
                                                  const timeStr = ts.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                                                  return (
                                                    <li key={event.id} className="flex gap-1.5">
                                                      <div className="w-1 shrink-0 mt-0.5 self-stretch bg-olive-100 rounded-full" />
                                                      <div className="min-w-0">
                                                        <div className="flex items-center gap-1 flex-wrap">
                                                          {event.previousStatus && (
                                                            <span className={`text-[8px] font-medium line-through text-gray-400`}>
                                                              {event.previousStatus}
                                                            </span>
                                                          )}
                                                          {event.previousStatus && <span className="text-[8px] text-gray-300">→</span>}
                                                          <span className={`text-[8px] font-semibold uppercase ${statusColors[event.newStatus] ?? 'text-olive-600'}`}>
                                                            {event.newStatus}
                                                          </span>
                                                          {event.newActionType && event.newActionType !== 'NONE' && (
                                                            <span className="text-[8px] text-olive-400">
                                                              · {event.newActionType.replace(/_/g, ' ')}
                                                            </span>
                                                          )}
                                                          {event.newResolutionStatus && (
                                                            <span className={`text-[8px] px-1 py-px ${RESOLUTION_BADGE_CLASS[event.newResolutionStatus as RecommendationResolutionStatus] ?? 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                                                              {RESOLUTION_LABEL[event.newResolutionStatus as RecommendationResolutionStatus]}
                                                            </span>
                                                          )}
                                                          {event.effectivenessDelta && (
                                                            <span className={`text-[8px] px-1 py-px font-medium ${EFFECTIVENESS_BADGE_CLASS[event.effectivenessDelta as EffectivenessDelta] ?? 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                                                              {EFFECTIVENESS_ICON[event.effectivenessDelta as EffectivenessDelta]} {EFFECTIVENESS_LABEL[event.effectivenessDelta as EffectivenessDelta]}
                                                            </span>
                                                          )}
                                                          {event.preActionSignalScore != null && event.postActionSignalScore != null && (
                                                            <span className="text-[8px] text-olive-400">
                                                              {event.preActionSignalScore}→{event.postActionSignalScore}pts
                                                            </span>
                                                          )}
                                                        </div>
                                                        {event.note && (
                                                          <p className="text-[8px] text-olive-500 italic mt-0.5 truncate max-w-[160px]" title={event.note}>
                                                            "{event.note}"
                                                          </p>
                                                        )}
                                                        <p className="text-[8px] text-olive-300 mt-0.5">
                                                          {event.changedBy.name} · {dateStr} {timeStr}
                                                        </p>
                                                      </div>
                                                    </li>
                                                  )
                                                })}
                                              </ol>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )
                              })()}
                            </td>
                            {/* Actions */}
                            <td className="px-4 py-3">
                              {dbProduct ? (
                                <div className="flex gap-1 flex-wrap">
                                  {dbProduct.status === 'PENDING' && (
                                    <>
                                      <button onClick={() => updateProductStatus(dbProduct.id, 'APPROVED')} className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200">Approve</button>
                                      <button onClick={() => updateProductStatus(dbProduct.id, 'REJECTED')} className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200">Reject</button>
                                    </>
                                  )}
                                  {dbProduct.status === 'APPROVED' && (
                                    <button onClick={() => updateProductStatus(dbProduct.id, 'REJECTED')} className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100">Revoke</button>
                                  )}
                                  {dbProduct.status === 'REJECTED' && (
                                    <button onClick={() => updateProductStatus(dbProduct.id, 'APPROVED')} className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200">Re-approve</button>
                                  )}
                                  {dbProduct.contentStatus !== 'LIVE' && (
                                    <>
                                      {dbProduct.contentStatus === 'DRAFT' && <button onClick={() => updateContentStatus(dbProduct.id, 'IN_REVIEW')} className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded hover:bg-amber-200">Under Review</button>}
                                      {dbProduct.contentStatus === 'IN_REVIEW' && <button onClick={() => updateContentStatus(dbProduct.id, 'READY')} className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200">Intro Pending</button>}
                                      {(dbProduct.contentStatus === 'READY' || dbProduct.contentStatus === 'IN_REVIEW') && <button onClick={() => updateContentStatus(dbProduct.id, 'LIVE')} className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">Go Live</button>}
                                    </>
                                  )}
                                  {dbProduct.contentStatus === 'LIVE' && (
                                    <button onClick={() => updateContentStatus(dbProduct.id, 'READY')} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Withdraw</button>
                                  )}
                                  <button onClick={() => editProduct(dbProduct)} className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200">Edit</button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => importWine(wine)}
                                  disabled={importingWineId === wine.id || importingAll}
                                  className="text-xs px-2 py-1 bg-olive-700 text-parchment-100 rounded hover:bg-olive-800 disabled:opacity-50"
                                >
                                  {importingWineId === wine.id ? 'Importing…' : 'Import'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          })()}
          {/* Restaurants Tab */}
          {activeTab === 'restaurants' && (
            <div className="space-y-6">
              <div className="bg-white border border-olive-200 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-semibold text-olive-900">Restaurant Partners</h2>
                  <button
                    onClick={() => setShowNewRestaurantForm(!showNewRestaurantForm)}
                    className="text-sm px-4 py-2 bg-olive-700 text-parchment-100 hover:bg-olive-800 transition-colors"
                  >
                    {showNewRestaurantForm ? 'Cancel' : '+ Add Restaurant'}
                  </button>
                </div>

                {showNewRestaurantForm && (
                  <div className="border border-olive-200 bg-parchment-50 p-5 mb-6">
                    <h3 className="text-sm font-semibold text-olive-900 mb-4">New Restaurant</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="label">Name *</label>
                        <input className="input-field" value={newRestaurantForm.name}
                          onChange={(e) => {
                            const name = e.target.value
                            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                            setNewRestaurantForm((f) => ({ ...f, name, slug }))
                          }}
                        />
                      </div>
                      <div>
                        <label className="label">Slug *</label>
                        <input className="input-field" value={newRestaurantForm.slug}
                          onChange={(e) => setNewRestaurantForm((f) => ({ ...f, slug: e.target.value }))}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="label">Address *</label>
                        <input className="input-field" value={newRestaurantForm.address}
                          onChange={(e) => setNewRestaurantForm((f) => ({ ...f, address: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="label">City *</label>
                        <input className="input-field" value={newRestaurantForm.city}
                          onChange={(e) => setNewRestaurantForm((f) => ({ ...f, city: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="label">Zip Code *</label>
                        <input className="input-field" value={newRestaurantForm.zipCode}
                          onChange={(e) => setNewRestaurantForm((f) => ({ ...f, zipCode: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="label">Cuisine Type</label>
                        <input className="input-field" placeholder="e.g. Italian, Wine Bar" value={newRestaurantForm.cuisineType}
                          onChange={(e) => setNewRestaurantForm((f) => ({ ...f, cuisineType: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="label">Price Range</label>
                        <input className="input-field" placeholder="e.g. $$, $$$" value={newRestaurantForm.priceRange}
                          onChange={(e) => setNewRestaurantForm((f) => ({ ...f, priceRange: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="label">Website</label>
                        <input className="input-field" placeholder="https://" value={newRestaurantForm.website}
                          onChange={(e) => setNewRestaurantForm((f) => ({ ...f, website: e.target.value }))}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="label">Description</label>
                        <textarea className="input-field" rows={2} value={newRestaurantForm.description}
                          onChange={(e) => setNewRestaurantForm((f) => ({ ...f, description: e.target.value }))}
                        />
                      </div>
                    </div>
                    <button onClick={createRestaurant} className="mt-4 text-sm px-5 py-2 bg-olive-700 text-parchment-100 hover:bg-olive-800 transition-colors">
                      Create Restaurant
                    </button>
                  </div>
                )}

                {/* Wine assignment panel */}
                {assignWinePanel && (
                  <div className="border border-amber-200 bg-amber-50 p-5 mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-olive-900">Assign Wine to: {assignWinePanel.restaurantName}</h3>
                      <button onClick={() => setAssignWinePanel(null)} className="text-xs text-olive-500 hover:text-olive-800">✕ Close</button>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div>
                        <label className="label">Wine / Product *</label>
                        <select className="input-field" value={wineAssignForm.productId}
                          onChange={(e) => setWineAssignForm((f) => ({ ...f, productId: e.target.value }))}
                        >
                          <option value="">Select a wine…</option>
                          {products.filter((p) => p.category === 'WINE' || p.category === 'OLIVE_OIL').map((p) => (
                            <option key={p.id} value={p.id}>{p.name} — {p.company.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="label">Serving Type *</label>
                        <select className="input-field" value={wineAssignForm.servingType}
                          onChange={(e) => setWineAssignForm((f) => ({ ...f, servingType: e.target.value }))}
                        >
                          <option value="BOTTLE_LIST">Bottle List</option>
                          <option value="BY_GLASS">By the Glass</option>
                        </select>
                      </div>
                      <div>
                        <label className="label">Notes (optional)</label>
                        <input className="input-field" placeholder="Sommelier note…" value={wineAssignForm.notes}
                          onChange={(e) => setWineAssignForm((f) => ({ ...f, notes: e.target.value }))}
                        />
                      </div>
                    </div>
                    <button onClick={assignWine} className="mt-3 text-sm px-4 py-1.5 bg-amber-600 text-white hover:bg-amber-700 transition-colors">
                      Assign Wine
                    </button>
                  </div>
                )}

                {/* Restaurant table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-olive-200">
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Name</th>
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Location</th>
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Wines</th>
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Status</th>
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Editorial</th>
                        <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {restaurants.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-sm text-olive-500">
                            No restaurants yet. Add one above.
                          </td>
                        </tr>
                      )}
                      {restaurants.map((r) => (
                        <tr key={r.id} className="border-b border-olive-100">
                          <td className="py-3 text-sm font-medium text-olive-900">
                            <div className="flex items-center gap-2">
                              {r.name}
                              {r.isFeatured && (
                                <span className="text-[9px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 uppercase tracking-wider">Featured</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 text-sm text-olive-600">{r.city}, {r.state}</td>
                          <td className="py-3 text-sm text-olive-600">
                            <div className="space-y-0.5">
                              {r.wines.slice(0, 2).map((w) => (
                                <div key={w.id} className="flex items-center gap-1.5">
                                  <span className="text-xs text-olive-700">{w.product.name}</span>
                                  <span className="text-[10px] text-olive-400">
                                    {w.servingType === 'BY_GLASS' ? '🍷 Glass' : '🍾 Bottle'}
                                  </span>
                                  <button
                                    onClick={() => removeWine(r.id, w.product.id)}
                                    className="text-[10px] text-red-400 hover:text-red-600 ml-1"
                                    title="Remove"
                                  >✕</button>
                                </div>
                              ))}
                              {r.wines.length > 2 && (
                                <span className="text-xs text-olive-400">+{r.wines.length - 2} more</span>
                              )}
                              {r.wines.length === 0 && (
                                <span className="text-xs text-olive-400 italic">no wines</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3">
                            <span className={`badge badge-${r.status.toLowerCase()}`}>{r.status}</span>
                          </td>
                          <td className="py-3">
                            <span className={`text-[10px] font-medium px-2 py-0.5 ${contentStatusStyle(r.contentStatus ?? 'DRAFT')}`}>
                              {contentStatusLabel(r.contentStatus ?? 'DRAFT')}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="flex gap-1 flex-wrap">
                              {r.status === 'PENDING' && (
                                <>
                                  <button onClick={() => updateRestaurantStatus(r.id, 'APPROVED')} className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200">Approve</button>
                                  <button onClick={() => updateRestaurantStatus(r.id, 'REJECTED')} className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200">Reject</button>
                                </>
                              )}
                              {r.contentStatus !== 'LIVE' && (
                                <>
                                  {r.contentStatus === 'DRAFT' && <button onClick={() => updateRestaurantContentStatus(r.id, 'IN_REVIEW')} className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded hover:bg-amber-200">Under Review</button>}
                                  {r.contentStatus === 'IN_REVIEW' && <button onClick={() => updateRestaurantContentStatus(r.id, 'READY')} className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200">Intro Pending</button>}
                                  {(r.contentStatus === 'READY' || r.contentStatus === 'IN_REVIEW') && <button onClick={() => updateRestaurantContentStatus(r.id, 'LIVE')} className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">Publish</button>}
                                </>
                              )}
                              {r.contentStatus === 'LIVE' && (
                                <button onClick={() => updateRestaurantContentStatus(r.id, 'READY')} className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Unpublish</button>
                              )}
                              <button
                                onClick={() => toggleRestaurantFeatured(r.id, !r.isFeatured)}
                                className={`text-xs px-2 py-1 rounded hover:opacity-80 ${r.isFeatured ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}`}
                              >
                                {r.isFeatured ? '★ Featured' : '☆ Feature'}
                              </button>
                              <button
                                onClick={() => setAssignWinePanel({ restaurantId: r.id, restaurantName: r.name })}
                                className="text-xs px-2 py-1 bg-olive-100 text-olive-800 rounded hover:bg-olive-200"
                              >
                                + Wine
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Fulfillment Tab */}
          {activeTab === 'fulfillment' && (
            <div className="space-y-6">
              {/* Sub-tab bar */}
              <div className="flex gap-2 border-b border-olive-200">
                {([
                  { key: 'zones', label: 'Delivery Zones' },
                  { key: 'routes', label: 'Delivery Routes' },
                  { key: 'schedules', label: 'Pickup Schedules' },
                ] as const).map((st) => (
                  <button
                    key={st.key}
                    onClick={() => setFulfillmentSubTab(st.key)}
                    className={`px-5 py-2.5 text-sm font-medium transition-colors ${
                      fulfillmentSubTab === st.key
                        ? 'text-olive-900 border-b-2 border-olive-700'
                        : 'text-olive-600 hover:text-olive-800'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Delivery Zones sub-tab */}
              {fulfillmentSubTab === 'zones' && (
                <div className="bg-white border border-olive-200 p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-semibold text-olive-900">Delivery Zones</h2>
                    <p className="text-sm text-olive-400">Enable or disable zones to control checkout availability</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left border-b border-olive-200">
                          <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Zone Name</th>
                          <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Code</th>
                          <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Description</th>
                          <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Status</th>
                          <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deliveryZones.length === 0 && (
                          <tr><td colSpan={5} className="py-8 text-center text-sm text-olive-500">No zones found.</td></tr>
                        )}
                        {deliveryZones.map((zone) => (
                          <tr key={zone.id} className="border-b border-olive-100">
                            <td className="py-3 text-sm font-medium text-olive-900">{zone.name}</td>
                            <td className="py-3 text-xs font-mono text-olive-600">{zone.code}</td>
                            <td className="py-3 text-sm text-olive-600 max-w-xs">{zone.description || <span className="italic text-olive-400">—</span>}</td>
                            <td className="py-3">
                              <span className={`text-xs font-medium px-2 py-0.5 ${zone.isActive ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                                {zone.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="py-3">
                              <button
                                onClick={() => toggleZoneActive(zone.id, !zone.isActive)}
                                className={`text-xs px-3 py-1 rounded hover:opacity-80 transition-opacity ${zone.isActive ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}
                              >
                                {zone.isActive ? 'Disable' : 'Enable'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Delivery Routes sub-tab */}
              {fulfillmentSubTab === 'routes' && (
                <div className="bg-white border border-olive-200 p-6 space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-base font-semibold text-olive-900">Delivery Routes</h2>
                      <p className="text-sm text-olive-400">Assign delivery days to zones</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left border-b border-olive-200">
                            <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Zone</th>
                            <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Delivery Day</th>
                            <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Status</th>
                            <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deliveryRoutes.length === 0 && (
                            <tr><td colSpan={4} className="py-8 text-center text-sm text-olive-500">No routes found.</td></tr>
                          )}
                          {deliveryRoutes.map((route) => (
                            <tr key={route.id} className="border-b border-olive-100">
                              <td className="py-3 text-sm font-medium text-olive-900">{route.zone.name}</td>
                              <td className="py-3 text-sm text-olive-800">{route.deliveryDayName}</td>
                              <td className="py-3">
                                <span className={`text-xs font-medium px-2 py-0.5 ${route.isActive ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                                  {route.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="py-3">
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => toggleRouteActive(route.id, !route.isActive)}
                                    className={`text-xs px-2 py-1 rounded hover:opacity-80 ${route.isActive ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-green-50 text-green-700 border border-green-200'}`}
                                  >
                                    {route.isActive ? 'Pause' : 'Activate'}
                                  </button>
                                  <button
                                    onClick={() => deleteRoute(route.id)}
                                    className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 border border-red-200 hover:opacity-80"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Add new route */}
                  <div className="border border-olive-200 bg-parchment-50 p-4">
                    <h3 className="text-sm font-semibold text-olive-900 mb-3">Add Delivery Route</h3>
                    <div className="flex gap-3 flex-wrap items-end">
                      <div>
                        <label className="label">Zone</label>
                        <select className="input-field" value={newRouteForm.zoneId} onChange={(e) => setNewRouteForm((f) => ({ ...f, zoneId: e.target.value }))}>
                          <option value="">Select zone…</option>
                          {deliveryZones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="label">Delivery Day</label>
                        <select className="input-field" value={newRouteForm.deliveryDay} onChange={(e) => setNewRouteForm((f) => ({ ...f, deliveryDay: e.target.value }))}>
                          <option value="">Select day…</option>
                          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d, i) => (
                            <option key={i} value={i}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <button onClick={createRoute} className="text-sm px-4 py-2 bg-olive-700 text-parchment-100 hover:bg-olive-800 transition-colors">
                        Add Route
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Pickup Schedules sub-tab */}
              {fulfillmentSubTab === 'schedules' && (
                <div className="bg-white border border-olive-200 p-6 space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-base font-semibold text-olive-900">Pickup Schedules</h2>
                      <p className="text-sm text-olive-400">Configure pickup days per location</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left border-b border-olive-200">
                            <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Location</th>
                            <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Pickup Day</th>
                            <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Status</th>
                            <th className="pb-3 text-xs font-medium text-olive-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pickupSchedules.length === 0 && (
                            <tr><td colSpan={4} className="py-8 text-center text-sm text-olive-500">No schedules found.</td></tr>
                          )}
                          {pickupSchedules.map((sched) => (
                            <tr key={sched.id} className="border-b border-olive-100">
                              <td className="py-3 text-sm font-medium text-olive-900">{sched.location.name}</td>
                              <td className="py-3 text-sm text-olive-800">{sched.pickupDayName}</td>
                              <td className="py-3">
                                <span className={`text-xs font-medium px-2 py-0.5 ${sched.isActive ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                                  {sched.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="py-3">
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => toggleScheduleActive(sched.id, !sched.isActive)}
                                    className={`text-xs px-2 py-1 rounded hover:opacity-80 ${sched.isActive ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-green-50 text-green-700 border border-green-200'}`}
                                  >
                                    {sched.isActive ? 'Pause' : 'Activate'}
                                  </button>
                                  <button
                                    onClick={() => deleteSchedule(sched.id)}
                                    className="text-xs px-2 py-1 rounded bg-red-50 text-red-700 border border-red-200 hover:opacity-80"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Add new schedule */}
                  <div className="border border-olive-200 bg-parchment-50 p-4">
                    <h3 className="text-sm font-semibold text-olive-900 mb-3">Add Pickup Schedule</h3>
                    <div className="flex gap-3 flex-wrap items-end">
                      <div>
                        <label className="label">Location</label>
                        <select className="input-field" value={newScheduleForm.locationId} onChange={(e) => setNewScheduleForm((f) => ({ ...f, locationId: e.target.value }))}>
                          <option value="">Select location…</option>
                          {pickupLocationsList.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="label">Pickup Day</label>
                        <select className="input-field" value={newScheduleForm.pickupDay} onChange={(e) => setNewScheduleForm((f) => ({ ...f, pickupDay: e.target.value }))}>
                          <option value="">Select day…</option>
                          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d, i) => (
                            <option key={i} value={i}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <button onClick={createSchedule} className="text-sm px-4 py-2 bg-olive-700 text-parchment-100 hover:bg-olive-800 transition-colors">
                        Add Schedule
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Portfolio Pricing Tab */}
          {activeTab === 'portfolio-pricing' && (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-amber-600 mb-1">Internal Use Only · Not visible to consumers</p>
                  <h2 className="text-2xl font-serif font-bold text-olive-900 mb-1">Portfolio Pricing</h2>
                  <p className="text-sm text-olive-500">Full distribution chain economics for all 21 portfolio wines. Consumers see only the final marketplace price.</p>
                </div>
                <button
                  onClick={syncAllPricesToDB}
                  disabled={syncingAllPrices}
                  className="shrink-0 text-sm px-4 py-2 bg-olive-700 text-parchment-100 hover:bg-olive-800 disabled:opacity-50 transition-colors"
                >
                  {syncingAllPrices ? 'Syncing…' : 'Sync All Prices → DB'}
                </button>
              </div>

              {/* Chain legend */}
              <div className="flex flex-wrap gap-3 text-[10px] font-medium uppercase tracking-wider">
                {[
                  { label: 'EUR Cost', color: 'text-olive-400' },
                  { label: 'USD Cost', color: 'text-olive-400' },
                  { label: 'Importer Sell', color: 'text-olive-600' },
                  { label: 'Distributor', color: 'text-olive-600' },
                  { label: 'Retail Est.', color: 'text-olive-700' },
                  { label: 'Restaurant', color: 'text-olive-600' },
                  { label: 'Consumer ✓', color: 'text-amber-700 font-bold' },
                ].map((col) => (
                  <span key={col.label} className={`${col.color} border border-olive-200 px-2 py-0.5 bg-parchment-50`}>{col.label}</span>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-olive-300 text-left">
                      <th className="py-3 pr-4 text-[10px] font-medium text-olive-600 uppercase tracking-wider">Wine</th>
                      <th className="py-3 px-3 text-[10px] font-medium text-olive-400 uppercase tracking-wider">EUR Cost</th>
                      <th className="py-3 px-3 text-[10px] font-medium text-olive-400 uppercase tracking-wider">USD Cost</th>
                      <th className="py-3 px-3 text-[10px] font-medium text-olive-500 uppercase tracking-wider">Importer Sell</th>
                      <th className="py-3 px-3 text-[10px] font-medium text-olive-500 uppercase tracking-wider">Distributor</th>
                      <th className="py-3 px-3 text-[10px] font-medium text-olive-600 uppercase tracking-wider">Retail Est.</th>
                      <th className="py-3 px-3 text-[10px] font-medium text-olive-500 uppercase tracking-wider">Restaurant</th>
                      <th className="py-3 px-3 text-[10px] font-bold text-amber-700 uppercase tracking-wider">Consumer ✓</th>
                      <th className="py-3 px-3 text-[10px] font-medium text-olive-500 uppercase tracking-wider">DB Price</th>
                      <th className="py-3 px-3 text-[10px] font-medium text-olive-500 uppercase tracking-wider">Sync</th>
                    </tr>
                  </thead>
                  <tbody>
                    {WINES.map((wine) => {
                      const producer = PRODUCERS.find((p) => p.id === wine.producerId)
                      const dbProduct = products.find((p) => p.slug === wine.slug || p.slug === wine.id)
                      const canonicalCents = Math.round(wine.consumerPurchasePriceUSD * 100)
                      const dbCents = dbProduct?.retailPriceCents ?? null
                      const inSync = dbCents !== null && dbCents === canonicalCents
                      const drifted = dbCents !== null && dbCents !== canonicalCents
                      return (
                        <tr key={wine.id} className="border-b border-parchment-200 hover:bg-parchment-50 transition-colors">
                          <td className="py-3 pr-4">
                            <p className="font-medium text-olive-900 leading-tight">{wine.displayName}</p>
                            <p className="text-[10px] text-olive-400 mt-0.5">{producer?.name} · {wine.region}</p>
                          </td>
                          <td className="py-3 px-3 text-olive-400 tabular-nums">€{wine.internalWholesalePriceEUR.toFixed(2)}</td>
                          <td className="py-3 px-3 text-olive-400 tabular-nums">${wine.costUSD.toFixed(2)}</td>
                          <td className="py-3 px-3 text-olive-600 tabular-nums">${wine.importerSellPriceUSD.toFixed(2)}</td>
                          <td className="py-3 px-3 text-olive-600 tabular-nums">${wine.distributorWholesalePriceUSD.toFixed(2)}</td>
                          <td className="py-3 px-3 text-olive-700 tabular-nums font-medium">${wine.retailEstimatedPriceUSD.toFixed(2)}</td>
                          <td className="py-3 px-3 text-olive-600 tabular-nums">${wine.restaurantBottlePriceUSD.toFixed(2)}</td>
                          <td className="py-3 px-3 text-amber-700 tabular-nums font-semibold">${wine.consumerPurchasePriceUSD.toFixed(2)}</td>
                          <td className="py-3 px-3 tabular-nums">
                            {dbCents !== null ? (
                              <span className={drifted ? 'text-red-600 font-medium' : 'text-green-700'}>
                                ${(dbCents / 100).toFixed(2)}{drifted && ' ⚠'}
                              </span>
                            ) : (
                              <span className="text-olive-300 italic text-[10px]">Not in DB</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {dbProduct ? (
                              inSync ? (
                                <span className="text-[10px] text-green-600 font-medium">✓ Synced</span>
                              ) : (
                                <button
                                  onClick={() => syncPriceToDB(wine)}
                                  disabled={syncingPriceId === wine.id || syncingAllPrices}
                                  className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 hover:bg-amber-200 disabled:opacity-50 transition-colors"
                                >
                                  {syncingPriceId === wine.id ? '…' : 'Sync'}
                                </button>
                              )
                            ) : (
                              <span className="text-[10px] text-olive-300 italic">—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-olive-300">
                      <td className="py-3 pr-4 text-[10px] font-medium text-olive-500 uppercase tracking-wider">
                        {WINES.length} wines · Multiplier chain: ×1.35 → ×1.30 → ×1.45 → ×2.7
                      </td>
                      <td colSpan={7} className="py-3 px-3 text-[10px] text-olive-400">
                        FX rate EUR/USD = 1.08 · Price bands: $15 $18 $20 $22 $25 $28 $32 $36 $40 $45 $55 $60
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Release Intelligence Tab */}
          {activeTab === 'release-intelligence' && (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-medium tracking-[0.14em] uppercase text-amber-600 mb-1">Internal Use Only · Admin-only intelligence</p>
                  <h2 className="text-2xl font-serif font-bold text-olive-900 mb-1">Release Intelligence</h2>
                  <p className="text-sm text-olive-500">Time-decayed demand signals → release timing, allocation, and catalog exposure recommendations.</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={runAllIntel}
                    disabled={runningAllIntel || loadingIntelligence}
                    className="text-sm px-4 py-2 border border-olive-300 text-olive-700 hover:bg-parchment-100 disabled:opacity-50 transition-colors"
                  >
                    {runningAllIntel ? 'Running…' : '⚡ Refresh All Intel'}
                  </button>
                  <button
                    onClick={() => { setReleaseIntelligence(null); fetchReleaseIntelligence() }}
                    disabled={loadingIntelligence}
                    className="text-sm px-4 py-2 bg-olive-700 text-parchment-100 hover:bg-olive-800 disabled:opacity-50 transition-colors"
                  >
                    {loadingIntelligence ? 'Refreshing…' : '↻ Refresh'}
                  </button>
                </div>
              </div>

              {/* Analysis Coverage — computed from products state, always visible */}
              {(() => {
                const approved = products.filter(p => p.status === 'APPROVED')
                const counts: Record<AnalysisFreshness, number> = { NEVER_RUN: 0, FRESH: 0, AGING: 0, STALE: 0 }
                for (const p of approved) counts[deriveAnalysisFreshness(p.lastRecommendationAt)]++
                const tiers: Array<[AnalysisFreshness, string, string]> = [
                  ['NEVER_RUN', 'Never Analyzed', 'border-gray-200 bg-gray-50'],
                  ['FRESH',     'Fresh',           'border-emerald-200 bg-emerald-50'],
                  ['AGING',     'Aging',           'border-amber-200 bg-amber-50'],
                  ['STALE',     'Stale',           'border-red-200 bg-red-50'],
                ]
                return (
                  <div className="bg-white border border-olive-200 p-4">
                    <p className="text-[10px] font-medium text-olive-400 uppercase tracking-wider mb-3">
                      Analysis Coverage · {approved.length} approved product{approved.length !== 1 ? 's' : ''}
                    </p>
                    <div className="grid grid-cols-4 gap-3">
                      {tiers.map(([key, label, color]) => (
                        <div key={key} className={`border ${color} p-3 text-center`}>
                          <p className="text-2xl font-serif font-bold text-olive-900">{counts[key]}</p>
                          <p className="text-[10px] font-medium text-olive-500 uppercase tracking-wider mt-1">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* Recommendation Workflow Status — computed from products with a releaseMonitorStatus */}
              {(() => {
                const withRec   = products.filter(p => p.status === 'APPROVED' && p.releaseMonitorStatus)
                const recCounts = { OPEN: 0, REVIEWED: 0, ACTIONED: 0, DISMISSED: 0, UNTRACKED: 0 }
                let staleOpen   = 0
                for (const p of withRec) {
                  const s = p.recommendationStatus
                  if (!s) {
                    recCounts.UNTRACKED++
                  } else if (s in recCounts) {
                    recCounts[s as keyof typeof recCounts]++
                  }
                  // Stale open = OPEN (or untracked) + intelligence is STALE or NEVER_RUN
                  const freshness = deriveAnalysisFreshness(p.lastRecommendationAt)
                  if ((!s || s === 'OPEN') && (freshness === 'STALE' || freshness === 'NEVER_RUN')) {
                    staleOpen++
                  }
                }
                const tiles: Array<[string, number, string, string]> = [
                  ['OPEN',      recCounts.OPEN,      'Open',      'border-sky-200 bg-sky-50 text-sky-700'],
                  ['REVIEWED',  recCounts.REVIEWED,  'Reviewed',  'border-violet-200 bg-violet-50 text-violet-700'],
                  ['ACTIONED',  recCounts.ACTIONED,  'Actioned',  'border-emerald-200 bg-emerald-50 text-emerald-700'],
                  ['DISMISSED', recCounts.DISMISSED, 'Dismissed', 'border-gray-200 bg-gray-50 text-gray-500'],
                ]
                return (
                  <div className="bg-white border border-olive-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-medium text-olive-400 uppercase tracking-wider">
                        Recommendation Workflow · {withRec.length} active recommendation{withRec.length !== 1 ? 's' : ''}
                      </p>
                      {staleOpen > 0 && (
                        <span className="text-[9px] font-semibold px-2 py-0.5 bg-red-50 text-red-600 border border-red-200">
                          {staleOpen} stale open
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {tiles.map(([key, count, label, color]) => (
                        <div key={key} className={`border ${color.split(' ').slice(0, 2).join(' ')} p-3 text-center`}>
                          <p className={`text-2xl font-serif font-bold ${color.split(' ').slice(2).join(' ')}`}>{count}</p>
                          <p className="text-[10px] font-medium text-olive-500 uppercase tracking-wider mt-1">{label}</p>
                        </div>
                      ))}
                    </div>
                    {recCounts.UNTRACKED > 0 && (
                      <p className="text-[9px] text-olive-400 mt-2">
                        + {recCounts.UNTRACKED} with no workflow status yet — use ✓ Review in the Products tab to begin tracking
                      </p>
                    )}
                  </div>
                )
              })()}

              {/* Resolution Outcome — computed from ACTIONED products */}
              {(() => {
                const actioned = products.filter(p => p.status === 'APPROVED' && p.recommendationStatus === 'ACTIONED')
                const resCounts: Record<RecommendationResolutionStatus, number> = {
                  UNRESOLVED: 0, IMPROVING: 0, RESOLVED: 0, REQUIRES_FOLLOW_UP: 0,
                }
                let unassessed = 0
                for (const p of actioned) {
                  const r = p.recommendationResolutionStatus as RecommendationResolutionStatus | null | undefined
                  if (!r) unassessed++
                  else if (r in resCounts) resCounts[r]++
                }
                const tiles: Array<[RecommendationResolutionStatus, string, string]> = [
                  ['UNRESOLVED',         'Awaiting',       'border-amber-200 bg-amber-50 text-amber-800'],
                  ['IMPROVING',          'Improving',      'border-blue-200 bg-blue-50 text-blue-800'],
                  ['RESOLVED',           'Resolved',       'border-emerald-200 bg-emerald-50 text-emerald-800'],
                  ['REQUIRES_FOLLOW_UP', 'Follow-up Req.', 'border-red-200 bg-red-50 text-red-800'],
                ]
                return (
                  <div className="bg-white border border-olive-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-medium text-olive-400 uppercase tracking-wider">
                        Resolution Outcome · {actioned.length} actioned recommendation{actioned.length !== 1 ? 's' : ''}
                      </p>
                      <button
                        onClick={runFollowupCheck}
                        disabled={runningFollowupCheck}
                        className="text-[9px] px-2 py-0.5 bg-olive-100 text-olive-700 hover:bg-olive-200 disabled:opacity-50 transition-colors"
                      >
                        {runningFollowupCheck ? 'Checking…' : '⟳ Run Follow-up Check'}
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {tiles.map(([key, label, color]) => (
                        <div key={key} className={`border ${color.split(' ').slice(0, 2).join(' ')} p-3 text-center`}>
                          <p className={`text-2xl font-serif font-bold ${color.split(' ').slice(2).join(' ')}`}>{resCounts[key]}</p>
                          <p className="text-[10px] font-medium text-olive-500 uppercase tracking-wider mt-1">{label}</p>
                        </div>
                      ))}
                    </div>
                    {unassessed > 0 && (
                      <p className="text-[9px] text-olive-400 mt-2">
                        + {unassessed} actioned with no outcome assessed — run the follow-up check or manually set in Products tab
                      </p>
                    )}
                  </div>
                )
              })()}

              {/* Recommendation Effectiveness — computed from actioned products that have a delta */}
              {(() => {
                const actioned = products.filter(p => p.status === 'APPROVED' && p.recommendationStatus === 'ACTIONED')
                const effCounts: Record<EffectivenessDelta, number> = {
                  POSITIVE_SHIFT: 0, NO_MEANINGFUL_CHANGE: 0, NEGATIVE_SHIFT: 0, MIXED_RESULT: 0,
                }
                let unmeasured = 0
                for (const p of actioned) {
                  const e = p.effectivenessDelta as EffectivenessDelta | null | undefined
                  if (!e) unmeasured++
                  else if (e in effCounts) effCounts[e]++
                }
                const measured = actioned.length - unmeasured
                if (actioned.length === 0) return null
                const tiles: Array<[EffectivenessDelta, string]> = [
                  ['POSITIVE_SHIFT',       'border-emerald-200 bg-emerald-50 text-emerald-800'],
                  ['MIXED_RESULT',         'border-amber-200 bg-amber-50 text-amber-800'],
                  ['NO_MEANINGFUL_CHANGE', 'border-gray-200 bg-gray-50 text-gray-600'],
                  ['NEGATIVE_SHIFT',       'border-red-200 bg-red-50 text-red-800'],
                ]
                return (
                  <div className="bg-white border border-olive-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-medium text-olive-400 uppercase tracking-wider">
                        Recommendation Effectiveness · {measured} of {actioned.length} measured
                      </p>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {tiles.map(([key, color]) => (
                        <div key={key} className={`border ${color.split(' ').slice(0, 2).join(' ')} p-3 text-center`}>
                          <p className={`text-2xl font-serif font-bold ${color.split(' ').slice(2).join(' ')}`}>
                            {EFFECTIVENESS_ICON[key]} {effCounts[key]}
                          </p>
                          <p className="text-[10px] font-medium text-olive-500 uppercase tracking-wider mt-1">
                            {EFFECTIVENESS_LABEL[key]}
                          </p>
                        </div>
                      ))}
                    </div>
                    {unmeasured > 0 && (
                      <p className="text-[9px] text-olive-400 mt-2">
                        + {unmeasured} actioned with no effectiveness measurement — run the follow-up check to derive scores
                      </p>
                    )}
                  </div>
                )
              })()}

              {/* Bias Governance — visibility and controls for learned bias weights */}
              {(() => {
                const SUFFICIENCY_LABEL: Record<string, string> = {
                  INSUFFICIENT: 'Insufficient Data',
                  MARGINAL:     'Marginal',
                  SUFFICIENT:   'Sufficient',
                  STRONG:       'Strong Signal',
                }
                const SUFFICIENCY_BADGE: Record<string, string> = {
                  INSUFFICIENT: 'bg-gray-100 text-gray-600 border border-gray-200',
                  MARGINAL:     'bg-amber-100 text-amber-800 border border-amber-200',
                  SUFFICIENT:   'bg-blue-100 text-blue-800 border border-blue-200',
                  STRONG:       'bg-emerald-100 text-emerald-800 border border-emerald-200',
                }
                const SUFFICIENCY_DESC: Record<string, string> = {
                  INSUFFICIENT: 'Fewer than 3 measured outcomes. Bias will not be applied.',
                  MARGINAL:     '3–9 outcomes. Observe only — not enough to apply safely.',
                  SUFFICIENT:   '10–24 outcomes. Cautious application allowed.',
                  STRONG:       '25+ outcomes. Patterns are reliable.',
                }
                const MODE_BADGE: Record<string, string> = {
                  OFF:                 'bg-gray-100 text-gray-600 border border-gray-200',
                  OBSERVE_ONLY:        'bg-amber-100 text-amber-800 border border-amber-200',
                  APPLY_TO_CONFIDENCE: 'bg-violet-100 text-violet-800 border border-violet-200',
                }
                const MODE_LABEL: Record<string, string> = {
                  OFF:                 'Off',
                  OBSERVE_ONLY:        'Observe Only',
                  APPLY_TO_CONFIDENCE: 'Apply to Confidence',
                }
                const MODE_DESC: Record<string, string> = {
                  OFF:                 'Weights computed and shown but never applied to recommendations.',
                  OBSERVE_ONLY:        'Weights monitored and displayed. Not applied to any outputs.',
                  APPLY_TO_CONFIDENCE: 'Multipliers applied to recommendation confidence at generation time.',
                }

                if (loadingGovernance && !biasGovernance) {
                  return (
                    <div className="bg-white border border-olive-200 p-4 flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-olive-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-[10px] text-olive-400">Loading bias governance…</span>
                    </div>
                  )
                }
                if (!biasGovernance) return null

                const g           = biasGovernance
                const sufficiency = g.biasDataSufficiencyStatus ?? g.computedSufficiencyStatus ?? 'INSUFFICIENT'
                const mode        = g.biasMode as string
                const enabled     = g.biasEnabled as boolean
                const safeToApply = g.safeToApply as boolean
                const totalMeas   = g.totalMeasuredAtLastCompute ?? 0
                const biasWeightsFromRollup = effectivenessRollups?.biasWeights

                return (
                  <div className="bg-white border border-olive-200 p-4 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-medium text-olive-400 uppercase tracking-wider">Bias Governance</p>
                        <p className="text-[9px] text-olive-400 mt-0.5">
                          Controls whether learned effectiveness patterns influence future recommendations
                        </p>
                      </div>
                      <button
                        onClick={fetchBiasGovernance}
                        disabled={loadingGovernance}
                        className="text-[9px] px-2 py-0.5 bg-olive-100 text-olive-700 hover:bg-olive-200 disabled:opacity-50 transition-colors"
                      >
                        {loadingGovernance ? 'Loading…' : '⟳ Refresh'}
                      </button>
                    </div>

                    {/* Status row */}
                    <div className="grid grid-cols-3 gap-3">
                      {/* Bias enabled/disabled */}
                      <div className="border border-olive-200 bg-parchment-50 p-3">
                        <p className="text-[9px] font-medium text-olive-400 uppercase tracking-wider mb-1">Bias</p>
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-semibold ${
                            enabled ? 'text-emerald-800' : 'text-gray-500'
                          }`}>
                            {enabled ? 'Enabled' : 'Disabled'}
                          </span>
                          <button
                            onClick={() => updateBiasGovernance({ biasEnabled: !enabled })}
                            disabled={updatingGovernance}
                            className={`text-[8px] px-1.5 py-0.5 border transition-colors disabled:opacity-50 ${
                              enabled
                                ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {updatingGovernance ? '…' : enabled ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      </div>

                      {/* Mode */}
                      <div className="border border-olive-200 bg-parchment-50 p-3">
                        <p className="text-[9px] font-medium text-olive-400 uppercase tracking-wider mb-1">Mode</p>
                        <span className={`text-[9px] px-1.5 py-0.5 ${MODE_BADGE[mode] ?? 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                          {MODE_LABEL[mode] ?? mode}
                        </span>
                      </div>

                      {/* Data sufficiency */}
                      <div className="border border-olive-200 bg-parchment-50 p-3">
                        <p className="text-[9px] font-medium text-olive-400 uppercase tracking-wider mb-1">Data Sufficiency</p>
                        <span className={`text-[9px] px-1.5 py-0.5 ${SUFFICIENCY_BADGE[sufficiency] ?? 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                          {SUFFICIENCY_LABEL[sufficiency] ?? sufficiency}
                        </span>
                        <p className="text-[8px] text-olive-400 mt-1">{totalMeas} measured</p>
                      </div>
                    </div>

                    {/* Sufficiency description */}
                    <p className="text-[9px] text-olive-500 bg-parchment-50 border border-olive-100 px-3 py-2">
                      {SUFFICIENCY_DESC[sufficiency] ?? ''}
                    </p>

                    {/* Safe-to-apply status */}
                    <div className={`flex items-center gap-2 px-3 py-2 border ${
                      safeToApply
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-amber-50 border-amber-200'
                    }`}>
                      <span className={`text-[10px] font-semibold ${
                        safeToApply ? 'text-emerald-800' : 'text-amber-800'
                      }`}>
                        {safeToApply ? '✓ Bias is currently being applied to confidence scores' : '⊘ Bias is NOT being applied to recommendations'}
                      </span>
                    </div>

                    {/* Mode controls */}
                    <div>
                      <p className="text-[9px] font-medium text-olive-400 uppercase tracking-wider mb-2">Change Mode</p>
                      <div className="flex gap-2 flex-wrap">
                        {(['OFF', 'OBSERVE_ONLY', 'APPLY_TO_CONFIDENCE'] as const).map(m => (
                          <button
                            key={m}
                            onClick={() => updateBiasGovernance({ biasMode: m })}
                            disabled={updatingGovernance || mode === m}
                            className={`text-[9px] px-2 py-1 border transition-colors disabled:opacity-50 ${
                              mode === m
                                ? (MODE_BADGE[m] ?? 'bg-gray-100 text-gray-600 border border-gray-200') + ' font-semibold'
                                : 'bg-parchment-50 border-olive-200 text-olive-700 hover:bg-olive-100'
                            }`}
                          >
                            {MODE_LABEL[m]}
                          </button>
                        ))}
                      </div>
                      <p className="text-[9px] text-olive-400 mt-1.5">{MODE_DESC[mode] ?? ''}</p>
                    </div>

                    {/* Current multipliers — only show if we have computed weights */}
                    {biasWeightsFromRollup && Object.keys(biasWeightsFromRollup.actionType).length > 0 && (
                      <div>
                        <p className="text-[9px] font-medium text-olive-400 uppercase tracking-wider mb-2">
                          Current Multipliers
                          {!safeToApply && <span className="ml-1 normal-case text-olive-300">(observing — not applied)</span>}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {(Object.entries(biasWeightsFromRollup.actionType) as Array<[string, number]>).map(([key, weight]) => (
                            <div key={key} className={`text-[9px] px-2 py-1 border flex flex-col items-center min-w-[80px] ${
                              weight > 1.05 ? 'bg-emerald-50 border-emerald-200' :
                              weight < 0.95 ? 'bg-amber-50 border-amber-200'   :
                              'bg-parchment-50 border-olive-200'
                            }`}>
                              <span className={`font-semibold text-[11px] ${
                                weight > 1.05 ? 'text-emerald-700' :
                                weight < 0.95 ? 'text-amber-700'   :
                                'text-olive-600'
                              }`}>
                                ×{weight.toFixed(2)}
                              </span>
                              <span className="text-[8px] text-olive-400 text-center leading-tight mt-0.5">
                                {key.replace(/_/g, ' ')}
                              </span>
                            </div>
                          ))}
                          <div className="text-[9px] px-2 py-1 border bg-blue-50 border-blue-200 flex flex-col items-center min-w-[80px]">
                            <span className="font-semibold text-[11px] text-blue-700">
                              ×{(biasWeightsFromRollup.globalModifier as number).toFixed(2)}
                            </span>
                            <span className="text-[8px] text-blue-400 text-center leading-tight mt-0.5">global</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Timestamps */}
                    {(g.biasLastComputedAt || g.biasLastAppliedAt) && (
                      <div className="flex gap-6 text-[8px] text-olive-300">
                        {g.biasLastComputedAt && (
                          <span>Last computed: {new Date(g.biasLastComputedAt).toLocaleString()}</span>
                        )}
                        {g.biasLastAppliedAt && (
                          <span>Last applied: {new Date(g.biasLastAppliedAt).toLocaleString()}</span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Effectiveness Insights — portfolio rollups from measured products */}
              {(() => {
                if (loadingRollups) {
                  return (
                    <div className="bg-white border border-olive-200 p-4 flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-olive-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-[10px] text-olive-400">Computing effectiveness rollups…</span>
                    </div>
                  )
                }
                if (!effectivenessRollups) return null
                const { rollups, learningSignals, biasWeights } = effectivenessRollups
                const ps = rollups.portfolioSummary
                return (
                  <div className="bg-white border border-olive-200 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-medium text-olive-400 uppercase tracking-wider">
                        Effectiveness Insights · {ps.totalMeasured} measured product{ps.totalMeasured !== 1 ? 's' : ''}
                      </p>
                      <button
                        onClick={fetchEffectivenessRollups}
                        disabled={loadingRollups}
                        className="text-[9px] px-2 py-0.5 bg-olive-100 text-olive-700 hover:bg-olive-200 disabled:opacity-50 transition-colors"
                      >
                        {loadingRollups ? 'Computing…' : '⟳ Refresh'}
                      </button>
                    </div>

                    {ps.totalMeasured === 0 ? (
                      <p className="text-[10px] text-olive-400">No measured products yet. Run the follow-up check after actions have been taken.</p>
                    ) : (
                      <>
                        {/* Portfolio summary tiles */}
                        <div className="grid grid-cols-4 gap-3">
                          {([
                            { label: 'Measured',   value: ps.totalMeasured,                                        color: 'border-olive-200 bg-parchment-50 text-olive-800' },
                            { label: '✓ Positive', value: `${ps.positiveRate}%`,                                   color: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
                            { label: '✗ Negative', value: `${ps.negativeRate}%`,                                   color: 'border-red-200 bg-red-50 text-red-800' },
                            { label: 'Avg Δ',      value: ps.avgDelta >= 0 ? `+${ps.avgDelta}` : `${ps.avgDelta}`, color: ps.avgDelta >= 0 ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-amber-200 bg-amber-50 text-amber-800' },
                          ] as Array<{ label: string; value: string | number; color: string }>).map(t => (
                            <div key={t.label} className={`border ${t.color.split(' ').slice(0, 2).join(' ')} p-3 text-center`}>
                              <p className={`text-2xl font-serif font-bold ${t.color.split(' ').slice(2).join(' ')}`}>{t.value}</p>
                              <p className="text-[10px] font-medium text-olive-500 uppercase tracking-wider mt-1">{t.label}</p>
                            </div>
                          ))}
                        </div>

                        {/* Portfolio learning signals */}
                        {learningSignals.portfolioInsights.length > 0 && (
                          <div className="bg-parchment-50 border border-olive-100 p-3 space-y-1">
                            <p className="text-[10px] font-medium text-olive-500 uppercase tracking-wider mb-2">Portfolio Learning</p>
                            {learningSignals.portfolioInsights.map((insight: string, i: number) => (
                              <p key={i} className="text-[10px] text-olive-700 leading-snug">{insight}</p>
                            ))}
                          </div>
                        )}

                        {/* Action type performance table */}
                        {rollups.actionTypePerformance.length > 0 && (
                          <div>
                            <p className="text-[10px] font-medium text-olive-400 uppercase tracking-wider mb-2">Action Type Performance</p>
                            <table className="w-full text-[9px]">
                              <thead>
                                <tr className="border-b border-olive-200">
                                  <th className="text-left py-1 text-olive-400 font-medium uppercase tracking-wider">Action</th>
                                  <th className="text-right py-1 text-olive-400 font-medium uppercase tracking-wider">n</th>
                                  <th className="text-right py-1 text-olive-400 font-medium uppercase tracking-wider">✓%</th>
                                  <th className="text-right py-1 text-olive-400 font-medium uppercase tracking-wider">✗%</th>
                                  <th className="text-right py-1 text-olive-400 font-medium uppercase tracking-wider">Avg Δ</th>
                                  <th className="text-right py-1 text-olive-400 font-medium uppercase tracking-wider">Bias</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-olive-100">
                                {rollups.actionTypePerformance.map((r: any) => (
                                  <tr key={r.key}>
                                    <td className="py-1 text-olive-700">{r.label}</td>
                                    <td className="py-1 text-right text-olive-500">{r.totalCount}</td>
                                    <td className="py-1 text-right text-emerald-700 font-medium">{r.positiveRate}%</td>
                                    <td className="py-1 text-right text-red-600">{r.negativeRate}%</td>
                                    <td className={`py-1 text-right font-medium ${r.averageDelta >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>
                                      {r.averageDelta >= 0 ? `+${r.averageDelta}` : r.averageDelta}
                                    </td>
                                    <td className="py-1 text-right text-olive-400">
                                      {biasWeights.actionType[r.key] != null
                                        ? `×${(biasWeights.actionType[r.key] as number).toFixed(2)}`
                                        : '—'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Region + Style tables */}
                        <div className="grid grid-cols-2 gap-4">
                          {rollups.regionPerformance.length > 0 && (
                            <div>
                              <p className="text-[10px] font-medium text-olive-400 uppercase tracking-wider mb-2">Region</p>
                              <table className="w-full text-[9px]">
                                <thead>
                                  <tr className="border-b border-olive-200">
                                    <th className="text-left py-1 text-olive-400 font-medium uppercase tracking-wider">Region</th>
                                    <th className="text-right py-1 text-olive-400 font-medium uppercase tracking-wider">n</th>
                                    <th className="text-right py-1 text-olive-400 font-medium uppercase tracking-wider">✓%</th>
                                    <th className="text-right py-1 text-olive-400 font-medium uppercase tracking-wider">Avg Δ</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-olive-100">
                                  {rollups.regionPerformance.map((r: any) => (
                                    <tr key={r.key}>
                                      <td className="py-1 text-olive-700 truncate max-w-[80px]">{r.label}</td>
                                      <td className="py-1 text-right text-olive-500">{r.totalCount}</td>
                                      <td className="py-1 text-right text-emerald-700 font-medium">{r.positiveRate}%</td>
                                      <td className={`py-1 text-right font-medium ${r.averageDelta >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>
                                        {r.averageDelta >= 0 ? `+${r.averageDelta}` : r.averageDelta}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                          {rollups.stylePerformance.length > 0 && (
                            <div>
                              <p className="text-[10px] font-medium text-olive-400 uppercase tracking-wider mb-2">Style</p>
                              <table className="w-full text-[9px]">
                                <thead>
                                  <tr className="border-b border-olive-200">
                                    <th className="text-left py-1 text-olive-400 font-medium uppercase tracking-wider">Style</th>
                                    <th className="text-right py-1 text-olive-400 font-medium uppercase tracking-wider">n</th>
                                    <th className="text-right py-1 text-olive-400 font-medium uppercase tracking-wider">✓%</th>
                                    <th className="text-right py-1 text-olive-400 font-medium uppercase tracking-wider">Avg Δ</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-olive-100">
                                  {rollups.stylePerformance.map((r: any) => (
                                    <tr key={r.key}>
                                      <td className="py-1 text-olive-700">{r.label}</td>
                                      <td className="py-1 text-right text-olive-500">{r.totalCount}</td>
                                      <td className="py-1 text-right text-emerald-700 font-medium">{r.positiveRate}%</td>
                                      <td className={`py-1 text-right font-medium ${r.averageDelta >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>
                                        {r.averageDelta >= 0 ? `+${r.averageDelta}` : r.averageDelta}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* Price tier */}
                        {rollups.priceTierPerformance.length > 0 && (
                          <div>
                            <p className="text-[10px] font-medium text-olive-400 uppercase tracking-wider mb-2">Price Tier</p>
                            <table className="w-full text-[9px]">
                              <thead>
                                <tr className="border-b border-olive-200">
                                  <th className="text-left py-1 text-olive-400 font-medium uppercase tracking-wider">Tier</th>
                                  <th className="text-right py-1 text-olive-400 font-medium uppercase tracking-wider">n</th>
                                  <th className="text-right py-1 text-olive-400 font-medium uppercase tracking-wider">✓%</th>
                                  <th className="text-right py-1 text-olive-400 font-medium uppercase tracking-wider">✗%</th>
                                  <th className="text-right py-1 text-olive-400 font-medium uppercase tracking-wider">Avg Δ</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-olive-100">
                                {rollups.priceTierPerformance.map((r: any) => (
                                  <tr key={r.key}>
                                    <td className="py-1 text-olive-700">{r.label}</td>
                                    <td className="py-1 text-right text-olive-500">{r.totalCount}</td>
                                    <td className="py-1 text-right text-emerald-700 font-medium">{r.positiveRate}%</td>
                                    <td className="py-1 text-right text-red-600">{r.negativeRate}%</td>
                                    <td className={`py-1 text-right font-medium ${r.averageDelta >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>
                                      {r.averageDelta >= 0 ? `+${r.averageDelta}` : r.averageDelta}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Best/worst signal highlights */}
                        {(learningSignals.strongestActionType || learningSignals.strongestRegionResponse) && (
                          <div className="grid grid-cols-2 gap-3">
                            {learningSignals.strongestActionType && (
                              <div className="bg-emerald-50 border border-emerald-200 p-3">
                                <p className="text-[9px] font-medium text-emerald-600 uppercase tracking-wider mb-1">Strongest Action</p>
                                <p className="text-[11px] font-semibold text-emerald-900">{learningSignals.strongestActionType.label}</p>
                                <p className="text-[9px] text-emerald-700 mt-0.5">{learningSignals.strongestActionType.positiveRate}% positive · n={learningSignals.strongestActionType.sampleCount}</p>
                              </div>
                            )}
                            {learningSignals.weakestActionType && (
                              <div className="bg-amber-50 border border-amber-200 p-3">
                                <p className="text-[9px] font-medium text-amber-600 uppercase tracking-wider mb-1">Weakest Action</p>
                                <p className="text-[11px] font-semibold text-amber-900">{learningSignals.weakestActionType.label}</p>
                                <p className="text-[9px] text-amber-700 mt-0.5">{learningSignals.weakestActionType.positiveRate}% positive · n={learningSignals.weakestActionType.sampleCount}</p>
                              </div>
                            )}
                            {learningSignals.strongestRegionResponse && (
                              <div className="bg-blue-50 border border-blue-200 p-3">
                                <p className="text-[9px] font-medium text-blue-600 uppercase tracking-wider mb-1">Top Region</p>
                                <p className="text-[11px] font-semibold text-blue-900">{learningSignals.strongestRegionResponse.label}</p>
                                <p className="text-[9px] text-blue-700 mt-0.5">{learningSignals.strongestRegionResponse.positiveRate}% positive · n={learningSignals.strongestRegionResponse.sampleCount}</p>
                              </div>
                            )}
                            {learningSignals.mostResponsiveStyle && (
                              <div className="bg-violet-50 border border-violet-200 p-3">
                                <p className="text-[9px] font-medium text-violet-600 uppercase tracking-wider mb-1">Top Style</p>
                                <p className="text-[11px] font-semibold text-violet-900">{learningSignals.mostResponsiveStyle.label}</p>
                                <p className="text-[9px] text-violet-700 mt-0.5">{learningSignals.mostResponsiveStyle.positiveRate}% positive · n={learningSignals.mostResponsiveStyle.sampleCount}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Phase 10 bias weights */}
                        {biasWeights.meta.biasApplied && (
                          <div className="bg-olive-50 border border-olive-200 p-3">
                            <p className="text-[9px] font-medium text-olive-500 uppercase tracking-wider mb-1">Phase 10 Bias Weights <span className="normal-case">(×confidence multipliers)</span></p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {(Object.entries(biasWeights.actionType) as Array<[string, number]>).map(([key, weight]) => (
                                <span key={key} className={`text-[9px] px-1.5 py-0.5 border ${
                                  weight > 1 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                                  weight < 1 ? 'bg-amber-50 border-amber-200 text-amber-800' :
                                  'bg-parchment-50 border-olive-200 text-olive-700'
                                }`}>
                                  {key.replace(/_/g, ' ')} ×{weight.toFixed(2)}
                                </span>
                              ))}
                              <span className="text-[9px] px-1.5 py-0.5 border bg-blue-50 border-blue-200 text-blue-800">
                                global ×{(biasWeights.globalModifier as number).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })()}

              {/* Calibration Monitoring — confidence accuracy + bias quality check */}
              {(() => {
                if (loadingCalibration) {
                  return (
                    <div className="bg-white border border-olive-200 p-4 flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-olive-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-[10px] text-olive-400">Computing calibration…</span>
                    </div>
                  )
                }
                if (!calibrationRollups) return null
                const cal = calibrationRollups.calibration
                const hasBiasData = cal.biasCalibration.withBias.total > 0

                return (
                  <div className="bg-white border border-olive-200 p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-medium text-olive-400 uppercase tracking-wider">
                        Calibration Monitoring
                        <span className="ml-2 normal-case font-normal text-olive-300">
                          · {cal.totalPoints} snapshot{cal.totalPoints !== 1 ? 's' : ''}{cal.pendingCount > 0 ? ` · ${cal.pendingCount} pending outcome` : ''}
                        </span>
                      </p>
                      <button
                        onClick={fetchCalibrationRollups}
                        disabled={loadingCalibration}
                        className="text-[9px] px-2 py-0.5 bg-olive-100 text-olive-700 hover:bg-olive-200 disabled:opacity-50 transition-colors"
                      >
                        {loadingCalibration ? 'Computing…' : '⟳ Refresh'}
                      </button>
                    </div>

                    {cal.totalPoints === 0 ? (
                      <p className="text-[10px] text-olive-400">
                        No calibration data yet. Confidence snapshots are captured automatically when recommendations are actioned.
                      </p>
                    ) : (
                      <>
                        {/* Confidence accuracy per tier */}
                        {cal.pointsWithOutcome > 0 && (
                          <div>
                            <p className="text-[9px] font-medium text-olive-400 uppercase tracking-wider mb-2">Confidence Accuracy</p>
                            <table className="w-full text-[10px]">
                              <thead>
                                <tr className="border-b border-parchment-200">
                                  <th className="text-left py-1 pr-3 text-olive-400 font-normal">Tier</th>
                                  <th className="text-right py-1 px-2 text-olive-400 font-normal">n</th>
                                  <th className="text-right py-1 px-2 text-emerald-600 font-normal">Positive</th>
                                  <th className="text-right py-1 px-2 text-amber-600 font-normal">Mixed</th>
                                  <th className="text-right py-1 px-2 text-red-600 font-normal">Negative</th>
                                  <th className="text-right py-1 pl-2 text-olive-400 font-normal">Pending</th>
                                </tr>
                              </thead>
                              <tbody>
                                {cal.confidenceBuckets.map((b: any) => (
                                  <tr key={b.bucket} className="border-b border-parchment-100 last:border-0">
                                    <td className="py-1.5 pr-3">
                                      <span className={`text-[9px] font-semibold uppercase px-1 py-0.5 ${
                                        b.bucket === 'high'   ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                        b.bucket === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                                'bg-gray-50 text-gray-500 border border-gray-200'
                                      }`}>{b.bucket}</span>
                                    </td>
                                    <td className="py-1.5 px-2 text-right text-olive-500">{b.totalOutcome}</td>
                                    <td className="py-1.5 px-2 text-right font-medium text-emerald-700">{b.totalOutcome > 0 ? `${b.positiveRate}%` : '—'}</td>
                                    <td className="py-1.5 px-2 text-right text-amber-600">{b.totalOutcome > 0 ? `${b.mixedRate}%` : '—'}</td>
                                    <td className="py-1.5 px-2 text-right text-red-600">{b.totalOutcome > 0 ? `${b.negativeRate}%` : '—'}</td>
                                    <td className="py-1.5 pl-2 text-right text-olive-300">{b.pendingCount > 0 ? b.pendingCount : '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Bias quality check */}
                        <div>
                          <p className="text-[9px] font-medium text-olive-400 uppercase tracking-wider mb-2">Bias Quality Check</p>
                          {!hasBiasData ? (
                            <p className="text-[10px] text-olive-300 italic">
                              No bias-applied recommendations have outcomes yet. Enable bias and action recommendations to begin calibration.
                            </p>
                          ) : (
                            <div className="flex gap-3 flex-wrap">
                              <div className="flex-1 min-w-[120px] bg-violet-50 border border-violet-200 p-3">
                                <p className="text-[9px] font-medium text-violet-500 uppercase tracking-wider mb-1">Bias-Applied</p>
                                <p className="text-lg font-bold text-violet-800">{cal.biasCalibration.withBias.positiveRate}%</p>
                                <p className="text-[9px] text-violet-500 mt-0.5">positive · n={cal.biasCalibration.withBias.total}</p>
                              </div>
                              <div className="flex-1 min-w-[120px] bg-parchment-50 border border-olive-200 p-3">
                                <p className="text-[9px] font-medium text-olive-500 uppercase tracking-wider mb-1">Unbiased</p>
                                <p className="text-lg font-bold text-olive-800">{cal.biasCalibration.withoutBias.positiveRate}%</p>
                                <p className="text-[9px] text-olive-400 mt-0.5">positive · n={cal.biasCalibration.withoutBias.total}</p>
                              </div>
                              <div className={`flex-1 min-w-[120px] p-3 border ${
                                cal.biasCalibration.advantage > 0  ? 'bg-emerald-50 border-emerald-200' :
                                cal.biasCalibration.advantage < 0  ? 'bg-red-50 border-red-200' :
                                                                       'bg-gray-50 border-gray-200'
                              }`}>
                                <p className={`text-[9px] font-medium uppercase tracking-wider mb-1 ${
                                  cal.biasCalibration.advantage > 0  ? 'text-emerald-600' :
                                  cal.biasCalibration.advantage < 0  ? 'text-red-600' : 'text-gray-500'
                                }`}>Bias Advantage</p>
                                <p className={`text-lg font-bold ${
                                  cal.biasCalibration.advantage > 0  ? 'text-emerald-800' :
                                  cal.biasCalibration.advantage < 0  ? 'text-red-800' : 'text-gray-700'
                                }`}>
                                  {cal.biasCalibration.advantage > 0 ? '+' : ''}{cal.biasCalibration.advantage}pp
                                </p>
                                <p className={`text-[9px] mt-0.5 ${
                                  cal.biasCalibration.advantage > 0  ? 'text-emerald-600' :
                                  cal.biasCalibration.advantage < 0  ? 'text-red-600' : 'text-gray-400'
                                }`}>
                                  {cal.biasCalibration.advantage > 0  ? 'bias is improving quality' :
                                   cal.biasCalibration.advantage < 0  ? 'review governance settings' :
                                                                          'no measurable difference'}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })()}

              {/* ── Phase 12: Predictive Allocation & Release Planning ──────────── */}
              {(() => {
                const SIZING_LABEL: Record<string, string> = {
                  significant_increase: 'Sig. Increase',
                  modest_increase:      'Modest Increase',
                  hold_flat:            'Hold Flat',
                  maintain:             'Maintain',
                  reduce_exposure:      'Reduce',
                }
                const TIMING_LABEL: Record<string, string> = {
                  accelerate:             'Accelerate',
                  hold_until_signal:      'Hold for Signal',
                  stage_two_waves:        'Two Waves',
                  release_trade_first:    'Trade First',
                  release_consumer_first: 'Consumer First',
                  no_action:              'No Action',
                }
                const ROLLOUT_LABEL: Record<string, string> = {
                  consumer_led:     'Consumer Led',
                  trade_led:        'Trade Led',
                  balanced:         'Balanced',
                  soft_launch:      'Soft Launch',
                  allocation_first: 'Allocation First',
                }
                const sizingColor = (v: string) => {
                  if (v === 'significant_increase') return 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  if (v === 'modest_increase')      return 'bg-sky-100 text-sky-800 border border-sky-200'
                  if (v === 'reduce_exposure')      return 'bg-red-100 text-red-700 border border-red-200'
                  return 'bg-parchment-100 text-olive-700 border border-olive-200'
                }
                const timingColor = (v: string) => {
                  if (v === 'accelerate')             return 'bg-violet-100 text-violet-800 border border-violet-200'
                  if (v === 'hold_until_signal')      return 'bg-amber-100 text-amber-700 border border-amber-200'
                  if (v === 'release_trade_first')    return 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                  if (v === 'release_consumer_first') return 'bg-teal-100 text-teal-800 border border-teal-200'
                  if (v === 'stage_two_waves')        return 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                  return 'bg-gray-100 text-gray-500 border border-gray-200'
                }
                const confColor = (v: string) => {
                  if (v === 'high')   return 'text-emerald-700 font-semibold'
                  if (v === 'medium') return 'text-amber-700'
                  return 'text-gray-400'
                }

                return (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-olive-800 tracking-wide uppercase">Predictive Allocation &amp; Release Planning</h3>
                        <p className="text-[11px] text-olive-400 mt-0.5">Advisory only — no automation. Based on current demand signals, calibration &amp; learning data.</p>
                      </div>
                      <button
                        onClick={() => { setAllocationPlanning(null); fetchAllocationPlanning() }}
                        className="text-[11px] text-olive-500 hover:text-olive-800 border border-olive-200 px-2 py-1 rounded"
                      >
                        Refresh
                      </button>
                    </div>

                    {loadingPlanning && (
                      <div className="flex items-center gap-2 py-6 text-sm text-olive-400">
                        <div className="w-4 h-4 border-2 border-olive-400 border-t-transparent rounded-full animate-spin" />
                        Building allocation plans…
                      </div>
                    )}

                    {!loadingPlanning && !allocationPlanning && (
                      <div className="text-sm text-olive-400 py-6 text-center border border-dashed border-olive-200 rounded">
                        No planning data available yet.
                      </div>
                    )}

                    {!loadingPlanning && allocationPlanning && (() => {
                      const ap = allocationPlanning
                      const s  = ap.summary
                      const ctx = ap.context
                      return (
                        <>
                          {/* Summary bar */}
                          <div className="bg-parchment-50 border border-olive-200 rounded p-4 mb-4">
                            <p className="text-[11px] text-olive-600 mb-3 italic">{s.portfolioHealthNote}</p>
                            <div className="flex flex-wrap gap-3">
                              {[
                                { label: 'Accelerate', value: s.accelerateCandidates,         color: 'text-violet-700' },
                                { label: 'Increase Alloc', value: s.increaseAllocationCandidates, color: 'text-emerald-700' },
                                { label: 'Hold Flat', value: s.holdFlatCount,                 color: 'text-olive-600' },
                                { label: 'Reduce', value: s.reduceCandidates,                 color: 'text-red-600' },
                                { label: 'Trade First', value: s.tradeFirstCandidates,         color: 'text-indigo-700' },
                                { label: 'Consumer First', value: s.consumerFirstCandidates,  color: 'text-teal-700' },
                                { label: 'Total Analysed', value: s.totalAnalysed,             color: 'text-gray-500' },
                              ].map(chip => (
                                <div key={chip.label} className="flex flex-col items-center bg-white border border-olive-100 rounded px-3 py-1.5 min-w-[72px]">
                                  <span className={`text-base font-bold ${chip.color}`}>{chip.value}</span>
                                  <span className="text-[9px] text-olive-400 uppercase tracking-wide mt-0.5">{chip.label}</span>
                                </div>
                              ))}
                            </div>
                            {/* Data context indicators */}
                            <div className="flex gap-3 mt-3">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${ctx.hasRollups ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                                {ctx.hasRollups ? `✓ Rollups (${ctx.rollupMeasuredCount})` : '○ No rollup data'}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${ctx.hasCalibration ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                                {ctx.hasCalibration ? `✓ Calibration (${ctx.calibrationPoints} pts)` : '○ No calibration data'}
                              </span>
                            </div>
                          </div>

                          {/* Plans table */}
                          {ap.plans.length === 0 ? (
                            <div className="text-sm text-olive-400 py-6 text-center border border-dashed border-olive-200 rounded">
                              No products with sufficient signal for planning.
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-[11px] border-collapse">
                                <thead>
                                  <tr className="bg-parchment-100 text-olive-500 uppercase tracking-wider text-[9px]">
                                    <th className="text-left px-3 py-2 font-medium border-b border-olive-200">Wine</th>
                                    <th className="text-left px-3 py-2 font-medium border-b border-olive-200">Status</th>
                                    <th className="text-left px-3 py-2 font-medium border-b border-olive-200">Driver</th>
                                    <th className="text-left px-3 py-2 font-medium border-b border-olive-200">Allocation</th>
                                    <th className="text-left px-3 py-2 font-medium border-b border-olive-200">Timing</th>
                                    <th className="text-left px-3 py-2 font-medium border-b border-olive-200">Rollout</th>
                                    <th className="text-center px-3 py-2 font-medium border-b border-olive-200">Conf.</th>
                                    <th className="text-left px-3 py-2 font-medium border-b border-olive-200">
                                      Rationale &amp; Prediction
                                      {loadingPredictivePlanning && (
                                        <span className="ml-1.5 text-[8px] text-olive-300 font-normal italic">loading…</span>
                                      )}
                                    </th>
                                    <th className="text-left px-3 py-2 font-medium border-b border-olive-200">Decision</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {ap.plans.map((plan: any) => {
                                    const existing   = planningDecisions[plan.productId]
                                    const isOverriding = overridingProductId === plan.productId

                                    const decisionBadge = (status: string) => {
                                      if (status === 'ACCEPTED')   return 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      if (status === 'OVERRIDDEN') return 'bg-amber-100 text-amber-800 border border-amber-200'
                                      if (status === 'DEFERRED')   return 'bg-gray-100 text-gray-500 border border-gray-200'
                                      return 'bg-white text-olive-400 border border-olive-200'
                                    }

                                    return (
                                      <>
                                        <tr key={plan.productId} className="border-b border-olive-100 hover:bg-parchment-50 align-top">
                                          <td className="px-3 py-2.5">
                                            <p className="font-medium text-olive-900 leading-tight">{plan.wineName}</p>
                                            <p className="text-[10px] text-olive-400">{plan.company}</p>
                                            {scenarioData?.comparisons && (
                                              <button
                                                onClick={() => toggleScenario(plan.productId)}
                                                className={`mt-1 text-[9px] px-1.5 py-0.5 rounded border ${
                                                  expandedScenarios.has(plan.productId)
                                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-indigo-200 hover:text-indigo-600'
                                                }`}
                                              >
                                                {expandedScenarios.has(plan.productId) ? '▲ Hide scenarios' : '▼ Compare scenarios'}
                                              </button>
                                            )}
                                          </td>
                                          <td className="px-3 py-2.5 text-olive-600 whitespace-nowrap">{plan.releaseStatus}</td>
                                          <td className="px-3 py-2.5">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                              plan.dominantDriver === 'consumer' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                                              plan.dominantDriver === 'trade'    ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                                                                   'bg-gray-50 text-gray-600 border-gray-200'
                                            }`}>
                                              {plan.dominantDriver}
                                            </span>
                                          </td>
                                          <td className="px-3 py-2.5">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${sizingColor(plan.allocationSizing)}`}>
                                              {SIZING_LABEL[plan.allocationSizing] ?? plan.allocationSizing}
                                            </span>
                                          </td>
                                          <td className="px-3 py-2.5">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${timingColor(plan.releaseTiming)}`}>
                                              {TIMING_LABEL[plan.releaseTiming] ?? plan.releaseTiming}
                                            </span>
                                          </td>
                                          <td className="px-3 py-2.5 text-olive-600 whitespace-nowrap">
                                            {ROLLOUT_LABEL[plan.rolloutMode] ?? plan.rolloutMode}
                                          </td>
                                          <td className="px-3 py-2.5 text-center">
                                            <span className={confColor(plan.planConfidence)}>{plan.planConfidence}</span>
                                          </td>
                                          <td className="px-3 py-2.5 max-w-[260px]">
                                            <p className="text-olive-700 leading-snug">{plan.allocationRationale}</p>
                                            <p className="text-olive-500 leading-snug mt-0.5">{plan.timingRationale}</p>
                                            {plan.learningContext && (
                                              <p className="text-[10px] text-blue-500 italic mt-1">{plan.learningContext}</p>
                                            )}
                                            {plan.calibrationContext && (
                                              <p className="text-[10px] text-violet-500 italic mt-0.5">{plan.calibrationContext}</p>
                                            )}
                                            {/* Phase 16 — Predictive enrichment */}
                                            {predictivePlanning?.enrichments?.[plan.productId] && (() => {
                                              const enr = predictivePlanning.enrichments[plan.productId]
                                              const likeBadge: Record<string, string> = {
                                                strong:            'bg-emerald-50 text-emerald-700 border-emerald-200',
                                                moderate:          'bg-sky-50 text-sky-700 border-sky-200',
                                                mixed:             'bg-amber-50 text-amber-700 border-amber-200',
                                                limited:           'bg-red-50 text-red-700 border-red-200',
                                                insufficient_data: 'bg-gray-50 text-gray-400 border-gray-200',
                                              }
                                              const likeLabel: Record<string, string> = {
                                                strong:            '▲ Strong signal',
                                                moderate:          '↑ Moderate signal',
                                                mixed:             '~ Mixed signal',
                                                limited:           '▼ Weak signal',
                                                insufficient_data: '○ Insufficient data',
                                              }
                                              const badgeCls = likeBadge[enr.predictedSuccessLikelihood] ?? likeBadge.insufficient_data
                                              return (
                                                <div className="mt-1.5 pt-1.5 border-t border-olive-100">
                                                  <div className="flex items-center gap-1.5 mb-0.5">
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${badgeCls}`}>
                                                      {likeLabel[enr.predictedSuccessLikelihood] ?? '○'}
                                                    </span>
                                                    {enr.confidenceAdjustment === 'raise' && (
                                                      <span className="text-[9px] text-emerald-600 font-medium">↑ raise conf.</span>
                                                    )}
                                                    {enr.confidenceAdjustment === 'lower' && (
                                                      <span className="text-[9px] text-red-500 font-medium">↓ lower conf.</span>
                                                    )}
                                                  </div>
                                                  <p className="text-[10px] text-olive-500 italic leading-tight">{enr.likelihoodNote}</p>
                                                  {enr.supportingFactors.length > 0 && (
                                                    <ul className="mt-0.5 space-y-0.5">
                                                      {enr.supportingFactors.map((f: string, i: number) => (
                                                        <li key={i} className="text-[9px] text-emerald-700 leading-tight">+ {f}</li>
                                                      ))}
                                                    </ul>
                                                  )}
                                                  {enr.cautionFlags.length > 0 && (
                                                    <ul className="mt-0.5 space-y-0.5">
                                                      {enr.cautionFlags.map((f: string, i: number) => (
                                                        <li key={i} className="text-[9px] text-amber-700 leading-tight">⚠ {f}</li>
                                                      ))}
                                                    </ul>
                                                  )}
                                                </div>
                                              )
                                            })()}
                                          </td>
                                          {/* Decision + Execution column */}
                                          <td className="px-3 py-2.5 min-w-[130px]">
                                            {existing ? (
                                              <div className="flex flex-col gap-1">
                                                {/* Decision badge */}
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded border w-fit ${decisionBadge(existing.decisionStatus)}`}>
                                                  {existing.decisionStatus}
                                                </span>
                                                {existing.planningDecisionNotes && (
                                                  <p className="text-[10px] text-olive-400 italic">{existing.planningDecisionNotes}</p>
                                                )}
                                                {/* Adherence badge when execution recorded */}
                                                {existing.planAdherence && existing.planAdherence !== 'pending' && (() => {
                                                  const ADHERENCE_LABEL: Record<string,string> = {
                                                    matched_recommendation:  'Followed rec.',
                                                    matched_decision:        'Followed override',
                                                    recommendation_restored: 'Rec. restored',
                                                    deviated_from_decision:  'Deviated',
                                                    partially_executed:      'Partial',
                                                    not_executed:            'Not executed',
                                                  }
                                                  const ADHERENCE_COLOR: Record<string,string> = {
                                                    matched_recommendation:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
                                                    matched_decision:        'bg-sky-50 text-sky-700 border border-sky-200',
                                                    recommendation_restored: 'bg-violet-50 text-violet-700 border border-violet-200',
                                                    deviated_from_decision:  'bg-red-50 text-red-700 border border-red-200',
                                                    partially_executed:      'bg-amber-50 text-amber-700 border border-amber-200',
                                                    not_executed:            'bg-gray-50 text-gray-500 border border-gray-200',
                                                  }
                                                  return (
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded w-fit ${ADHERENCE_COLOR[existing.planAdherence] ?? 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                                                      {ADHERENCE_LABEL[existing.planAdherence] ?? existing.planAdherence}
                                                    </span>
                                                  )
                                                })()}
                                                {/* Execution controls — only when decision is ACCEPTED or OVERRIDDEN and not yet executed */}
                                                {['ACCEPTED','OVERRIDDEN'].includes(existing.decisionStatus) && (!existing.executionStatus || existing.executionStatus === 'PENDING') && (
                                                  <div className="flex flex-col gap-0.5 mt-0.5">
                                                    <button
                                                      onClick={() => {
                                                        const sel = existing.selectedAllocationSizing ?? plan.allocationSizing
                                                        submitExecution(existing.id, plan.productId, 'EXECUTED', {
                                                          allocationSizing: sel,
                                                          releaseTiming:    existing.selectedReleaseTiming ?? plan.releaseTiming,
                                                          rolloutMode:      existing.selectedRolloutMode   ?? plan.rolloutMode,
                                                          notes: '',
                                                        })
                                                      }}
                                                      className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100"
                                                    >
                                                      Mark Executed
                                                    </button>
                                                    <button
                                                      onClick={() => {
                                                        setExecutingDecisionId(existing.id)
                                                        setExecutionForm({
                                                          allocationSizing: existing.selectedAllocationSizing ?? plan.allocationSizing,
                                                          releaseTiming:    existing.selectedReleaseTiming    ?? plan.releaseTiming,
                                                          rolloutMode:      existing.selectedRolloutMode      ?? plan.rolloutMode,
                                                          notes: '',
                                                        })
                                                      }}
                                                      className="text-[10px] px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded hover:bg-sky-100"
                                                    >
                                                      Record Actuals
                                                    </button>
                                                    <button
                                                      onClick={() => submitExecution(existing.id, plan.productId, 'NOT_EXECUTED', { allocationSizing: '', releaseTiming: '', rolloutMode: '', notes: '' })}
                                                      className="text-[10px] px-2 py-0.5 bg-gray-50 text-gray-500 border border-gray-200 rounded hover:bg-gray-100"
                                                    >
                                                      Not Executed
                                                    </button>
                                                  </div>
                                                )}
                                                {/* Already executed — show what was done */}
                                                {existing.executionStatus && existing.executionStatus !== 'PENDING' && (
                                                  <div className="flex flex-col gap-0.5 mt-0.5">
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border w-fit ${
                                                      existing.executionStatus === 'EXECUTED'     ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                      existing.executionStatus === 'PARTIAL'      ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                      existing.executionStatus === 'DEVIATED'     ? 'bg-red-50 text-red-700 border-red-200' :
                                                                                                    'bg-gray-50 text-gray-500 border-gray-200'
                                                    }`}>
                                                      {existing.executionStatus}
                                                    </span>
                                                    {existing.executionNotes && (
                                                      <p className="text-[10px] text-olive-400 italic">{existing.executionNotes}</p>
                                                    )}
                                                    {existing.executedByUserName && (
                                                      <p className="text-[10px] text-olive-300">{existing.executedByUserName}</p>
                                                    )}
                                                  </div>
                                                )}
                                                <button
                                                  onClick={() => {
                                                    setOverridingProductId(plan.productId)
                                                    setOverrideForm({
                                                      allocationSizing: existing.selectedAllocationSizing ?? plan.allocationSizing,
                                                      releaseTiming:    existing.selectedReleaseTiming    ?? plan.releaseTiming,
                                                      rolloutMode:      existing.selectedRolloutMode      ?? plan.rolloutMode,
                                                      notes: '',
                                                    })
                                                  }}
                                                  className="text-[10px] text-olive-400 hover:text-olive-700 underline mt-0.5"
                                                >
                                                  Revise decision
                                                </button>
                                              </div>
                                            ) : (
                                              <div className="flex flex-col gap-1">
                                                <button
                                                  onClick={() => submitPlanningDecision(plan, 'ACCEPTED')}
                                                  className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100"
                                                >
                                                  Accept
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    setOverridingProductId(plan.productId)
                                                    setOverrideForm({
                                                      allocationSizing: plan.allocationSizing,
                                                      releaseTiming:    plan.releaseTiming,
                                                      rolloutMode:      plan.rolloutMode,
                                                      notes: '',
                                                    })
                                                  }}
                                                  className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded hover:bg-amber-100"
                                                >
                                                  Override
                                                </button>
                                                <button
                                                  onClick={() => submitPlanningDecision(plan, 'DEFERRED')}
                                                  className="text-[10px] px-2 py-0.5 bg-gray-50 text-gray-500 border border-gray-200 rounded hover:bg-gray-100"
                                                >
                                                  Defer
                                                </button>
                                              </div>
                                            )}
                                          </td>
                                        </tr>
                                        {/* Inline override form */}
                                        {isOverriding && (
                                          <tr key={`${plan.productId}-override`} className="bg-amber-50 border-b border-amber-100">
                                            <td colSpan={9} className="px-4 py-3">
                                              <p className="text-[11px] font-medium text-amber-800 mb-2">Override plan for {plan.wineName}</p>
                                              <div className="flex flex-wrap gap-3 mb-2">
                                                <div>
                                                  <label className="text-[9px] uppercase tracking-wider text-amber-600 block mb-0.5">Allocation</label>
                                                  <select
                                                    value={overrideForm.allocationSizing}
                                                    onChange={e => setOverrideForm(f => ({ ...f, allocationSizing: e.target.value }))}
                                                    className="text-[11px] border border-amber-200 rounded px-2 py-1 bg-white"
                                                  >
                                                    {['hold_flat','modest_increase','significant_increase','reduce_exposure','maintain'].map(v => (
                                                      <option key={v} value={v}>{SIZING_LABEL[v] ?? v}</option>
                                                    ))}
                                                  </select>
                                                </div>
                                                <div>
                                                  <label className="text-[9px] uppercase tracking-wider text-amber-600 block mb-0.5">Timing</label>
                                                  <select
                                                    value={overrideForm.releaseTiming}
                                                    onChange={e => setOverrideForm(f => ({ ...f, releaseTiming: e.target.value }))}
                                                    className="text-[11px] border border-amber-200 rounded px-2 py-1 bg-white"
                                                  >
                                                    {['accelerate','hold_until_signal','stage_two_waves','release_trade_first','release_consumer_first','no_action'].map(v => (
                                                      <option key={v} value={v}>{TIMING_LABEL[v] ?? v}</option>
                                                    ))}
                                                  </select>
                                                </div>
                                                <div>
                                                  <label className="text-[9px] uppercase tracking-wider text-amber-600 block mb-0.5">Rollout</label>
                                                  <select
                                                    value={overrideForm.rolloutMode}
                                                    onChange={e => setOverrideForm(f => ({ ...f, rolloutMode: e.target.value }))}
                                                    className="text-[11px] border border-amber-200 rounded px-2 py-1 bg-white"
                                                  >
                                                    {['consumer_led','trade_led','balanced','soft_launch','allocation_first'].map(v => (
                                                      <option key={v} value={v}>{ROLLOUT_LABEL[v] ?? v}</option>
                                                    ))}
                                                  </select>
                                                </div>
                                                <div className="flex-1 min-w-[160px]">
                                                  <label className="text-[9px] uppercase tracking-wider text-amber-600 block mb-0.5">Notes (optional)</label>
                                                  <input
                                                    type="text"
                                                    value={overrideForm.notes}
                                                    onChange={e => setOverrideForm(f => ({ ...f, notes: e.target.value }))}
                                                    placeholder="Reason for override…"
                                                    className="text-[11px] border border-amber-200 rounded px-2 py-1 bg-white w-full"
                                                  />
                                                </div>
                                              </div>
                                              <div className="flex gap-2">
                                                <button
                                                  onClick={() => submitPlanningDecision(plan, 'OVERRIDDEN', overrideForm)}
                                                  className="text-[11px] px-3 py-1 bg-amber-600 text-white rounded hover:bg-amber-700"
                                                >
                                                  Confirm Override
                                                </button>
                                                <button
                                                  onClick={() => setOverridingProductId(null)}
                                                  className="text-[11px] px-3 py-1 border border-olive-200 text-olive-500 rounded hover:bg-parchment-50"
                                                >
                                                  Cancel
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        )}
                                        {/* Inline Record Actuals form */}
                                        {existing && executingDecisionId === existing.id && (
                                          <tr key={`${plan.productId}-execution`} className="bg-sky-50 border-b border-sky-100">
                                            <td colSpan={9} className="px-4 py-3">
                                              <p className="text-[11px] font-medium text-sky-800 mb-2">Record actuals for {plan.wineName}</p>
                                              <div className="flex flex-wrap gap-3 mb-2">
                                                <div>
                                                  <label className="text-[9px] uppercase tracking-wider text-sky-600 block mb-0.5">Actual Allocation</label>
                                                  <select
                                                    value={executionForm.allocationSizing}
                                                    onChange={e => setExecutionForm(f => ({ ...f, allocationSizing: e.target.value }))}
                                                    className="text-[11px] border border-sky-200 rounded px-2 py-1 bg-white"
                                                  >
                                                    {['hold_flat','modest_increase','significant_increase','reduce_exposure','maintain'].map(v => (
                                                      <option key={v} value={v}>{SIZING_LABEL[v] ?? v}</option>
                                                    ))}
                                                  </select>
                                                </div>
                                                <div>
                                                  <label className="text-[9px] uppercase tracking-wider text-sky-600 block mb-0.5">Actual Timing</label>
                                                  <select
                                                    value={executionForm.releaseTiming}
                                                    onChange={e => setExecutionForm(f => ({ ...f, releaseTiming: e.target.value }))}
                                                    className="text-[11px] border border-sky-200 rounded px-2 py-1 bg-white"
                                                  >
                                                    {['accelerate','hold_until_signal','stage_two_waves','release_trade_first','release_consumer_first','no_action'].map(v => (
                                                      <option key={v} value={v}>{TIMING_LABEL[v] ?? v}</option>
                                                    ))}
                                                  </select>
                                                </div>
                                                <div>
                                                  <label className="text-[9px] uppercase tracking-wider text-sky-600 block mb-0.5">Actual Rollout</label>
                                                  <select
                                                    value={executionForm.rolloutMode}
                                                    onChange={e => setExecutionForm(f => ({ ...f, rolloutMode: e.target.value }))}
                                                    className="text-[11px] border border-sky-200 rounded px-2 py-1 bg-white"
                                                  >
                                                    {['consumer_led','trade_led','balanced','soft_launch','allocation_first'].map(v => (
                                                      <option key={v} value={v}>{ROLLOUT_LABEL[v] ?? v}</option>
                                                    ))}
                                                  </select>
                                                </div>
                                                <div className="flex-1 min-w-[160px]">
                                                  <label className="text-[9px] uppercase tracking-wider text-sky-600 block mb-0.5">Notes (optional)</label>
                                                  <input
                                                    type="text"
                                                    value={executionForm.notes}
                                                    onChange={e => setExecutionForm(f => ({ ...f, notes: e.target.value }))}
                                                    placeholder="Any deviation notes…"
                                                    className="text-[11px] border border-sky-200 rounded px-2 py-1 bg-white w-full"
                                                  />
                                                </div>
                                              </div>
                                              <div className="flex gap-2">
                                                <button
                                                  onClick={() => submitExecution(existing.id, plan.productId, 'EXECUTED', executionForm)}
                                                  className="text-[11px] px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                                                >
                                                  Mark Executed
                                                </button>
                                                <button
                                                  onClick={() => submitExecution(existing.id, plan.productId, 'PARTIAL', executionForm)}
                                                  className="text-[11px] px-3 py-1 bg-amber-500 text-white rounded hover:bg-amber-600"
                                                >
                                                  Mark Partial
                                                </button>
                                                <button
                                                  onClick={() => submitExecution(existing.id, plan.productId, 'DEVIATED', executionForm)}
                                                  className="text-[11px] px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                                >
                                                  Mark Deviated
                                                </button>
                                                <button
                                                  onClick={() => setExecutingDecisionId(null)}
                                                  className="text-[11px] px-3 py-1 border border-olive-200 text-olive-500 rounded hover:bg-parchment-50"
                                                >
                                                  Cancel
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        )}
                                        {/* Phase 17 — Scenario comparison row */}
                                        {expandedScenarios.has(plan.productId) && (() => {
                                          const comparison = scenarioData?.comparisons?.find((c: any) => c.productId === plan.productId)
                                          if (!comparison) return (
                                            <tr key={`${plan.productId}-scenarios`} className="bg-indigo-50 border-b border-indigo-100">
                                              <td colSpan={9} className="px-4 py-3 text-[11px] text-indigo-400 italic">
                                                {loadingScenarios ? 'Computing scenarios…' : 'No scenario data available for this product.'}
                                              </td>
                                            </tr>
                                          )
                                          const LIKE_BADGE: Record<string,string> = {
                                            strong:            'bg-emerald-100 text-emerald-800 border-emerald-200',
                                            moderate:          'bg-sky-100 text-sky-800 border-sky-200',
                                            mixed:             'bg-amber-100 text-amber-800 border-amber-200',
                                            limited:           'bg-red-100 text-red-700 border-red-200',
                                            insufficient_data: 'bg-gray-100 text-gray-400 border-gray-200',
                                          }
                                          const LIKE_LABEL: Record<string,string> = {
                                            strong:            '▲ Strong',
                                            moderate:          '↑ Moderate',
                                            mixed:             '~ Mixed',
                                            limited:           '▼ Weak',
                                            insufficient_data: '○ No data',
                                          }
                                          const allScenarios = [comparison.recommended, ...comparison.alternatives]
                                          return (
                                            <tr key={`${plan.productId}-scenarios`} className="bg-indigo-50 border-b border-indigo-100">
                                              <td colSpan={9} className="px-4 py-3">
                                                <div className="flex items-center gap-2 mb-2">
                                                  <p className="text-[11px] font-semibold text-indigo-800">Scenario comparison — {comparison.wineName}</p>
                                                  {comparison.bestFitLabel !== 'Recommended' && (
                                                    <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded">
                                                      ⚠ Alternative stronger: {comparison.bestFitLabel}
                                                    </span>
                                                  )}
                                                </div>
                                                <p className="text-[10px] text-indigo-500 italic mb-2">{comparison.spreadNote}</p>
                                                <div className="flex flex-wrap gap-3">
                                                  {allScenarios.map((sc: any) => {
                                                    const isBest = sc.label === comparison.bestFitLabel
                                                    const isRec  = sc.label === 'Recommended'
                                                    return (
                                                      <div
                                                        key={sc.label}
                                                        className={`flex-1 min-w-[180px] max-w-[260px] rounded border p-2.5 ${
                                                          isBest
                                                            ? 'bg-emerald-50 border-emerald-300'
                                                            : isRec
                                                              ? 'bg-white border-indigo-200'
                                                              : 'bg-white border-gray-200'
                                                        }`}
                                                      >
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                          <span className="text-[10px] font-semibold text-indigo-900">{sc.label}</span>
                                                          {isBest && <span className="text-[8px] text-emerald-600 font-medium">★ best fit</span>}
                                                          {isRec  && !isBest && <span className="text-[8px] text-indigo-400">recommended</span>}
                                                        </div>
                                                        <div className="flex flex-wrap gap-1 mb-1.5">
                                                          <span className="text-[9px] px-1 py-0.5 bg-gray-100 text-gray-600 rounded">{SIZING_LABEL[sc.allocationSizing] ?? sc.allocationSizing}</span>
                                                          <span className="text-[9px] px-1 py-0.5 bg-gray-100 text-gray-600 rounded">{TIMING_LABEL[sc.releaseTiming] ?? sc.releaseTiming}</span>
                                                          <span className="text-[9px] px-1 py-0.5 bg-gray-100 text-gray-600 rounded">{ROLLOUT_LABEL[sc.rolloutMode] ?? sc.rolloutMode}</span>
                                                        </div>
                                                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${
                                                          LIKE_BADGE[sc.enrichment.predictedSuccessLikelihood] ?? LIKE_BADGE.insufficient_data
                                                        }`}>
                                                          {LIKE_LABEL[sc.enrichment.predictedSuccessLikelihood] ?? '○'}
                                                        </span>
                                                        <p className="text-[9px] text-gray-500 italic mt-1 leading-tight">{sc.enrichment.likelihoodNote}</p>
                                                        {sc.enrichment.supportingFactors?.length > 0 && (
                                                          <ul className="mt-1 space-y-0.5">
                                                            {sc.enrichment.supportingFactors.map((f: string, i: number) => (
                                                              <li key={i} className="text-[9px] text-emerald-700 leading-tight">+ {f}</li>
                                                            ))}
                                                          </ul>
                                                        )}
                                                        {sc.enrichment.cautionFlags?.length > 0 && (
                                                          <ul className="mt-0.5 space-y-0.5">
                                                            {sc.enrichment.cautionFlags.map((f: string, i: number) => (
                                                              <li key={i} className="text-[9px] text-amber-700 leading-tight">⚠ {f}</li>
                                                            ))}
                                                          </ul>
                                                        )}
                                                        {/* Phase 18 — pattern library notes for this scenario */}
                                                        {strategyPatterns && (() => {
                                                          const allPatterns = [
                                                            ...(strategyPatterns.winningPatterns ?? []),
                                                            ...(strategyPatterns.riskPatterns    ?? []),
                                                          ]
                                                          const relevant = allPatterns.filter((p: any) => {
                                                            const regionMatch  = p.region     && p.region     === comparison.recommended.enrichment?.region || (plan as any).region === p.region
                                                            const styleMatch   = p.style      && (plan as any).wineStyle     === p.style
                                                            const rolloutMatch = p.rolloutMode && p.rolloutMode === sc.rolloutMode
                                                            const timingMatch  = p.timing      && p.timing      === sc.releaseTiming
                                                            return !!(regionMatch || styleMatch || rolloutMatch || timingMatch)
                                                          }).slice(0, 2)
                                                          if (relevant.length === 0) return null
                                                          return (
                                                            <div className="mt-1 pt-1 border-t border-dashed border-gray-200">
                                                              {relevant.map((p: any) => (
                                                                <p key={p.id} className={`text-[9px] leading-tight mt-0.5 ${p.category === 'winning' ? 'text-emerald-600' : 'text-red-500'}`}>
                                                                  {p.category === 'winning' ? '★' : '▼'} {p.pattern}
                                                                </p>
                                                              ))}
                                                            </div>
                                                          )
                                                        })()}
                                                      </div>
                                                    )
                                                  })}
                                                </div>
                                              </td>
                                            </tr>
                                          )
                                        })()}
                                      </>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                          <p className="text-[10px] text-olive-300 mt-2 text-right">
                            Generated {new Date(ap.generatedAt).toLocaleString()}
                          </p>
                        </>
                      )
                    })()}
                  </div>
                )
              })()}

              {/* ── Phase 15: Decision Quality & Adherence Analytics ─────────── */}
              {(() => {
                const RATE_COLOR = (rate: number) =>
                  rate >= 60 ? 'text-emerald-700 font-semibold' :
                  rate >= 35 ? 'text-amber-700' : 'text-red-600'

                const ADHERE_LABEL: Record<string, string> = {
                  matched_recommendation:  'Followed rec.',
                  matched_decision:        'Followed override',
                  recommendation_restored: 'Rec. restored',
                  deviated_from_decision:  'Deviated',
                  partially_executed:      'Partial',
                  not_executed:            'Not executed',
                }

                return (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-olive-800 tracking-wide uppercase">Decision Quality &amp; Adherence Analytics</h3>
                        <p className="text-[11px] text-olive-400 mt-0.5">What is the recommendation → decision → execution chain teaching us?</p>
                      </div>
                      <button
                        onClick={() => { setDecisionQuality(null); fetchDecisionQuality() }}
                        className="text-[11px] text-olive-500 hover:text-olive-800 border border-olive-200 px-2 py-1 rounded"
                      >
                        Refresh
                      </button>
                    </div>

                    {loadingDecisionQuality && (
                      <div className="flex items-center gap-2 py-6 text-sm text-olive-400">
                        <div className="w-4 h-4 border-2 border-olive-400 border-t-transparent rounded-full animate-spin" />
                        Computing decision quality rollups…
                      </div>
                    )}

                    {!loadingDecisionQuality && !decisionQuality && (
                      <div className="text-sm text-olive-400 py-6 text-center border border-dashed border-olive-200 rounded">
                        No decision quality data available yet.
                      </div>
                    )}

                    {!loadingDecisionQuality && decisionQuality && (() => {
                      const dq = decisionQuality
                      if (!dq.rollups) return (
                        <div className="text-sm text-olive-400 py-6 text-center border border-dashed border-olive-200 rounded">
                          {dq.note ?? 'No decisions recorded yet.'}
                        </div>
                      )
                      const r  = dq.rollups
                      const ph = r.processHealth
                      const rq = r.recommendationQuality
                      const eq = r.executionQuality
                      const aq = r.adherenceQuality

                      return (
                        <>
                          {/* Process health bar */}
                          <div className="bg-parchment-50 border border-olive-200 rounded p-4 mb-4">
                            <div className="flex flex-wrap gap-3 mb-3">
                              {[
                                { label: 'Total Decisions', value: ph.totalDecisions,        color: 'text-gray-600' },
                                { label: 'Decided',         value: ph.decidedCount,           color: 'text-olive-700' },
                                { label: 'Executed',        value: ph.executedCount,          color: 'text-sky-700' },
                                { label: 'Measured',        value: ph.measuredCount,          color: 'text-violet-700' },
                                { label: 'Decision Cov.',   value: `${ph.decisionCoverageRate}%`,    color: ph.decisionCoverageRate >= 70 ? 'text-emerald-700' : 'text-amber-700' },
                                { label: 'Execution Cov.',  value: `${ph.executionCoverageRate}%`,   color: ph.executionCoverageRate >= 60 ? 'text-emerald-700' : 'text-amber-700' },
                                { label: 'Overall Positive',value: `${ph.overallPositiveRate}%`,     color: RATE_COLOR(ph.overallPositiveRate) },
                              ].map(chip => (
                                <div key={chip.label} className="flex flex-col items-center bg-white border border-olive-100 rounded px-3 py-1.5 min-w-[80px]">
                                  <span className={`text-sm font-bold ${chip.color}`}>{chip.value}</span>
                                  <span className="text-[9px] text-olive-400 uppercase tracking-wide mt-0.5">{chip.label}</span>
                                </div>
                              ))}
                            </div>
                            {ph.breakdownNotes.map((note: string, i: number) => (
                              <p key={i} className="text-[11px] text-olive-600 italic mt-1">{note}</p>
                            ))}
                          </div>

                          {/* Two-column: Rec quality + Execution quality */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* Recommendation Quality */}
                            <div className="border border-olive-200 rounded p-3">
                              <p className="text-[10px] font-semibold text-olive-600 uppercase tracking-wider mb-2">Recommendation Quality</p>
                              <table className="w-full text-[11px]">
                                <thead>
                                  <tr className="text-[9px] text-olive-400 uppercase border-b border-olive-100">
                                    <th className="text-left py-1">Decision</th>
                                    <th className="text-center py-1">n</th>
                                    <th className="text-center py-1">Measured</th>
                                    <th className="text-center py-1">Positive%</th>
                                    <th className="text-center py-1">Negative%</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {[rq.accepted, rq.overridden, rq.deferred].map((b: any) => (
                                    <tr key={b.label} className="border-b border-olive-50">
                                      <td className="py-1.5 text-olive-700">{b.label}</td>
                                      <td className="py-1.5 text-center text-olive-500">{b.count}</td>
                                      <td className="py-1.5 text-center text-olive-500">{b.withOutcome}</td>
                                      <td className={`py-1.5 text-center ${RATE_COLOR(b.positiveRate)}`}>{b.positiveRate}%</td>
                                      <td className={`py-1.5 text-center ${b.negativeRate > 30 ? 'text-red-600' : 'text-olive-500'}`}>{b.negativeRate}%</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              <p className={`text-[10px] italic mt-2 ${
                                rq.overrideAdvantage > 10 ? 'text-amber-700' :
                                rq.overrideAdvantage < -10 ? 'text-emerald-700' : 'text-olive-500'
                              }`}>
                                {rq.overrideAdvantageNote}
                              </p>
                            </div>

                            {/* Execution Quality */}
                            <div className="border border-olive-200 rounded p-3">
                              <p className="text-[10px] font-semibold text-olive-600 uppercase tracking-wider mb-2">Execution Quality</p>
                              <table className="w-full text-[11px]">
                                <thead>
                                  <tr className="text-[9px] text-olive-400 uppercase border-b border-olive-100">
                                    <th className="text-left py-1">Status</th>
                                    <th className="text-center py-1">n</th>
                                    <th className="text-center py-1">Measured</th>
                                    <th className="text-center py-1">Positive%</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {[eq.executed, eq.partial, eq.deviated, eq.notExecuted].map((b: any) => (
                                    <tr key={b.label} className="border-b border-olive-50">
                                      <td className="py-1.5 text-olive-700">{b.label}</td>
                                      <td className="py-1.5 text-center text-olive-500">{b.count}</td>
                                      <td className="py-1.5 text-center text-olive-500">{b.withOutcome}</td>
                                      <td className={`py-1.5 text-center ${RATE_COLOR(b.positiveRate)}`}>{b.positiveRate}%</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              <p className="text-[10px] italic mt-2 text-olive-500">
                                Completion rate: <span className={eq.executionCompletionRate >= 60 ? 'text-emerald-700 font-medium' : 'text-amber-700 font-medium'}>{eq.executionCompletionRate}%</span>
                                {' — '}{eq.executionQualityNote}
                              </p>
                            </div>
                          </div>

                          {/* Adherence Quality */}
                          <div className="border border-olive-200 rounded p-3 mb-4">
                            <p className="text-[10px] font-semibold text-olive-600 uppercase tracking-wider mb-2">Adherence Outcome Comparison</p>
                            <div className="overflow-x-auto">
                              <table className="w-full text-[11px]">
                                <thead>
                                  <tr className="text-[9px] text-olive-400 uppercase border-b border-olive-100">
                                    <th className="text-left py-1">Adherence Pattern</th>
                                    <th className="text-center py-1">n</th>
                                    <th className="text-center py-1">Measured</th>
                                    <th className="text-center py-1">Positive%</th>
                                    <th className="text-center py-1">Mixed%</th>
                                    <th className="text-center py-1">Negative%</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {[aq.matchedRecommendation, aq.matchedDecision, aq.recommendationRestored, aq.deviatedFromDecision, aq.partiallyExecuted, aq.notExecuted].map((b: any) => (
                                    <tr key={b.label} className="border-b border-olive-50">
                                      <td className="py-1.5 text-olive-700">{b.label}</td>
                                      <td className="py-1.5 text-center text-olive-500">{b.count}</td>
                                      <td className="py-1.5 text-center text-olive-500">{b.withOutcome}</td>
                                      <td className={`py-1.5 text-center ${RATE_COLOR(b.positiveRate)}`}>{b.positiveRate}%</td>
                                      <td className="py-1.5 text-center text-olive-500">{b.mixedRate}%</td>
                                      <td className={`py-1.5 text-center ${b.negativeRate > 30 ? 'text-red-600' : 'text-olive-500'}`}>{b.negativeRate}%</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <div className="flex gap-4 mt-2">
                              <p className="text-[10px] text-olive-500">
                                Best pattern: <span className="text-emerald-700 font-medium">{ADHERE_LABEL[aq.bestAdherencePattern] ?? aq.bestAdherencePattern}</span>
                              </p>
                              <p className="text-[10px] text-olive-500">
                                Weakest pattern: <span className="text-red-600 font-medium">{ADHERE_LABEL[aq.worstAdherencePattern] ?? aq.worstAdherencePattern}</span>
                              </p>
                            </div>
                          </div>

                          {/* Regional & Style breakdown (only when data exists) */}
                          {(r.regionBreakdown.length > 0 || r.styleBreakdown.length > 0) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              {r.regionBreakdown.length > 0 && (
                                <div className="border border-olive-200 rounded p-3">
                                  <p className="text-[10px] font-semibold text-olive-600 uppercase tracking-wider mb-2">By Region</p>
                                  <table className="w-full text-[11px]">
                                    <thead>
                                      <tr className="text-[9px] text-olive-400 uppercase border-b border-olive-100">
                                        <th className="text-left py-1">Region</th>
                                        <th className="text-center py-1">n</th>
                                        <th className="text-center py-1">Positive%</th>
                                        <th className="text-center py-1">Accepted%</th>
                                        <th className="text-center py-1">Executed%</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {r.regionBreakdown.map((d: any) => (
                                        <tr key={d.key} className="border-b border-olive-50">
                                          <td className="py-1.5 text-olive-700">{d.label}</td>
                                          <td className="py-1.5 text-center text-olive-500">{d.count}</td>
                                          <td className={`py-1.5 text-center ${RATE_COLOR(d.positiveRate)}`}>{d.positiveRate}%</td>
                                          <td className="py-1.5 text-center text-olive-500">{d.acceptedRate}%</td>
                                          <td className="py-1.5 text-center text-olive-500">{d.executedRate}%</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                              {r.styleBreakdown.length > 0 && (
                                <div className="border border-olive-200 rounded p-3">
                                  <p className="text-[10px] font-semibold text-olive-600 uppercase tracking-wider mb-2">By Wine Style</p>
                                  <table className="w-full text-[11px]">
                                    <thead>
                                      <tr className="text-[9px] text-olive-400 uppercase border-b border-olive-100">
                                        <th className="text-left py-1">Style</th>
                                        <th className="text-center py-1">n</th>
                                        <th className="text-center py-1">Positive%</th>
                                        <th className="text-center py-1">Accepted%</th>
                                        <th className="text-center py-1">Executed%</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {r.styleBreakdown.map((d: any) => (
                                        <tr key={d.key} className="border-b border-olive-50">
                                          <td className="py-1.5 text-olive-700">{d.label}</td>
                                          <td className="py-1.5 text-center text-olive-500">{d.count}</td>
                                          <td className={`py-1.5 text-center ${RATE_COLOR(d.positiveRate)}`}>{d.positiveRate}%</td>
                                          <td className="py-1.5 text-center text-olive-500">{d.acceptedRate}%</td>
                                          <td className="py-1.5 text-center text-olive-500">{d.executedRate}%</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          )}

                          <p className="text-[10px] text-olive-300 text-right">
                            Generated {new Date(dq.generatedAt).toLocaleString()}
                          </p>
                        </>
                      )
                    })()}
                  </div>
                )
              })()}

              {/* ── Phase 18: Portfolio Strategy Pattern Library ─────────── */}
              {(() => {
                const CONF_BADGE: Record<string, string> = {
                  strong:   'bg-emerald-50 text-emerald-700 border-emerald-200',
                  moderate: 'bg-sky-50 text-sky-700 border-sky-200',
                  limited:  'bg-gray-50 text-gray-500 border-gray-200',
                }

                return (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-olive-800 tracking-wide uppercase">Portfolio Strategy Pattern Library</h3>
                        <p className="text-[11px] text-olive-400 mt-0.5">Recurring strategy patterns derived from historical decisions &amp; outcomes.</p>
                      </div>
                      <button
                        onClick={() => { setStrategyPatterns(null); fetchStrategyPatterns() }}
                        className="text-[11px] text-olive-500 hover:text-olive-800 border border-olive-200 px-2 py-1 rounded"
                      >
                        Refresh
                      </button>
                    </div>

                    {loadingPatterns && (
                      <div className="flex items-center gap-2 py-6 text-sm text-olive-400">
                        <div className="w-4 h-4 border-2 border-olive-400 border-t-transparent rounded-full animate-spin" />
                        Deriving strategy patterns…
                      </div>
                    )}

                    {!loadingPatterns && !strategyPatterns && (
                      <div className="text-sm text-olive-400 py-6 text-center border border-dashed border-olive-200 rounded">
                        No pattern data available yet.
                      </div>
                    )}

                    {!loadingPatterns && strategyPatterns && (() => {
                      const sp = strategyPatterns
                      const winning: any[] = sp.winningPatterns ?? []
                      const risk: any[]    = sp.riskPatterns    ?? []

                      return (
                        <>
                          {/* Portfolio insight */}
                          <div className="bg-parchment-50 border border-olive-200 rounded px-4 py-3 mb-4">
                            <p className="text-[11px] text-olive-600 italic">{sp.portfolioInsight}</p>
                            <div className="flex gap-3 mt-2">
                              <span className="text-[10px] text-emerald-700 font-medium">{winning.length} winning pattern{winning.length !== 1 ? 's' : ''}</span>
                              <span className="text-[10px] text-olive-400">·</span>
                              <span className="text-[10px] text-red-600 font-medium">{risk.length} risk pattern{risk.length !== 1 ? 's' : ''}</span>
                              <span className="text-[10px] text-olive-400">·</span>
                              <span className="text-[10px] text-olive-400">{sp.totalPatternsFound} total</span>
                            </div>
                          </div>

                          {/* Two columns: winning + risk */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Winning patterns */}
                            <div>
                              <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider mb-2">Winning Patterns</p>
                              {winning.length === 0 ? (
                                <p className="text-[11px] text-olive-400 italic">No confirmed winning patterns yet — record more executions.</p>
                              ) : (
                                <div className="space-y-2">
                                  {winning.map((p: any) => (
                                    <div key={p.id} className="border border-emerald-200 bg-emerald-50 rounded px-3 py-2">
                                      <p className="text-[11px] text-olive-800 leading-snug">{p.pattern}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[9px] text-emerald-600 italic">{p.evidence}</span>
                                        <span className={`text-[8px] px-1 py-0.5 rounded border ${CONF_BADGE[p.confidence] ?? CONF_BADGE.limited}`}>
                                          {p.confidence}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Risk patterns */}
                            <div>
                              <p className="text-[10px] font-semibold text-red-700 uppercase tracking-wider mb-2">Risk Patterns</p>
                              {risk.length === 0 ? (
                                <p className="text-[11px] text-olive-400 italic">No confirmed risk patterns yet.</p>
                              ) : (
                                <div className="space-y-2">
                                  {risk.map((p: any) => (
                                    <div key={p.id} className="border border-red-200 bg-red-50 rounded px-3 py-2">
                                      <p className="text-[11px] text-olive-800 leading-snug">{p.pattern}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[9px] text-red-500 italic">{p.evidence}</span>
                                        <span className={`text-[8px] px-1 py-0.5 rounded border ${CONF_BADGE[p.confidence] ?? CONF_BADGE.limited}`}>
                                          {p.confidence}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {sp.dataNote && (
                            <p className="text-[10px] text-olive-400 italic mt-3">{sp.dataNote}</p>
                          )}
                          <p className="text-[10px] text-olive-300 text-right mt-2">
                            Generated {new Date(sp.generatedAt).toLocaleString()}
                          </p>
                        </>
                      )
                    })()}
                  </div>
                )
              })()}

              {loadingIntelligence && (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="w-6 h-6 border-2 border-olive-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-olive-400">Analysing demand signals…</p>
                  </div>
                </div>
              )}

              {!loadingIntelligence && releaseIntelligence && (() => {
                const ri = releaseIntelligence
                const s  = ri.summary

                const monitorBadge = (status: string) => {
                  const map: Record<string, string> = {
                    HIGH_DEMAND:         'bg-emerald-100 text-emerald-800 border border-emerald-200',
                    NEEDS_REVIEW:        'bg-amber-100 text-amber-800 border border-amber-200',
                    ALLOCATION_PRESSURE: 'bg-red-100 text-red-800 border border-red-200',
                    UPCOMING_INTEREST:   'bg-blue-100 text-blue-800 border border-blue-200',
                    UNDERPERFORMING:     'bg-gray-100 text-gray-600 border border-gray-200',
                    STABLE:              'bg-parchment-100 text-olive-600 border border-olive-200',
                  }
                  return map[status] ?? 'bg-white text-olive-500 border border-olive-200'
                }

                const exposureBadge = (tier: string) => {
                  const map: Record<string, string> = {
                    PRIORITY: 'bg-violet-100 text-violet-800 border border-violet-200',
                    LIMITED:  'bg-amber-100 text-amber-800 border border-amber-200',
                    STANDARD: 'bg-sky-50 text-sky-700 border border-sky-200',
                    LOW:      'bg-gray-50 text-gray-500 border border-gray-200',
                  }
                  return map[tier] ?? 'bg-white text-olive-500 border border-olive-200'
                }

                const confidenceBadge = (c: string) => {
                  if (c === 'high')   return 'text-emerald-700 font-semibold'
                  if (c === 'medium') return 'text-amber-700'
                  return 'text-gray-400'
                }

                return (
                  <>
                    {/* Summary cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {[
                        { label: 'High Demand',         value: s.highDemandCount,         color: 'border-emerald-300 bg-emerald-50' },
                        { label: 'Needs Review',         value: s.needsReviewCount,         color: 'border-amber-300 bg-amber-50' },
                        { label: 'Alloc. Pressure',      value: s.allocationPressureCount,  color: 'border-red-300 bg-red-50' },
                        { label: 'Upcoming Interest',    value: s.upcomingInterestCount,    color: 'border-blue-300 bg-blue-50' },
                        { label: 'Underperforming',      value: s.underperformingCount,     color: 'border-gray-300 bg-gray-50' },
                        { label: 'Stable',               value: s.stableCount,              color: 'border-olive-200 bg-parchment-50' },
                      ].map((card) => (
                        <div key={card.label} className={`border ${card.color} p-4`}>
                          <p className="text-[10px] font-medium text-olive-500 uppercase tracking-wider mb-1">{card.label}</p>
                          <p className="text-3xl font-serif font-bold text-olive-900">{card.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Signal bias */}
                    {ri.signalBias && (
                      <div className="bg-white border border-olive-200 p-5">
                        <h3 className="text-sm font-semibold text-olive-900 mb-3">Portfolio Signal Bias</h3>
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-olive-400">Trade</span>
                            <span className="text-xl font-serif font-bold text-olive-900">
                              {Math.round(ri.signalBias.tradeRatio * 100)}%
                            </span>
                            <span className="text-xs text-olive-400">(weight: {ri.signalBias.totalTradeWeight.toFixed(2)})</span>
                          </div>
                          <div className="w-px h-5 bg-olive-200" />
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-olive-400">Consumer</span>
                            <span className="text-xl font-serif font-bold text-olive-900">
                              {Math.round(ri.signalBias.consumerRatio * 100)}%
                            </span>
                            <span className="text-xs text-olive-400">(weight: {ri.signalBias.totalConsumerWeight.toFixed(2)})</span>
                          </div>
                          <div className="w-px h-5 bg-olive-200" />
                          <div>
                            <span className="text-[10px] font-medium uppercase tracking-wider text-olive-400 mr-1">Dominant</span>
                            <span className={`text-sm font-medium ${
                              ri.signalBias.dominantChannel === 'trade'    ? 'text-violet-700' :
                              ri.signalBias.dominantChannel === 'consumer' ? 'text-sky-700' :
                              'text-olive-500'
                            }`}>
                              {ri.signalBias.dominantChannel === 'balanced' ? 'Balanced' : ri.signalBias.dominantChannel.charAt(0).toUpperCase() + ri.signalBias.dominantChannel.slice(1) + '-led'}
                            </span>
                          </div>
                        </div>
                        {/* Visual bar */}
                        <div className="mt-3 h-2 bg-parchment-100 border border-olive-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-violet-400 transition-all"
                            style={{ width: `${Math.round(ri.signalBias.tradeRatio * 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-1 text-[9px] text-olive-300 uppercase tracking-wider">
                          <span>Trade</span>
                          <span>Consumer</span>
                        </div>
                      </div>
                    )}

                    {/* Release acceleration candidates */}
                    {ri.releaseAccelerationCandidates?.length > 0 && (
                      <div className="bg-white border border-blue-200 p-5">
                        <h3 className="text-sm font-semibold text-blue-900 mb-3">
                          Release Acceleration Candidates
                          <span className="ml-2 text-[10px] font-normal text-blue-400 uppercase tracking-wider">Pre-release wines ready to go live</span>
                        </h3>
                        <div className="space-y-2">
                          {ri.releaseAccelerationCandidates.map((r: any) => (
                            <div key={r.productId} className="flex items-start gap-3 py-2 border-b border-blue-50 last:border-0">
                              <span className={`mt-0.5 text-[10px] font-semibold uppercase tracking-wider ${confidenceBadge(r.confidence)}`}>
                                {r.confidence}
                              </span>
                              <div>
                                <p className="text-sm font-medium text-olive-900">{r.wineName}</p>
                                <p className="text-xs text-olive-500 mt-0.5">{r.reason}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Allocation pressure */}
                    {ri.allocationPressureList?.length > 0 && (
                      <div className="bg-white border border-olive-200 p-5">
                        <h3 className="text-sm font-semibold text-olive-900 mb-3">Allocation Pressure</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-olive-200 text-left">
                                <th className="pb-2 text-[10px] font-medium text-olive-400 uppercase tracking-wider">Wine</th>
                                <th className="pb-2 px-3 text-[10px] font-medium text-olive-400 uppercase tracking-wider">Inventory</th>
                                <th className="pb-2 px-3 text-[10px] font-medium text-olive-400 uppercase tracking-wider">Waitlist</th>
                                <th className="pb-2 px-3 text-[10px] font-medium text-olive-400 uppercase tracking-wider">Wks Supply</th>
                                <th className="pb-2 px-3 text-[10px] font-medium text-olive-400 uppercase tracking-wider">Pressure</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ri.allocationPressureList.map((m: any) => (
                                <tr key={m.productId} className="border-b border-parchment-100 last:border-0">
                                  <td className="py-2 pr-3 text-olive-800 font-medium">{m.wineName}</td>
                                  <td className="py-2 px-3 text-olive-600 tabular-nums">{m.inventory}</td>
                                  <td className="py-2 px-3 text-olive-600 tabular-nums">{m.waitlistCount}</td>
                                  <td className="py-2 px-3 tabular-nums">
                                    {m.weeksOfSupply === 99 ? '∞' : m.weeksOfSupply}
                                  </td>
                                  <td className="py-2 px-3">
                                    <span className={`text-[10px] font-semibold uppercase ${
                                      m.pressureLevel === 'critical' ? 'text-red-700' :
                                      m.pressureLevel === 'high'     ? 'text-orange-600' :
                                      'text-amber-600'
                                    }`}>
                                      {m.pressureLevel}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* All recommendations */}
                    {ri.recommendations?.length > 0 && (
                      <div className="bg-white border border-olive-200 p-5">
                        <h3 className="text-sm font-semibold text-olive-900 mb-3">
                          All Recommendations
                          <span className="ml-2 text-[10px] font-normal text-olive-400 uppercase tracking-wider">{ri.recommendations.length} wines analysed</span>
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-olive-200 text-left">
                                <th className="pb-2 text-[10px] font-medium text-olive-400 uppercase tracking-wider pr-4">Wine</th>
                                <th className="pb-2 px-3 text-[10px] font-medium text-olive-400 uppercase tracking-wider">Type</th>
                                <th className="pb-2 px-3 text-[10px] font-medium text-olive-400 uppercase tracking-wider">Driver</th>
                                <th className="pb-2 px-3 text-[10px] font-medium text-olive-400 uppercase tracking-wider">Confidence</th>
                                <th className="pb-2 px-3 text-[10px] font-medium text-olive-400 uppercase tracking-wider">Freshness</th>
                                <th className="pb-2 px-3 text-[10px] font-medium text-olive-400 uppercase tracking-wider">Monitor</th>
                                <th className="pb-2 px-3 text-[10px] font-medium text-olive-400 uppercase tracking-wider">Exposure</th>
                                <th className="pb-2 pl-3 text-[10px] font-medium text-olive-400 uppercase tracking-wider">Reason</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ri.recommendations.map((r: any) => {
                                const freshnessBadge = (f: string) => {
                                  if (f === 'fresh')          return 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  if (f === 'needs_refresh')  return 'bg-amber-50 text-amber-700 border border-amber-200'
                                  if (f === 'stale')          return 'bg-red-50 text-red-600 border border-red-200'
                                  return 'bg-gray-50 text-gray-500 border border-gray-200' // never_analyzed
                                }
                                const freshnessLabel = (f: string) => {
                                  if (f === 'fresh')         return 'Fresh'
                                  if (f === 'needs_refresh') return 'Needs Refresh'
                                  if (f === 'stale')         return 'Stale'
                                  return 'Never Run'
                                }
                                const driverBadge = (d: string) => {
                                  if (d === 'trade')    return 'text-violet-700'
                                  if (d === 'consumer') return 'text-sky-700'
                                  return 'text-olive-400'
                                }
                                return (
                                  <tr key={r.productId} className="border-b border-parchment-100 last:border-0 hover:bg-parchment-50 transition-colors">
                                    <td className="py-2.5 pr-4">
                                      <p className="font-medium text-olive-900">{r.wineName}</p>
                                      <p className="text-[10px] text-olive-400 mt-0.5">{r.releaseStatus}</p>
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <span className="text-[10px] font-medium text-olive-700 whitespace-nowrap">
                                        {r.type.replace(/_/g, ' ')}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <span className={`text-[10px] font-semibold uppercase ${driverBadge(r.dominantDriver)}`}>
                                        {r.dominantDriver}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <span className={`text-[10px] font-semibold uppercase ${confidenceBadge(r.confidence)}`}>
                                        {r.confidence}
                                      </span>
                                      {r.biasApplied && (
                                        <p className="text-[9px] mt-0.5 whitespace-nowrap">
                                          <span className="line-through text-olive-300">{r.baseConfidenceScore}</span>
                                          <span className="text-olive-400 mx-0.5">→</span>
                                          <span className="font-semibold text-violet-600">{r.adjustedConfidenceScore}</span>
                                          <span className="text-olive-300 ml-0.5">×{r.biasMultiplier.toFixed(2)}</span>
                                        </p>
                                      )}
                                      {r.confidenceReason && (
                                        <p className="text-[9px] text-olive-400 mt-0.5 leading-snug max-w-[160px]">{r.confidenceReason}</p>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <span className={`text-[10px] font-medium px-1.5 py-0.5 whitespace-nowrap ${freshnessBadge(r.freshness)}`}>
                                        {freshnessLabel(r.freshness)}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <span className={`text-[10px] font-medium px-1.5 py-0.5 ${monitorBadge(r.monitorStatus)}`}>
                                        {r.monitorStatus.replace(/_/g, ' ')}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <span className={`text-[10px] font-medium px-1.5 py-0.5 ${exposureBadge(r.exposureTier)}`}>
                                        {r.exposureTier}
                                      </span>
                                    </td>
                                    <td className="py-2.5 pl-3 text-olive-500 max-w-xs leading-snug">{r.reason}</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Underperforming wines */}
                    {ri.underperformingWines?.length > 0 && (
                      <div className="bg-white border border-gray-200 p-5">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">
                          Underperforming
                          <span className="ml-2 text-[10px] font-normal text-gray-400 uppercase tracking-wider">Live wines with no demand signals</span>
                        </h3>
                        <div className="space-y-2">
                          {ri.underperformingWines.map((r: any) => (
                            <div key={r.productId} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                              <span className={`mt-0.5 text-[10px] px-1.5 py-0.5 ${exposureBadge(r.exposureTier)}`}>
                                {r.exposureTier}
                              </span>
                              <div>
                                <p className="text-sm font-medium text-olive-800">{r.wineName}</p>
                                <p className="text-xs text-olive-400 mt-0.5">{r.reason}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {ri.recommendations?.length === 0 && (
                      <div className="bg-white border border-olive-200 p-10 text-center">
                        <p className="text-sm text-olive-400">No products with demand signals yet — intelligence will populate as waitlists, orders, and trade inquiries are recorded.</p>
                      </div>
                    )}

                    <p className="text-[10px] text-olive-300 text-right">
                      Generated {new Date(ri.generatedAt).toLocaleString()} · {s.totalAnalysed} products analysed
                    </p>
                  </>
                )
              })()}

              {!loadingIntelligence && !releaseIntelligence && (
                <div className="bg-white border border-olive-200 p-10 text-center">
                  <p className="text-sm text-olive-400 mb-4">Release intelligence not yet loaded.</p>
                  <button
                    onClick={fetchReleaseIntelligence}
                    className="text-sm px-5 py-2 bg-olive-700 text-parchment-100 hover:bg-olive-800 transition-colors"
                  >
                    Load Intelligence
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
