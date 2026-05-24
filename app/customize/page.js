'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import LoadingScreen from '@/components/LoadingScreen'

const THEMES = [
  { id: 'dark',    label: 'Dark',    bg: '#1a1a2e', border: '#f97316', text: '#e2e8f0' },
  { id: 'gaming',  label: 'Gaming',  bg: '#0d0d0d', border: '#00ff88', text: '#ffffff' },
  { id: 'purple',  label: 'Purple',  bg: '#1e1b4b', border: '#8b5cf6', text: '#e2e8f0' },
  { id: 'minimal', label: 'Minimal', bg: '#ffffff', border: '#1a1a2e', text: '#1a1a2e' },
]

const ANIMATIONS = [
  { id: 'slide',  label: 'Slide Up' },
  { id: 'bounce', label: 'Bounce' },
  { id: 'fade',   label: 'Fade In' },
  { id: 'pop',    label: 'Pop' },
]

const SOUNDS = [
  { id: 'none',   label: '🔇 No Sound' },
  { id: 'ding',   label: '🔔 Ding' },
  { id: 'chime',  label: '🎵 Chime' },
  { id: 'tada',   label: '🎉 Tada' },
]

const ACCENT_COLORS = ['#f97316', '#8b5cf6', '#06b6d4', '#22c55e', '#ec4899', '#ef4444', '#f59e0b', '#ffffff']

const DEFAULT_SETTINGS = {
  theme: 'dark',
  accentColor: '#f97316',
  animation: 'slide',
  sound: 'ding',
  tiers: [
    { minAmount: 1,   maxAmount: 50,  maxChars: 30,  displayTime: 5,  ttsEnabled: false },
    { minAmount: 51,  maxAmount: 200, maxChars: 120, displayTime: 15, ttsEnabled: false },
    { minAmount: 201, maxAmount: null, maxChars: 300, displayTime: 30, ttsEnabled: true },
  ]
}

