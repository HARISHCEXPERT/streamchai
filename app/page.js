'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const FAKE_DONATIONS = [
  { name: 'Rahul_Gaming', amount: 69, message: 'Streamer touch grass 😭', color: '#f97316' },
  { name: 'PriyaLive', amount: 151, message: 'Bhai teri aim toh meri Priyanka se bhi buri hai 💀', color: '#8b5cf6' },
  { name: 'DelhiKaBanda', amount: 21, message: 'Chai pi le yaar, haath kaanp rahe hain 🍵', color: '#06b6d4' },
  { name: 'KoiRandom420', amount: 500, message: 'First time dekha streamer actually jeeta 🔥🔥🔥', color: '#22c55e' },
  { name: 'AnonymousFan', amount: 11, message: 'Love from Mumbai ❤️', color: '#ec4899' },
]

const CONTENT = {
  en: {
    badge: '🇮🇳 Built for Indian Streamers',
    h1a: 'Stop losing viewers.',
    h1b: 'Start getting paid.',
    subtitle: 'Viewer scans QR → drops ₹10 → their message explodes on your stream. Live. Under 2 seconds. No BS.',
    demoLabel: '↓ This is what your stream looks like',
    obsTitle: 'OBS Studio — Stream Preview',
    cta: 'Get Started Free',
    demoBtn: '▶ Play Demo Alert',
    playing: '🔊 Playing...',
    freeNote: 'Free during beta · No credit card · 2 min setup',
    nav: { signin: 'Sign in', live: '🔴 47 streamers live' },
    howTitle: 'Three steps. That\'s it.',
    howBadge: 'HOW IT WORKS',
    steps: [
      { icon: '🔗', step: '01', title: 'Connect Razorpay', desc: 'Paste your Razorpay payment link. Done in 2 minutes.' },
      { icon: '📺', step: '02', title: 'Add to OBS', desc: 'Copy overlay URL → paste into OBS Browser Source. One time.' },
      { icon: '🍵', step: '03', title: 'Viewers Support You', desc: 'They pay via UPI → name and message fires on stream instantly.' },
    ],
    featBadge: 'FEATURES',
    featTitle: 'Everything you need.',
    features: [
      { icon: '⚡', title: 'Realtime Alerts', desc: 'Payment fires on overlay in under 2 seconds' },
      { icon: '🔊', title: 'Text-to-Speech', desc: 'Auto TTS for donations above ₹200' },
      { icon: '🎚️', title: 'Amount Tiers', desc: 'Bigger donation = longer message = more screen time' },
      { icon: '🧪', title: 'Test Alert', desc: 'Fire a fake alert before going live' },
      { icon: '🚫', title: 'Profanity Filter', desc: 'Keeps your stream clean automatically' },
      { icon: '📱', title: 'Mobile Donation Page', desc: 'Viewers donate from phone in seconds' },
      { icon: '📊', title: 'Donation History', desc: 'Full dashboard. See who gave what.' },
      { icon: '🌐', title: 'Website Widget', desc: 'Embed donation button on your own site' },
    ],
    quote: '"First donation came in during stream and my chat went absolutely insane. StreamChai literally changed the energy of my streams."',
    quoteAuthor: '— GamingWala_Arjun, 8.2K subscribers',
    bottomTitle: 'Ready to go live? 🔴',
    bottomSub: 'Free during beta. 2 minute setup. No credit card.',
    stats: [
      { v: '47+', l: 'Indian Streamers' },
      { v: '₹1', l: 'Minimum Donation' },
      { v: '<2s', l: 'Alert Latency' },
      { v: '100%', l: 'UPI Compatible' },
    ],
    footer: 'Built for Indian streamers ❤️',
    langModal: {
      title: 'Choose your language',
      sub: 'You can change this anytime from the navbar.',
      en: '🇬🇧 English',
      hi: '🇮🇳 Hindi (Hinglish)',
    }
  },
  hi: {
    badge: '🇮🇳 Indian Streamers ke liye banaya',
    h1a: 'Viewers ko dekh ke khush mat ho.',
    h1b: 'Unse paise lena seekh.',
    subtitle: 'Viewer QR scan kare → ₹10 daalein → unka message LIVE stream pe blast ho jaye. 2 second mein. Seedha OBS mein.',
    demoLabel: '↓ Aise dikhta hai tera stream jab donation aata hai',
    obsTitle: 'OBS Studio — Stream Preview',
    cta: 'Free mein shuru karo',
    demoBtn: '▶ Demo Alert dekh',
    playing: '🔊 Chal raha hai...',
    freeNote: 'Beta mein bilkul free · Credit card nahi chahiye · 2 minute setup',
    nav: { signin: 'Sign in', live: '🔴 47 streamers live' },
    howTitle: 'Teen steps. Bas.',
    howBadge: 'KAISE KAAM KARTA HAI',
    steps: [
      { icon: '🔗', step: '01', title: 'Razorpay connect karo', desc: 'Apna Razorpay payment link paste karo. 2 minute ka kaam.' },
      { icon: '📺', step: '02', title: 'OBS mein daal do', desc: 'Overlay URL copy karo, OBS Browser Source mein paste. Ek baar.' },
      { icon: '🍵', step: '03', title: 'Viewers support karo', desc: 'UPI se payment → naam aur message live stream pe pop. Turant.' },
    ],
    featBadge: 'FEATURES',
    featTitle: 'Jo chahiye, sab hai.',
    features: [
      { icon: '⚡', title: 'Realtime Alerts', desc: 'Payment ke 2 second mein overlay pe fire kare' },
      { icon: '🔊', title: 'Text-to-Speech', desc: '₹200+ pe auto TTS chalu ho jata hai' },
      { icon: '🎚️', title: 'Amount Tiers', desc: 'Jitna zyada donate, utna bada message aur time' },
      { icon: '🧪', title: 'Test Alert Button', desc: 'Live jane se pehle bina payment ke test karo' },
      { icon: '🚫', title: 'Profanity Filter', desc: 'Gaali automatically filter. Stream safe.' },
      { icon: '📱', title: 'Mobile Donation Page', desc: 'Viewer phone se easily donate kar sake' },
      { icon: '📊', title: 'Donation History', desc: 'Kaun ne kitna diya — sab dashboard mein' },
      { icon: '🌐', title: 'Website Widget', desc: 'Apni site pe bhi donation button laga lo' },
    ],
    quote: '"Pehli baar stream pe donation aaya toh mera chat blast ho gaya. StreamChai ne literally meri stream ka vibe change kar diya."',
    quoteAuthor: '— GamingWala_Arjun, 8.2K subscribers',
    bottomTitle: 'Live jane ke liye ready? 🔴',
    bottomSub: 'Beta mein free. 2 minute setup. Card nahi chahiye.',
    stats: [
      { v: '47+', l: 'Indian Streamers' },
      { v: '₹1', l: 'Minimum Donation' },
      { v: '<2s', l: 'Alert Latency' },
      { v: '100%', l: 'UPI Compatible' },
    ],
    footer: 'Indian streamers ke liye banaya ❤️',
    langModal: {
      title: 'Bhasha chuniye',
      sub: 'Baad mein bhi change kar sakte ho navbar se.',
      en: '🇬🇧 English',
      hi: '🇮🇳 Hindi (Hinglish)',
    }
  }
}

