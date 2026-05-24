'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import LoadingScreen from '@/components/LoadingScreen'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error || !session) { router.replace('/'); return }

      const user = session.user
      const { data: existing } = await supabase
        .from('creators')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!existing) {
        await supabase.from('creators').insert({
          user_id: user.id,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Streamer',
          avatar_url: user.user_metadata?.avatar_url || null,
          email: user.email,
        })
      }

      router.replace('/dashboard')
    }

    handleCallback()
  }, [])

  return <LoadingScreen text="Logging you in..." />
}
