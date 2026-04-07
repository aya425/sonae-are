'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(`ログイン失敗: ${error.message}`)
      return
    }

    setMessage('ログイン成功')
    window.location.href = '/api/me'
  }

  return (
    <main style={{ padding: '24px' }}>
      <h1>ログイン</h1>

      <form onSubmit={handleLogin} style={{ display: 'grid', gap: '12px', maxWidth: '400px' }}>
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">ログイン</button>
      </form>

      {message && <p>{message}</p>}
    </main>
  )
}