import axios from 'axios'
import { Exercise, NutritionCache, ExerciseMetaCache } from '@/models'

const WGER_BASE          = 'https://wger.de/api/v2'
const ENGLISH_LANG       = 2
const EXERCISE_TTL_DAYS  = parseInt(process.env.WGER_EXERCISE_CACHE_TTL_DAYS || '30')
const NUTRITION_TTL_DAYS = 7
const META_TTL_DAYS      = parseInt(process.env.WGER_META_CACHE_TTL_DAYS || '90')

// Muscle name → wger category ID
const CATEGORY_MAP: Record<string, number> = {
  abs: 10, abdominals: 10, core: 10,
  arms: 8, biceps: 8, triceps: 8, forearms: 8,
  back: 12, lats: 12, lower_back: 12, middle_back: 12, traps: 12,
  calves: 14,
  chest: 11,
  legs: 9, quadriceps: 9, quads: 9, hamstrings: 9, glutes: 9,
  shoulders: 13, neck: 13
}

// Category ID → our muscle field value
const CAT_TO_MUSCLE: Record<number, string> = {
  10: 'abs', 8: 'biceps', 12: 'back',
  14: 'calves', 11: 'chest', 9: 'quads', 13: 'shoulders'
}

// Helper: strip HTML tags from wger descriptions
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

// Helper: ensure URL is absolute
function ensureAbsolute(url: string): string {
  if (!url) return ''
  return url.startsWith('http') ? url : `https://wger.de${url}`
}

// ══════════════════════════════════════════
// MAP VIDEO (exact wger field names)
// ══════════════════════════════════════════
function mapVideo(vid: any) {
  return {
    wgerVideoId:   vid.id,
    uuid:          vid.uuid,
    videoUrl:      ensureAbsolute(vid.video),  // ← "video" not "videoUrl"
    isMain:        vid.is_main || false,
    durationSec:   parseFloat(vid.duration) || 0,  // ← string → float
    width:         vid.width  || 0,
    height:        vid.height || 0,
    codec:         vid.codec  || 'h264',
    fileSizeBytes: vid.size   || 0,
    licenseAuthor: vid.license_author || ''
  }
}

// ══════════════════════════════════════════
// MAP IMAGE (exact wger field names)
// ══════════════════════════════════════════
function mapImage(img: any) {
  return {
    wgerImageId:   img.id,
    uuid:          img.uuid,
    imageUrl:      ensureAbsolute(img.image),  // ← "image" not "imageUrl"
    isMain:        img.is_main || false,
    isAiGenerated: img.is_ai_generated || false
  }
}

// ══════════════════════════════════════════
// MAP MUSCLE (handle empty name_en)
// ══════════════════════════════════════════
function mapMuscle(m: any) {
  return {
    wgerMuscleId:    m.id,
    latinName:       m.name,
    englishName:     m.name_en || '',
    displayName:     m.name_en || m.name,  // ← CRITICAL: name_en can be empty string
    isFront:         m.is_front || false,
    svgUrlMain:      m.image_url_main    || '',
    svgUrlSecondary: m.image_url_secondary || ''
  }
}

