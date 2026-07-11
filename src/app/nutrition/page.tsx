'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Search, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'

const CALORIE_GOAL = 2000
const FETCH_TIMEOUT_MS = 6000

const FALLBACK_RECIPES = [
  { name: 'Chicken Biryani Bowl', calories: 480, protein: 35, carbs: 52, fat: 12, time: '30 min', tag: 'High Protein', emoji: '🍚' },
  { name: 'Daal Chawal', calories: 380, protein: 18, carbs: 65, fat: 6, time: '25 min', tag: 'Balanced', emoji: '🫘' },
  { name: 'Grilled Fish with Salad', calories: 320, protein: 42, carbs: 15, fat: 10, time: '20 min', tag: 'Low Carb', emoji: '🐟' },
  { name: 'Egg Paratha', calories: 420, protein: 22, carbs: 45, fat: 16, time: '15 min', tag: 'Breakfast', emoji: '🍳' },
  { name: 'Fruit Chaat', calories: 180, protein: 3, carbs: 42, fat: 1, time: '10 min', tag: 'Snack', emoji: '🍓' },
  { name: 'Protein Shake', calories: 250, protein: 35, carbs: 20, fat: 5, time: '5 min', tag: 'Post Workout', emoji: '🥛' },
]

const MEAL_TYPE_ORDER = [
  'breakfast',
  'morning_snack',
  'lunch',
  'afternoon_snack',
  'dinner',
  'late_snack',
]

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  morning_snack: 'Morning Snack',
  lunch: 'Lunch',
  afternoon_snack: 'Afternoon Snack',
  dinner: 'Dinner',
  late_snack: 'Late Snack',
}

const MEAL_ICONS: Record<string, string> = {
  breakfast: '🌅',
  morning_snack: '🍎',
  lunch: '🍽️',
  afternoon_snack: '🥜',
  dinner: '🌙',
  late_snack: '🍪',
}

const LOG_MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'morning_snack', label: 'Snack' },
]

interface FoodItem {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  servingSize: number
  servingUnit: string
}

interface MealLogEntry {
  _id: string
  mealType: string
  loggedAt: string
  foods: FoodItem[]
  totals: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber?: number
  }
}

interface DailyTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface NutritionResult {
  name: string
  calories: number
  protein: number
  carbohydrates: number
  fat: number
  fiber?: number
  serving_size_g?: number
}

interface RecipeCard {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  time: string
  tag: string
  emoji: string
}

interface ApiRecipe {
  _id: string
  title: string
  calories: number
  protein?: number
  carbs?: number
  fat?: number
  prepTimeMinutes?: number
  mealType?: string
}

function formatMealType(type: string) {
  return MEAL_LABELS[type] || type.replace(/_/g, ' ')
}

