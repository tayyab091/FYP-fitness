'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, Globe, Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react'


const EMPTY_FORM = {
  name: '',
  description: '',
  phone: '',
  email: '',
  website: '',
  street: '',
  city: '',
  country: '',
  postalCode: ''
}

export default function AdminGymsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-gyms'],
    queryFn: async () => {
      const res = await fetch(`/api/admin/gyms`, { credentials: 'include' })
      return res.json()
    }
  })

  const saveGym = useMutation({
    mutationFn: async (body: any) => {
      const url = editId ? `/api/admin/gyms/${editId}` : `/api/admin/gyms`
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method, credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: body.name,
          description: body.description,
          phone: body.phone,
          email: body.email,
          website: body.website || '',
          address: {
            street: body.street,
            city: body.city,
            country: body.country,
            postalCode: body.postalCode || ''
          }
        })
      })
      return res.json()
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['admin-gyms'] })
      setShowForm(false)
      setEditId(null)
      setForm({ ...EMPTY_FORM })
    }
  })

  const deleteGym = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/admin/gyms/${id}`, { method: 'DELETE', credentials: 'include' })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-gyms'] })
  })

  const verifyGym = useMutation({
    mutationFn: async ({ id, action, note }: { id: string; action: string; note?: string }) => {
      await fetch(`/api/admin/gyms/${id}/${action}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note })
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-gyms'] })
  })

  const gyms = data?.data || data?.gyms || []

  const statusColor = (s: string) => ({
    verified: 'text-green-500', rejected: 'text-red-500',
    pending: 'text-yellow-500', suspended: 'text-orange-500'
  })[s] || 'text-muted-foreground'

  const handleEdit = (gym: any) => {
    setForm({
      name: gym.name || '',
      description: gym.description || '',
      phone: gym.phone || '',
      email: gym.email || '',
      website: gym.website || '',
      street: gym.address?.street || '',
      city: gym.address?.city || '',
      country: gym.address?.country || '',
      postalCode: gym.address?.postalCode || ''
    })
    setEditId(gym._id)
    setShowForm(true)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Gym Management</h1>
        <button onClick={() => { setForm({ ...EMPTY_FORM }); setEditId(null); setShowForm(true) }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Add Gym
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">{editId ? 'Edit Gym' : 'Add Gym'}</h2>
              <button onClick={() => { setShowForm(false); setEditId(null) }}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Gym Name', key: 'name', type: 'text' },
                { label: 'Email', key: 'email', type: 'email' },
                { label: 'Phone', key: 'phone', type: 'text' },
                { label: 'Website', key: 'website', type: 'text' },
                { label: 'Street', key: 'street', type: 'text' },
                { label: 'City', key: 'city', type: 'text' },
                { label: 'Country', key: 'country', type: 'text' },
                { label: 'Postal Code', key: 'postalCode', type: 'text' }
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
                <label className="text-xs text-muted-foreground block mb-1">Description</label>
                <textarea rows={4} value={form.description ?? ''}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background resize-none" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => saveGym.mutate(form)} disabled={saveGym.isPending}
                className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm hover:bg-primary/90 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
                {saveGym.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
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
        <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />)}</div>
      ) : (
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Gym Name</th>
                <th className="text-left px-4 py-3 font-medium">Country</th>
                <th className="text-left px-4 py-3 font-medium">Owner Email</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {gyms.map((gym: any) => (
                <tr key={gym._id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{gym.name}</td>
                  <td className="px-4 py-3 text-muted-foreground flex items-center gap-1">
                    <Globe className="w-3 h-3" />{gym.address?.country || '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{gym.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium capitalize ${statusColor(gym.verificationStatus)}`}>
                      {gym.verificationStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 flex-wrap">
                      {gym.verificationStatus === 'pending' && (
                        <>
                          <button onClick={() => verifyGym.mutate({ id: gym._id, action: 'verify' })}
                            className="text-xs bg-green-500/10 text-green-600 hover:bg-green-500/20 px-2 py-1 rounded">
                            Approve
                          </button>
                          <button onClick={() => {
                            const note = prompt('Rejection reason:')
                            if (note !== null) verifyGym.mutate({ id: gym._id, action: 'reject', note })
                          }} className="text-xs bg-red-500/10 text-red-600 hover:bg-red-500/20 px-2 py-1 rounded">
                            Reject
                          </button>
                        </>
                      )}
                      {gym.verificationStatus === 'verified' && (
                        <button onClick={() => verifyGym.mutate({ id: gym._id, action: 'suspend' })}
                          className="text-xs bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 px-2 py-1 rounded">
                          Suspend
                        </button>
                      )}
                      <button onClick={() => handleEdit(gym)}
                        className="text-xs bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 px-2 py-1 rounded flex items-center gap-1">
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      <button onClick={() => { if (confirm('Delete this gym?')) deleteGym.mutate(gym._id) }}
                        className="text-xs bg-red-500/10 text-red-600 hover:bg-red-500/20 px-2 py-1 rounded flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
