'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X } from 'lucide-react'


const EMPTY_FORM = { title: '', mealType: 'lunch', calories: '', protein: '', carbs: '', fat: '', imageUrl: '', ingredients: '', instructions: '' }

export default function AdminRecipesPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-recipes'],
    queryFn: async () => {
      const res = await fetch(`/api/admin/recipes`, { credentials: 'include' })
      return res.json()
    }
  })

  const saveRecipe = useMutation({
    mutationFn: async (body: any) => {
      const url = editId ? `/api/admin/recipes/${editId}` : `/api/admin/recipes`
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method, credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...body,
          calories: Number(body.calories),
          protein: Number(body.protein),
          carbs: Number(body.carbs),
          fat: Number(body.fat),
          ingredients: body.ingredients.split('\n').filter(Boolean),
          instructions: body.instructions.split('\n').filter(Boolean)
        })
      })
      return res.json()
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-recipes'] }); setShowForm(false); setEditId(null); setForm({ ...EMPTY_FORM }) }
  })

  const deleteRecipe = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/admin/recipes/${id}`, { method: 'DELETE', credentials: 'include' })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-recipes'] })
  })

  const recipes = data?.data || data?.recipes || []

  const handleEdit = (recipe: any) => {
    setForm({
      title: recipe.title || '',
      mealType: recipe.mealType || 'lunch',
      calories: String(recipe.calories ?? ''),
      protein: String(recipe.protein ?? ''),
      carbs: String(recipe.carbs ?? ''),
      fat: String(recipe.fat ?? ''),
      imageUrl: recipe.imageUrl || '',
      ingredients: (recipe.ingredients || []).join('\n'),
      instructions: (recipe.instructions || []).join('\n')
    })
    setEditId(recipe._id)
    setShowForm(true)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Recipe Management</h1>
        <button onClick={() => { setForm({ ...EMPTY_FORM }); setEditId(null); setShowForm(true) }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Add Recipe
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">{editId ? 'Edit Recipe' : 'Add Recipe'}</h2>
              <button onClick={() => { setShowForm(false); setEditId(null) }}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Title', key: 'title', type: 'text' },
                { label: 'Image URL', key: 'imageUrl', type: 'text' },
                { label: 'Calories', key: 'calories', type: 'number' },
                { label: 'Protein (g)', key: 'protein', type: 'number' },
                { label: 'Carbs (g)', key: 'carbs', type: 'number' },
                { label: 'Fat (g)', key: 'fat', type: 'number' }
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-muted-foreground block mb-1">{f.label}</label>
                  <input type={f.type}
                    value={form[f.key as keyof typeof form] ?? ''}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
              ))}
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Meal Type</label>
                <select value={form.mealType ?? 'lunch'} onChange={e => setForm(p => ({ ...p, mealType: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background">
                  {['breakfast', 'lunch', 'dinner', 'snack'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Ingredients (one per line)</label>
                <textarea rows={4} value={form.ingredients ?? ''}
                  onChange={e => setForm(p => ({ ...p, ingredients: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background resize-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Instructions (one per line)</label>
                <textarea rows={4} value={form.instructions ?? ''}
                  onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background resize-none" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => saveRecipe.mutate(form)}
                className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors">
                {editId ? 'Update' : 'Create'}
              </button>
              <button onClick={() => { setShowForm(false); setEditId(null) }}
                className="flex-1 border py-2 rounded-lg text-sm hover:bg-secondary transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((recipe: any) => (
            <div key={recipe._id} className="border rounded-xl overflow-hidden group hover:border-primary/40 transition-colors">
              {recipe.imageUrl && <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-32 object-cover" />}
              <div className="p-3">
                <p className="font-medium text-sm">{recipe.title}</p>
                <p className="text-xs text-muted-foreground capitalize mt-0.5">{recipe.mealType} · {recipe.calories} kcal</p>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => handleEdit(recipe)}
                    className="flex-1 flex items-center justify-center gap-1 border py-1 rounded text-xs hover:bg-secondary transition-colors">
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => { if (confirm('Delete?')) deleteRecipe.mutate(recipe._id) }}
                    className="p-1.5 text-destructive hover:bg-destructive/10 rounded transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