// ══════════════════════════════════════════
// GET FULL EXERCISE INFO — CACHE FIRST
// ══════════════════════════════════════════
export async function getExerciseFullInfo(wgerId: number) {
  const stale = new Date(Date.now() - EXERCISE_TTL_DAYS * 86400000)

  const cached = await Exercise.findOne({ wgerId, cachedAt: { $gte: stale } })
  if (cached) return cached

  const response = await axios.get(`${WGER_BASE}/exerciseinfo/${wgerId}/`, {
    params: { format: 'json' },
    timeout: 10000
  })
  const w = response.data

  // Get English name/description
  const enTrans = w.translations?.find((t: any) => t.language === ENGLISH_LANG)
    || w.translations?.[0] || {}
  const exerciseName = enTrans.name || w.name || `Exercise ${wgerId}`
  const description  = stripHtml(enTrans.description || w.description || '')

  // Map videos, images, muscles, equipment
  const wgerVideos   = (w.videos   || []).map(mapVideo)
  const wgerImages   = (w.images   || []).map(mapImage)
  const wgerEquipment = (w.equipment || []).map((eq: any) => ({
    wgerEquipmentId: eq.id,
    name:       eq.name,
    displayName: eq.id === 7 ? 'Bodyweight' : eq.name
  }))
  const musclesPrimary   = (w.muscles           || []).map((m: any) => mapMuscle(m))
  const musclesSecondary = (w.muscles_secondary || []).map((m: any) => mapMuscle(m))

  // Computed convenience fields
  const primaryVideoUrl = wgerVideos.find((v: any) => v.isMain)?.videoUrl || wgerVideos[0]?.videoUrl || ''
  const primaryImageUrl = wgerImages.find((i: any) => i.isMain)?.imageUrl || wgerImages[0]?.imageUrl || ''
  const isBodyweight    = (w.equipment || []).some((eq: any) => eq.id === 7)

  const doc = {
    name:         exerciseName,
    type:         'strength',
    muscle:       CAT_TO_MUSCLE[w.category?.id] || 'chest',
    difficulty:   'intermediate',
    instructions: description,
    safetyInfo:   '',
    equipmentList: wgerEquipment.map((e: any) => e.displayName),

    wgerId:   w.id,
    wgerUuid: w.uuid,
    wgerCategory: { id: w.category?.id, name: w.category?.name },
    musclesPrimary,
    musclesSecondary,
    wgerVideos,
    wgerImages,
    wgerEquipment,

    primaryVideoUrl,
    primaryImageUrl,
    hasVideo:  wgerVideos.length > 0,
    hasImage:  wgerImages.length > 0,
    isBodyweight,
    imageUrl: primaryImageUrl,

    // Backward compatibility
    media: {
      videoUrl:     primaryVideoUrl,
      thumbnailUrl: primaryImageUrl,
      imageUrls:    wgerImages.map((i: any) => i.imageUrl),
      gifUrl:       ''
    },
    keywords: [CAT_TO_MUSCLE[w.category?.id], w.category?.name?.toLowerCase(), 'wger'].filter(Boolean),
    dataSource: 'wger',
    isActive:   true,
    cachedAt:   new Date()
  }

  const saved = await Exercise.findOneAndUpdate(
    { wgerId: w.id },
    doc,
    { upsert: true, new: true }
  )
  console.log(`💾 wger exercise saved: "${exerciseName}" | video:${wgerVideos.length} img:${wgerImages.length}`)
  return saved
}

// ══════════════════════════════════════════
// SEARCH EXERCISES BY CATEGORY
// ══════════════════════════════════════════
export async function getExercisesFromWger(filters: {
  muscle?: string; category?: string; equipment?: string
  name?: string; limit?: number; offset?: number
}) {
  const stale  = new Date(Date.now() - EXERCISE_TTL_DAYS * 86400000)
  const muscle = (filters.muscle || filters.category || '').toLowerCase().trim()

  // DB query
  const dbQuery: any = { isActive: true, dataSource: 'wger', cachedAt: { $gte: stale } }
  const catId = muscle ? CATEGORY_MAP[muscle] : null
  if (catId)          dbQuery['wgerCategory.id'] = catId
  else if (muscle)    dbQuery.$text = { $search: muscle }

  const cached = await Exercise.find(dbQuery).limit(filters.limit || 20)
  if (cached.length >= 5) {
    console.log(`✅ wger cache HIT: ${cached.length} exercises`)
    return { data: cached, fromCache: true, source: 'wger' }
  }

  console.log(`⚡ wger API call for: ${muscle || 'all'}`)
  const params: any = { language: ENGLISH_LANG, limit: filters.limit || 20, offset: 0, format: 'json' }
  if (catId)             params.category  = catId
  if (filters.equipment) params.equipment = filters.equipment

  const listRes = await axios.get(`${WGER_BASE}/exercise/`, { params, timeout: 10000 })
  const list    = listRes.data?.results || []

  const saved = []
  for (const ex of list.slice(0, 15)) {
    try {
      const info = await getExerciseFullInfo(ex.id)
      if (info) saved.push(info)
      await new Promise(r => setTimeout(r, 120))  // polite delay
    } catch { /* skip */ }
  }

  return { data: saved, fromCache: false, count: saved.length, source: 'wger' }
}

