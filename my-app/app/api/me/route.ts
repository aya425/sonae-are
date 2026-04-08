import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not logged in',
        },
      },
      { status: 401 }
    )
  }

  return NextResponse.json({
    data: {
      id: user.id,
      email: user.email,
    },
    error: null,
  })
}