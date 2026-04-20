# Production Environment Checklist

## 1. 目的

本番デプロイに必要な環境変数と接続先を整理し、開発環境との混同を防ぐ。

---

## 2. 本番環境変数一覧

| 区分     | 環境変数名                           | 用途                                                 | 必須/任意          | 本番で必要 | 入手元 / 管理者 | 備考                                   |
| -------- | ------------------------------------ | ---------------------------------------------------- | ------------------ | ---------- | --------------- | -------------------------------------- |
| App      | NEXT_PUBLIC_APP_URL                  | 本番アプリURL。Stripe戻り先、通知メールURL生成に利用 | 必須               | 必須       | デプロイ担当    | Railway公開URLまたは独自ドメイン       |
| App      | APP_BASE_URL                         | メールURL生成のフォールバック                        | 任意               | 任意       | デプロイ担当    | 基本は NEXT_PUBLIC_APP_URL を優先      |
| Supabase | NEXT_PUBLIC_SUPABASE_URL             | Supabase接続先URL                                    | 必須               | 必須       | Supabase管理者  | 本番プロジェクトのURL                  |
| Supabase | NEXT_PUBLIC_SUPABASE_ANON_KEY        | クライアント用公開キー                               | 必須               | 必須       | Supabase管理者  | 本番 anon key                          |
| Supabase | NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Supabase publishable key                             | 任意               | 任意       | Supabase管理者  | 未設定時は ANON_KEY にフォールバック   |
| Supabase | SUPABASE_SERVICE_ROLE_KEY            | サーバー側管理処理用キー                             | 必須               | 必須       | Supabase管理者  | 絶対にクライアントへ出さない           |
| Stripe   | STRIPE_SECRET_KEY                    | Checkout / 解約 / Webhook周辺で利用                  | 必須               | 必須       | Stripe管理者    | live secret key を使う                 |
| Stripe   | STRIPE_WEBHOOK_SECRET                | Webhook署名検証                                      | 必須               | 必須       | Stripe管理者    | 本番 webhook endpoint ごとに発行       |
| Stripe   | STRIPE_PRICE_ID_PREMIUM              | 有料プラン price ID                                  | 必須               | 必須       | Stripe管理者    | live price ID を使う                   |
| OpenAI   | OPENAI_API_KEY                       | AI提案 / AI説明補助                                  | 必須               | 必須       | OpenAI管理者    | 利用制限・課金設定も確認               |
| OpenAI   | OPENAI_MODEL                         | 利用モデル名                                         | 任意               | 任意       | チーム設定      | 未設定時は gpt-4o-mini                 |
| Redis    | UPSTASH_REDIS_REST_URL               | Upstash Redis接続先                                  | Redis使用時必須    | 必須       | Redis管理者     | 本番用DB                               |
| Redis    | UPSTASH_REDIS_REST_TOKEN             | Upstash Redis認証トークン                            | Redis使用時必須    | 必須       | Redis管理者     | 絶対に公開しない                       |
| Mail     | MAIL_PROVIDER                        | メール送信方式の切替                                 | 必須               | 必須       | チーム決定      | resend など                            |
| Mail     | MAIL_FROM                            | 送信元メールアドレス                                 | 必須               | 必須       | メール担当      | 本番ドメイン認証済みの送信元が望ましい |
| Mail     | RESEND_API_KEY                       | Resend利用時のAPIキー                                | Provider次第で必須 | 条件付き   | メール担当      | Resend採用時に利用                     |
| Mail     | SMTP_HOST                            | SMTP接続先                                           | SMTP採用時のみ必須 | 条件付き   | メール担当      | SMTP方式を使う場合のみ                 |
| Mail     | SMTP_PORT                            | SMTPポート                                           | SMTP採用時のみ必須 | 条件付き   | メール担当      | SMTP方式を使う場合のみ                 |
| Internal | CRON_SECRET                          | 通知バッチ実行APIの保護                              | 必須               | 必須       | チーム管理      | 内部実行用キー                         |

---

## 3. 必須として先に揃えるもの

- NEXT_PUBLIC_APP_URL
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_PRICE_ID_PREMIUM
- OPENAI_API_KEY
- UPSTASH_REDIS_REST_URL
- UPSTASH_REDIS_REST_TOKEN
- MAIL_PROVIDER
- MAIL_FROM
- CRON_SECRET

---

## 4. 条件付きで必要なもの

- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- APP_BASE_URL
- OPENAI_MODEL
- RESEND_API_KEY
- SMTP_HOST
- SMTP_PORT

---

## 5. 本番投入前に確認するURL

- 本番アプリURL
- Stripe Checkout success URL
- Stripe Checkout cancel URL
- Stripe Webhook送信先URL
- 通知メール内の備蓄品一覧リンク
- Supabase Auth の Site URL / Redirect URL

---

## 6. 開発環境と混同しやすい項目

- Supabase の URL / anon key / service role key
- Stripe の secret key / webhook secret / price ID
- Redis の URL / token
- OpenAI API key
- メール送信API key
- 本番URLとローカルURL
- 通知API用の内部実行キー

---

## 7. 未確定項目

- [ ] 本番URL
- [ ] 本番 Stripe Price ID
- [ ] 本番 Stripe Webhook Secret
- [ ] 本番 Redis 接続情報
- [ ] 本番メール送信方式（Resend or SMTP）
- [ ] 本番送信元メールアドレス
- [ ] CRON_SECRET の値
