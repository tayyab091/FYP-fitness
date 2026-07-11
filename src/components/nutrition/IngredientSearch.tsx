/**
 * IngredientSearch Component
 * 
 * Dropdown search for finding ingredients from wger database
 * Shows nutrition info and allows selecting with quantity
 */

'use client'

import { useState, useCallback } from 'react'
import { Search, Check, ChefHat } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface Ingredient {
    id:              string
    name:            string
    energy:          number
    protein:         number
    carbohydrates:   number
    fat:             number
    fiber:           number
    imageUrl?:       string
    brand?:          string
}

interface IngredientSearchProps {
    onSelect: (ingredient: Ingredient, grams: number) => void
    loading?: boolean
}

export default function IngredientSearch({ onSelect, loading }: IngredientSearchProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<Ingredient[]>([])
    const [searching, setSearching] = useState(false)
    const [selectedGrams, setSelectedGrams] = useState(100)
    const [showResults, setShowResults] = useState(false)

    const searchIngredients = useCallback(async (searchQuery: string) => {
        if (!searchQuery?.trim()) {
            setResults([])
            return
        }

        setSearching(true)
        try {
            const response = await fetch(
                `/api/nutrition/search?query=${encodeURIComponent(searchQuery)}&limit=10`
            )
            const data = await response.json()
            setResults(data.data?.results || [])
            setShowResults(true)
        } catch (error) {
            console.error('❌ Search error:', error)
            setResults([])
        } finally {
            setSearching(false)
        }
    }, [])

    const handleSelectIngredient = (ingredient: Ingredient) => {
        onSelect(ingredient, selectedGrams)
        setQuery('')
        setResults([])
        setShowResults(false)
        setSelectedGrams(100)
    }

    return (
        <div className="relative w-full">
            <div className="space-y-3">
                {/* Search Input */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search ingredients (e.g., chicken, rice, eggs)..."
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value)
                            searchIngredients(e.target.value)
                        }}
                        className="pl-10 bg-gray-50 focus:bg-white border-gray-200"
                    />
                </div>

                {/* Grams Input */}
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                        Serving (g):
                    </label>
                    <Input
                        type="number"
                        min="1"
                        max="2000"
                        value={selectedGrams}
                        onChange={(e) => setSelectedGrams(Number(e.target.value) || 100)}
                        className="w-24 bg-gray-50 border-gray-200"
                    />
                </div>
            </div>

            {/* Results Dropdown */}
            {showResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    {searching ? (
                        <div className="p-4 text-center text-gray-500">
                            <div className="inline-block animate-spin">⏳</div> Searching...
                        </div>
                    ) : results.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                            <ChefHat className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            {query ? 'No ingredients found' : 'Start typing to search'}
                        </div>
                    ) : (
                        <div className="divide-y">
                            {results.map((ingredient) => (
                                <button
                                    key={ingredient.id}
                                    onClick={() => handleSelectIngredient(ingredient)}
                                    className="w-full p-3 text-left hover:bg-blue-50 transition-colors flex justify-between items-start"
                                >
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900">
                                            {ingredient.name}
                                        </div>
                                        {ingredient.brand && (
                                            <div className="text-xs text-gray-500">
                                                {ingredient.brand}
                                            </div>
                                        )}
                                        <div className="text-xs text-gray-600 mt-1">
                                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded mr-1">
                                                {ingredient.energy} cal
                                            </span>
                                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded mr-1">
                                                {ingredient.protein.toFixed(1)}g P
                                            </span>
                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                {ingredient.carbohydrates.toFixed(1)}g C
                                            </span>
                                        </div>
                                    </div>
                                    {ingredient.imageUrl && (
                                        <img
                                            src={ingredient.imageUrl}
                                            alt={ingredient.name}
                                            className="w-12 h-12 rounded object-cover ml-2"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
