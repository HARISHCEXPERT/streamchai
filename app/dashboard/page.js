'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import LoadingScreen from '@/components/LoadingScreen'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [creator, setCreator] = useState(null)
  const [testStatus, setTestStatus] = useState('')
  const [copied, setCopied] = useState('')
  const [donations, setDonations] = useState([])
  const [mounted, setMounted] = useState(false)
  const [razorpayLink, setRazorpayLink] = useState('')
  const [savingLink, setSavingLink] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/'); return }
      setUser(session.user)
      await fetchOrCreateCreator(session.user)
      setLoading(false)
    })
  }, [])

  async function fetchOrCreateCreator(user) {
    // Try fetch first
    const { data, error } = await supabase
      .from('creators')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (data) {
      setCreator(data)
      setRazorpayLink(data.razorpay_payment_link || '')
      fetchDonations(data.id)
      return
    }

    // Not found — create
    const { data: newCreator, error: insertError } = await supabase
      .from('creators')
      .insert({
        user_id: user.id,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Streamer',
        avatar_url: user.user_metadata?.avatar_url || null,
        email: user.email,
      })
      .select()
      .single()

    if (newCreator) {
      setCreator(newCreator)
      setRazorpayLink(newCreator.razorpay_payment_link || '')
      fetchDonations(newCreator.id)
    } else {
      console.error('Creator create failed:', insertError)
    }
  }

  async function fetchDonations(creatorId) {
    const { data } = await supabase
      .from('donations')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false })
      .limit(20)
    setDonations(data || [])
  }

  async function saveRazorpayLink() {
    if (!creator) return
    setSavingLink(true)
    await supabase
      .from('creators')
      .update({ razorpay_payment_link: razorpayLink })
      .eq('id', creator.id)
    setSavingLink(false)
    setCreator(prev => ({ ...prev, razorpay_payment_link: razorpayLink }))
  }

  async function sendTestAlert() {
    if (!creator) return
    setTestStatus('Sending...')
    const res = await fetch('/api/test-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creatorId: creator.id }),
    })
    const data = await res.json()
    setTestStatus(data.status === 'ok' ? '✅ Test alert sent!' : '❌ Failed')
    setTimeout(() => setTestStatus(''), 3000)
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  function copyUrl(url, key) {
    navigator.clipboard.writeText(url)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  if (!mounted || loading) return <LoadingScreen text='Loading dashboard...' />

  if (!creator) return <LoadingScreen text='Something went wrong...' />

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const overlayUrl = `${appUrl}/overlay/${creator.id}`
  const donationUrl = `${appUrl}/donate/${creator.id}`
  const webhookUrl = `${appUrl}/api/webhook/razorpay`

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.logo}>🍵 StreamChai</span>
            <span style={styles.badge}>Dashboard</span>
          </div>
          <div style={styles.headerRight}>
            {user?.user_metadata?.avatar_url && (
              <img src={user.user_metadata.avatar_url} alt="avatar" style={styles.avatar} />
            )}
            <span style={styles.userName}>{creator.name}</span>
            <button onClick={signOut} style={styles.signOutBtn}>Sign out</button>
          </div>
        </div>

        {/* Stats */}
        <div style={styles.statsRow}>
          <StatCard label="Total Donations" value={donations.filter(d => !d.is_test).length} />
          <StatCard label="Total Earned" value={`₹${donations.filter(d => !d.is_test).reduce((s, d) => s + (d.amount || 0), 0)}`} />
          <StatCard
            label="Today"
            value={`₹${donations.filter(d => !d.is_test && new Date(d.created_at).toDateString() === new Date().toDateString()).reduce((s, d) => s + (d.amount || 0), 0)}`}
          />
        </div>

        {/* Cards */}
        <div style={styles.grid}>

          <Card title="💳 Razorpay Payment Link" subtitle="Razorpay → Payment Links → Create → paste here">
            <div style={styles.inputRow}>
              <input
                style={styles.linkInput}
                placeholder="https://rzp.io/l/yourlink"
                value={razorpayLink}
                onChange={e => setRazorpayLink(e.target.value)}
              />
              <button onClick={saveRazorpayLink} style={styles.saveBtn} disabled={savingLink}>
                {savingLink ? '...' : 'Save'}
              </button>
            </div>
          </Card>

          <Card title="🖥️ OBS Overlay URL" subtitle="OBS → Sources → Browser Source → paste URL">
            <UrlBox url={overlayUrl} copied={copied === 'overlay'} onCopy={() => copyUrl(overlayUrl, 'overlay')} />
            <p style={styles.hint}>Width: 1920 | Height: 1080 | Custom CSS: <code>body {'{ background: transparent !important; }'}</code></p>
          </Card>

          <Card title="🔗 Donation Link" subtitle="Share this with your viewers">
            <UrlBox url={donationUrl} copied={copied === 'donate'} onCopy={() => copyUrl(donationUrl, 'donate')} />
          </Card>

          <Card title="⚙️ Razorpay Webhook URL" subtitle="Razorpay → Settings → Webhooks → Add New">
            <UrlBox url={webhookUrl} copied={copied === 'webhook'} onCopy={() => copyUrl(webhookUrl, 'webhook')} />
            <p style={styles.hint}>Enable event: <code>payment.captured</code></p>
          </Card>

          <Card title="🧪 Test Alert" subtitle="Fire a fake donation to check your overlay">
            <button onClick={sendTestAlert} style={styles.testBtn}>🍵 Send Test Alert</button>
            {testStatus && <p style={styles.testStatus}>{testStatus}</p>}
          </Card>

          <Card title="📋 Setup Checklist" subtitle="Complete these to go live">
            {[
              { done: !!creator.razorpay_payment_link, text: 'Add Razorpay Payment Link' },
              { done: true, text: 'Copy OBS Overlay URL' },
              { done: true, text: 'Add Webhook URL in Razorpay' },
              { done: true, text: 'Send Test Alert' },
            ].map((item, i) => (
              <div key={i} style={styles.checkItem}>
                <span style={{ color: item.done ? '#22c55e' : '#475569', fontSize: '16px' }}>
                  {item.done ? '✅' : '⬜'}
                </span>
                <span style={{ color: item.done ? '#64748b' : '#e2e8f0', fontSize: '13px', textDecoration: item.done ? 'line-through' : 'none' }}>
                  {item.text}
                </span>
              </div>
            ))}
          </Card>
        </div>

        {/* Recent Donations */}
        <div style={styles.recentSection}>
          <h3 style={styles.sectionTitle}>Recent Donations</h3>
          {donations.length === 0 ? (
            <p style={styles.empty}>No donations yet. Share your donation link!</p>
          ) : (
            <div style={styles.donationList}>
              {donations.map(d => (
                <div key={d.id} style={styles.donationRow}>
                  <span style={styles.donorName}>{d.donor_name}</span>
                  <span style={styles.donationMsg}>{d.message || '—'}</span>
                  <span style={styles.donationAmount}>₹{d.amount}</span>
                  {d.is_test && <span style={styles.testTag}>TEST</span>}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function Card({ title, subtitle, children }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>{title}</div>
      <div style={styles.cardSubtitle}>{subtitle}</div>
      <div style={{ marginTop: '12px' }}>{children}</div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  )
}

function UrlBox({ url, onCopy, copied }) {
  return (
    <div style={styles.urlBox}>
      <span style={styles.urlText}>{url || '—'}</span>
      <button onClick={onCopy} style={{ ...styles.copyBtn, background: copied ? '#22c55e' : '#f97316' }}>
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#0a0a14', color: '#e2e8f0', fontFamily: "'Segoe UI', system-ui, sans-serif" },
  container: { maxWidth: '960px', margin: '0 auto', padding: '32px 20px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  logo: { fontSize: '22px', fontWeight: '800', color: '#f97316' },
  badge: { background: 'rgba(249,115,22,0.15)', color: '#f97316', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' },
  userName: { fontSize: '14px', color: '#94a3b8' },
  signOutBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' },
  statCard: { background: '#1a1a2e', border: '1px solid rgba(249,115,22,0.15)', borderRadius: '12px', padding: '20px', textAlign: 'center' },
  statValue: { fontSize: '28px', fontWeight: '800', color: '#f97316' },
  statLabel: { fontSize: '12px', color: '#64748b', marginTop: '4px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' },
  card: { background: '#1a1a2e', border: '1px solid rgba(249,115,22,0.1)', borderRadius: '16px', padding: '20px' },
  cardTitle: { fontWeight: '700', fontSize: '14px', color: '#f1f5f9' },
  cardSubtitle: { fontSize: '11px', color: '#475569', marginTop: '3px' },
  urlBox: { display: 'flex', alignItems: 'center', background: '#0a0a14', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '8px 12px', gap: '8px' },
  urlText: { flex: 1, fontSize: '11px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  copyBtn: { color: '#fff', border: 'none', borderRadius: '6px', padding: '5px 12px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' },
  hint: { fontSize: '11px', color: '#334155', marginTop: '8px', lineHeight: '1.5' },
  inputRow: { display: 'flex', gap: '8px' },
  linkInput: { flex: 1, background: '#0a0a14', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#e2e8f0', outline: 'none' },
  saveBtn: { background: '#f97316', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  testBtn: { width: '100%', background: 'linear-gradient(135deg, #f97316, #ea580c)', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  testStatus: { marginTop: '8px', fontSize: '13px', color: '#94a3b8', textAlign: 'center' },
  checkItem: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' },
  recentSection: { background: '#1a1a2e', border: '1px solid rgba(249,115,22,0.1)', borderRadius: '16px', padding: '20px' },
  sectionTitle: { fontSize: '15px', fontWeight: '700', marginBottom: '16px' },
  empty: { color: '#475569', fontSize: '13px', textAlign: 'center', padding: '20px' },
  donationList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  donationRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: '#0a0a14', borderRadius: '8px', fontSize: '13px' },
  donorName: { fontWeight: '600', color: '#f97316', minWidth: '100px' },
  donationMsg: { flex: 1, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  donationAmount: { fontWeight: '700', color: '#e2e8f0' },
  testTag: { background: '#1e293b', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' },
}
