# Supabase 導入・設定ガイド（そなえアレ）

## 概要
本ドキュメントでは、そなえアレ開発における Supabase の導入手順と、DB設計方針・RLS方針をまとめる。

本アプリでは以下を前提とする。

- 認証は Supabase Auth を利用
- `auth.users` を認証の正本とする
- アプリ側は `public.users` を 1:1 で持つ
- RLS により「本人のデータのみ操作可能」を保証する

---

## 1. Supabase プロジェクト作成

1. Supabase にログイン  
2. 「New Project」作成  
3. 以下を控える  

- Project URL  
- anon key  
- service role key  

---

## 2. 環境変数設定

`.env.local` に以下を追加

    NEXT_PUBLIC_SUPABASE_URL=xxxxx
    NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
    SUPABASE_SERVICE_ROLE_KEY=xxxxx

---

## 3. Supabase クライアント作成

### フロント用

    import { createBrowserClient } from '@supabase/ssr'

    export const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

---

### サーバー用

    import { createServerClient } from '@supabase/ssr'
    import { cookies } from 'next/headers'

    export function createClient() {
      const cookieStore = cookies()

      return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            },
          },
        }
      )
    }

---

### service role（サーバー専用）

    import { createClient } from '@supabase/supabase-js'

    export const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

---

## 4. 接続確認 API

    // app/api/me/route.ts
    import { NextResponse } from 'next/server'
    import { createClient } from '@/src/lib/supabase/server'

    export async function GET() {
      const supabase = createClient()
      const { data, error } = await supabase.auth.getUser()

      if (error || !data.user) {
        return NextResponse.json(
          { data: null, error: { code: 'UNAUTHORIZED', message: 'Not logged in' } },
          { status: 401 }
        )
      }

      return NextResponse.json({ data: data.user, error: null })
    }

---

## 5. 認証確認

確認項目

- サインアップできる  
- ログインできる  
- ログアウトできる  
- `/api/me` が取得できる  
- ログアウト後は UNAUTHORIZED になる  

---

## 6. DB設計方針

### 基本方針

- 認証：auth.users  
- アプリデータ：public.*  
- users は auth.users と 1:1  

---

### 主要テーブル一覧

| テーブル | 役割 |
|--------|------|
| users | アプリユーザー情報 |
| family_members | 家族情報 |
| member_allergens | 家族ごとのアレルゲン |
| products | 商品マスタ |
| plans | 備えプラン |
| plan_items | プラン内商品 |
| stock_items | 備蓄品 |
| notification_logs | 通知履歴 |
| plans_master | プラン種別 |
| subscriptions | 契約情報 |

---

### users テーブル

    create table if not exists public.users (
      id uuid primary key references auth.users(id) on delete cascade,
      display_name text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

---

### auth.users → public.users 自動同期

    create or replace function public.handle_new_user()
    returns trigger
    language plpgsql
    security definer
    set search_path = public
    as $$
    begin
      insert into public.users (id)
      values (new.id)
      on conflict (id) do nothing;
      return new;
    end;
    $$;

    create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

---

## 7. RLS（Row Level Security）方針

### 基本方針

- ユーザーは自分のデータのみアクセス可能  
- auth.uid() を基準に制御  
- マスタ系は全体参照OK  

---

### users

    alter table public.users enable row level security;

    create policy "users_select_own"
    on public.users
    for select
    to authenticated
    using (id = auth.uid());

    create policy "users_insert_own"
    on public.users
    for insert
    to authenticated
    with check (id = auth.uid());

    create policy "users_update_own"
    on public.users
    for update
    to authenticated
    using (id = auth.uid())
    with check (id = auth.uid());

---

### family_members

    alter table public.family_members enable row level security;

    create policy "family_members_own_all"
    on public.family_members
    for all
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

---

### plans

    alter table public.plans enable row level security;

    create policy "plans_own_all"
    on public.plans
    for all
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

---

### stock_items

    alter table public.stock_items enable row level security;

    create policy "stock_items_own_all"
    on public.stock_items
    for all
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

---

### マスタ系（products / plans_master）

- SELECT：認証ユーザー全員OK  
- INSERT / UPDATE / DELETE：不可（管理者のみ）  

---

## 8. service role の使いどころ

以下でのみ使用する

- 通知バッチ  
- Stripe Webhook  
- 管理系処理  
- RLSを超える必要がある処理  

※ クライアント側では絶対に使用しない  

---

## まとめ

- Supabase Auth を認証の基盤とする  
- public.users をアプリユーザーの実体とする  
- RLS により本人データ分離を担保する  
- マスタ系とユーザーデータを明確に分離する  
