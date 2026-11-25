// Reliable donations subscription: auto-reconnect with backoff, and a one-time
// catch-up read of still-pending donations after every (re)connect so nothing
// sent while the socket was down is missed. No periodic polling, and it never
// changes donation status — the overlay marks status only after it shows an alert.
export function subscribeDonations(supabase, creatorId, { onRow, onStatus, catchUpMinutes = 15 } = {}) {
  let channel = null, retry = 0, stopped = false, timer = null, gen = 0

  async function catchUp() {
    const since = new Date(Date.now() - catchUpMinutes * 60000).toISOString()
    const { data } = await supabase
      .from('donations').select('*')
      .eq('creator_id', creatorId).eq('status', 'pending')
      .gte('created_at', since)
      .order('created_at', { ascending: true }).limit(20)
    ;(data || []).forEach(r => onRow && onRow(r))
  }

  function schedule() {
    if (stopped) return
    clearTimeout(timer)
    const wait = Math.min(30000, 1000 * 2 ** retry++)
    onStatus && onStatus('RETRY_IN_' + Math.round(wait / 1000) + 's')
    timer = setTimeout(start, wait)
  }

  function start() {
    if (stopped) return
    const my = ++gen
    if (channel) { const old = channel; channel = null; supabase.removeChannel(old) }
    channel = supabase
      .channel(`sd-donations-${creatorId}-${my}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'donations', filter: `creator_id=eq.${creatorId}` },
        p => onRow && onRow(p.new))
      .subscribe(status => {
        if (my !== gen) return // ignore events from replaced channels
        onStatus && onStatus(status)
        if (status === 'SUBSCRIBED') { retry = 0; catchUp() }
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') schedule()
      })
  }

  const wake = () => { if (!stopped) { retry = 0; start() } }
  const onVis = () => { if (typeof document !== 'undefined' && document.visibilityState === 'visible') wake() }
  if (typeof window !== 'undefined') { window.addEventListener('online', wake); document.addEventListener('visibilitychange', onVis) }

  start()
  return () => {
    stopped = true; clearTimeout(timer)
    if (typeof window !== 'undefined') { window.removeEventListener('online', wake); document.removeEventListener('visibilitychange', onVis) }
    if (channel) supabase.removeChannel(channel)
  }
}
