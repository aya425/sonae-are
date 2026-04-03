# そなえアレ API設計書（MVP）

## 1. 概要

本APIは、食物アレルギー家庭向け防災備蓄支援アプリ「そなえアレ」のMVP機能を提供する。

本アプリは、食物アレルギーのある家庭が、家族条件に合った「食べられる備え」を迷わず準備し、購入・管理・見直しまで継続できる状態を支援することを目的とする。

本APIでは、以下のMVP価値を実現する。

- 家族情報・アレルギー情報の登録 / 取得 / 更新
- 家族条件に応じた備えプランの生成
- 備えプランの保存 / 一覧 / 詳細 / 削除
- アレルギー対応商品の一覧 / 詳細表示
- 備蓄商品の登録 / 一覧 / 削除
- ダッシュボードでの期限・コスト・保存済みプランの確認
- 賞味期限30日前のメール通知
- 通知メールから備蓄一覧画面への導線
- Stripe Checkout による有料プラン決済
- AIによる提案理由の説明補助

---

## 2. 技術前提

- Frontend: Next.js（App Router）
- Backend: Next.js Route Handlers
- DB: Supabase（PostgreSQL）
- 認証: Supabase Auth
- キャッシュ: Upstash Redis
- 決済: Stripe
- AI: OpenAI API
- API仕様: OpenAPI（Swagger）

---

## 3. 設計方針

### 3.1 生成と保存の分離

- `POST /plans/generate` は備えプランの生成のみを行う
- `POST /plans` は生成済みプランの保存を行う

生成結果を確認した上で保存できるようにし、MVPにおける提案体験と保存機能を分離する。

### 3.2 家族情報は `family_profiles` を基準に扱う

家族情報は `family_profiles` を親とし、`family_members` と `member_allergens` を配下に持つ構造で管理する。  
ログインユーザーに紐づく家族情報をまとめて取得・更新する。

### 3.3 ダッシュボードは集約APIとする

ダッシュボード画面で必要な情報は `GET /dashboard` でまとめて返却する。  
フロント側で複数APIを呼ばずに表示できるようにする。

### 3.4 商品はマスタ参照とする

商品情報は `products` テーブルを基準とし、MVPでは参照専用とする。

### 3.5 通知はバッチ実行とする

賞味期限通知は cron から `POST /notifications/expiry/run` を実行して送信する。  
対象は賞味期限30日前の商品とし、1日1回まとめて通知する。

### 3.6 通知導線は備蓄一覧画面とする

通知メールには、期限が近い備蓄を確認するための備蓄一覧画面へのリンクを含める。  
専用の見直し画面はMVPでは設けない。

### 3.7 編集画面はMVP対象外とする

備えプラン編集画面、備蓄商品編集画面、見直し専用画面はMVP対象外とする。  
ただし、家族情報の更新はMVPに残すため `PUT /family` を設ける。

---

## 4. API一覧

| カテゴリ | メソッド | エンドポイント | 概要 |
|----------|----------|----------------|------|
| Auth | POST | /auth/signup | ユーザー登録 |
| Auth | POST | /auth/login | ログイン |
| Auth | POST | /auth/logout | ログアウト |
| Me | GET | /me | 自分情報取得 |
| Dashboard | GET | /dashboard | ダッシュボード取得 |
| Family | GET | /family | 家族情報取得 |
| Family | POST | /family | 家族情報登録 |
| Family | PUT | /family | 家族情報更新 |
| Plans | POST | /plans/generate | 備えプラン生成 |
| Plans | GET | /plans | 保存済みプラン一覧取得 |
| Plans | POST | /plans | 備えプラン保存 |
| Plans | GET | /plans/:id | 保存済みプラン詳細取得 |
| Plans | DELETE | /plans/:id | 保存済みプラン削除 |
| Products | GET | /products | 商品一覧取得 |
| Products | GET | /products/:id | 商品詳細取得 |
| Stock | GET | /stock-items | 備蓄一覧取得 |
| Stock | POST | /stock-items | 備蓄登録 |
| Stock | DELETE | /stock-items/:id | 備蓄削除 |
| Payments | POST | /payments/checkout | Stripe Checkout セッション作成 |
| Payments | POST | /payments/webhook | Stripe Webhook受信 |
| Notifications | POST | /notifications/expiry/run | 賞味期限通知実行 |

---

## 5. 認証 / 認可

| 区分 | 内容 |
|------|------|
| 認証方式 | Bearer JWT |
| 認証基盤 | Supabase Auth |
| 必須API | Auth系以外すべて |
| webhook | Stripe署名検証を行う |
| 通知API | 内部実行用キーで保護する |

### 補足

- ログインユーザーに紐づくデータのみ操作可能とする
- `plans`、`family_profiles`、`family_members`、`member_allergens`、`stock_items` は本人データのみ取得・操作可能とする
- 商品マスタは参照専用とする

---

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

### 422 の例

