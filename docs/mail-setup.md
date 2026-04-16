# メール送信セットアップ手順

## 概要

本ドキュメントでは、Resend を用いたメール送信機能のセットアップと、ローカル開発で MailHog を使ってメール確認する手順を説明します。

---

## セットアップ手順

### 1. アプリディレクトリへ移動

cd my-app

### 2. 依存関係インストール

npm install

### 3. 環境変数設定

`my-app/.env.local` を作成し、以下を設定してください。

```env
RESEND_API_KEY=
MAIL_FROM=onboarding@resend.dev
```

※ API キーはチーム内で共有されたものを使用してください
※ `.env.local` は Git に含めないこと

---

## 開発サーバー起動

npm run dev

---

## MailHog を使ったローカル確認

ローカルで実メール送信を避けたい場合は、MailHog を使って SMTP 受信内容をブラウザで確認できます。

### 1. `.env.local` を SMTP 用に設定

```env
MAIL_PROVIDER=smtp
MAIL_FROM=test@example.com
SMTP_HOST=mailhog
SMTP_PORT=1025
```

補足:

- Docker Compose では `mailhog` サービス名で名前解決されます
- `my-app/lib/mail.ts` は `MAIL_PROVIDER=smtp` のとき SMTP 経由で送信します

### 2. Docker Compose で起動

ルートディレクトリで以下を実行します。

```bash
docker compose up
```

`docker-compose.yml` では以下のポートが公開されています。

- アプリ: `http://localhost:3000`
- MailHog SMTP: `localhost:1025`
- MailHog UI: `http://localhost:8025`

### 3. MailHog UI を開く

ブラウザで以下を開きます。

```text
http://localhost:8025
```

ここに受信メール一覧が表示されます。

### 4. 通知バッチを実行する

開発用 API を使ってメール送信を確認します。

エンドポイント:

```text
POST /api/batch/expire-notification
```

用途:
賞味期限30日前の備蓄に対して通知処理を実行する

確認内容:
・対象データが取得されること
・メールが送信されること（MailHog）
・notified_30days_at が更新されること

### 5. MailHog で受信確認

MailHog UI で以下を確認します。

- メールが一覧に表示されること
- 件名が正しいこと
- 本文が表示されること
- リンクが含まれていること

### 6. 環境変数を変更したら再起動

`.env.local` を変更した場合は、アプリコンテナを再起動してください。

例:

```bash
docker compose down
docker compose up
```

---

## 確認内容

- 自分のメールアドレスにメールが届くこと
- 件名・本文・リンクが表示されること

※ 各自 1 回実行で OK

---

## 通知メール仕様（たたき台）

- 件名：
  【そなえアレ】賞味期限が近い備蓄品があります

- 内容：
  - 賞味期限が近い商品一覧
  - 備蓄品一覧ページへのリンク（/stock-items）
  - 見直し・再購入の促し
  - 注意文（最終確認は公式表示）

---

## 使い分け

- Resend: 本番環境でのメール送信に使用
- MailHog: 開発環境でのメール確認に使用

## 現在の状態

- 現在は手動で API を実行して通知を確認する
- メール送信：確認済み（MailHog）
- 本番では Cron により1日1回自動実行される想定
