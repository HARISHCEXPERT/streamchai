'use client'

// OBS browser source: https://<site>/alerts/<creatorId>?design=neon-burst&theme=neon
// Optional params: accent=%23ff0055  sound=coin  hype=2000 (0 = off)  tts=0  clean=1
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { createAlertEngine, unlockAudio, ALERT_DESIGNS } from '@/lib/overlay-engine'
import { subscribeDonations } from '@/lib/realtime'

export default function AlertsOverlay({ params, searchParams }) {
  const { creatorId } = params
  const rootRef = useRef(null)
  const [status, setStatus] = useState('connecting')
  const [needsClick, setNeedsClick] = useState(false)

  useEffect(() => {
    let engine, unsub, alive = true
    ;(async () => {
      const { data } = await supabase.from('creators').select('alert_settings').eq('id', creatorId).maybeSingle()
      if (!alive) return
      const s = data?.alert_settings || {}
      const q = searchParams || {}
      const design = ALERT_DESIGNS.includes(q.design) ? q.design : (ALERT_DESIGNS.includes(s.design) ? s.design : 'slide-card')
      engine = createAlertEngine(rootRef.current, {
        design,
        theme: q.theme || s.theme_v2 || 'neon',
        accent: q.accent || s.accentColor || null,
        sound: q.sound || s.sound || 'chime',
        tts: q.tts !== '0',
        hypeAbove: q.hype !== undefined ? Number(q.hype) : (s.hypeAbove ?? 2000),
        onShown: d => { if (d.id && !d.__preview) supabase.from('donations').update({ status: 'displayed' }).eq('id', d.id).then(() => {}) },
        onDone: d => { if (d.id && !d.__preview) supabase.from('donations').update({ status: 'completed' }).eq('id', d.id).then(() => {}) },
      })
      unsub = subscribeDonations(supabase, creatorId, {
        onRow: row => { if (row.status === 'pending') engine.push(row) },
        onStatus: st => setStatus(st),
      })
    })()
    // OBS allows audio by default; a normal browser tab needs one click first.
    if (typeof window !== 'undefined' && !window.obsstudio) setNeedsClick(true)
    return () => { alive = false; unsub && unsub(); engine && engine.clear() }
  }, [creatorId])

  const clean = searchParams?.clean === '1'
  return (
    <>
      <link rel="stylesheet" href="/overlays/sd-overlays.css" />
      <style>{`html,body{background:transparent!important;margin:0;overflow:hidden}`}</style>
      <div ref={rootRef} style={{ position: 'fixed', inset: 0 }} />
      {!clean && status !== 'SUBSCRIBED' && (
        <div style={{ position: 'fixed', top: 8, right: 8, font: '12px system-ui', color: '#fff', background: 'rgba(0,0,0,.55)', padding: '4px 8px', borderRadius: 6 }}>
          ● {status === 'connecting' ? 'Connecting…' : status}
        </div>
      )}
      {needsClick && (
        <button onClick={() => { unlockAudio(); setNeedsClick(false) }}
          style={{ position: 'fixed', top: 8, left: 8, font: '13px system-ui', padding: '6px 10px', borderRadius: 8, border: 0, cursor: 'pointer' }}>
          🔊 Click once to enable sound
        </button>
      )}
    </>
  )
}