export default function CustomizePage() {
  const router = useRouter()
  const [creator, setCreator] = useState(null)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/'); return }
      const { data } = await supabase
        .from('creators')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle()
      if (data) {
        setCreator(data)
        if (data.alert_settings) {
          setSettings({ ...DEFAULT_SETTINGS, ...data.alert_settings })
        }
      }
      setLoading(false)
    })
  }, [])

  function updateSetting(key, val) {
    setSettings(prev => ({ ...prev, [key]: val }))
  }

  function updateTier(index, key, val) {
    setSettings(prev => {
      const tiers = [...prev.tiers]
      tiers[index] = { ...tiers[index], [key]: val }
      return { ...prev, tiers }
    })
  }

  async function save() {
    if (!creator) return
    setSaving(true)
    await supabase
      .from('creators')
      .update({ alert_settings: settings })
      .eq('id', creator.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return <LoadingScreen text="Loading customizer..." />

  const theme = THEMES.find(t => t.id === settings.theme) || THEMES[0]

  return (
    <div style={s.page}>
      {/* Nav */}
      <div style={s.nav}>
        <button onClick={() => router.push('/dashboard')} style={s.backBtn}>← Dashboard</button>
        <span style={s.navTitle}>🎨 Customize Alerts</span>
        <button onClick={save} style={{ ...s.saveBtn, background: saved ? '#22c55e' : '#f97316' }} disabled={saving}>
          {saving ? 'Saving...' : saved ? '✅ Saved!' : 'Save Changes'}
        </button>
      </div>

      <div style={s.layout}>
        {/* Left — controls */}
        <div style={s.controls}>

          {/* Theme */}
          <Section title="Alert Theme">
            <div style={s.themeGrid}>
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => updateSetting('theme', t.id)}
                  style={{
                    ...s.themeBtn,
                    background: t.bg,
                    border: settings.theme === t.id ? `2px solid ${t.border}` : '2px solid transparent',
                    color: t.text,
                  }}
                >
                  <div style={{ width: '100%', height: '32px', background: t.border, borderRadius: '4px', marginBottom: '6px', opacity: 0.7 }} />
                  {t.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Accent Color */}
          <Section title="Accent Color">
            <div style={s.colorRow}>
              {ACCENT_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => updateSetting('accentColor', c)}
                  style={{
                    ...s.colorBtn,
                    background: c,
                    border: settings.accentColor === c ? '3px solid #fff' : '3px solid transparent',
                    boxShadow: settings.accentColor === c ? `0 0 0 2px ${c}` : 'none',
                  }}
                />
              ))}
            </div>
          </Section>

          {/* Animation */}
          <Section title="Animation Style">
            <div style={s.optionRow}>
              {ANIMATIONS.map(a => (
                <button
                  key={a.id}
                  onClick={() => updateSetting('animation', a.id)}
                  style={{
                    ...s.optionBtn,
                    background: settings.animation === a.id ? 'rgba(249,115,22,0.15)' : '#0a0a14',
                    border: settings.animation === a.id ? '1px solid #f97316' : '1px solid rgba(255,255,255,0.08)',
                    color: settings.animation === a.id ? '#f97316' : '#94a3b8',
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Sound */}
          <Section title="Alert Sound">
            <div style={s.optionRow}>
              {SOUNDS.map(so => (
                <button
                  key={so.id}
                  onClick={() => updateSetting('sound', so.id)}
                  style={{
                    ...s.optionBtn,
                    background: settings.sound === so.id ? 'rgba(249,115,22,0.15)' : '#0a0a14',
                    border: settings.sound === so.id ? '1px solid #f97316' : '1px solid rgba(255,255,255,0.08)',
                    color: settings.sound === so.id ? '#f97316' : '#94a3b8',
                  }}
                >
                  {so.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Tiers */}
          <Section title="Donation Tiers">
            {settings.tiers.map((tier, i) => (
              <div key={i} style={s.tierCard}>
                <div style={s.tierHeader}>
                  <span style={s.tierLabel}>
                    ₹{tier.minAmount} {tier.maxAmount ? `— ₹${tier.maxAmount}` : 'aur upar'}
                  </span>
                </div>
                <div style={s.tierRow}>
                  <TierField label="Max Chars" value={tier.maxChars} onChange={v => updateTier(i, 'maxChars', parseInt(v))} min={10} max={500} />
                  <TierField label="Display (sec)" value={tier.displayTime} onChange={v => updateTier(i, 'displayTime', parseInt(v))} min={3} max={60} />
                  <div style={s.tierToggle}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>TTS</span>
                    <button
                      onClick={() => updateTier(i, 'ttsEnabled', !tier.ttsEnabled)}
                      style={{
                        ...s.toggle,
                        background: tier.ttsEnabled ? '#f97316' : '#334155',
                      }}
                    >
                      <div style={{
                        ...s.toggleThumb,
                        transform: tier.ttsEnabled ? 'translateX(16px)' : 'translateX(2px)',
                      }} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </Section>

        </div>

        {/* Right — live preview */}
        <div style={s.previewCol}>
          <div style={s.previewLabel}>Live Preview</div>
          <div style={s.previewBox}>
            {/* Fake OBS */}
            <div style={s.obsBar}>
              <span style={{ ...s.obsDot, background: '#ef4444' }} />
              <span style={{ ...s.obsDot, background: '#f59e0b' }} />
              <span style={{ ...s.obsDot, background: '#22c55e' }} />
              <span style={s.obsText}>OBS Preview</span>
            </div>
            <div style={{ ...s.obsScreen, background: 'linear-gradient(135deg, #0f172a, #1e1b4b)' }}>
              <span style={s.liveTag}>🔴 LIVE</span>
              <span style={s.viewerTag}>👁 1,247</span>
              <div style={s.fakeGameBg}>🎮 LIVE STREAM</div>

              {/* Alert preview */}
              <div style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                right: '12px',
              }}>
                <AlertPreview settings={settings} theme={theme} />
              </div>
            </div>
          </div>

          <button
            onClick={() => setPreview(p => !p)}
            style={s.previewBtn}
          >
            {preview ? 'Hide' : '▶ Play'} Animation Preview
          </button>

          {preview && (
            <div style={{ marginTop: '16px' }}>
              <AlertPreview settings={settings} theme={theme} animate />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AlertPreview({ settings, theme, animate }) {
  const accentColor = settings.accentColor
  const animMap = {
    slide:  'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
    bounce: 'bounceIn 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
    fade:   'fadeIn 0.5s ease',
    pop:    'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
  }

  return (
    <div style={{
      background: theme.bg,
      border: `2px solid ${accentColor}`,
      borderRadius: '14px',
      padding: '12px 16px',
      maxWidth: '300px',
      boxShadow: `0 0 20px ${accentColor}44`,
      animation: animate ? (animMap[settings.animation] || animMap.slide) : 'none',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
        <span style={{ fontSize: '22px' }}>🍵</span>
        <div>
          <div style={{ color: accentColor, fontWeight: '800', fontSize: '16px' }}>₹69</div>
          <div style={{ color: '#64748b', fontSize: '11px' }}>Rahul_Gaming</div>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: '16px' }}>🔊</span>
      </div>
      <div style={{
        color: theme.text,
        fontSize: '12px',
        borderTop: `1px solid ${accentColor}33`,
        paddingTop: '6px',
      }}>
        Streamer touch grass 😭
      </div>
      <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
        <div style={{ height: '100%', background: accentColor, borderRadius: '2px', animation: 'shrinkBar 3s linear forwards' }} />
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={s.section}>
      <div style={s.sectionTitle}>{title}</div>
      {children}
    </div>
  )
}

function TierField({ label, value, onChange, min, max }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <span style={{ fontSize: '11px', color: '#475569' }}>{label}</span>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        min={min}
        max={max}
        style={s.numInput}
      />
    </div>
  )
}

const s = {
  page: { minHeight: '100vh', background: '#0a0a14', color: '#e2e8f0', fontFamily: "'Segoe UI', system-ui, sans-serif" },
  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, background: '#0a0a14', zIndex: 100 },
  backBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' },
  navTitle: { fontWeight: '700', fontSize: '16px' },
  saveBtn: { color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'background 0.2s' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 420px', gap: '24px', padding: '24px', maxWidth: '1200px', margin: '0 auto' },
  controls: { display: 'flex', flexDirection: 'column', gap: '16px' },
  section: { background: '#1a1a2e', border: '1px solid rgba(249,115,22,0.1)', borderRadius: '16px', padding: '20px' },
  sectionTitle: { fontWeight: '700', fontSize: '14px', marginBottom: '14px', color: '#f1f5f9' },
  themeGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' },
  themeBtn: { borderRadius: '10px', padding: '10px 8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center' },
  colorRow: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  colorBtn: { width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', transition: 'all 0.15s' },
  optionRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  optionBtn: { borderRadius: '8px', padding: '8px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s' },
  tierCard: { background: '#0a0a14', borderRadius: '10px', padding: '14px', marginBottom: '10px', border: '1px solid rgba(255,255,255,0.05)' },
  tierHeader: { marginBottom: '10px' },
  tierLabel: { fontSize: '13px', fontWeight: '700', color: '#f97316' },
  tierRow: { display: 'flex', gap: '16px', alignItems: 'flex-end' },
  tierToggle: { display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' },
  toggle: { width: '36px', height: '20px', borderRadius: '10px', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' },
  toggleThumb: { position: 'absolute', top: '2px', width: '16px', height: '16px', background: '#fff', borderRadius: '50%', transition: 'transform 0.2s' },
  numInput: { width: '80px', background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '6px 10px', fontSize: '13px', color: '#e2e8f0', outline: 'none' },
  previewCol: { position: 'sticky', top: '72px', alignSelf: 'start' },
  previewLabel: { fontSize: '12px', color: '#475569', marginBottom: '10px', fontWeight: '600', letterSpacing: '1px' },
  previewBox: { borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' },
  obsBar: { background: '#0f0f1a', padding: '7px 12px', display: 'flex', alignItems: 'center', gap: '5px' },
  obsDot: { width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block' },
  obsText: { fontSize: '11px', color: '#334155', marginLeft: '8px' },
  obsScreen: { position: 'relative', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  liveTag: { position: 'absolute', top: '10px', left: '10px', background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '3px 7px', borderRadius: '4px' },
  viewerTag: { position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: '#e2e8f0', fontSize: '11px', padding: '3px 7px', borderRadius: '4px' },
  fakeGameBg: { fontSize: '16px', color: 'rgba(255,255,255,0.1)', fontWeight: '800', letterSpacing: '2px' },
  previewBtn: { width: '100%', marginTop: '12px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', color: '#f97316', borderRadius: '10px', padding: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
}