// ══════════════════════════════════════════
// FETCH VIDEOS FOR EXERCISE (separate call)
// ══════════════════════════════════════════
export async function getVideosForExercise(wgerId: number) {
  try {
    const res = await axios.get(`${WGER_BASE}/video/`, {
      params: { exercise: wgerId, format: 'json', limit: 10 },
      timeout: 8000
    })
    return (res.data?.results || []).map(mapVideo)
  } catch (err: any) {
    console.warn(`⚠️  Videos fetch failed for ${wgerId}: ${err.message}`)
    return []
  }
}

// ══════════════════════════════════════════
// FETCH IMAGES FOR EXERCISE (separate call)
// ══════════════════════════════════════════
export async function getImagesForExercise(wgerId: number) {
  try {
    const res = await axios.get(`${WGER_BASE}/exerciseimage/`, {
      params: { exercise: wgerId, format: 'json', limit: 10 },
      timeout: 8000
    })
    return (res.data?.results || []).map(mapImage)
  } catch (err: any) {
    console.warn(`⚠️  Images fetch failed for ${wgerId}: ${err.message}`)
    return []
  }
}

// ══════════════════════════════════════════
// GET ALL META (muscles, equipment, categories)
// ══════════════════════════════════════════
export async function getWgerMeta() {
  const stale = new Date(Date.now() - META_TTL_DAYS * 86400000)
  const cached = await ExerciseMetaCache.findOne({ metaType: 'muscles', cachedAt: { $gte: stale } })
  if (cached) {
    const [eqCache, catCache] = await Promise.all([
      ExerciseMetaCache.findOne({ metaType: 'equipment' }),
      ExerciseMetaCache.findOne({ metaType: 'categories' })
    ])
    console.log('✅ wger meta cache HIT')
    return { muscles: cached.data, equipment: eqCache?.data || [], categories: catCache?.data || [] }
  }

  console.log('⚡ Fetching wger meta lists...')
  const [catRes, muscleRes, equipRes] = await Promise.all([
    axios.get(`${WGER_BASE}/exercisecategory/?format=json`),
    axios.get(`${WGER_BASE}/muscle/?format=json`),
    axios.get(`${WGER_BASE}/equipment/?format=json`)
  ])

  const muscles = (muscleRes.data?.results || []).map((m: any) => ({
    id:                  m.id,
    name:                m.name,
    name_en:             m.name_en,
    displayName:         m.name_en || m.name,   // ← never empty
    is_front:            m.is_front,
    image_url_main:      m.image_url_main,       // SVG diagram URL
    image_url_secondary: m.image_url_secondary
  }))

  const equipment = (equipRes.data?.results || []).map((eq: any) => ({
    id:          eq.id,
    name:        eq.name,
    displayName: eq.id === 7 ? 'Bodyweight' : eq.name   // handle "none (bodyweight)"
  }))

  const categories = catRes.data?.results || []

  await Promise.all([
    ExerciseMetaCache.findOneAndUpdate({ metaType: 'muscles' },    { metaType: 'muscles',    data: muscles,    cachedAt: new Date() }, { upsert: true }),
    ExerciseMetaCache.findOneAndUpdate({ metaType: 'equipment' },  { metaType: 'equipment',  data: equipment,  cachedAt: new Date() }, { upsert: true }),
    ExerciseMetaCache.findOneAndUpdate({ metaType: 'categories' }, { metaType: 'categories', data: categories, cachedAt: new Date() }, { upsert: true })
  ])

  console.log('💾 wger meta cached')
  return { muscles, equipment, categories }
}