export default function LandingPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [lang, setLang] = useState(null) // null = show modal
  const [demoAlert, setDemoAlert] = useState(null)
  const [demoIndex, setDemoIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [autoAlert, setAutoAlert] = useState(null)
  const autoTimerRef = useRef(null)
  const autoIndexRef = useRef(0)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) { router.replace('/dashboard'); return }
      const saved = localStorage.getItem('sc_lang')
      if (saved) setLang(saved)
      setChecking(false)
    })
  }, [])

  // Auto-cycle alerts after lang is picked
  useEffect(() => {
    if (!lang) return
    const cycle = () => {
      const donation = FAKE_DONATIONS[autoIndexRef.current % FAKE_DONATIONS.length]
      setAutoAlert(donation)
      autoIndexRef.current++
      autoTimerRef.current = setTimeout(() => {
        setAutoAlert(null)
        setTimeout(cycle, 800)
      }, 3500)
    }
    const initial = setTimeout(cycle, 1200)
    return () => { clearTimeout(initial); clearTimeout(autoTimerRef.current) }
  }, [lang])

  function pickLang(l) {
    localStorage.setItem('sc_lang', l)
    setLang(l)
  }

  function playDemo() {
    if (isPlaying) return
    setIsPlaying(true)
    const donation = FAKE_DONATIONS[demoIndex % FAKE_DONATIONS.length]
    setDemoAlert(donation)
    setDemoIndex(i => i + 1)
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance(
        `${donation.name} ne ${donation.amount} rupaye diye. ${donation.message.replace(/[^\w\s]/g, '')}`
      )
      u.lang = 'hi-IN'
      u.rate = 0.85
      window.speechSynthesis.speak(u)
    }
    setTimeout(() => {
      setDemoAlert(null)
      setTimeout(() => setIsPlaying(false), 300)
    }, 4000)
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  if (checking) return null

  // Language selection modal
  if (!lang) {
    const m = CONTENT.en.langModal
    return (
      <div style={styles.modalBg}>
        <div style={styles.modalCard}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🍵</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#f1f5f9', marginBottom: '8px' }}>StreamChai</div>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#f1f5f9', marginBottom: '6px' }}>{m.title}</div>
          <div style={{ fontSize: '12px', color: '#475569', marginBottom: '28px' }}>{m.sub}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
            <button onClick={() => pickLang('en')} style={styles.langBtn}>
              {m.en}
              <span style={styles.langBtnSub}>Clean. Professional.</span>
            </button>
            <button onClick={() => pickLang('hi')} style={styles.langBtn}>
              {m.hi}
              <span style={styles.langBtnSub}>Apni boli mein.</span>
            </button>
          </div>
        </div>
        <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { background: #0a0a14 !important; }`}</style>
      </div>
    )
  }

  const c = CONTENT[lang]

  return (
    <div style={styles.page}>
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />

      {/* Nav */}
      <nav style={styles.nav}>
        <div style={styles.navLogo}>🍵 StreamChai</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={styles.socialProof}>{c.nav.live}</span>
          <button
            onClick={() => { localStorage.removeItem('sc_lang'); setLang(null) }}
            style={styles.langToggle}
          >
            {lang === 'en' ? '🇮🇳 हिंदी' : '🇬🇧 English'}
          </button>
          <button onClick={signInWithGoogle} style={styles.navBtn}>{c.nav.signin}</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={styles.hero}>
        <div style={styles.badge}>{c.badge}</div>
        <h1 style={styles.h1}>
          {c.h1a}<br />
          <span style={styles.h1Accent}>{c.h1b}</span>
        </h1>
        <p style={styles.subtitle}>{c.subtitle}</p>

        {/* OBS mockup */}
        <div style={styles.heroDemoWrap}>
          <div style={styles.heroDemoLabel}>{c.demoLabel}</div>
          <div style={styles.obsFrame}>
            <div style={styles.obsTopBar}>
              <span style={styles.obsDot} />
              <span style={{ ...styles.obsDot, background: '#f59e0b' }} />
              <span style={{ ...styles.obsDot, background: '#22c55e' }} />
              <span style={styles.obsTitle}>{c.obsTitle}</span>
            </div>
            <div style={styles.obsContent}>
              <div style={styles.fakeStream}>
                <div style={styles.fakeGameText}>🎮 LIVE GAMING STREAM</div>
                <div style={styles.liveTag}>🔴 LIVE</div>
                <div style={styles.viewerCount}>👁 1,247 viewers</div>
              </div>
              <div style={styles.alertOverlay}>
                {autoAlert && (
                  <AlertPopup
                    key={autoAlert.name + autoIndexRef.current}
                    donation={autoAlert}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div style={styles.ctaRow}>
          <button onClick={signInWithGoogle} style={styles.ctaBtn}>
            <GoogleIcon />
            {c.cta}
          </button>
          <button onClick={playDemo} style={styles.demoBtn} disabled={isPlaying}>
            {isPlaying ? c.playing : c.demoBtn}
          </button>
        </div>

        {demoAlert && (
          <div style={styles.demoOverlay}>
            <AlertPopup donation={demoAlert} large />
          </div>
        )}

        <p style={styles.freeNote}>{c.freeNote}</p>
      </div>

      {/* Stats bar */}
      <div style={styles.statsBar}>
        {c.stats.map(s => (
          <div key={s.l} style={styles.statItem}>
            <div style={styles.statVal}>{s.v}</div>
            <div style={styles.statLbl}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div style={styles.section}>
        <div style={styles.sectionBadge}>{c.howBadge}</div>
        <h2 style={styles.sectionTitle}>{c.howTitle}</h2>
        <div style={styles.steps}>
          {c.steps.map(s => (
            <div key={s.step} style={styles.stepCard}>
              <div style={styles.stepIcon}>{s.icon}</div>
              <div style={styles.stepNum}>{s.step}</div>
              <div style={styles.stepTitle}>{s.title}</div>
              <div style={styles.stepDesc}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div style={styles.section}>
        <div style={styles.sectionBadge}>{c.featBadge}</div>
        <h2 style={styles.sectionTitle}>{c.featTitle}</h2>
        <div style={styles.features}>
          {c.features.map(f => (
            <div key={f.title} style={styles.featureCard}>
              <div style={styles.featureIcon}>{f.icon}</div>
              <div style={styles.featureTitle}>{f.title}</div>
              <div style={styles.featureDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Social proof */}
      <div style={styles.section}>
        <div style={styles.proofBox}>
          <div style={styles.proofQuote}>{c.quote}</div>
          <div style={styles.proofAuthor}>{c.quoteAuthor}</div>
          <div style={styles.proofStars}>⭐⭐⭐⭐⭐</div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={styles.bottomCta}>
        <h2 style={styles.bottomCtaTitle}>{c.bottomTitle}</h2>
        <p style={styles.bottomCtaSubtitle}>{c.bottomSub}</p>
        <button onClick={signInWithGoogle} style={styles.ctaBtn}>
          <GoogleIcon />
          {c.cta}
        </button>
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <span style={{ color: '#f97316', fontWeight: '700' }}>🍵 StreamChai</span>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <a href="#" style={styles.footerLink}>Twitter/X</a>
          <a href="#" style={styles.footerLink}>Discord</a>
          <span style={{ color: '#1e293b' }}>{c.footer}</span>
        </div>
      </footer>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a14 !important; }
        @keyframes slideUp {
          from { transform: translateY(40px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(249,115,22,0.3); }
          50% { box-shadow: 0 0 40px rgba(249,115,22,0.6); }
        }
        @keyframes shrink { from { width: 100%; } to { width: 0%; } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  )
}

function AlertPopup({ donation, large }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)',
      border: `2px solid ${donation.color}`,
      borderRadius: large ? '20px' : '14px',
      padding: large ? '20px 24px' : '14px 18px',
      maxWidth: large ? '420px' : '340px',
      animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      boxShadow: `0 0 30px ${donation.color}44, 0 8px 32px rgba(0,0,0,0.4)`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <span style={{ fontSize: large ? '32px' : '24px' }}>🍵</span>
        <div style={{ flex: 1 }}>
          <div style={{ color: donation.color, fontWeight: '800', fontSize: large ? '20px' : '16px' }}>
            ₹{donation.amount}
          </div>
          <div style={{ color: '#64748b', fontSize: large ? '13px' : '11px' }}>
            {donation.name}
          </div>
        </div>
        <span style={{ fontSize: '18px', animation: 'blink 1s ease infinite' }}>🔊</span>
      </div>
      {donation.message && (
        <div style={{
          color: '#e2e8f0',
          fontSize: large ? '15px' : '12px',
          lineHeight: '1.5',
          borderTop: `1px solid ${donation.color}33`,
          paddingTop: '8px',
        }}>
          {donation.message}
        </div>
      )}
      <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', marginTop: '10px', overflow: 'hidden' }}>
        <div style={{ height: '100%', background: donation.color, borderRadius: '2px', animation: 'shrink 3.5s linear forwards' }} />
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

const styles = {
  page: { minHeight: '100vh', background: '#0a0a14', color: '#e2e8f0', fontFamily: "'Segoe UI', system-ui, sans-serif", position: 'relative', overflowX: 'hidden' },
  bgGlow1: { position: 'fixed', top: '-200px', right: '-200px', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 },
  bgGlow2: { position: 'fixed', bottom: '-200px', left: '-200px', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 },
  modalBg: { minHeight: '100vh', background: '#0a0a14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  modalCard: { background: '#1a1a2e', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '24px', padding: '40px', maxWidth: '360px', width: '100%', textAlign: 'center', animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  langBtn: { width: '100%', background: '#0a0a14', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px 20px', color: '#e2e8f0', fontSize: '15px', fontWeight: '700', cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px', transition: 'border-color 0.2s' },
  langBtnSub: { fontSize: '12px', color: '#475569', fontWeight: '400' },
  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px', position: 'relative', zIndex: 10, borderBottom: '1px solid rgba(255,255,255,0.04)' },
  navLogo: { fontSize: '20px', fontWeight: '800', color: '#f97316' },
  socialProof: { fontSize: '12px', color: '#22c55e', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', padding: '4px 12px', borderRadius: '20px', animation: 'blink 3s ease infinite' },
  langToggle: { background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' },
  navBtn: { background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', color: '#f97316', padding: '8px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  hero: { textAlign: 'center', padding: '60px 20px 40px', position: 'relative', zIndex: 10, maxWidth: '860px', margin: '0 auto' },
  badge: { display: 'inline-block', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', color: '#f97316', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', marginBottom: '24px' },
  h1: { fontSize: 'clamp(28px, 4.5vw, 52px)', fontWeight: '900', lineHeight: '1.15', marginBottom: '20px', color: '#f1f5f9', letterSpacing: '-1px' },
  h1Accent: { color: '#f97316' },
  subtitle: { fontSize: '16px', color: '#64748b', lineHeight: '1.7', marginBottom: '32px', maxWidth: '560px', margin: '0 auto 32px' },
  heroDemoWrap: { margin: '0 auto 32px', maxWidth: '600px' },
  heroDemoLabel: { fontSize: '12px', color: '#475569', marginBottom: '12px', textAlign: 'center' },
  obsFrame: { background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' },
  obsTopBar: { background: '#0f0f1a', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  obsDot: { width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', flexShrink: 0 },
  obsTitle: { fontSize: '11px', color: '#334155', marginLeft: '8px' },
  obsContent: { position: 'relative', height: '200px' },
  fakeStream: { position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  fakeGameText: { fontSize: '18px', color: 'rgba(255,255,255,0.15)', fontWeight: '800', letterSpacing: '2px' },
  liveTag: { position: 'absolute', top: '12px', left: '12px', background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px', animation: 'blink 2s ease infinite' },
  viewerCount: { position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.5)', color: '#e2e8f0', fontSize: '11px', padding: '3px 8px', borderRadius: '4px' },
  alertOverlay: { position: 'absolute', bottom: '12px', left: '12px', right: '12px', display: 'flex', justifyContent: 'flex-start' },
  ctaRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' },
  ctaBtn: { display: 'inline-flex', alignItems: 'center', gap: '10px', background: '#fff', color: '#1a1a2e', border: 'none', borderRadius: '12px', padding: '14px 28px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 20px rgba(249,115,22,0.15)', transition: 'all 0.2s' },
  demoBtn: { display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', color: '#f97316', borderRadius: '12px', padding: '14px 24px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' },
  demoOverlay: { position: 'fixed', bottom: '32px', left: '32px', zIndex: 9999, pointerEvents: 'none' },
  freeNote: { fontSize: '12px', color: '#334155', marginTop: '12px' },
  statsBar: { display: 'flex', justifyContent: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', position: 'relative', zIndex: 10 },
  statItem: { flex: 1, maxWidth: '200px', textAlign: 'center', padding: '24px 20px', borderRight: '1px solid rgba(255,255,255,0.04)' },
  statVal: { fontSize: '26px', fontWeight: '900', color: '#f97316' },
  statLbl: { fontSize: '12px', color: '#475569', marginTop: '4px' },
  section: { maxWidth: '900px', margin: '0 auto', padding: '60px 20px', position: 'relative', zIndex: 10 },
  sectionBadge: { fontSize: '11px', fontWeight: '700', color: '#f97316', letterSpacing: '2px', marginBottom: '10px', textAlign: 'center' },
  sectionTitle: { fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: '800', textAlign: 'center', marginBottom: '40px', color: '#f1f5f9' },
  steps: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' },
  stepCard: { background: '#1a1a2e', border: '1px solid rgba(249,115,22,0.1)', borderRadius: '16px', padding: '28px', position: 'relative' },
  stepIcon: { fontSize: '32px', marginBottom: '12px' },
  stepNum: { position: 'absolute', top: '20px', right: '20px', fontSize: '11px', fontWeight: '800', color: 'rgba(249,115,22,0.25)', letterSpacing: '1px' },
  stepTitle: { fontSize: '15px', fontWeight: '700', marginBottom: '8px', color: '#f1f5f9' },
  stepDesc: { fontSize: '13px', color: '#64748b', lineHeight: '1.6' },
  features: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' },
  featureCard: { background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px' },
  featureIcon: { fontSize: '24px', marginBottom: '10px' },
  featureTitle: { fontSize: '14px', fontWeight: '700', color: '#f1f5f9', marginBottom: '6px' },
  featureDesc: { fontSize: '12px', color: '#64748b', lineHeight: '1.5' },
  proofBox: { background: 'linear-gradient(135deg, #1a1a2e, #0f0f1a)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '20px', padding: '40px', textAlign: 'center', animation: 'pulse 3s ease infinite' },
  proofQuote: { fontSize: '18px', color: '#e2e8f0', lineHeight: '1.7', marginBottom: '16px', fontStyle: 'italic' },
  proofAuthor: { fontSize: '13px', color: '#f97316', fontWeight: '600', marginBottom: '8px' },
  proofStars: { fontSize: '18px' },
  bottomCta: { textAlign: 'center', padding: '60px 20px', position: 'relative', zIndex: 10 },
  bottomCtaTitle: { fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: '900', marginBottom: '12px', color: '#f1f5f9' },
  bottomCtaSubtitle: { fontSize: '14px', color: '#475569', marginBottom: '28px' },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 40px', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: '13px', position: 'relative', zIndex: 10, flexWrap: 'wrap', gap: '12px' },
  footerLink: { color: '#475569', textDecoration: 'none', fontSize: '13px' },
}