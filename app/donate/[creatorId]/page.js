'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function DonatePage({ params }) {
  const { creatorId } = params
  const [creator, setCreator] = useState(null)
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const QUICK_AMOUNTS = [10, 21, 51, 101, 201, 500]

  useEffect(() => {
    supabase
      .from('creators')
      .select('id, name, avatar_url')
      .eq('id', creatorId)
      .maybeSingle()
      .then(({ data }) => setCreator(data))
  }, [creatorId])

  function getTier(amt) {
    const n = parseInt(amt)
    if (!n) return null
    if (n <= 50) return { chars: 30, time: '5 sec', tts: false }
    if (n <= 200) return { chars: 120, time: '15 sec', tts: false }
    if (n <= 500) return { chars: 200, time: '20 sec', tts: true }
    return { chars: 300, time: '30 sec', tts: true }
  }

  async function handlePay() {
    if (!amount || parseInt(amount) < 1) return
    setLoading(true)

    try {
      // 1. Create order on backend
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseInt(amount),
          creatorId,
          donorName: name || 'Anonymous',
          message: message.slice(0, getTier(amount)?.chars || 30),
        }),
      })

      const { orderId, error } = await res.json()
      if (error || !orderId) throw new Error(error || 'Order failed')

      // 2. Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: parseInt(amount) * 100,
        currency: 'INR',
        name: creator?.name || 'StreamChai',
        description: `Donation from ${name || 'Anonymous'}`,
        order_id: orderId,
        prefill: {
          name: name || 'Anonymous',
        },
        theme: { color: '#f97316' },
        handler: function (response) {
          // Payment successful
          setLoading(false)
          setAmount('')
          setMessage('')
          setName('')
          showSuccess()
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()

    } catch (err) {
      console.error(err)
      setLoading(false)
      alert('Something went wrong. Try again.')
    }
  }

  const [success, setSuccess] = useState(false)
  function showSuccess() {
    setSuccess(true)
    setTimeout(() => setSuccess(false), 4000)
  }

  const tier = getTier(amount)

  if (!creator) return (
    <div style={{ minHeight: '100vh', background: '#0a0a14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontFamily: 'system-ui' }}>
      Loading...
    </div>
  )

  return (
    <div style={styles.page}>
      {/* Razorpay SDK */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" />

      {success && (
        <div style={styles.successBanner}>
          🍵 Donation sent! Watch for your name on stream!
        </div>
      )}

      <div style={styles.container}>
        <div style={styles.card}>

          {/* Creator header */}
          <div style={styles.creatorHeader}>
            <div style={styles.avatar}>
              {creator.avatar_url
                ? <img src={creator.avatar_url} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                : creator.name?.[0]?.toUpperCase()
              }
            </div>
            <div>
              <div style={styles.creatorName}>{creator.name}</div>
              <div style={styles.liveTag}>🔴 Live now</div>
            </div>
          </div>

          <div style={styles.divider} />

          {/* Quick amounts */}
          <p style={styles.label}>Choose amount</p>
          <div style={styles.quickAmounts}>
            {QUICK_AMOUNTS.map(a => (
              <button
                key={a}
                onClick={() => setAmount(String(a))}
                style={{
                  ...styles.quickBtn,
                  ...(amount === String(a) ? styles.quickBtnActive : {}),
                }}
              >
                ₹{a}
              </button>
            ))}
          </div>

          <input
            style={styles.input}
            type="number"
            placeholder="Ya custom amount daalo..."
            value={amount}
            onChange={e => setAmount(e.target.value)}
            min="1"
          />

          {/* Tier preview */}
          {tier && (
            <div style={styles.tierPreview}>
              <span>⏱ {tier.time} on screen</span>
              <span>📝 {tier.chars} chars</span>
              {tier.tts && <span>🔊 TTS on</span>}
            </div>
          )}

          {/* Name */}
          <p style={styles.label}>
            Tera naam <span style={styles.optional}>(optional)</span>
          </p>
          <input
            style={styles.input}
            placeholder="Anonymous"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={30}
          />

          {/* Message */}
          <p style={styles.label}>
            Message
            <span style={styles.optional}> (optional)</span>
            {tier && <span style={styles.charCount}>{message.length}/{tier.chars}</span>}
          </p>
          <textarea
            style={styles.textarea}
            placeholder="Streamer ko kuch bol..."
            value={message}
            onChange={e => setMessage(e.target.value)}
            maxLength={tier?.chars || 30}
            rows={3}
          />

          <button
            onClick={handlePay}
            disabled={!amount || parseInt(amount) < 1 || loading}
            style={{
              ...styles.payBtn,
              opacity: (!amount || parseInt(amount) < 1 || loading) ? 0.6 : 1,
            }}
          >
            {loading ? 'Opening payment...' : `🍵 Chai bhejo ₹${amount || '—'}`}
          </button>

          <p style={styles.poweredBy}>Powered by StreamChai × Razorpay</p>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a14 !important; }
        @keyframes slideDown {
          from { transform: translateY(-60px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#0a0a14', color: '#e2e8f0', fontFamily: "'Segoe UI', system-ui, sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' },
  successBanner: { position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: '#22c55e', color: '#fff', padding: '12px 24px', borderRadius: '12px', fontWeight: '700', fontSize: '14px', zIndex: 9999, animation: 'slideDown 0.4s ease', whiteSpace: 'nowrap' },
  container: { width: '100%', maxWidth: '420px' },
  card: { background: '#1a1a2e', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '20px', padding: '28px' },
  creatorHeader: { display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' },
  avatar: { width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #f97316, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '800', color: '#fff', flexShrink: 0, overflow: 'hidden' },
  creatorName: { fontWeight: '700', fontSize: '17px' },
  liveTag: { fontSize: '12px', color: '#ef4444', marginTop: '2px' },
  divider: { height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '20px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#94a3b8', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  optional: { fontWeight: '400', color: '#475569' },
  charCount: { fontWeight: '400', color: '#475569', fontSize: '11px' },
  quickAmounts: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px' },
  quickBtn: { background: '#0a0a14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '10px', color: '#94a3b8', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  quickBtnActive: { background: 'rgba(249,115,22,0.15)', border: '1px solid #f97316', color: '#f97316' },
  input: { width: '100%', background: '#0a0a14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: '#e2e8f0', marginBottom: '16px', outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', background: '#0a0a14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '11px 14px', fontSize: '14px', color: '#e2e8f0', marginBottom: '16px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' },
  tierPreview: { display: 'flex', gap: '12px', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.15)', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#f97316', marginBottom: '16px' },
  payBtn: { width: '100%', background: 'linear-gradient(135deg, #f97316, #ea580c)', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', transition: 'opacity 0.2s' },
  poweredBy: { textAlign: 'center', fontSize: '11px', color: '#334155', marginTop: '12px' },
}