// ══════════════════════════════════════════
// MAP INGREDIENT FROM /ingredient/ (list response)
// ══════════════════════════════════════════
function mapIngredientFromList(ing: any) {
  return {
    wgerIngredientId: ing.id,
    wgerUuid:         ing.uuid,
    name:             ing.name?.trim()        || '',
    commonName:       ing.common_name?.trim() || '',
    brand:            ing.brand               || '',
    sourceName:       ing.source_name         || '',

    // energy is INTEGER in API, others are STRINGS — all stored as numbers
    calories:              ing.energy                           || 0,
    protein_g:             parseFloat(ing.protein)             || 0,
    carbohydrates_total_g: parseFloat(ing.carbohydrates)       || 0,
    carbohydrates_sugar_g: parseFloat(ing.carbohydrates_sugar) || 0,
    fat_total_g:           parseFloat(ing.fat)                 || 0,
    fat_saturated_g:       parseFloat(ing.fat_saturated)       || 0,
    fiber_g:               parseFloat(ing.fiber)               || 0,
    sodium_g:              parseFloat(ing.sodium)              || 0,  // in grams in wger

    serving_size_g:  100,  // wger values are per 100g
    isVegan:         ing.is_vegan,       // null | true | false
    isVegetarian:    ing.is_vegetarian,  // null | true | false
    nutriscore:      ing.nutriscore,     // null | "a" | "b" | "c" | "d" | "e"

    weightUnits: (ing.weight_units || []).map((wu: any) => ({
      unitId: wu.id,
      gram:   wu.gram,
      name:   wu.name
    })),

    // No image in list response — fetch from ingredientinfo if needed
    imageUrl:   '',
    thumbnails: {},
    source:     'wger'
  }
}

// ══════════════════════════════════════════
// MAP INGREDIENT FROM /ingredientinfo/ (detail response)
// ══════════════════════════════════════════
function mapIngredientFromInfo(ing: any) {
  const base = mapIngredientFromList(ing)

  return {
    ...base,
    // language in ingredientinfo is a FULL OBJECT not a number
    // language.short_name === 'en' means English

    // Image — can be null
    imageUrl: ing.image?.image || '',   // ing.image is an object, .image is the URL

    // Thumbnails — can be null
    thumbnails: ing.thumbnails ? {
      small:         ing.thumbnails.small          || '',
      smallCropped:  ing.thumbnails.small_cropped  || '',
      medium:        ing.thumbnails.medium         || '',
      mediumCropped: ing.thumbnails.medium_cropped || '',
      large:         ing.thumbnails.large          || ''
    } : {}
  }
}

// ══════════════════════════════════════════
// SEARCH INGREDIENTS — CACHE FIRST
// ══════════════════════════════════════════
export async function searchIngredients(query: string, limit: number = 10) {
  // ALWAYS filter language=2 (English only)
  const queryKey  = `wger:${query.toLowerCase().trim()}`
  const staleDate = new Date(Date.now() - NUTRITION_TTL_DAYS * 86400000)

  // Check cache
  const cached = await NutritionCache.findOne({
    queryKey,
    cachedAt: { $gte: staleDate }
  })
  if (cached) {
    NutritionCache.findByIdAndUpdate(cached._id, {
      $inc: { hitCount: 1 }, lastHitAt: new Date()
    }).exec()
    return { data: cached.results, fromCache: true }
  }

  // Call wger — MUST include language=2 for English results
  console.log(`⚡ wger ingredient search: "${query}"`)
  const response = await axios.get(`${WGER_BASE}/ingredient/`, {
    params: {
      name:     query.trim(),
      language: ENGLISH_LANG,  // ← ALWAYS English
      format:   'json',
      limit:    limit
    },
    timeout: 8000
  })

  const ingredients = response.data?.results || []

  if (ingredients.length === 0) {
    return { data: [], fromCache: false }
  }

  // Map using exact field names
  const results = ingredients.map(mapIngredientFromList)

  // Save to cache
  await NutritionCache.findOneAndUpdate(
    { queryKey, queryType: 'freeform' },
    {
      queryKey,
      originalQuery: query,
      queryType:     'freeform',
      results,
      cachedAt:  new Date(),
      hitCount:  1,
      lastHitAt: new Date()
    },
    { upsert: true, new: true }
  )

  return { data: results, fromCache: false }
}

