# Redis（Upstash）セットアップ手順

## 概要

本ドキュメントでは、Upstash Redis を用いたキャッシュ基盤のセットアップ手順を説明します。

---

## セットアップ手順

### 1. アプリディレクトリへ移動

cd my-app

### 2. 環境変数設定

`my-app/.env.local` を作成し、以下を設定してください。

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

※ 値はチーム内で共有されたものを使用してください
※ `.env.local` は Git に含めないこと

---

## 開発サーバー起動

npm run dev

---

## 動作確認

ブラウザで以下にアクセスしてください。

http://localhost:3000/api/redis/test

成功例：

{
"ok": true,
"data": {
"message": "Redis set/get success",
"value": "hello"
}
}

---

## 設計方針

- Redis はキャッシュ用途として使用
- 正本データは Supabase
- Redis 障害時はキャッシュなしで継続
- Redis エラーで API を落とさない
