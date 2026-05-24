'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session) {
        console.error('No session:', error)
        router.replace('/')
        return
      }

      const user = session.user

      // Check if creator exists
      const { data: existing, error: fetchError } = await supabase
        .from('creators')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle() // use maybeSingle instead of single — no 406 if missing

      if (fetchError) {
        console.error('Fetch error:', fetchError)
      }

      if (!existing) {
        const { error: insertError } = await supabase
          .from('creators')
          .insert({
            user_id: user.id,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Streamer',
            avatar_url: user.user_metadata?.avatar_url || null,
            email: user.email,
          })

        if (insertError) {
          console.error('Insert error:', insertError)
        }
      }

      router.replace('/dashboard')
    }

    handleCallback()
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a14',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '16px',
      fontFamily: 'system-ui, sans-serif',
      color: '#e2e8f0',
    }}>
      <div style={{ fontSize: '40px' }}>🍵</div>
      <p style={{ color: '#64748b', fontSize: '15px' }}>Setting up your account...</p>
    </div>
  )
}