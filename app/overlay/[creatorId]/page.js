'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function OverlayPage({ params }) {
  const { creatorId } = params
  const [queue, setQueue] = useState([])
  const [current, setCurrent] = useState(null)
  const processingRef = useRef(false)
  const timerRef = useRef(null)

  // Subscribe to new donations via Supabase Realtime
  useEffect(() => {
    // On load, recover any pending donations (OBS reconnect survival)
    recoverPending()

    const channel = supabase
      .channel(`donations:${creatorId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'donations',
          filter: `creator_id=eq.${creatorId}`,
        },
        (payload) => {
          const donation = payload.new
          if (donation.status === 'pending') {
            setQueue(prev => [...prev, donation])
          }
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [creatorId])

  // Process queue sequentially
  useEffect(() => {
    if (!processingRef.current && queue.length > 0) {
      processNext()
    }
  }, [queue])

  async function recoverPending() {
    const { data } = await supabase
      .from('donations')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10)

    if (data && data.length > 0) {
      setQueue(data)
    }
  }

  async function processNext() {
    if (queue.length === 0) return
    processingRef.current = true

    const donation = queue[0]
    setCurrent(donation)

    // Mark as displayed
    await supabase
      .from('donations')
      .update({ status: 'displayed' })
      .eq('id', donation.id)

    // TTS
    if (donation.tts_enabled && donation.message) {
      const utterance = new SpeechSynthesisUtterance(
        `${donation.donor_name} ne ${donation.amount} rupaye diye. ${donation.message}`
      )
      utterance.lang = 'hi-IN'
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
    }

    // Auto dismiss after displayTime
    timerRef.current = setTimeout(async () => {
      setCurrent(null)
      await supabase
        .from('donations')
        .update({ status: 'completed' })
        .eq('id', donation.id)

      setQueue(prev => prev.slice(1))
      processingRef.current = false
    }, donation.display_time * 1000)
  }

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
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            border: '2px solid #f97316',
            borderRadius: '16px',
            padding: '16px 20px',
            maxWidth: '420px',
            animation: 'slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: '0 0 30px rgba(249, 115, 22, 0.4)',
          }}
        >
          {/* Chai icon + amount */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '28px' }}>🍵</span>
            <div>
              <div style={{ color: '#f97316', fontWeight: '700', fontSize: '18px' }}>
                ₹{current.amount}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '12px' }}>
                {current.donor_name}
                {current.is_test && (
                  <span style={{ marginLeft: '6px', background: '#374151', padding: '1px 6px', borderRadius: '4px', fontSize: '10px' }}>
                    TEST
                  </span>
                )}
              </div>
            </div>
            {/* Queue indicator */}
            {queue.length > 1 && (
              <div style={{
                marginLeft: 'auto',
                background: '#f97316',
                color: '#fff',
                borderRadius: '50%',
                width: '22px',
                height: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: '700',
              }}>
                +{queue.length - 1}
              </div>
            )}
          </div>

          {/* Message */}
          {current.message && (
            <div style={{
              color: '#e2e8f0',
              fontSize: '14px',
              lineHeight: '1.5',
              borderTop: '1px solid rgba(249,115,22,0.2)',
              paddingTop: '8px',
              marginTop: '4px',
            }}>
              {current.message}
            </div>
          )}

          {/* Progress bar */}
          <div style={{
            height: '3px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '2px',
            marginTop: '12px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              background: '#f97316',
              borderRadius: '2px',
              animation: `shrink ${current.display_time}s linear forwards`,
            }} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateY(60px) scale(0.9); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: transparent !important; }
      `}</style>
    </div>
  )
}