- 無料プランで保存済みプラン件数の上限に達している
- 備えプランの保存時に items が0件
- 家族情報が未登録のためプラン生成できない
- 備蓄登録時に必須項目が不足している

---

## 7. API詳細

### POST /auth/signup

#### 概要

ユーザー登録を行う。

#### Request

```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

#### Response

```json
{
  "data": {
    "user_id": "uuid"
  },
  "error": null
}
```

---

### POST /auth/login

#### 概要

ユーザーログインを行う。

#### Request

```json
{
  "email": "test@example.com",
  "password": "password123"
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

### POST /auth/logout

#### 概要

ログアウトを行う。

#### Response

```json
{
  "data": {
    "success": true
  },
  "error": null
}
```

---

### GET /me

#### 概要

ログインユーザー情報を取得する。

#### Response

```json
{
  "data": {
    "profile": {
      "display_name": "山田"
    },
    "subscription": {
      "status": "active",
      "plan_name": "premium"
    }
  },
  "error": null
}
```

---

### GET /family

#### 概要

ログインユーザーに紐づく家族情報を取得する。

#### Response

```json
{
  "data": {
    "family_profile": {
      "id": "uuid",
      "household_size": 4,
      "notes": "乳アレルギーの子どもがいる"
    },
    "members": [
      {
        "id": "uuid-parent",
        "role": "parent",
        "age_group": "adult",
        "notes": null,
        "allergens": []
      },
      {
        "id": "uuid-child",
        "role": "child",
        "age_group": "child",
        "notes": "牛乳アレルギーあり",
        "allergens": ["milk", "egg"]
      }
    ]
  },
  "error": null
}
```

---

### POST /family

#### 概要

家族情報を初回登録する。

#### Request

```json
{
  "household_size": 4,
  "notes": "乳アレルギーの子どもがいる",
  "members": [
    {
      "role": "parent",
      "age_group": "adult",
      "notes": null,
      "allergens": []
    },
    {
      "role": "child",
      "age_group": "child",
      "notes": "牛乳アレルギーあり",
      "allergens": ["milk", "egg"]
    }
  ]
}
```

#### Response

```json
{
  "data": {
    "created": true
  },
  "error": null
}
```

---

### PUT /family

#### 概要

家族情報を更新する。  
`family_profiles`、家族メンバー一覧、アレルゲン情報をまとめて再保存する。

#### Request

```json
{
  "family_profile": {
    "household_size": 4,
    "notes": "小麦も注意"
  },
  "members": [
    {
      "id": "uuid-parent",
      "role": "parent",
      "age_group": "adult",
      "notes": null,
      "allergens": []
    },
    {
      "id": "uuid-child",
      "role": "child",
      "age_group": "child",
      "notes": "牛乳・小麦アレルギーあり",
      "allergens": ["milk", "wheat"]
    }
  ]
}
```

#### Response

```json
{
  "data": {
    "updated": true
  },
  "error": null
}
```

---

### POST /plans/generate

#### 概要

ログインユーザーに紐づく家族情報をもとに、備えプランを生成する。  
生成結果は保存しない。

#### Request

```json
{
  "family_profile_id": "uuid-family-profile",
  "days": 3,
  "priority_policy": "safety_first",
  "include_daily_items": true
}
```

#### Response

```json
{
  "data": {
    "days": 3,
    "priority_policy": "safety_first",
    "include_daily_items": true,
    "total_estimated_cost": 5000,
    "yearly_estimated_cost": 18000,
    "items": [
      {
        "product_id": "uuid",
        "product_name": "アレルギー対応ビスケット",
        "quantity": 3,
        "unit_price": 300,
        "product_type": "daily_item"
      }
    ],
    "ai_comment": "安全性を優先し、家族条件に合う商品を中心に提案しました。"
  },
  "error": null
}
```

---

### POST /plans

#### 概要

生成済みの備えプランを保存する。

#### Request

```json
{
  "title": "3日分備蓄プラン",
  "days": 3,
  "priority_policy": "safety_first",
  "include_daily_items": true,
  "total_estimated_cost": 5000,
  "yearly_estimated_cost": 18000,
  "ai_comment": "安全性を優先し、家族条件に合う商品を中心に提案しました。",
  "items": [
    {
      "product_id": "uuid",
      "quantity": 3,
      "priority": "high",
      "purpose_note": "非常時の主食代替"
    }
  ]
}
```

#### Response

```json
{
  "data": {
    "plan_id": "uuid"
  },
  "error": null
}
```

#### 業務ルール

- 無料プランは保存可能件数に上限を設ける
- 上限を超える場合は 422 を返す

---

### GET /plans

#### 概要

保存済み備えプラン一覧を取得する。

#### Response

```json
{
  "data": {
    "plans": [
      {
        "id": "uuid",
        "title": "3日分備蓄プラン",
        "days": 3,
        "total_estimated_cost": 5000,
        "yearly_estimated_cost": 18000,
        "created_at": "2026-04-03T10:00:00Z"
      }
    ]
  },
  "error": null
}
```

---

### GET /plans/:id

#### 概要

保存済み備えプラン詳細を取得する。

#### Response

```json
{
  "data": {
    "id": "uuid",
    "title": "3日分備蓄プラン",
    "days": 3,
    "priority_policy": "safety_first",
    "include_daily_items": true,
    "total_estimated_cost": 5000,
    "yearly_estimated_cost": 18000,
    "ai_comment": "安全性を優先し、家族条件に合う商品を中心に提案しました。",
    "items": [
      {
        "product_id": "uuid",
        "product_name": "アレルギー対応ビスケット",
        "quantity": 3,
        "unit_price": 300,
        "priority": "high",
        "purpose_note": "非常時の主食代替"
      }
    ]
  },
  "error": null
}
```

---

### DELETE /plans/:id

#### 概要

保存済み備えプランを削除する。

#### Response

```json
{
  "data": {
    "deleted": true
  },
  "error": null
}
```

---

### GET /products

#### 概要

商品一覧を取得する。

#### Query Parameters

- `product_type`: `emergency_food` または `daily_item`
- `category`: 商品カテゴリ
- `keyword`: 商品名検索用キーワード

#### Response

```json
{
  "data": {
    "products": [
      {
        "id": "uuid",
        "name": "アレルギー対応ビスケット",
        "category": "おやつ",
        "product_type": "daily_item",
        "is_free_from_28": true,
        "price": 300,
        "purchase_url": "https://example.com/item",
        "shelf_life_months": 12,
        "note": "28品目不使用"
      }
    ]
  },
  "error": null
}
```

---

### GET /products/:id

#### 概要

商品詳細を取得する。

#### Response

```json
{
  "data": {
    "id": "uuid",
    "name": "アレルギー対応ビスケット",
    "category": "おやつ",
    "product_type": "daily_item",
    "is_free_from_28": true,
    "price": 300,
    "purchase_url": "https://example.com/item",
    "shelf_life_months": 12,
    "note": "28品目不使用"
  },
  "error": null
}
```

---

### GET /stock-items

#### 概要

備蓄一覧を取得する。  
通知メールからの導線先として利用する。

#### Response

```json
{
  "data": {
    "stock_items": [
      {
        "id": "uuid",
        "product_id": "uuid-product",
        "product_name": "アレルギー対応ビスケット",
        "quantity": 2,
        "purchased_at": "2026-04-01",
        "expires_at": "2026-06-01",
        "unit_price": 300,
        "is_expiring_soon": true
      }
    ]
  },
  "error": null
}
```

#### 備考

- 一覧は `expires_at` 昇順を基本とする
- 期限が近い商品を確認しやすい表示を前提とする

---

### POST /stock-items

#### 概要

備蓄商品を登録する。

#### Request

```json
{
  "product_id": "uuid-product",
  "quantity": 2,
  "purchased_at": "2026-04-01",
  "expires_at": "2026-06-01",
  "unit_price": 300
}
```

#### Response

```json
{
  "data": {
    "stock_item_id": "uuid"
  },
  "error": null
}
```

---

### DELETE /stock-items/:id

#### 概要

備蓄商品を削除する。

#### Response

```json
{
  "data": {
    "deleted": true
  },
  "error": null
}
```

---

### GET /dashboard

#### 概要

ダッシュボード表示に必要な情報をまとめて取得する。

#### Response

```json
{
  "data": {
    "saved_plan_count": 2,
    "stock_item_count": 5,
    "expiring_soon_count": 1,
    "total_stock_cost": 4200,
    "subscription": {
      "status": "active",
      "plan_name": "premium"
    }
  },
  "error": null
}
```

---

### POST /payments/checkout

#### 概要

Stripe Checkout セッションを作成する。

#### Request

```json
{
  "price_id": "price_xxx"
}
```

#### Response

```json
{
  "data": {
    "checkout_url": "https://checkout.stripe.com/..."
  },
  "error": null
}
```

---

### POST /payments/webhook

#### 概要

Stripe Webhookを受信し、契約状態を更新する。

#### Response

```json
{
  "data": {
    "received": true
  },
  "error": null
}
```

---

### POST /notifications/expiry/run

#### 概要

賞味期限30日前の商品を対象に、1日1回まとめて通知メールを送信する。

#### 認可

内部実行専用

#### Response

```json
{
  "data": {
    "processed_users": 10,
    "sent_notifications": 8
  },
  "error": null
}
```

#### 通知内容

- 期限が近い備蓄商品の一覧
- 備蓄一覧画面へのリンク
- 備えの確認を促すメッセージ

---

## 8. 現在の状態

- API設計: レビュー反映済み
- MVPスコープ: 調整済み
- DB設計: 現行方針と整合済み
- 実装前提: 整理済み

---

## 9. 次フェーズ

- Swagger 形式への落とし込み
- Route Handlers 実装
- Supabase連携
- フロント接続
- APIテスト実装