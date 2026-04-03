# そなえアレ API設計書（DB設計準拠・MVP）

⸻

## 1. 概要

本APIは、食物アレルギー家庭向け防災備蓄支援アプリ「そなえアレ」のMVP機能を提供する。

ユーザーが「食べられる備え」を迷わず準備し、購入・管理・見直しまで継続できる状態を実現することを目的とする。

⸻

## 2. 技術前提
	•	Frontend：Next.js（App Router）
	•	Backend：Next.js Route Handlers
	•	DB：Supabase（PostgreSQL）
	•	認証：Supabase Auth（JWT）
	•	キャッシュ：Upstash Redis
	•	決済：Stripe
	•	AI：OpenAI API
	•	API仕様：OpenAPI（Swagger）

⸻

## 3. API一覧

| カテゴリ | メソッド | エンドポイント | 概要 |
|----------|----------|----------------|------|
| Auth | POST | /auth/signup | ユーザー登録 |
| Auth | POST | /auth/login | ログイン |
| Auth | POST | /auth/logout | ログアウト |
| Me | GET | /me | 自分情報取得 |
| Dashboard | GET | /dashboard | ダッシュボード取得 |
| Family | GET | /family | 家族情報取得 |
| Family | POST | /family | 家族情報登録 |
| Plans | POST | /plans/generate | プラン生成 |
| Plans | GET | /plans | プラン一覧 |
| Plans | POST | /plans | プラン保存 |
| Plans | GET | /plans/:id | プラン詳細 |
| Plans | DELETE | /plans/:id | プラン削除 |
| Products | GET | /products | 商品一覧 |
| Products | GET | /products/:id | 商品詳細 |
| Stock | GET | /stock-items | 備蓄一覧 |
| Stock | POST | /stock-items | 備蓄登録 |
| Stock | DELETE | /stock-items/:id | 備蓄削除 |
| Payments | POST | /payments/checkout | Checkout作成 |
| Payments | POST | /payments/webhook | Webhook |
| Notifications | POST | /notifications/expiry/run | 通知実行 |
| Review | GET | /review/summary | 見直し画面 |

⸻

## 4. 設計方針

### 4.1 生成と保存の分離

- POST /plans/generate → 生成のみ（保存しない）
- POST /plans → 保存

### 4.2 家族情報は一括管理

- family_profiles / members / allergens をまとめて扱う

### 4.3 ダッシュボードは集約API

- 必要な情報を1APIで返却

### 4.4 商品はマスタ参照

- productsテーブルを基準とする

### 4.5 通知はバッチ実行

- cron → /notifications/expiry/run

⸻

## 5. 認証 / 認可

| 区分 | 内容 |
|------|------|
| 認証方式 | Bearer JWT |
| 必須API | auth以外すべて |
| webhook | 署名検証 |
| 通知API | 内部キー |

⸻

## 6. エラー設計

### ステータスコード

| コード | 意味 |
|--------|------|
| 400 | 入力エラー |
| 401 | 未認証 |
| 403 | 権限なし |
| 404 | データなし |
| 409 | 競合 |
| 422 | 業務ルール違反 |
| 500 | サーバエラー |

### エラーフォーマット

```json
{
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": []
  }
}
```

⸻

## 7. API詳細

### POST /auth/login

#### 概要
ユーザーログイン

#### Request

```json
{
  "email": "test@example.com",
  "password": "password"
}
```

#### Response

```json
{
  "data": {
    "access_token": "jwt"
  },
  "error": null
}
```

---

### GET /me

#### 概要
ログインユーザー情報取得

#### Response

```json
{
  "data": {
    "profile": {
      "display_name": "山田"
    },
    "subscription": {
      "status": "active"
    }
  },
  "error": null
}
```

---

### POST /plans/generate

#### 概要
備えプラン生成（保存しない）

#### Request

```json
{
  "family_profile_id": "uuid",
  "days": 3,
  "priority_policy": "safety_first",
  "include_daily_items": true
}
```

#### Response

```json
{
  "data": {
    "total_estimated_cost": 5000,
    "items": [
      {
        "product_id": "uuid",
        "quantity": 3
      }
    ],
    "ai_comment": "安全性を優先しました"
  },
  "error": null
}
```

---

### POST /plans

#### 概要
プラン保存

#### Request

```json
{
  "title": "3日分備蓄",
  "days": 3,
  "total_estimated_cost": 5000,
  "items": [
    {
      "product_id": "uuid",
      "quantity": 3
    }
  ]
}
```

---

### GET /plans

#### 概要
保存済みプラン一覧取得

---

### GET /plans/:id

#### 概要
プラン詳細取得

---

### DELETE /plans/:id

#### 概要
プラン削除

---

### GET /products

#### 概要
商品一覧取得

---

### POST /stock-items

#### 概要
備蓄登録

#### Request

```json
{
  "product_id": "uuid",
  "quantity": 2,
  "purchased_at": "2026-04-01",
  "expires_at": "2026-06-01",
  "unit_price": 300
}
```

---

### GET /dashboard

#### 概要
ダッシュボード情報取得

---

### POST /payments/checkout

#### 概要
Stripe Checkout作成

---

### POST /notifications/expiry/run

#### 概要
通知実行（cron）

⸻

## 8. 現在の状態

- API設計：完了
- Swagger：確認済み
- DB設計：整合済み

⸻

## 9. 次フェーズ

- API実装
- Supabase連携
- フロント接続
- テスト