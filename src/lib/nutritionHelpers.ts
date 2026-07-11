/**
 * Nutrition Helpers
 * 
 * Utility functions for nutrition calculations and date handling
 * Used in meal planning and nutrition tracking
 */

/**
 * Scale nutrition values from per-100g to actual serving size
 * 
 * @param ingredient - food item with nutrition per 100g
 * @param servingAmountG - how many grams in the serving
 * @returns scaled nutrition values
 */
export function scaleNutrition(ingredient: any, servingAmountG: number) {
    const factor = servingAmountG / 100

    return {
        caloriesForServing: Math.round(ingredient.calories * factor),
        proteinForServing:  Math.round((ingredient.protein_g || 0) * factor * 10) / 10,
        carbsForServing:    Math.round((ingredient.carbohydrates_total_g || 0) * factor * 10) / 10,
        fatForServing:      Math.round((ingredient.fat_total_g || 0) * factor * 10) / 10,
        fiberForServing:    Math.round((ingredient.fiber_g || 0) * factor * 10) / 10
    }
}

/**
 * Calculate meal totals from its items
 * 
 * @param items - array of meal items with scaled nutrition
 * @returns totals object
 */
export function calculateMealTotals(items: any[]) {
    return items.reduce(
        (totals, item) => ({
            totalCalories: totals.totalCalories + (item.caloriesForServing || 0),
            totalProtein:  totals.totalProtein + (item.proteinForServing || 0),
            totalCarbs:    totals.totalCarbs + (item.carbsForServing || 0),
            totalFat:      totals.totalFat + (item.fatForServing || 0),
            totalFiber:    totals.totalFiber + (item.fiberForServing || 0)
        }),
        { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, totalFiber: 0 }
    )
}

/**
 * Get today's date as YYYY-MM-DD string
 * Useful for plan queries and tracking
 * 
 * @returns date string in YYYY-MM-DD format
 */
export function getTodayString(): string {
    return new Date().toISOString().split('T')[0]
}

/**
 * Get date string for any date offset
 * 
 * @param daysOffset - number of days to add/subtract (default 0 = today)
 * @returns date string in YYYY-MM-DD format
 */
export function getDateString(daysOffset: number = 0): string {
    const d = new Date()
    d.setDate(d.getDate() + daysOffset)
    return d.toISOString().split('T')[0]
}

/**
 * Get day of week name from date string
 * 
 * @param dateString - date in YYYY-MM-DD format
 * @returns lowercase day name (e.g. "monday")
 */
export function getDayOfWeek(dateString: string): string {
    const d = new Date(dateString + 'T12:00:00')
    return d.toLocaleDateString('en', { weekday: 'long' }).toLowerCase()
}

/**
 * Check if a date string is today
 * 
 * @param dateString - date in YYYY-MM-DD format
 * @returns boolean
 */
export function isToday(dateString: string): boolean {
    return dateString === getTodayString()
}

/**
 * Check if a date string is in the past
 * 
 * @param dateString - date in YYYY-MM-DD format
 * @returns boolean
 */
export function isPast(dateString: string): boolean {
    return dateString < getTodayString()
}

/**
 * Check if a date string is in the future
 * 
 * @param dateString - date in YYYY-MM-DD format
 * @returns boolean
 */
export function isFuture(dateString: string): boolean {
    return dateString > getTodayString()
}

/**
 * Format date string for display
 * 
 * @param dateString - date in YYYY-MM-DD format
 * @returns formatted string (e.g. "Saturday, May 11, 2026")
 */
export function formatDateForDisplay(dateString: string): string {
    const d = new Date(dateString + 'T12:00:00')
    return d.toLocaleDateString('en', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    })
}
