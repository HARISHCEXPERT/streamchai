// StreamDrop overlay engine — framework-free, works in OBS browser source.
// Designs are CSS "skins" (public/overlays/sd-overlays.css); themes are CSS variables.
//   const engine = createAlertEngine(rootEl, { design: 'neon-burst', theme: 'neon' })
//   engine.push({ id, donor_name, amount, message, display_time, tts_enabled, is_test })

export const DESIGNS = [
  { id: 'slide-card',  label: 'Slide Card',  kind: 'alert',  desc: 'Glass card slides in from the side' },
  { id: 'flip-3d',     label: '3D Flip',     kind: 'alert',  desc: 'Card flips to reveal the amount' },
  { id: 'neon-burst',  label: 'Neon Burst',  kind: 'alert',  desc: 'Neon ring burst with glowing text' },
  { id: 'coin-rain',   label: 'Coin Rain',   kind: 'alert',  desc: 'Coins rain down — more coins for bigger drops' },
  { id: 'chat-bubble', label: 'Chat Bubble', kind: 'alert',  desc: 'Big chat bubble with avatar' },
  { id: 'big-hype',    label: 'Big Hype',    kind: 'alert',  desc: 'Full-screen celebration for big drops' },
  { id: 'goal-bar',    label: 'Goal Bar',    kind: 'widget', desc: 'Progress towards a goal' },
  { id: 'leaderboard', label: 'Leaderboard', kind: 'widget', desc: 'Top supporters podium' },
  { id: 'ticker',      label: 'Ticker',      kind: 'widget', desc: 'Scrolling strip of recent supporters' },
  { id: 'winner',      label: 'Giveaway Winner', kind: 'widget', desc: 'Dramatic winner reveal' },
]

export const THEMES = [
  { id: 'neon',    label: 'Neon Gaming',   swatch: ['#00f0ff', '#ff2bd6'] },
  { id: 'festive', label: 'Desi Festive',  swatch: ['#ff9f1c', '#e63946'] },
  { id: 'minimal', label: 'Minimal Clean', swatch: ['#ffffff', '#111827'] },
  { id: 'anime',   label: 'Anime Pop',     swatch: ['#ff6fb5', '#7c5cff'] },
  { id: 'royal',   label: 'Royal Gold',    swatch: ['#f5c542', '#1b1035'] },
]

export const ALERT_DESIGNS = DESIGNS.filter(d => d.kind === 'alert').map(d => d.id)

