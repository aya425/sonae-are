# Stripe Webhook ローカル開発手順

## 概要

ローカル環境では、StripeからWebhookが直接届かないため、
Stripe CLIを使ってWebhookを転送する必要があります。

これを行わないと、決済は成功しても `subscriptions` テーブルに反映されません。

---

## 必要な準備

### 1. Stripe CLI をインストール

```bash
brew install stripe/stripe-cli/stripe
```

### 2. Stripeにログイン

```bash
stripe login
```

コマンドを実行するとブラウザが開くので、Stripeにログインして認証を完了する。
※ チームのStripeアカウントでログインすること

ログインに成功すると、CLIでWebhook転送などが実行できるようになる。

※ ログイン後に

```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```

を実行してWebhook転送を開始する

### 3. 環境変数の確認

.env.local に以下が設定されていることを確認する。

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000/
STRIPE_SECRET_KEY=...
STRIPE_PRICE_ID_PREMIUM=...
STRIPE_WEBHOOK_SECRET=...
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 4. なぜ `stripe listen` が必要か

Stripe → localhost（ローカル環境）には直接Webhookを送れないため、
CLIで中継する必要がある。

Stripe → stripe listen → localhost:3000 → Dockerアプリ

## ローカル開発手順

### 実行例（ターミナルを分けて実行）

ローカル開発時は、以下のようにターミナルを2つ使用する。

```bash
# ターミナル①（アプリ起動）
docker compose up

# ターミナル②（Webhook転送）
stripe listen --forward-to localhost:3000/api/payments/webhook
```

### 1. アプリを起動する（Docker）

```bash
docker compose up
```

ブラウザで以下が開けることを確認：
http://localhost:3000

### 2. 別ターミナルでWebhook転送を開始

```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```

起動すると以下が表示される：

```bash
Your webhook signing secret is whsec_xxx
```

### 3. STRIPE_WEBHOOK_SECRET を確認

.env.local の値と一致していることを確認：

```env
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### 4. 環境変数変更時は再起動

```bash
docker compose down
docker compose up
```

必要に応じて stripe listen も再起動する。

### 5. アプリから決済を実行

/billing の画面からテスト決済を行う。

### 6. stripe listen のログを確認

以下のイベントが出ることを確認：
--> checkout.session.completed
<-- [200] POST http://localhost:3000/api/payments/webhook

### 7. アプリ側ログを確認

確認するログ：

- Stripe webhook received
- checkout.session.completed received
- customer.subscription.updated received
- Stripe webhook handler failed

### 8. Supabase の DB を確認

subscriptions テーブルを確認する。

チェック項目：

- user_id
- plan_id（premiumになっているか）
- stripe_customer_id
- stripe_subscription_id
- status
- current_period_end

---

## 正常系の確認ポイント

以下を満たせば成功：

- Checkout画面が開く
- 決済後にstripe listenでイベントが出る
- webhookが200で返る
- subscriptionsに保存される

---

## よくあるハマりどころ

1. stripe listen を起動していない

症状：

- 決済成功
- でもDB更新されない

原因：

- Webhookが届いていない

---

2. STRIPE_WEBHOOK_SECRET が違う

症状：

- Webhookは届くが処理失敗

原因：

- 署名検証エラー

---

3. checkout.session.completed だけ500になる

症状：

- 他イベントは200
- これだけ500

原因：

- metadata.user_id などが不足
- stripe trigger を使っている可能性あり

---

4. SUPABASE_SERVICE_ROLE_KEY が間違っている

症状：

- DB保存失敗

原因：

- Supabase接続エラー

---

5. plans_master に premium がない

症状：

- premium plan was not found

原因：

- DB初期データ不一致

---

6. stripe trigger を使っている

症状：

- Webhookは来るが正しく動かない

原因：

- 実際のCheckoutとデータが違う

---

## 補足

- 本番では stripe listen は不要
- 公開URLにWebhookを設定する

---

## 推奨確認フロー

1. Docker起動
2. stripe listen 起動
3. env確認
4. 必要なら再起動
5. 決済実行
6. stripeログ確認
7. アプリログ確認
8. DB確認
