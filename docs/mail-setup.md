# メール送信（Resend）セットアップ手順

## 概要

本ドキュメントでは、Resend を用いたメール送信機能のセットアップと動作確認手順を説明します。

---

## セットアップ手順

### 1. アプリディレクトリへ移動

cd my-app

### 2. 依存関係インストール

npm install

### 3. 環境変数設定

`my-app/.env.local` を作成し、以下を設定してください。

RESEND_API_KEY=
MAIL_FROM=[onboarding@resend.dev](mailto:onboarding@resend.dev)

※ API キーはチーム内で共有されたものを使用してください
※ `.env.local` は Git に含めないこと

---

## 開発サーバー起動

npm run dev

---

## メール送信確認

### エンドポイント

POST /api/mail/test

### リクエスト例

{
"to": "[your-email@example.com](mailto:your-email@example.com)"
}

---

## 確認内容

- 自分のメールアドレスにメールが届くこと
- 件名・本文・リンクが表示されること

※ 各自 1 回実行で OK

---

## 通知メール仕様（たたき台）

- 件名：
  【そなえアレ】賞味期限が近い備蓄があります

- 内容：

  - 賞味期限が近い商品一覧
  - 備蓄品一覧ページへのリンク（/inventory）
  - 見直し・再購入の促し
  - 注意文（最終確認は公式表示）

---

## 開発用 API について

- POST /api/mail/test は開発用の疎通確認 API
- 本番 API では使用しない
- 正式な通知処理は別途実装予定