export default function NutritionPage() {
  const { user, isLoading: authLoading } = useAuth()

  const [meals, setMeals] = useState<MealLogEntry[]>([])
  const [dailyTotals, setDailyTotals] = useState<DailyTotals>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  })
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryTimedOut, setSummaryTimedOut] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<NutritionResult[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  const [loggingIndex, setLoggingIndex] = useState<number | null>(null)
  const [logMealType, setLogMealType] = useState('breakfast')
  const [logQuantity, setLogQuantity] = useState('100')
  const [submittingLog, setSubmittingLog] = useState(false)

  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [recipes, setRecipes] = useState<RecipeCard[]>([])
  const [recipesFromApi, setRecipesFromApi] = useState(false)
  const [recipesLoading, setRecipesLoading] = useState(true)

  const fetchTodayMeals = useCallback(async () => {
    if (!user) return

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    setSummaryLoading(true)
    setSummaryTimedOut(false)

    try {
      const res = await fetch('/api/tracking/meals/today', {
        credentials: 'include',
        signal: controller.signal,
      })
      const data = await res.json()

      if (data.success) {
        setMeals(data.data.meals || [])
        setDailyTotals(
          data.data.dailyTotals || { calories: 0, protein: 0, carbs: 0, fat: 0 }
        )
      } else {
        setMeals([])
        setDailyTotals({ calories: 0, protein: 0, carbs: 0, fat: 0 })
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setSummaryTimedOut(true)
      } else {
        toast.error('Could not load today\'s meals')
      }
      setMeals([])
      setDailyTotals({ calories: 0, protein: 0, carbs: 0, fat: 0 })
    } finally {
      clearTimeout(timeout)
      setSummaryLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!authLoading && user) {
      fetchTodayMeals()
    }
  }, [authLoading, user, fetchTodayMeals])

  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    const fetchRecipes = async () => {
      setRecipesLoading(true)
      try {
        const res = await fetch('/api/recipes?limit=6', { signal: controller.signal })
        const data = await res.json()

        if (res.ok && data.recipes?.length > 0) {
          setRecipes(
            data.recipes.map((r: ApiRecipe) => ({
              name: r.title,
              calories: r.calories,
              protein: r.protein ?? 0,
              carbs: r.carbs ?? 0,
              fat: r.fat ?? 0,
              time: r.prepTimeMinutes ? `${r.prepTimeMinutes} min` : '—',
              tag: r.mealType || 'Recipe',
              emoji: '🍽️',
            }))
          )
          setRecipesFromApi(true)
        } else {
          setRecipes(FALLBACK_RECIPES)
          setRecipesFromApi(false)
        }
      } catch {
        setRecipes(FALLBACK_RECIPES)
        setRecipesFromApi(false)
      } finally {
        clearTimeout(timeout)
        setRecipesLoading(false)
      }
    }

    fetchRecipes()
    return () => {
      controller.abort()
      clearTimeout(timeout)
    }
  }, [])

  const calorieProgress = Math.min(
    100,
    Math.round(((dailyTotals.calories || 0) / CALORIE_GOAL) * 100)
  )

  const groupedMeals = useMemo(() => {
    const groups: Record<string, MealLogEntry[]> = {}
    for (const meal of meals) {
      if (!groups[meal.mealType]) groups[meal.mealType] = []
      groups[meal.mealType].push(meal)
    }
    return MEAL_TYPE_ORDER.filter((t) => groups[t]?.length).map((type) => ({
      type,
      entries: groups[type],
    }))
  }, [meals])

  const handleSearch = async () => {
    const query = searchQuery.trim()
    if (!query) return

    if (!user) {
      toast.error('Sign in to search foods')
      return
    }

    setSearching(true)
    setHasSearched(true)
    setSearchResults([])
    setLoggingIndex(null)

    try {
      const res = await fetch(
        `/api/nutrition/analyze?query=${encodeURIComponent(query)}`,
        { credentials: 'include' }
      )
      const data = await res.json()

      if (data.success && data.data?.length > 0) {
        setSearchResults(data.data)
      } else {
        setSearchResults([])
        toast.error(data.error || 'No results found')
      }
    } catch {
      toast.error('Search failed. Try again.')
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const scaleFood = (item: NutritionResult, grams: number): FoodItem => {
    const base = item.serving_size_g || 100
    const ratio = grams / base
    return {
      name: item.name,
      calories: Math.round((item.calories || 0) * ratio),
      protein: Math.round(((item.protein || 0) * ratio) * 10) / 10,
      carbs: Math.round(((item.carbohydrates || 0) * ratio) * 10) / 10,
      fat: Math.round(((item.fat || 0) * ratio) * 10) / 10,
      fiber: item.fiber ? Math.round(item.fiber * ratio * 10) / 10 : undefined,
      servingSize: grams,
      servingUnit: 'g',
    }
  }

  const handleLogMeal = async (item: NutritionResult) => {
    const grams = parseFloat(logQuantity)
    if (!grams || grams <= 0) {
      toast.error('Enter a valid quantity in grams')
      return
    }

    setSubmittingLog(true)
    try {
      const food = scaleFood(item, grams)
      const res = await fetch('/api/tracking/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          mealType: logMealType,
          foods: [food],
        }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        toast.success('Meal logged!')
        setLoggingIndex(null)
        setSearchQuery('')
        setSearchResults([])
        setHasSearched(false)
        fetchTodayMeals()
      } else {
        toast.error(data.error || data.message || 'Failed to log meal')
      }
    } catch {
      toast.error('Failed to log meal')
    } finally {
      setSubmittingLog(false)
    }
  }

  const handleDeleteMeal = async (mealId: string) => {
    setDeletingId(mealId)
    try {
      const res = await fetch(`/api/tracking/meals/${mealId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = await res.json()

      if (res.ok && data.success) {
        toast.success('Meal removed')
        fetchTodayMeals()
      } else {
        toast.error(data.error || 'Failed to delete meal')
      }
    } catch {
      toast.error('Failed to delete meal')
    } finally {
      setDeletingId(null)
    }
  }

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 pb-24 px-4 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <span className="text-[#00ff87] text-sm font-semibold uppercase tracking-widest">
            Nutrition
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-white mt-2">
            Track Your Meals
          </h1>
          <p className="text-[#a0a0a0] mt-1">{todayLabel}</p>
        </div>

        {/* SECTION 1 — Daily Summary */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4">Daily Summary</h2>

          {authLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="glass rounded-2xl p-5 skeleton h-24" />
              ))}
            </div>
          ) : !user ? (
            <div className="glass rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">🥗</div>
              <p className="text-white font-semibold mb-2">Sign in to track nutrition</p>
              <p className="text-[#a0a0a0] text-sm mb-6">
                Log meals, monitor macros, and hit your daily goals.
              </p>
              <Link href="/login" className="btn-accent px-6 py-3 text-sm">
                Sign In
              </Link>
            </div>
          ) : summaryLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="glass rounded-2xl p-5 skeleton h-24" />
              ))}
            </div>
          ) : summaryTimedOut ? (
            <div className="glass rounded-2xl p-6 text-center">
              <p className="text-[#a0a0a0] text-sm">
                Could not load summary in time.{' '}
                <button
                  onClick={fetchTodayMeals}
                  className="text-[#00ff87] hover:underline"
                >
                  Retry
                </button>
              </p>
            </div>
          ) : meals.length === 0 ? (
            <div className="glass rounded-2xl p-8 text-center">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-white font-medium">No meals logged today</p>
              <p className="text-[#a0a0a0] text-sm mt-1">
                Search for a food below and tap Log This to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="glass rounded-2xl p-5 border border-[#00ff87]/20">
                  <p className="text-[#a0a0a0] text-xs uppercase tracking-wider">Calories</p>
                  <p className="text-2xl font-black text-[#00ff87] mt-1">
                    {Math.round(dailyTotals.calories)}
                  </p>
                  <p className="text-[#555] text-xs mt-1">/ {CALORIE_GOAL} goal</p>
                </div>
                <div className="glass rounded-2xl p-5">
                  <p className="text-[#a0a0a0] text-xs uppercase tracking-wider">Protein</p>
                  <p className="text-2xl font-black text-red-400 mt-1">
                    {Math.round(dailyTotals.protein)}g
                  </p>
                </div>
                <div className="glass rounded-2xl p-5">
                  <p className="text-[#a0a0a0] text-xs uppercase tracking-wider">Carbs</p>
                  <p className="text-2xl font-black text-blue-400 mt-1">
                    {Math.round(dailyTotals.carbs)}g
                  </p>
                </div>
                <div className="glass rounded-2xl p-5">
                  <p className="text-[#a0a0a0] text-xs uppercase tracking-wider">Fat</p>
                  <p className="text-2xl font-black text-yellow-400 mt-1">
                    {Math.round(dailyTotals.fat)}g
                  </p>
                </div>
              </div>

              <div className="glass rounded-2xl p-5">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#a0a0a0]">Calorie progress</span>
                  <span className="text-white font-medium">
                    {Math.round(dailyTotals.calories)} / {CALORIE_GOAL} cal
                  </span>
                </div>
                <div className="h-3 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#00ff87] to-[#00bfff] rounded-full transition-all duration-500"
                    style={{ width: `${calorieProgress}%` }}
                  />
                </div>
                <p className="text-[#555] text-xs mt-2">{calorieProgress}% of daily goal</p>
              </div>
            </div>
          )}
        </section>

        {/* SECTION 2 — Food Search */}
        <section>
          <h2 className="text-lg font-bold text-white mb-4">Food Search</h2>
          <div className="glass rounded-2xl p-5 space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder='e.g. "2 eggs and roti"'
                  className="pl-10 bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-[#555] focus:border-[#00ff87]"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                className="bg-[#00ff87] text-black hover:bg-[#00cc6a] font-bold px-6"
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
              </Button>
            </div>

            {!user && !authLoading && (
              <p className="text-[#a0a0a0] text-sm text-center py-2">
                Sign in to search and log foods
              </p>
            )}

            {hasSearched && !searching && searchResults.length === 0 && user && (
              <p className="text-[#a0a0a0] text-sm text-center py-4">No foods found</p>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-3">
                {searchResults.map((item, idx) => (
                  <div key={idx} className="glass rounded-xl p-4 border border-[#2a2a2a]">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold capitalize">{item.name}</p>
                        <p className="text-[#a0a0a0] text-sm mt-1">
                          {Math.round(item.calories)} cal per {item.serving_size_g || 100}g
                        </p>
                        <p className="text-[#555] text-xs mt-1">
                          P: {Math.round(item.protein || 0)}g · C:{' '}
                          {Math.round(item.carbohydrates || 0)}g · F:{' '}
                          {Math.round(item.fat || 0)}g
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setLoggingIndex(loggingIndex === idx ? null : idx)
                          setLogMealType('breakfast')
                          setLogQuantity(String(item.serving_size_g || 100))
                        }}
                        className="bg-[#00ff87]/10 text-[#00ff87] border border-[#00ff87]/30 hover:bg-[#00ff87]/20 shrink-0"
                      >
                        Log This
                      </Button>
                    </div>

                    {loggingIndex === idx && (
                      <div className="mt-4 pt-4 border-t border-[#2a2a2a] space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[#a0a0a0] text-xs block mb-1">
                              Meal type
                            </label>
                            <select
                              value={logMealType}
                              onChange={(e) => setLogMealType(e.target.value)}
                              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm focus:border-[#00ff87] outline-none"
                            >
                              {LOG_MEAL_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>
                                  {t.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[#a0a0a0] text-xs block mb-1">
                              Quantity (g)
                            </label>
                            <Input
                              type="number"
                              min="1"
                              value={logQuantity}
                              onChange={(e) => setLogQuantity(e.target.value)}
                              className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                            />
                          </div>
                        </div>
                        <Button
                          onClick={() => handleLogMeal(item)}
                          disabled={submittingLog}
                          className="w-full bg-[#00ff87] text-black hover:bg-[#00cc6a] font-bold"
                        >
                          {submittingLog ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Logging...
                            </>
                          ) : (
                            'Confirm & Log'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* SECTION 3 — Today's Meals */}
        {user && !authLoading && (
          <section>
            <h2 className="text-lg font-bold text-white mb-4">Today&apos;s Meals</h2>

            {groupedMeals.length === 0 && !summaryLoading ? (
              <div className="glass rounded-2xl p-6 text-center">
                <p className="text-[#a0a0a0] text-sm">No meals logged today</p>
              </div>
            ) : (
              <div className="space-y-6">
                {groupedMeals.map(({ type, entries }) => (
                  <div key={type}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">{MEAL_ICONS[type] || '🍽️'}</span>
                      <h3 className="text-white font-semibold">{formatMealType(type)}</h3>
                      <span className="text-[#555] text-sm">
                        ({entries.length} {entries.length === 1 ? 'entry' : 'entries'})
                      </span>
                    </div>

                    <div className="space-y-3">
                      {entries.map((meal) => (
                        <div
                          key={meal._id}
                          className="glass rounded-xl p-4 border border-[#2a2a2a]"
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-[#a0a0a0] text-xs">
                                {new Date(meal.loggedAt).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </p>
                              <div className="mt-2 space-y-1">
                                {meal.foods.map((food, fIdx) => (
                                  <div
                                    key={fIdx}
                                    className="flex justify-between items-center text-sm"
                                  >
                                    <span className="text-white truncate">{food.name}</span>
                                    <span className="text-[#00ff87] font-medium shrink-0 ml-2">
                                      {Math.round(food.calories)} cal
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <p className="text-[#555] text-xs mt-2">
                                P: {Math.round(meal.totals.protein)}g · C:{' '}
                                {Math.round(meal.totals.carbs)}g · F:{' '}
                                {Math.round(meal.totals.fat)}g
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteMeal(meal._id)}
                              disabled={deletingId === meal._id}
                              className="p-2 rounded-lg text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors shrink-0 disabled:opacity-50"
                              aria-label="Delete meal"
                            >
                              {deletingId === meal._id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* SECTION 4 — Recipes */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Explore Recipes</h2>
            {!recipesFromApi && !recipesLoading && (
              <span className="text-[#555] text-xs">Pakistani picks</span>
            )}
          </div>

          {recipesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass rounded-2xl p-5 skeleton h-36" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recipes.map((recipe, idx) => (
                <div
                  key={idx}
                  className="glass rounded-2xl p-5 hover:border-[#00ff87]/20 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{recipe.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold leading-tight">{recipe.name}</p>
                      <span className="inline-block mt-1 text-[10px] uppercase tracking-wider text-[#00ff87] bg-[#00ff87]/10 px-2 py-0.5 rounded-full">
                        {recipe.tag}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-[#555]">Calories</p>
                      <p className="text-white font-bold">{recipe.calories}</p>
                    </div>
                    <div>
                      <p className="text-[#555]">Protein</p>
                      <p className="text-white font-bold">{recipe.protein}g</p>
                    </div>
                    <div>
                      <p className="text-[#555]">Carbs</p>
                      <p className="text-white font-bold">{recipe.carbs}g</p>
                    </div>
                    <div>
                      <p className="text-[#555]">Fat</p>
                      <p className="text-white font-bold">{recipe.fat}g</p>
                    </div>
                  </div>
                  <p className="text-[#555] text-xs mt-3">⏱ {recipe.time}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
