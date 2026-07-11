'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X, RefreshCw } from 'lucide-react'

const EMPTY = { name: '', type: 'strength', muscle: 'chest', difficulty: 'beginner', instructions: '', equipmentList: '' }

export default function AdminExercisesPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-exercises', page],
    queryFn: async () => {
      const res = await fetch(`/api/exercises?page=${page}&limit=20`, { credentials: 'include' })
      return res.json()
    }
  })

  const seed = useMutation({
    mutationFn: async () => {
      await fetch(`/api/exercises/seed-wger`, { method: 'POST', credentials: 'include' })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-exercises'] })
  })

  const saveExercise = useMutation({
    mutationFn: async (body: any) => {
      const url = editId ? `/api/exercises/${editId}` : `/api/exercises`
      const method = editId ? 'PUT' : 'POST'
      await fetch(url, {
        method, credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, equipmentList: body.equipmentList.split(',').map((e: string) => e.trim()).filter(Boolean) })
      })
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-exercises'] }); setShowForm(false); setEditId(null); setForm({ ...EMPTY }) }
  })

  const deleteExercise = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/exercises/${id}`, { method: 'DELETE', credentials: 'include' })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-exercises'] })
  })

  const exercises = data?.data || data?.exercises || []
  const pagination = data?.pagination || {}

  const handleEdit = (ex: any) => {
    setForm({
      name: ex.name || '',
      type: ex.type || 'strength',
      muscle: ex.muscle || 'chest',
      difficulty: ex.difficulty || 'beginner',
      instructions: ex.instructions || '',
      equipmentList: (ex.equipmentList || []).join(', ')
    })
    setEditId(ex._id)
    setShowForm(true)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Exercise Management</h1>
        <div className="flex gap-2">
          <button onClick={() => seed.mutate()} disabled={seed.isPending}
            className="flex items-center gap-2 border px-4 py-2 rounded-lg text-sm hover:bg-secondary transition-colors">
            <RefreshCw className={`w-4 h-4 ${seed.isPending ? 'animate-spin' : ''}`} />
            {seed.isPending ? 'Seeding...' : 'Seed from wger'}
          </button>
          <button onClick={() => { setForm({ ...EMPTY }); setEditId(null); setShowForm(true) }}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Add Exercise
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">{editId ? 'Edit Exercise' : 'Add Exercise'}</h2>
              <button onClick={() => { setShowForm(false); setEditId(null) }}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              {[{ label: 'Name', key: 'name' }, { label: 'Equipment (comma separated)', key: 'equipmentList' }].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-muted-foreground block mb-1">{f.label}</label>
                  <input value={form[f.key as keyof typeof form] ?? ''}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
              ))}
              {[
                { label: 'Type', key: 'type', opts: ['cardio', 'strength', 'stretching', 'plyometrics', 'powerlifting', 'olympic_weightlifting', 'strongman'] },
                { label: 'Muscle', key: 'muscle', opts: ['chest', 'biceps', 'triceps', 'lats', 'quadriceps', 'hamstrings', 'glutes', 'abdominals', 'traps', 'calves', 'forearms', 'shoulders'] },
                { label: 'Difficulty', key: 'difficulty', opts: ['beginner', 'intermediate', 'expert'] }
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-muted-foreground block mb-1">{f.label}</label>
                  <select value={form[f.key as keyof typeof form] ?? ''}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background">
                    {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Instructions</label>
                <textarea rows={4} value={form.instructions ?? ''}
                  onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background resize-none" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => saveExercise.mutate(form)}
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
        <div className="space-y-2">{[...Array(10)].map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />)}</div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Muscle</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Difficulty</th>
                <th className="text-left px-4 py-3 font-medium">Source</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {exercises.map((ex: any) => (
                <tr key={ex._id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{ex.name}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{ex.muscle}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{ex.type}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{ex.difficulty}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">{ex.dataSource || 'manual'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(ex)}
                        className="p-1.5 hover:bg-secondary rounded transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { if (confirm('Delete?')) deleteExercise.mutate(ex._id) }}
                        className="p-1.5 text-destructive hover:bg-destructive/10 rounded transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex justify-center gap-3 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 border rounded-lg text-sm hover:bg-secondary disabled:opacity-40 transition-colors">
            Previous
          </button>
          <span className="text-sm text-muted-foreground py-2">Page {page} of {pagination.pages}</span>
          <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages}
            className="px-4 py-2 border rounded-lg text-sm hover:bg-secondary disabled:opacity-40 transition-colors">
            Next
          </button>
        </div>
      )}
    </div>
  )
}