// ══════════════════════════════════════════
// GET INGREDIENT DETAIL WITH IMAGE — CACHE FIRST
// ══════════════════════════════════════════
export async function getIngredientDetail(wgerIngredientId: number) {
  const queryKey  = `wger:detail:${wgerIngredientId}`
  const staleDate = new Date(Date.now() - NUTRITION_TTL_DAYS * 86400000)

  const cached = await NutritionCache.findOne({
    queryKey,
    cachedAt: { $gte: staleDate }
  })
  if (cached?.results?.[0]) {
    return { data: cached.results[0], fromCache: true }
  }

  // Call ingredientinfo endpoint (has images + thumbnails)
  const response = await axios.get(
    `${WGER_BASE}/ingredientinfo/${wgerIngredientId}/`,
    { params: { format: 'json' }, timeout: 8000 }
  )

  const result = mapIngredientFromInfo(response.data)

  await NutritionCache.findOneAndUpdate(
    { queryKey, queryType: 'item' },
    {
      queryKey,
      originalQuery: String(wgerIngredientId),
      queryType:     'item',
      results:       [result],
      cachedAt:  new Date(),
      hitCount:  1,
      lastHitAt: new Date()
    },
    { upsert: true, new: true }
  )

  return { data: result, fromCache: false }
}

// ══════════════════════════════════════════
// SEARCH INGREDIENTS (nutrition)
// ══════════════════════════════════════════
export async function searchIngredients_deprecated(query: string) {
  const key   = `wger:${query.toLowerCase().trim()}`
  const stale = new Date(Date.now() - NUTRITION_TTL_DAYS * 86400000)

  const cached = await NutritionCache.findOne({ queryKey: key, cachedAt: { $gte: stale } })
  if (cached) {
    NutritionCache.findByIdAndUpdate(cached._id, { $inc: { hitCount: 1 } }).exec()
    return { data: cached.results, fromCache: true, source: 'wger' }
  }

  const res = await axios.get(`${WGER_BASE}/ingredient/`, {
    params: { name: query, language: ENGLISH_LANG, limit: 10, format: 'json' },
    timeout: 8000
  })

  const results = (res.data?.results || []).map((ing: any) => ({
    name:                  ing.name,
    calories:              ing.energy           || 0,
    serving_size_g:        100,
    fat_total_g:           ing.fat              || 0,
    fat_saturated_g:       ing.saturated_fat    || 0,
    protein_g:             ing.protein          || 0,
    sodium_mg:             ing.sodium           || 0,
    potassium_mg:          ing.potassium        || 0,
    cholesterol_mg:        0,
    carbohydrates_total_g: ing.carbohydrates    || 0,
    fiber_g:               ing.fiber            || 0,
    sugar_g:               ing.sugar            || 0,
    wgerIngredientId:      ing.id,
    source:                'wger'
  }))

  await NutritionCache.findOneAndUpdate(
    { queryKey: key, queryType: 'freeform' },
    { queryKey: key, originalQuery: query, queryType: 'freeform', results, cachedAt: new Date(), hitCount: 1 },
    { upsert: true }
  )

  return { data: results, fromCache: false, source: 'wger' }
}

// ══════════════════════════════════════════
// SEED ALL EXERCISES (admin use)
// ══════════════════════════════════════════
export async function seedAllExercisesFromWger() {
  const categories = [10, 8, 12, 14, 11, 9, 13]
  let total = 0

  for (const catId of categories) {
    try {
      const res  = await axios.get(`${WGER_BASE}/exercise/`, {
        params: { language: ENGLISH_LANG, category: catId, limit: 20, format: 'json' }
      })
      const list = res.data?.results || []
      for (const ex of list) {
        try { await getExerciseFullInfo(ex.id); total++; await new Promise(r => setTimeout(r, 150)) }
        catch { /* skip */ }
      }
      console.log(`✅ Category ${catId}: ${list.length} exercises`)
      await new Promise(r => setTimeout(r, 600))
    } catch (err: any) {
      console.error(`❌ Category ${catId} failed: ${err.message}`)
    }
  }
  return total
}
