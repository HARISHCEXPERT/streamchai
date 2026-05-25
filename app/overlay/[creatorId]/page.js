'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const ANIM_MAP = {
  slide:  'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
  bounce: 'bounceIn 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
  fade:   'fadeIn 0.5s ease',
  pop:    'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
}

const THEMES = {
  dark:    { bg: '#1a1a2e', text: '#e2e8f0' },
  gaming:  { bg: '#0d0d0d', text: '#ffffff' },
  purple:  { bg: '#1e1b4b', text: '#e2e8f0' },
  minimal: { bg: '#ffffff', text: '#1a1a2e' },
}

export default function OverlayPage({ params }) {
  const { creatorId } = params
  const [queue, setQueue] = useState([])
  const [current, setCurrent] = useState(null)
  const [settings, setSettings] = useState(null)
  const processingRef = useRef(false)

  useEffect(() => {
    // Load creator settings
    supabase
      .from('creators')
      .select('alert_settings')
      .eq('id', creatorId)
      .maybeSingle()
      .then(({ data }) => {
        setSettings(data?.alert_settings || {
          theme: 'dark',
          accentColor: '#f97316',
          animation: 'slide',
          sound: 'ding',
        })
      })

    // Recover pending
    recoverPending()

    // Poll every 3 seconds as backup
    const poll = setInterval(recoverPending, 3000)
    return () => { supabase.removeChannel(channel); clearInterval(poll) }

    // Realtime subscribe
    const channel = supabase
      .channel(`donations:${creatorId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'donations',
        filter: `creator_id=eq.${creatorId}`,
      }, (payload) => {
        if (payload.new.status === 'pending') {
          setQueue(prev => [...prev, payload.new])
        }
      })
      .subscribe()


  }, [creatorId])

  useEffect(() => {
    if (!processingRef.current && queue.length > 0 && settings) {
      processNext()
    }
  }, [queue, settings])

  async function recoverPending() {
    const { data } = await supabase
      .from('donations')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10)
    if (data?.length > 0) setQueue(data)
  }

  async function processNext() {
    if (queue.length === 0) return
    processingRef.current = true
    const donation = queue[0]
    setCurrent(donation)

    await supabase
      .from('donations')
      .update({ status: 'displayed' })
      .eq('id', donation.id)

    // TTS
    if (donation.tts_enabled && donation.message) {
      setTimeout(() => {
        speakTTS(`${donation.donor_name} ne ${donation.amount} rupaye diye. ${donation.message}`)
      }, 500)
    }

    // Play sound
    playSound(settings?.sound)

    setTimeout(async () => {
      setCurrent(null)
      await supabase
        .from('donations')
        .update({ status: 'completed' })
        .eq('id', donation.id)
      setQueue(prev => prev.slice(1))
      processingRef.current = false
    }, donation.display_time * 1000)
  }

  function playSound(sound) {
    if (!sound || sound === 'none' || typeof window === 'undefined') return
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      ctx.resume().then(() => {
        const freqMap = { ding: [880, 1100], chime: [1046, 1318], tada: [659, 784, 988] }
        const freqs = freqMap[sound] || [880]
        freqs.forEach((freq, i) => {
          const o = ctx.createOscillator()
          const g = ctx.createGain()
          o.connect(g)
          g.connect(ctx.destination)
          o.frequency.value = freq
          o.type = 'sine'
          const start = ctx.currentTime + i * 0.15
          g.gain.setValueAtTime(0, start)
          g.gain.linearRampToValueAtTime(0.4, start + 0.05)
          g.gain.exponentialRampToValueAtTime(0.001, start + 0.5)
          o.start(start)
          o.stop(start + 0.5)
        })
      })
    } catch(e) { console.log('Sound error:', e) }
  }

  function speakTTS(text) {
    if (typeof window === 'undefined') return
    try {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'hi-IN'
      u.rate = 0.85
      u.volume = 1
      // Force load voices
      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0) {
        const hindiVoice = voices.find(v => v.lang.includes('hi')) || voices[0]
        u.voice = hindiVoice
      }
      window.speechSynthesis.speak(u)
    } catch(e) { console.log('TTS error:', e) }
  }

  const [activated, setActivated] = useState(false)

  function activate() {
    setActivated(true)
    // Unlock audio context
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    ctx.resume()
    // Unlock TTS
    const u = new SpeechSynthesisUtterance('')
    window.speechSynthesis.speak(u)
  }

  if (!settings) return null

  if (!activated) {
    return (
      <div style={{
        width: '100vw', height: '100vh', background: 'transparent',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start',
        padding: '24px',
      }}>
        <button
          onClick={activate}
          style={{
            background: 'rgba(249,115,22,0.9)', color: '#fff', border: 'none',
            borderRadius: '10px', padding: '10px 20px', fontSize: '14px',
            fontWeight: '700', cursor: 'pointer',
          }}
        >
          🔊 Click to Activate Alerts
        </button>
        <style>{'body { background: transparent !important; }'}</style>
      </div>
    )
  }

  const theme = THEMES[settings.theme] || THEMES.dark
  const accentColor = settings.accentColor || '#f97316'
  const animation = ANIM_MAP[settings.animation] || ANIM_MAP.slide

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'transparent',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'flex-start',
      padding: '24px',
      fontFamily: "'Segoe UI', sans-serif",
      overflow: 'hidden',
    }}>
      {current && (
        <div
          key={current.id}
          style={{
            background: theme.bg,
            border: `2px solid ${accentColor}`,
            borderRadius: '16px',
            padding: '16px 20px',
            maxWidth: '420px',
            animation,
            boxShadow: `0 0 30px ${accentColor}44`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '28px' }}>🍵</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: accentColor, fontWeight: '800', fontSize: '18px' }}>
                ₹{current.amount}
              </div>
              <div style={{ color: '#64748b', fontSize: '12px' }}>
                {current.donor_name}
                {current.is_test && <span style={{ marginLeft: '6px', background: '#374151', padding: '1px 6px', borderRadius: '4px', fontSize: '10px' }}>TEST</span>}
              </div>
            </div>
            {queue.length > 1 && (
              <div style={{ background: accentColor, color: '#fff', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700' }}>
                +{queue.length - 1}
              </div>
            )}
          </div>

          {current.message && (
            <div style={{ color: theme.text, fontSize: '14px', lineHeight: '1.5', borderTop: `1px solid ${accentColor}22`, paddingTop: '8px', marginTop: '4px' }}>
              {current.message}
            </div>
          )}

          <div style={{ height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '12px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: accentColor, borderRadius: '2px', animation: `shrink ${current.display_time}s linear forwards` }} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(60px) scale(0.9); opacity: 0; }
          to   { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes bounceIn {
          0%   { transform: scale(0.3); opacity: 0; }
          50%  { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes popIn {
          0%   { transform: scale(0); opacity: 0; }
          80%  { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: transparent !important; }
      `}</style>
    </div>
  )
}