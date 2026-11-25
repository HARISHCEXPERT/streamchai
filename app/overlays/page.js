'use client'

// Overlay gallery: preview all designs x themes, test alerts, copy OBS links, save default.
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  DESIGNS, THEMES, SOUNDS, createAlertEngine, renderGoal, renderLeaderboard, renderTicker, renderWinner, unlockAudio,
} from '@/lib/overlay-engine'

const SAMPLE = [
  { donor_name: 'Aarav', message: 'Bhai aaj ka clutch 🔥🔥', amount: 50 },
  { donor_name: 'Priya Sharma', message: 'Love from Pune! Keep streaming ❤️', amount: 250 },
  { donor_name: 'Rohan_FF', message: 'Next match mein headshot only!', amount: 999 },
  { donor_name: 'Big Boss Gamer', message: 'Ye lo mic ke liye 🎤 MEGA SUPPORT', amount: 2500 },
]
const LEADERS = [{ name: 'Big Boss Gamer', total: 4200 }, { name: 'Rohan_FF', total: 2150 }, { name: 'Priya Sharma', total: 990 }, { name: 'Aarav', total: 450 }, { name: 'Zoya', total: 300 }]

export default function OverlayGallery() {
  const stageRef = useRef(null)
  const engineRef = useRef(null)
  const [design, setDesign] = useState('slide-card')
  const [theme, setTheme] = useState('neon')
  const [accent, setAccent] = useState('')
  const [sound, setSound] = useState('chime')
  const [creator, setCreator] = useState(null)
  const [copied, setCopied] = useState('')
  const [saved, setSaved] = useState('')
  const [origin, setOrigin] = useState('')

  const meta = DESIGNS.find(d => d.id === design)

  useEffect(() => {
    setOrigin(window.location.origin)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const { data } = await supabase.from('creators').select('id, name, alert_settings').eq('user_id', session.user.id).maybeSingle()
      if (data) {
        setCreator(data)
        const s = data.alert_settings || {}
        if (s.design) setDesign(s.design)
        if (s.theme_v2) setTheme(s.theme_v2)
        if (s.accentColor) setAccent(s.accentColor)
        if (s.sound) setSound(s.sound)
      }
    })
  }, [])

  // (re)build preview whenever selection changes
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    el.innerHTML = ''
    el.style.removeProperty('--sd-accent')
    engineRef.current = null
    const opts = { theme, accent: accent || undefined }
    if (meta.kind === 'alert') {
      engineRef.current = createAlertEngine(el, { design, ...opts, sound, hypeAbove: design === 'big-hype' ? 1 : 0, tts: false })
      engineRef.current.push({ ...SAMPLE[1], display_time: 6, __preview: true })
    } else if (design === 'goal-bar') renderGoal(el, { title: 'New Mic 🎤', current: 3200, target: 5000, ...opts })
    else if (design === 'leaderboard') renderLeaderboard(el, LEADERS, opts)
    else if (design === 'ticker') renderTicker(el, SAMPLE.map(s => ({ name: s.donor_name, amount: s.amount })), opts)
    else if (design === 'winner') renderWinner(el, { name: 'Priya Sharma', title: 'iPhone Giveaway', ...opts, sound })
  }, [design, theme, accent, sound])

  function test(i) {
    unlockAudio()
    if (meta.kind !== 'alert') { // replay widget
      const el = stageRef.current
      if (design === 'goal-bar') renderGoal(el, { title: 'New Mic 🎤', current: 3200 + SAMPLE[i].amount, target: 5000, theme, accent: accent || undefined })
      else if (design === 'winner') renderWinner(el, { name: SAMPLE[i].donor_name, title: 'iPhone Giveaway', theme, accent: accent || undefined, sound })
      return
    }
    engineRef.current?.clear()
    engineRef.current?.set({ hypeAbove: design === 'big-hype' ? 1 : 2000 })
    engineRef.current?.push({ ...SAMPLE[i], display_time: 6, __preview: true, tts_enabled: false })
  }

  const cid = creator?.id || 'YOUR_CREATOR_ID'
  const q = `theme=${theme}${accent ? `&accent=${encodeURIComponent(accent)}` : ''}`
  const obsUrl = meta.kind === 'alert'
    ? `${origin}/alerts/${cid}?design=${design}&${q}&sound=${sound}`
    : `${origin}/widgets/${cid}?type=${{ 'goal-bar': 'goal', leaderboard: 'leaderboard', ticker: 'ticker', winner: 'winner' }[design]}&${q}${design === 'goal-bar' ? '&title=New%20Mic&target=5000' : ''}${design === 'winner' ? '&name=WINNER_NAME&title=Giveaway' : ''}`

  async function copy() {
    try { await navigator.clipboard.writeText(obsUrl); setCopied('Copied!') } catch { setCopied('Copy manually') }
    setTimeout(() => setCopied(''), 1800)
  }

  async function saveDefault() {
    if (!creator) return
    const next = { ...(creator.alert_settings || {}), sound, theme_v2: theme, ...(accent ? { accentColor: accent } : {}) }
    if (meta.kind === 'alert') next.design = design
    const { error } = await supabase.from('creators').update({ alert_settings: next }).eq('id', creator.id)
    setSaved(error ? 'Could not save' : 'Saved as default ✓')
    if (!error) setCreator({ ...creator, alert_settings: next })
    setTimeout(() => setSaved(''), 2200)
  }

  const S = styles
  return (
    <div style={S.page}>
      <link rel="stylesheet" href="/overlays/sd-overlays.css" />
      <header style={S.head}>
        <div>
          <div style={S.kicker}>Overlay library</div>
          <h1 style={S.h1}>{DESIGNS.length} designs × {THEMES.length} themes = {DESIGNS.length * THEMES.length} overlays</h1>
          <p style={S.sub}>Pick a design and theme, test it, then paste the link into OBS as a Browser Source (1920×1080).</p>
        </div>
        <a href="/dashboard" style={S.back}>← Dashboard</a>
      </header>

      <style>{`.sd-gal-grid{display:grid;grid-template-columns:minmax(220px,280px) 1fr;gap:22px;align-items:start}@media(max-width:820px){.sd-gal-grid{grid-template-columns:1fr}.sd-gal-side{position:static!important}}`}</style>
      <div className="sd-gal-grid">
        <aside className="sd-gal-side" style={S.side}>
          <div style={S.label}>Design</div>
          <div style={S.list}>
            {DESIGNS.map(d => (
              <button key={d.id} onClick={() => setDesign(d.id)} style={{ ...S.item, ...(d.id === design ? S.itemOn : {}) }}>
                <b>{d.label}</b><span style={S.tag}>{d.kind === 'alert' ? 'Alert' : 'Widget'}</span>
                <small style={S.desc}>{d.desc}</small>
              </button>
            ))}
          </div>
        </aside>

        <main>
          <div style={S.label}>Theme</div>
          <div style={S.themes}>
            {THEMES.map(t => (
              <button key={t.id} onClick={() => setTheme(t.id)} style={{ ...S.theme, ...(t.id === theme ? S.itemOn : {}) }}>
                <span style={{ ...S.sw, background: `linear-gradient(135deg, ${t.swatch[0]}, ${t.swatch[1]})` }} />{t.label}
              </button>
            ))}
          </div>

          <div style={S.stageWrap}>
            <div ref={stageRef} style={{ position: 'absolute', inset: 0 }} />
          </div>

          <div style={S.controls}>
            {SAMPLE.map((s, i) => (
              <button key={i} onClick={() => test(i)} style={S.btn}>Test ₹{s.amount}</button>
            ))}
            <label style={S.ctl}>Accent
              <input type="color" value={accent || '#00f0ff'} onChange={e => setAccent(e.target.value)} style={S.color} />
              {accent && <button onClick={() => setAccent('')} style={S.mini}>reset</button>}
            </label>
            <label style={S.ctl}>Sound
              <select value={sound} onChange={e => { setSound(e.target.value); unlockAudio() }} style={S.select}>
                {SOUNDS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>

          <div style={S.obs}>
            <div style={S.label}>OBS Browser Source link</div>
            <div style={S.urlRow}>
              <code style={S.url}>{obsUrl}</code>
              <button onClick={copy} style={S.btnPrimary}>{copied || 'Copy'}</button>
            </div>
            {!creator && <p style={S.note}>Log in to get your personal link (it contains your creator ID).</p>}
            {creator && <button onClick={saveDefault} style={{ ...S.btn, marginTop: 10 }}>{saved || 'Use these as my default alert style'}</button>}
            <p style={S.note}>Drops of ₹2,000+ automatically use the Big Hype design (add <code>&hype=0</code> to turn it off).</p>
          </div>
        </main>
      </div>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#0a0a14', color: '#e8ecf5', fontFamily: 'Inter, system-ui, sans-serif', padding: '28px clamp(16px,4vw,48px)' },
  head: { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 22 },
  kicker: { color: '#f97316', fontWeight: 800, fontSize: 12, letterSpacing: '.18em', textTransform: 'uppercase' },
  h1: { margin: '6px 0', fontSize: 'clamp(24px,3.4vw,36px)', letterSpacing: '-.03em' },
  sub: { margin: 0, color: '#9aa3b8' },
  back: { color: '#cbd5e1', textDecoration: 'none', border: '1px solid #2a2f45', padding: '8px 12px', borderRadius: 10, whiteSpace: 'nowrap' },
  grid: { display: 'grid', gridTemplateColumns: 'minmax(220px,280px) 1fr', gap: 22, alignItems: 'start' },
  side: { position: 'sticky', top: 16 },
  label: { fontSize: 12, fontWeight: 800, color: '#7c879f', letterSpacing: '.12em', textTransform: 'uppercase', margin: '0 0 8px' },
  list: { display: 'grid', gap: 6 },
  item: { textAlign: 'left', background: '#121625', border: '1px solid #232a40', color: '#e8ecf5', borderRadius: 12, padding: '10px 12px', cursor: 'pointer', display: 'grid', gridTemplateColumns: '1fr auto', gap: 2 },
  itemOn: { borderColor: '#f97316', background: '#1d1622', boxShadow: '0 0 0 1px #f97316 inset' },
  tag: { fontSize: 10, fontWeight: 800, color: '#94a3b8', border: '1px solid #334155', borderRadius: 6, padding: '1px 6px', alignSelf: 'start' },
  desc: { gridColumn: '1 / -1', color: '#8a93a8', fontSize: 12 },
  themes: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  theme: { display: 'flex', alignItems: 'center', gap: 8, background: '#121625', border: '1px solid #232a40', color: '#e8ecf5', borderRadius: 999, padding: '7px 14px 7px 8px', cursor: 'pointer', fontWeight: 700 },
  sw: { width: 20, height: 20, borderRadius: '50%', display: 'inline-block' },
  stageWrap: { position: 'relative', width: '100%', aspectRatio: '16 / 9', borderRadius: 16, overflow: 'hidden', border: '1px solid #232a40',
    background: 'linear-gradient(135deg,#1b2238,#0d1120), repeating-conic-gradient(#151a2b 0% 25%, #11162a 0% 50%) 50% / 40px 40px' },
  controls: { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', margin: '14px 0' },
  btn: { background: '#161b2e', color: '#e8ecf5', border: '1px solid #2a3150', borderRadius: 10, padding: '9px 14px', fontWeight: 700, cursor: 'pointer' },
  btnPrimary: { background: '#f97316', color: '#111', border: 0, borderRadius: 10, padding: '9px 16px', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' },
  ctl: { display: 'flex', alignItems: 'center', gap: 8, color: '#9aa3b8', fontSize: 13, fontWeight: 700, marginLeft: 6 },
  color: { width: 36, height: 30, border: 0, background: 'none', cursor: 'pointer' },
  mini: { background: 'none', border: 0, color: '#94a3b8', textDecoration: 'underline', cursor: 'pointer', fontSize: 12 },
  select: { background: '#161b2e', color: '#e8ecf5', border: '1px solid #2a3150', borderRadius: 8, padding: '6px 8px' },
  obs: { background: '#0f1322', border: '1px solid #232a40', borderRadius: 14, padding: 16 },
  urlRow: { display: 'flex', gap: 8, alignItems: 'center' },
  url: { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', background: '#0a0d18', border: '1px solid #232a40', borderRadius: 8, padding: '9px 10px', fontSize: 12, color: '#b9c3d8' },
  note: { color: '#7c879f', fontSize: 12, margin: '8px 0 0' },
}
