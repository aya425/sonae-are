'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setMessage(`登録失敗: ${error.message}`)
      return
    }

    setMessage('登録成功。ログインしてください。')
  }

  return (
    <main style={{ padding: '24px' }}>
      <h1>会員登録</h1>

      <form onSubmit={handleSignup} style={{ display: 'grid', gap: '12px', maxWidth: '400px' }}>
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
        <button type="submit">登録</button>
      </form>

      {message && <p>{message}</p>}
    </main>
  )
}