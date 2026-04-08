'use client'

import { createClient } from '@/lib/supabase/client'

export default function LogoutPage() {
  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/api/me'
  }

  return (
    <main style={{ padding: '24px' }}>
      <h1>ログアウト確認</h1>
      <button onClick={handleLogout}>ログアウト</button>
    </main>
  )
}