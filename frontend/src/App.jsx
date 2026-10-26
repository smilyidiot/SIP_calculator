import { useEffect, useRef, useState } from 'react'
import { getProjection } from './api.js'

const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN')
const compact = (n) => {
  if (n >= 1e7) return '₹' + (n / 1e7).toFixed(2) + ' Cr'
  if (n >= 1e5) return '₹' + (n / 1e5).toFixed(2) + ' L'
  if (n >= 1e3) return '₹' + Math.round(n / 1e3) + 'k'
  return '₹' + Math.round(n)
}

function RangeField({ label, value, setValue, min, max, step, prefix, suffix }) {
  return (
    <div className="field">
      <div className="top">
        <label>{label}</label>
        <div className={'val' + (suffix ? ' suffix' : '')}>
          {prefix && <span>{prefix}</span>}
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => setValue(e.target.value === '' ? '' : Number(e.target.value))}
          />
          {suffix && <span>{suffix}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
      />
    </div>
  )
}

function Chart({ series }) {
  const W = 560, H = 230, padB = 22, padT = 8
  const n = series.length
  const maxV = series[n - 1].value || 1
  const x = (i) => (W * i) / (n - 1)
  const y = (v) => padT + (H - padT - padB) * (1 - v / maxV)
  const area = (key) => {
    let d = `M ${x(0)} ${y(series[0][key])}`
    for (let k = 1; k < n; k++) d += ` L ${x(k)} ${y(series[k][key])}`
    return d + ` L ${x(n - 1)} ${H - padB} L ${x(0)} ${H - padB} Z`
  }
  const line = (key) => {
    let d = `M ${x(0)} ${y(series[0][key])}`
    for (let k = 1; k < n; k++) d += ` L ${x(k)} ${y(series[k][key])}`
    return d
  }
  const step = n <= 11 ? 1 : Math.ceil((n - 1) / 8)
  const ticks = []
  for (let t = 0; t < n; t += step) {
    ticks.push(
      <text key={t} x={x(t)} y={H - 6} fill="var(--faint)" fontSize="10" textAnchor="middle">
        {series[t].year}
      </text>
    )
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-label="Growth chart">
      <path d={area('value')} fill="var(--accent)" opacity="0.16" />
      <path d={area('invested')} fill="var(--invested)" opacity="0.3" />
      <path d={line('value')} fill="none" stroke="var(--accent)" strokeWidth="2.5" />
      <path d={line('invested')} fill="none" stroke="var(--invested)" strokeWidth="1.5" strokeDasharray="4 4" />
      {ticks}
    </svg>
  )
}

export default function App() {
  const [mode, setMode] = useState('sip')
  const [amount, setAmount] = useState(10000)
  const [rate, setRate] = useState(12)
  const [years, setYears] = useState(10)
  const [data, setData] = useState(null)
  const [source, setSource] = useState('api')
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('sip-theme') || '' } catch { return '' }
  })
  const timer = useRef()

  useEffect(() => {
    const root = document.documentElement
    if (theme) root.setAttribute('data-theme', theme)
    else root.removeAttribute('data-theme')
    try { if (theme) localStorage.setItem('sip-theme', theme) } catch {}
  }, [theme])

  useEffect(() => {
    const amt = Number(amount) || 0
    const r = Number(rate) || 0
    const y = Math.round(Number(years) || 0)
    if (amt <= 0 || r <= 0 || y < 1) return
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      const res = await getProjection({ mode, amount: amt, annual_return: r, years: y })
      setData(res.data)
      setSource(res.source)
    }, 180)
    return () => clearTimeout(timer.current)
  }, [mode, amount, rate, years])

  const toggleTheme = () => {
    const sysDark = matchMedia('(prefers-color-scheme: dark)').matches
    setTheme((cur) => (cur === 'dark' ? 'light' : cur === 'light' ? 'dark' : sysDark ? 'light' : 'dark'))
  }

  return (
    <div className="wrap">
      <header>
        <div>
          <h1>SIP &amp; Investment Calculator</h1>
          <p className="sub">Estimate what your monthly SIP or a one-time investment could grow to.</p>
        </div>
        <button className="theme" onClick={toggleTheme}>Theme</button>
      </header>

      <div className="grid">
        <div className="card">
          <div className="seg">
            <button className={mode === 'sip' ? 'on' : ''} onClick={() => setMode('sip')}>Monthly SIP</button>
            <button
              className={mode === 'lump' ? 'on' : ''}
              onClick={() => { setMode('lump'); if (Number(amount) < 10000) setAmount(100000) }}
            >
              One-time
            </button>
          </div>
          <RangeField label={mode === 'sip' ? 'Monthly investment' : 'Investment amount'}
            value={amount} setValue={setAmount} min={500} max={200000} step={500} prefix="₹" />
          <RangeField label="Expected return (p.a.)"
            value={rate} setValue={setRate} min={1} max={30} step={0.5} suffix="%" />
          <RangeField label="Time period"
            value={years} setValue={setYears} min={1} max={40} step={1} suffix="yrs" />
        </div>

        <div className="card">
          {data && (
            <>
              <div className="stats">
                <div className="stat">
                  <div className="k"><span className="dot" style={{ background: 'var(--invested)' }} />Invested</div>
                  <div className="v">{inr(data.invested)}</div>
                </div>
                <div className="stat">
                  <div className="k"><span className="dot" style={{ background: 'var(--accent)' }} />Est. returns</div>
                  <div className="v">{inr(data.returns)}</div>
                  <div className="pct">
                    {data.invested > 0 ? '+' + Math.round((data.returns / data.invested) * 100) + '% gain' : ''}
                  </div>
                </div>
                <div className="stat big">
                  <div className="k">Total value</div>
                  <div className="v">{inr(data.total)}</div>
                </div>
              </div>

              <div className="chartwrap">
                <Chart series={data.series} />
                <div className="legend">
                  <span><i style={{ background: 'var(--invested)' }} />Invested</span>
                  <span><i style={{ background: 'var(--accent)' }} />Total value</span>
                </div>
              </div>

              <details className="table">
                <summary>Year-by-year breakdown</summary>
                <table>
                  <thead>
                    <tr><th>Year</th><th>Invested</th><th>Value</th><th>Returns</th></tr>
                  </thead>
                  <tbody>
                    {data.series.slice(1).map((p) => (
                      <tr key={p.year}>
                        <td>{p.year}</td>
                        <td>{compact(p.invested)}</td>
                        <td>{compact(p.value)}</td>
                        <td>{compact(p.value - p.invested)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </>
          )}
        </div>
      </div>

      <p className="foot">
        For illustration only. Assumes a constant annual return, compounded monthly.
        {source === 'local' && ' · offline: using the built-in calculation'}
      </p>
    </div>
  )
}
