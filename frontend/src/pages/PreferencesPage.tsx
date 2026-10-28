import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useApp } from '@/context/AppContext'
import { api } from '@/services/api'

function ChipInput({
  label,
  values,
  onChange,
}: {
  label: string
  values: string[]
  onChange: (v: string[]) => void
}) {
  const [draft, setDraft] = useState('')
  return (
    <div>
      <label className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</label>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(values.filter((x) => x !== v))}
            className="rounded-full border border-[var(--line)] px-3 py-1 text-xs"
          >
            {v} ×
          </button>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm"
          placeholder="Add item and press Add"
        />
        <button
          type="button"
          onClick={() => {
            const t = draft.trim()
            if (!t || values.includes(t)) return
            onChange([...values, t])
            setDraft('')
          }}
          className="rounded-xl border border-[var(--line)] px-3 py-2 text-sm"
        >
          Add
        </button>
      </div>
    </div>
  )
}

export function PreferencesPage() {
  const { userId, setUserId, pushToast, setPreferences } = useApp()
  const qc = useQueryClient()
  const users = useQuery({ queryKey: ['users'], queryFn: api.listUsers })
  const prefs = useQuery({
    queryKey: ['prefs', userId],
    queryFn: () => api.getPreferences(userId),
  })

  const [form, setForm] = useState({
    preferred_categories: [] as string[],
    preferred_brands: [] as string[],
    preferred_attributes: [] as string[],
    browsing_interests: [] as string[],
    recent_interactions: [] as string[],
    price_sensitivity: 0.5,
    personalization_enabled: true,
  })

  useEffect(() => {
    if (prefs.data) {
      setForm({
        preferred_categories: prefs.data.preferred_categories,
        preferred_brands: prefs.data.preferred_brands,
        preferred_attributes: prefs.data.preferred_attributes,
        browsing_interests: prefs.data.browsing_interests,
        recent_interactions: prefs.data.recent_interactions,
        price_sensitivity: prefs.data.price_sensitivity,
        personalization_enabled: prefs.data.personalization_enabled,
      })
      setPreferences(prefs.data)
    }
  }, [prefs.data, setPreferences])

  const save = useMutation({
    mutationFn: () => api.updatePreferences(userId, form),
    onSuccess: (data) => {
      setPreferences(data)
      void qc.invalidateQueries({ queryKey: ['prefs', userId] })
      pushToast('Preferences saved — search ranking will update', 'success')
    },
    onError: () => pushToast('Failed to save preferences', 'error'),
  })

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <h1 className="font-display text-4xl">Personalization settings</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Demo profiles only. Toggle personalization off to compare relevance-only ordering.
      </p>

      <label className="mt-6 block text-xs text-[var(--muted)]">
        Active demo profile
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="mt-1 w-full rounded-xl border border-[var(--line)] bg-[var(--card)] px-3 py-2 text-sm"
        >
          {(users.data || []).map((u) => (
            <option key={u.user_id} value={u.user_id}>
              {u.display_name}
            </option>
          ))}
        </select>
      </label>

      <div className="card-surface mt-6 space-y-6 p-5">
        <label className="flex items-center justify-between gap-4 text-sm">
          <span>Enable personalization</span>
          <input
            type="checkbox"
            checked={form.personalization_enabled}
            onChange={(e) => setForm((f) => ({ ...f, personalization_enabled: e.target.checked }))}
          />
        </label>

        <label className="block text-xs text-[var(--muted)]">
          Price sensitivity ({form.price_sensitivity.toFixed(2)})
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={form.price_sensitivity}
            onChange={(e) => setForm((f) => ({ ...f, price_sensitivity: Number(e.target.value) }))}
            className="mt-2 w-full"
          />
        </label>

        <ChipInput
          label="Preferred categories"
          values={form.preferred_categories}
          onChange={(preferred_categories) => setForm((f) => ({ ...f, preferred_categories }))}
        />
        <ChipInput
          label="Preferred brands"
          values={form.preferred_brands}
          onChange={(preferred_brands) => setForm((f) => ({ ...f, preferred_brands }))}
        />
        <ChipInput
          label="Preferred attributes"
          values={form.preferred_attributes}
          onChange={(preferred_attributes) => setForm((f) => ({ ...f, preferred_attributes }))}
        />
        <ChipInput
          label="Browsing interests"
          values={form.browsing_interests}
          onChange={(browsing_interests) => setForm((f) => ({ ...f, browsing_interests }))}
        />
        <ChipInput
          label="Recent interactions (product IDs)"
          values={form.recent_interactions}
          onChange={(recent_interactions) => setForm((f) => ({ ...f, recent_interactions }))}
        />

        <button
          type="button"
          onClick={() => save.mutate()}
          className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white"
        >
          {save.isPending ? 'Saving…' : 'Save preferences'}
        </button>
      </div>
    </div>
  )
}
