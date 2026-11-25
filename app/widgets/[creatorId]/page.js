'use client'

// OBS widgets:
//   /widgets/<creatorId>?type=goal&title=New%20Mic&target=5000&theme=neon
//   /widgets/<creatorId>?type=leaderboard&theme=royal
//   /widgets/<creatorId>?type=ticker&theme=festive
//   /widgets/<creatorId>?type=winner&name=Aarav&title=iPhone%20Giveaway
import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { renderGoal, renderLeaderboard, renderTicker, renderWinner } from '@/lib/overlay-engine'
import { subscribeDonations } from '@/lib/realtime'

function monthStart() { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString() }

export default function Widget({ params, searchParams }) {
  const { creatorId } = params
  const ref = useRef(null)

  useEffect(() => {
    const q = searchParams || {}
    const type = q.type || 'goal'
    let unsub, alive = true, timer

    async function draw() {
      const { data: c } = await supabase.from('creators').select('alert_settings').eq('id', creatorId).maybeSingle()
      const s = c?.alert_settings || {}
      const theme = q.theme || s.theme_v2 || 'neon'
      const accent = q.accent || s.accentColor || undefined
      if (!alive || !ref.current) return

      if (type === 'winner') { renderWinner(ref.current, { name: q.name || 'Winner', title: q.title || 'Giveaway', theme, accent }); return }

      const goal = s.goal || {}
      const since = type === 'goal' ? (q.since || goal.since || monthStart()) : monthStart()
      const { data: rows } = await supabase.from('donations')
        .select('donor_name, amount, message, created_at, is_test')
        .eq('creator_id', creatorId).gte('created_at', since)
        .order('created_at', { ascending: false }).limit(1000)
      const real = (rows || []).filter(r => !r.is_test)
      if (!alive || !ref.current) return

      if (type === 'goal') {
        const current = real.reduce((t, r) => t + Number(r.amount || 0), 0)
        renderGoal(ref.current, { title: q.title || goal.title || 'Stream Goal', target: Number(q.target || goal.target || 5000), current, theme, accent })
      } else if (type === 'leaderboard') {
        const totals = {}
        real.forEach(r => { const n = (r.donor_name || 'Anonymous').trim(); totals[n] = (totals[n] || 0) + Number(r.amount || 0) })
        const list = Object.entries(totals).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total)
        renderLeaderboard(ref.current, list, { title: q.title || 'Top Supporters', theme, accent })
      } else {
        renderTicker(ref.current, real.slice(0, 10).map(r => ({ name: r.donor_name || 'Anonymous', amount: r.amount })), { label: q.title || 'Latest drops', theme, accent })
      }
    }

    draw()
    if (type !== 'winner') {
      unsub = subscribeDonations(supabase, creatorId, { onRow: () => { clearTimeout(timer); timer = setTimeout(draw, 1500) } })
    }
    return () => { alive = false; clearTimeout(timer); unsub && unsub() }
  }, [creatorId])

  return (
    <>
      <link rel="stylesheet" href="/overlays/sd-overlays.css" />
      <style>{`html,body{background:transparent!important;margin:0;overflow:hidden}`}</style>
      <div ref={ref} style={{ position: 'fixed', inset: 0 }} />
    </>
  )
}