// Tier by amount: 1 small, 2 medium, 3 large, 4 huge
export function tierFor(amount) {
  const a = Number(amount) || 0
  if (a >= 2000) return 4
  if (a >= 500) return 3
  if (a >= 100) return 2
  return 1
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

export function rupees(n) {
  const v = Number(n) || 0
  return '₹' + v.toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

function initials(name) {
  return esc(String(name || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?')
}

// ---------- sounds (synthesised, no files / licences needed) ----------
let audioCtx = null
function ctx() {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    audioCtx = new AC()
  }
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {})
  return audioCtx
}
function tone(c, freq, start, dur, type = 'sine', vol = 0.25) {
  const o = c.createOscillator(), g = c.createGain()
  o.type = type; o.frequency.setValueAtTime(freq, c.currentTime + start)
  g.gain.setValueAtTime(0.0001, c.currentTime + start)
  g.gain.exponentialRampToValueAtTime(vol, c.currentTime + start + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur)
  o.connect(g); g.connect(c.destination)
  o.start(c.currentTime + start); o.stop(c.currentTime + start + dur + 0.05)
}
export const SOUNDS = ['none', 'ding', 'chime', 'coin', 'tada', 'whoosh', 'levelup']
export function playSound(name, tier = 1) {
  const c = ctx(); if (!c || !name || name === 'none') return
  switch (name) {
    case 'chime': [1046, 1318, 1568].forEach((f, i) => tone(c, f, i * 0.12, 0.6)); break
    case 'coin': tone(c, 988, 0, 0.08, 'square', 0.12); tone(c, 1319, 0.08, 0.35, 'square', 0.12); break
    case 'tada': [523, 659, 784, 1046].forEach((f, i) => tone(c, f, i * 0.09, i === 3 ? 0.8 : 0.2, 'triangle')); break
    case 'whoosh': {
      const o = c.createOscillator(), g = c.createGain()
      o.type = 'sawtooth'; o.frequency.setValueAtTime(200, c.currentTime); o.frequency.exponentialRampToValueAtTime(1600, c.currentTime + 0.35)
      g.gain.setValueAtTime(0.0001, c.currentTime); g.gain.exponentialRampToValueAtTime(0.12, c.currentTime + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.4)
      o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + 0.45); break
    }
    case 'levelup': [392, 523, 659, 784, 1046, 1318].forEach((f, i) => tone(c, f, i * 0.07, 0.25, 'square', 0.1)); break
    default: tone(c, 880, 0, 0.6)
  }
  if (tier >= 4) [523, 784, 1046].forEach((f, i) => tone(c, f, 0.9 + i * 0.12, 0.5, 'triangle', 0.15))
}

export function unlockAudio() { ctx() }

export function speak(text, lang = 'hi-IN') {
  if (typeof window === 'undefined' || !window.speechSynthesis || !text) return
  try {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang; u.rate = 0.9
    window.speechSynthesis.speak(u)
  } catch (e) {}
}

// ---------- particles ----------
function particles(layer, kind, count) {
  if (!layer) return
  const emojis = { coin: ['🪙'], confetti: null, spark: null }
  for (let i = 0; i < count; i++) {
    const p = document.createElement('i')
    p.className = 'sd-p sd-p-' + kind
    p.style.left = Math.random() * 100 + '%'
    p.style.animationDelay = (Math.random() * 1.2).toFixed(2) + 's'
    p.style.animationDuration = (1.6 + Math.random() * 1.6).toFixed(2) + 's'
    p.style.setProperty('--rot', Math.floor(Math.random() * 720 - 360) + 'deg')
    p.style.setProperty('--drift', Math.floor(Math.random() * 160 - 80) + 'px')
    if (kind === 'coin') p.textContent = emojis.coin[0]
    if (kind === 'confetti') p.style.setProperty('--h', Math.floor(Math.random() * 360))
    layer.appendChild(p)
  }
  setTimeout(() => { layer.innerHTML = '' }, 4200)
}

// ---------- templates ----------
function alertHTML(design, d, tier) {
  const name = esc(d.donor_name || 'Anonymous')
  const amt = esc(rupees(d.amount))
  const msg = d.message ? `<div class="sd-msg">${esc(d.message)}</div>` : ''
  const test = d.is_test ? '<span class="sd-test">TEST</span>' : ''
  const av = d.avatar_url ? `<img class="sd-av" src="${esc(d.avatar_url)}" alt="">` : `<div class="sd-av sd-av-i">${initials(d.donor_name)}</div>`
  switch (design) {
    case 'flip-3d':
      return `<div class="sd-flip"><div class="sd-flip-in">
        <div class="sd-face sd-front"><div class="sd-kicker">New Drop</div><div class="sd-name">${name}</div></div>
        <div class="sd-face sd-back"><div class="sd-amt">${amt}</div><div class="sd-name sm">${name}${test}</div>${msg}</div>
      </div></div>`
    case 'neon-burst':
      return `<div class="sd-burst"><div class="sd-ring"></div><div class="sd-ring r2"></div>
        <div class="sd-burst-body"><div class="sd-amt">${amt}</div><div class="sd-name">${name}${test}</div>${msg}</div></div>`
    case 'coin-rain':
      return `<div class="sd-coinbox"><div class="sd-jar">🪙</div><div><div class="sd-name">${name} dropped ${test}</div><div class="sd-amt">${amt}</div>${msg}</div></div>`
    case 'chat-bubble':
      return `<div class="sd-chat">${av}<div class="sd-bubble"><div class="sd-row"><span class="sd-name">${name}</span><span class="sd-chip">${amt}</span>${test}</div>${msg || '<div class="sd-msg">❤️</div>'}</div></div>`
    case 'big-hype':
      return `<div class="sd-hype"><div class="sd-hype-bg"></div><div class="sd-hype-in">
        <div class="sd-kicker">${tier >= 4 ? 'MEGA DROP' : 'HYPE DROP'}</div>
        <div class="sd-amt">${amt}</div><div class="sd-name">${name}${test}</div>${msg}</div></div>`
    default: // slide-card
      return `<div class="sd-card">${av}<div class="sd-card-body"><div class="sd-row"><span class="sd-name">${name}</span>${test}</div><div class="sd-amt">${amt}</div>${msg}</div><div class="sd-bar"><i></i></div></div>`
  }
}

// ---------- alert engine ----------
export function createAlertEngine(root, opts = {}) {
  const state = {
    design: opts.design || 'slide-card',
    theme: opts.theme || 'neon',
    accent: opts.accent || null,
    sound: opts.sound || 'chime',
    tts: opts.tts !== false,
    hypeAbove: opts.hypeAbove ?? 2000,   // amounts >= this use big-hype automatically (0 = off)
    queue: [], busy: false, seen: new Set(),
  }
  root.classList.add('sd-root')
  const stage = document.createElement('div'); stage.className = 'sd-stage'
  const fx = document.createElement('div'); fx.className = 'sd-fx'
  root.appendChild(stage); root.appendChild(fx)

  function applyTheme() {
    root.dataset.theme = state.theme
    if (state.accent) root.style.setProperty('--sd-accent', state.accent)
    else root.style.removeProperty('--sd-accent')
  }
  applyTheme()

  function next() {
    if (state.busy || !state.queue.length) return
    const d = state.queue.shift()
    state.busy = true
    const tier = tierFor(d.amount)
    const design = state.hypeAbove && Number(d.amount) >= state.hypeAbove ? 'big-hype' : state.design
    const secs = Math.max(3, Math.min(60, Number(d.display_time) || (tier >= 3 ? 12 : 8)))
    stage.innerHTML = `<div class="sd-alert sd-d-${design} sd-tier-${tier}" style="--sd-dur:${secs}s">${alertHTML(design, d, tier)}</div>`
    const el = stage.firstElementChild
    requestAnimationFrame(() => el.classList.add('sd-in'))
    if (design === 'coin-rain') particles(fx, 'coin', [0, 10, 22, 40, 70][tier])
    else if (design === 'big-hype' || tier >= 3) particles(fx, 'confetti', tier >= 4 ? 90 : 45)
    else if (design === 'neon-burst') particles(fx, 'spark', 24)
    playSound(state.sound, tier)
    if (state.tts && d.tts_enabled && d.message) speak(`${d.donor_name || 'Kisi'} ne ${Math.round(Number(d.amount) || 0)} rupaye bheje. ${d.message}`)
    opts.onShown && opts.onShown(d)
    setTimeout(() => {
      el.classList.remove('sd-in'); el.classList.add('sd-out')
      setTimeout(() => {
        stage.innerHTML = ''
        state.busy = false
        opts.onDone && opts.onDone(d)
        next()
      }, 650)
    }, secs * 1000)
  }

  return {
    push(d) {
      if (!d) return
      if (d.id) { if (state.seen.has(d.id)) return; state.seen.add(d.id) }
      state.queue.push(d); next()
    },
    set(patch) { Object.assign(state, patch); applyTheme() },
    pending() { return state.queue.length + (state.busy ? 1 : 0) },
    clear() { state.queue = []; stage.innerHTML = ''; fx.innerHTML = ''; state.busy = false },
  }
}

// ---------- widgets ----------
export function renderGoal(root, { title = 'Goal', current = 0, target = 1000, theme = 'neon', accent } = {}) {
  root.classList.add('sd-root'); root.dataset.theme = theme
  if (accent) root.style.setProperty('--sd-accent', accent)
  const pct = Math.max(0, Math.min(100, (Number(current) / Math.max(1, Number(target))) * 100))
  const existing = root.querySelector('.sd-goal')
  if (existing) {
    existing.querySelector('.sd-goal-fill').style.width = pct + '%'
    existing.querySelector('.sd-goal-cur').textContent = rupees(current)
    existing.querySelector('.sd-goal-pct').textContent = Math.floor(pct) + '%'
    existing.querySelector('.sd-goal-title').textContent = title
    existing.querySelector('.sd-goal-tgt').textContent = rupees(target)
    existing.classList.toggle('sd-done', pct >= 100)
    return
  }
  root.innerHTML = `<div class="sd-widget sd-goal ${pct >= 100 ? 'sd-done' : ''}">
    <div class="sd-goal-top"><span class="sd-goal-title">${esc(title)}</span><span class="sd-goal-pct">${Math.floor(pct)}%</span></div>
    <div class="sd-goal-track"><div class="sd-goal-fill" style="width:0%"><i></i></div></div>
    <div class="sd-goal-bot"><span class="sd-goal-cur">${esc(rupees(current))}</span><span class="sd-goal-tgt">${esc(rupees(target))}</span></div></div>`
  requestAnimationFrame(() => requestAnimationFrame(() => { root.querySelector('.sd-goal-fill').style.width = pct + '%' }))
}

export function renderLeaderboard(root, list = [], { title = 'Top Supporters', theme = 'neon', accent } = {}) {
  root.classList.add('sd-root'); root.dataset.theme = theme
  if (accent) root.style.setProperty('--sd-accent', accent)
  const top = list.slice(0, 5)
  const medals = ['🥇', '🥈', '🥉', '4', '5']
  root.innerHTML = `<div class="sd-widget sd-lb"><div class="sd-lb-title">${esc(title)}</div>${
    top.length ? top.map((r, i) => `<div class="sd-lb-row" style="animation-delay:${i * 0.12}s"><span class="sd-lb-rank r${i + 1}">${medals[i]}</span><span class="sd-lb-name">${esc(r.name)}</span><span class="sd-lb-amt">${esc(rupees(r.total))}</span></div>`).join('')
      : '<div class="sd-lb-empty">Be the first supporter!</div>'}</div>`
}

export function renderTicker(root, list = [], { label = 'Latest drops', theme = 'neon', accent } = {}) {
  root.classList.add('sd-root'); root.dataset.theme = theme
  if (accent) root.style.setProperty('--sd-accent', accent)
  const items = list.length ? list : [{ name: 'Your name here', amount: 0 }]
  const html = items.map(r => `<span class="sd-tk-item"><b>${esc(r.name)}</b>${r.amount ? ` ${esc(rupees(r.amount))}` : ''}${r.message ? ` — ${esc(r.message)}` : ''}</span>`).join('<span class="sd-tk-dot">✦</span>')
  const secs = Math.max(12, items.length * 6)
  root.innerHTML = `<div class="sd-widget sd-ticker"><div class="sd-tk-label">${esc(label)}</div><div class="sd-tk-track"><div class="sd-tk-move" style="animation-duration:${secs}s">${html}<span class="sd-tk-dot">✦</span>${html}<span class="sd-tk-dot">✦</span></div></div></div>`
}

export function renderWinner(root, { name = 'Winner', title = 'Giveaway', theme = 'neon', accent, sound = 'tada' } = {}) {
  root.classList.add('sd-root'); root.dataset.theme = theme
  if (accent) root.style.setProperty('--sd-accent', accent)
  root.innerHTML = `<div class="sd-widget sd-win"><div class="sd-win-kicker">${esc(title)}</div><div class="sd-win-roll"><span>?</span></div><div class="sd-win-sub">and the winner is…</div></div><div class="sd-fx"></div>`
  const roll = root.querySelector('.sd-win-roll span'), fx = root.querySelector('.sd-fx')
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let n = 0
  const t = setInterval(() => {
    roll.textContent = Array.from({ length: Math.min(12, String(name).length || 6) }, () => letters[Math.floor(Math.random() * 26)]).join('')
    if (++n > 22) {
      clearInterval(t)
      roll.textContent = name
      root.querySelector('.sd-win').classList.add('sd-revealed')
      root.querySelector('.sd-win-sub').textContent = '🎉 Congratulations! 🎉'
      particles(fx, 'confetti', 80)
      playSound(sound, 4)
    }
  }, 70)
}
