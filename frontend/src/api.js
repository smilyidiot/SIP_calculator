// Calls the FastAPI backend for a projection. Falls back to an equivalent
// client-side calculation if the API is unreachable, so the UI still works
// on static hosting (e.g. GitHub Pages) or offline.

function localProjection({ mode, amount, annual_return, years }) {
  const sipFV = (P, r, y) => {
    const i = r / 100 / 12
    const n = Math.round(y * 12)
    return i === 0 ? P * n : P * (((1 + i) ** n - 1) / i) * (1 + i)
  }
  const lumpFV = (P, r, y) => P * (1 + r / 100) ** y
  const invAt = (y) => (mode === 'sip' ? amount * Math.round(y * 12) : amount)
  const valAt = (y) => (mode === 'sip' ? sipFV(amount, annual_return, y) : lumpFV(amount, annual_return, y))

  const series = []
  for (let y = 0; y <= years; y++) series.push({ year: y, invested: invAt(y), value: valAt(y) })
  const invested = invAt(years)
  const total = valAt(years)
  return { invested, total, returns: total - invested, series }
}

export async function getProjection(params) {
  try {
    const res = await fetch('/api/projection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    if (!res.ok) throw new Error('API ' + res.status)
    return { data: await res.json(), source: 'api' }
  } catch (e) {
    return { data: localProjection(params), source: 'local' }
  }
}
