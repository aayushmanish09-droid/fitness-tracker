// PR + progression helpers shared by services.
// PR definition (per spec): highest weight ever lifted for an exercise.

// Given workout_sets rows for one exercise, return the max weight.
export function maxWeightFromSets(sets) {
  return sets.reduce((m, s) => (Number(s.weight) > m ? Number(s.weight) : m), 0)
}

// Build monthly best-weight series for a single exercise.
// history: [{ date: 'YYYY-MM-DD', weight: number }]
// Returns [{ key, label, monthShort, year, weight }] sorted ascending.
export function buildMonthlySeries(history) {
  const byMonth = new Map()
  for (const h of history) {
    const d = new Date(h.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const prev = byMonth.get(key)
    if (!prev || h.weight > prev.weight) {
      byMonth.set(key, {
        key,
        year: d.getFullYear(),
        month: d.getMonth(),
        weight: h.weight,
      })
    }
  }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return [...byMonth.values()]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((m) => ({
      ...m,
      monthShort: months[m.month],
      label: `${months[m.month]} '${String(m.year).slice(2)}`,
    }))
}

// Filter a monthly series by range: '3m' | '6m' | '12m' | 'all'
export function filterSeriesByRange(series, range) {
  if (range === 'all' || !range) return series
  const n = { '3m': 3, '6m': 6, '12m': 12 }[range] || 12
  return series.slice(-n)
}
