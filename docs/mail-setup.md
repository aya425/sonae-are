# メール送信セットアップ手順

## 概要

本ドキュメントでは、Resend を用いたメール送信機能のセットアップ手順に加え、ローカル開発で MailHog を使ってメール確認する方法と、本番環境での設定方法を整理しています。

---

## セットアップ手順

### 1. アプリディレクトリへ移動

cd my-app

### 2. 依存関係インストール

npm install

### 3. 環境変数設定

`my-app/.env.local` を作成し、以下を設定してください。

```env
MAIL_PROVIDER=resend
RESEND_API_KEY=
MAIL_FROM=onboarding@resend.dev
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=
```

※ API キーはチーム内で共有されたものを使用してください
※ `.env.local` は Git に含めないこと
※ CRON_SECRET は通知バッチAPI実行時の認証に使用します

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
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=
```

補足:

- Docker Compose では `mailhog` サービス名で名前解決されます
- `my-app/src/lib/mail.ts` は `MAIL_PROVIDER=smtp` のとき SMTP 経由で送信します

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

認証ヘッダー:

```text
Authorization: Bearer <CRON_SECRET>
```

用途:
賞味期限30日前の備蓄に対して通知処理を実行する

確認内容:
・対象データが取得されること
・メールが送信されること（MailHog）
・notified_30days_at が更新されること
・notification_logs に履歴が保存されること

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

## Railway 本番環境でのメール送信設定（テストモード）

本番環境では Resend を使って実際にメール送信を行います。

### 1. Railway の Variables を設定

Railway の対象サービスで以下を設定します。

```env
MAIL_PROVIDER=resend
RESEND_API_KEY=
MAIL_FROM=onboarding@resend.dev
NEXT_PUBLIC_APP_URL=https://sonae-are-production.up.railway.app
CRON_SECRET=
```

補足:

- RESEND_API_KEY は Resend で発行したAPIキーを設定する
- MAIL_FROM は現在テストモードのため onboarding@resend.dev を使用している
- 本番モードに切り替える場合は、独自ドメイン認証後に MAIL_FROM を独自ドメインのメールアドレスへ変更する
- NEXT_PUBLIC_APP_URL は本番URLを設定する
- CRON_SECRET は Cron から通知APIを叩くための認証に使用する

### 2. 本番で通知バッチを手動実行して確認

エンドポイント:

```text
POST https://sonae-are-production.up.railway.app/api/batch/expire-notification
```

認証ヘッダー:

```text
Authorization: Bearer <CRON_SECRET>
```

確認内容:

- 通知対象データが取得されること
- メールが送信されること
- notified_30days_at が更新されること
- notification_logs に履歴が保存されること

### 3. Railway の Cron で定期実行する

本番では Railway の Cron サービスから通知APIを定期実行します。

実行先:

```text
POST https://sonae-are-production.up.railway.app/api/batch/expire-notification
```

認証ヘッダー:

```text
Authorization: Bearer <CRON_SECRET>
```

現在の本番設定:

```text
0 0 * * *
```

補足:

- Railway の Cron は UTC 基準
- 0 0 \* \* \* は日本時間で毎日朝9時実行

### 4. 本番確認時の注意

- Resend がテストモードの場合、送信先メールアドレスに制限がある
- Audience に登録されたメールアドレスにのみ送信できる
- チームメンバーで確認する場合は、Resend の Audience に各自のメールアドレスを追加しておく

### 5. 本番モードへ切り替える場合

本番モードで任意のユーザーに送信するには、独自ドメイン認証が必要です。

実施内容:

- 独自ドメイン取得
- Cloudflare 等で DNS 管理
- Resend でドメイン追加
- SPF / DKIM レコード設定
- Resend で Verify
- MAIL_FROM を独自ドメインのメールアドレスに変更

例:

```env
MAIL_FROM=no-reply@your-domain.com
```

## 通知バッチの概要

- 通知バッチは Next.js の API ルートとして実装
- Railway の Cron から POST で API を実行
- 処理内容:
  - 賞味期限が30日以内
  - まだ通知していない備蓄データを取得
- 取得したデータをユーザーごとにグルーピングしてまとめてメール送信
- 送信後は以下を実施
  - stock_items.notified_30days_at を更新
  - notification_logs に送信履歴を保存
- これにより重複通知を防ぐ

## 確認内容

### **ローカル確認**

- MailHog にメールが届くこと
- 件名・本文・リンクが表示されること
- notified_30days_at が更新されること
- notification_logs が保存されること

### **本番確認**

- 許可されたメールアドレスにメールが届くこと
- 件名・本文・リンクが表示されること
- notified_30days_at が更新されること
- notification_logs が保存されること
- Cron による定期実行が動作すること

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

## **現在の状態**

- ローカルでは MailHog を使って通知確認できる
- Railway 本番環境では Resend を使ってメール送信確認できる
- 通知APIの手動実行は確認済み
- Railway の Cron により1日1回自動実行される設定まで確認済み
- 現在は Resend のテストモードのため、送信先メールアドレスには制限がある
- 本番モードにする場合は独自ドメイン認証が必要
