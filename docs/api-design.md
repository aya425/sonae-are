# API設計書

## 1. 概要

本APIは、食物アレルギー家庭向け防災備蓄支援アプリ「そなえアレ」のMVP機能を提供する。

本アプリでは、家族情報・アレルギー情報をもとに、家族条件に合った備えプランを提案し、商品購入導線、備蓄商品の登録、期限管理、費用管理、賞味期限通知までを一気通貫で支援する。

---

## 2. 前提整理

### 2.1 技術前提

- Frontend: Next.js + TypeScript + Tailwind CSS
- Backend: Next.js Route Handlers
- DB / Auth: Supabase
- Cache: Upstash Redis
- Payment: Stripe
- AI: OpenAI API
- Container: Docker / Docker Compose

### 2.2 設計前提

- 認証は Supabase Auth を利用する
- アプリ側ユーザー情報は `users` に持つ
- 家族情報は `family_members` と `member_allergens` で管理する
- 商品は固定商品マスタ `products` を参照する
- 備えプランは「生成」と「保存」を分離する
- 保存済み備えプランのみDBに保持する
- 備えプラン編集機能は当初MVP対象外として整理していたが、追加機能として限定実装する
  - 編集可能項目は plans.title / plans.family_member_count / plans.days
  - 再計算対象は plan_items.quantity のみを追記する。
- 備蓄商品編集機能はMVP対象外
- 備蓄商品は商品マスタから選択して登録できるが、自由入力商品も登録可能とする
- そのため `stock_items.product_id` は NULL 許容、`product_name` は必須とする
- `purchased_at` はユーザー入力ではなく、備蓄登録日時を自動保存する
- 通知は賞味期限30日前に1日1回バッチ処理で送信する
- 各備蓄商品に対する30日前通知は1回のみ
- 同日に通知対象となった商品はユーザー単位で1通のメールにまとめて送信する
- 有料機能の差分は保存済み備えプラン件数制限の解除のみとする
- 年間維持コスト、備蓄コスト目安はDBに保存せず、表示時にアプリ側で算出する

---

## 3. 設計方針

### 3.1 生成と保存を分離する

- `POST /plans/generate` は備えプランの生成のみを行う
- `POST /plans` は生成済みプランの保存を行う

### 3.2 家族情報は member 単位で扱う

- 家族構成は `family_members`
- アレルゲンは `member_allergens`
- APIでもメンバー単位で扱う

### 3.3 ダッシュボードは集約APIとする

- ダッシュボード画面で必要な情報は `GET /dashboard` でまとめて返す

### 3.4 商品はマスタ参照とする

- 商品情報は `products` を参照専用で扱う
- 備蓄登録では商品マスタ選択・自由入力の両方を許容する

### 3.5 通知はバッチ実行とする

- 通知実行は `POST /notifications/expiry/run`
- cron / バッチ基盤から実行する
- 通知メールの遷移先は備蓄品一覧画面とする

---

## 4. 認証 / 認可

| 区分     | 内容                     |
| -------- | ------------------------ |
| 認証方式 | Bearer JWT               |
| 認証基盤 | Supabase Auth            |
| 必須API  | Auth系以外すべて         |
| Webhook  | Stripe署名検証を行う     |
| 通知API  | 内部実行用キーで保護する |

### 補足

- ログインユーザーに紐づくデータのみ操作可能とする
- `family_members`、`member_allergens`、`plans`、`plan_items`、`stock_items`、`subscriptions` は本人データのみ取得・操作可能とする
- `products`、`plans_master` は認証済みユーザー全員が参照可能なマスタとする

---

## 5. 共通仕様

### 5.1 Base URL

`/api`

### 5.2 レスポンス形式

#### 正常系

```json
{
  "data": {},
  "error": null
}
```

#### 異常系

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

### 5.3 ステータスコード

| コード | 意味           |
| ------ | -------------- |
| 200    | 成功           |
| 201    | 作成成功       |
| 400    | 入力エラー     |
| 401    | 未認証         |
| 403    | 権限なし       |
| 404    | データなし     |
| 409    | 競合           |
| 422    | 業務ルール違反 |
| 500    | サーバエラー   |

### 5.4 422 の代表例

- 無料プランで保存済みプラン件数の上限に達している
- 家族情報が未登録で備えプラン生成できない
- 備えプラン保存時に `items` が0件
- 備蓄登録時に `quantity <= 0`
- 備蓄登録時に `unit_price < 0`
- 備蓄登録時に `expires_at <= purchased_at`

---

## 6. API一覧

| カテゴリ      | メソッド | エンドポイント                | 概要                           |
| ------------- | -------- | ----------------------------- | ------------------------------ |
| Auth          | POST     | /auth/signup                  | ユーザー登録                   |
| Auth          | POST     | /auth/login                   | ログイン                       |
| Auth          | POST     | /auth/logout                  | ログアウト                     |
| Me            | GET      | /me                           | 自分情報取得                   |
| Family        | GET      | /family-members               | 家族一覧取得                   |
| Family        | POST     | /family-members               | 家族メンバー登録               |
| Family        | PATCH    | /family-members/:id           | 家族メンバー更新               |
| Family        | PUT      | /family-members/:id/allergens | アレルゲン一覧更新             |
| Plans         | POST     | /plans/generate               | 備えプラン生成                 |
| Plans         | GET      | /plans                        | 保存済みプラン一覧取得         |
| Plans         | GET      | /plans/:id                    | 保存済みプラン詳細取得         |
| Plans         | POST     | /plans/:id/recalculate        | 備えプラン数量再計算           |
| Plans         | PATCH    | /plans/:id                    | 保存済み備えプラン更新         |
| Plans         | POST     | /plans                        | 備えプラン保存                 |
| Plans         | DELETE   | /plans/:id                    | 保存済みプラン削除             |
| Products      | GET      | /products                     | 商品一覧取得                   |
| Products      | GET      | /products/:id                 | 商品詳細取得                   |
| StockItems    | GET      | /stock-items                  | 備蓄一覧取得                   |
| StockItems    | POST     | /stock-items                  | 備蓄登録                       |
| StockItems    | DELETE   | /stock-items/:id              | 備蓄削除                       |
| Dashboard     | GET      | /dashboard                    | ダッシュボード取得             |
| Payments      | POST     | /payments/checkout            | Stripe Checkout セッション作成 |
| Payments      | POST     | /payments/webhook             | Stripe Webhook受信             |
| Notifications | POST     | /notifications/expiry/run     | 賞味期限通知実行               |

---

## 7. API詳細

### 7.1 Auth

#### POST /auth/signup

##### 用途

ユーザー登録を行う。

##### Request

```json
{
  "email": "test@example.com",
  "password": "password123",
  "display_name": "山田花子"
}
```

##### Response

```json
{
  "data": {
    "user_id": "uuid"
  },
  "error": null
}
```

---

#### POST /auth/login

##### 用途

ユーザーログインを行う。

##### Request

```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

##### Response

```json
{
  "data": {
    "access_token": "jwt"
  },
  "error": null
}
```

---

#### POST /auth/logout

##### 用途

ログアウトを行う。

##### Response

```json
{
  "data": {
    "success": true
  },
  "error": null
}
```

---

#### GET /me

##### 用途

ログインユーザー情報と契約状態を取得する。

##### Response

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "display_name": "山田花子"
    },
    "subscription": {
      "plan_code": "free",
      "plan_name": "無料プラン",
      "status": "active",
      "max_saved_plans": 1
    }
  },
  "error": null
}
```

---

### 7.2 Family

#### GET /family-members

##### 用途

ログインユーザーに紐づく家族メンバー一覧と各アレルゲン一覧を取得する。

##### Response

```json
{
  "data": {
    "members": [
      {
        "id": "uuid-parent",
        "role": "parent",
        "age_group": "adult",
        "notes": "保護者",
        "allergens": []
      },
      {
        "id": "uuid-child",
        "role": "child",
        "age_group": "child",
        "notes": "小学生",
        "allergens": ["egg", "milk"]
      }
    ]
  },
  "error": null
}
```

---

#### POST /family-members

##### 用途

家族メンバーを新規登録する。

##### Request

```json
{
  "role": "child",
  "age_group": "child",
  "notes": "小学生",
  "allergens": ["egg", "milk"]
}
```

##### Response

```json
{
  "data": {
    "id": "uuid",
    "created": true
  },
  "error": null
}
```

---

#### PATCH /family-members/:id

##### 用途

家族メンバー情報を更新する。

##### Request

```json
{
  "role": "child",
  "age_group": "child",
  "notes": "中学生"
}
```

##### Response

```json
{
  "data": {
    "updated": true
  },
  "error": null
}
```

---

#### PUT /family-members/:id/allergens

##### 用途

対象メンバーのアレルゲン一覧をまとめて更新する。

##### Request

```json
{
  "allergens": ["egg", "wheat"]
}
```

##### Response

```json
{
  "data": {
    "updated": true
  },
  "error": null
}
```

---

### 7.3 Products

#### GET /products

##### 用途

商品一覧を取得する。

##### Query Parameters

- `category`: 主食 / おかず / おやつ / 飲料
- `product_type`: `emergency_food` / `daily_item`
- `is_free_from_28`: boolean
- `keyword`: 商品名検索用キーワード

##### Response

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

#### GET /products/:id

##### 用途

商品詳細を取得する。

##### Response

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

### 7.4 Plans

#### POST /plans/generate

##### 用途

家族情報・固定商品マスタ・条件をもとにAIが備えプランを生成する。生成結果は保存しない。

##### Request

```json
{
  "days": 3,
  "include_daily_items": true,
  "priority_policy": "balance"
}
```

##### Response

```json
{
  "data": {
    "summary": {
      "family_member_count": 3,
      "days": 3,
      "total_estimated_cost": 12000,
      "annual_cost": 8000
    },
    "items": [
      {
        "product_id": "uuid",
        "name": "アルファ米",
        "category": "主食",
        "product_type": "emergency_food",
        "quantity": 6,
        "priority": "high",
        "price": 400,
        "purchase_url": "https://example.com/item"
      }
    ],
    "ai_comment": "主食を優先しつつ、日常転用品も含めてバランスよく提案しています。"
  },
  "error": null
}
```

##### 補足

- `family_member_count` はログインユーザーに紐づく `family_members` 件数を使う
- `annual_cost` は表示時に計算する派生値であり、DBには保存しない

---

#### GET /plans

##### 用途

保存済み備えプラン一覧を取得する。

##### Response

```json
{
  "data": {
    "plans": [
      {
        "id": "uuid",
        "title": "3日分プラン",
        "family_member_count": 3,
        "days": 3,
        "total_estimated_cost": 12000,
        "created_at": "2026-04-07T10:00:00Z",
        "updated_at": "2026-04-07T10:00:00Z"
      }
    ]
  },
  "error": null
}
```

---

#### GET /plans/:id

##### 用途

保存済み備えプラン詳細を取得する。

##### Response

```json
{
  "data": {
    "id": "uuid",
    "title": "3日分プラン",
    "family_member_count": 3,
    "days": 3,
    "priority_policy": "balance",
    "include_daily_items": true,
    "total_estimated_cost": 12000,
    "annual_cost": 8000,
    "ai_comment": "主食を優先しています",
    "items": [
      {
        "product_id": "uuid",
        "product_name": "アルファ米",
        "quantity": 6,
        "priority": "high",
        "purpose_note": "主食を確保するため",
        "unit_price": 400,
        "category": "主食",
        "product_type": "emergency_food",
        "purchase_url": "https://example.com/item"
      }
    ]
  },
  "error": null
}
```

##### 補足

- `annual_cost` は `updated_at` が最新の保存済みプラン1件を算出元として、`products.price`、`plan_items.quantity`、`products.shelf_life_months` から表示時に算出する

---

#### POST /plans/:id/recalculate

##### 用途

保存済み備えプランの人数・日数変更時に、商品の数量のみを再計算する。

##### Request

```json
{
  "family_member_count": 4,
  "days": 7
}
```

##### Response

```json
{
  "data": {
    "summary": {
      "family_member_count": 4,
      "days": 7,
      "total_estimated_cost": 18000,
      "annual_cost": 12000
    },
    "items": [
      {
        "product_id": "uuid",
        "product_name": "アルファ米",
        "quantity": 12,
        "priority": "high",
        "purpose_note": "主食を確保するため",
        "unit_price": 400,
        "category": "主食",
        "product_type": "emergency_food",
        "purchase_url": "https://example.com/item"
      }
    ]
  },
  "error": null
}
```

##### 業務ルール

- 再計算対象は `plan_items.quantity` のみとする
- 商品構成、商品ID、カテゴリ、商品種別は変更しない
- `title` の変更は再計算に影響しない

---

#### PATCH /plans/:id

##### 用途

保存済み備えプランのプラン名・人数・日数・再計算後数量を更新保存する。

##### Request

```json
{
  "title": "7日分見直しプラン",
  "family_member_count": 4,
  "days": 7,
  "items": [
    {
      "product_id": "uuid",
      "quantity": 12
    }
  ]
}
```

##### Response

```json
{
  "data": {
    "updated": true,
    "plan_id": "uuid"
  },
  "error": null
}
```

##### 業務ルール

- 更新可能項目は title、family_member_count、days、items[].quantity に限定する
- 商品構成の追加・削除・差し替えは行わない
- 本人が所有する保存済みプランのみ更新可能とする

---

#### POST /plans

##### 用途

生成済みの備えプランを保存する。

##### Request

```json
{
  "title": "3日分プラン",
  "days": 3,
  "priority_policy": "balance",
  "include_daily_items": true,
  "family_member_count": 3,
  "total_estimated_cost": 12000,
  "ai_comment": "主食を優先しています",
  "items": [
    {
      "product_id": "uuid",
      "quantity": 6,
      "priority": "high",
      "purpose_note": "主食を確保するため"
    }
  ]
}
```

##### Response

```json
{
  "data": {
    "plan_id": "uuid"
  },
  "error": null
}
```

##### 業務ルール

- 無料プランは保存可能件数1件まで
- 有料プランは保存件数制限を解除する
- 保存件数上限を超える場合は `422` を返す

---

#### DELETE /plans/:id

##### 用途

保存済み備えプランを削除する。

##### Response

```json
{
  "data": {
    "deleted": true
  },
  "error": null
}
```

---

### 7.5 StockItems

#### GET /stock-items

##### 用途

備蓄品一覧を取得する。通知メールの遷移先としても利用する。

##### Response

```json
{
  "data": {
    "stock_items": [
      {
        "id": "uuid",
        "product_id": "uuid-product",
        "product_name": "アレルギー対応ビスケット",
        "quantity": 2,
        "purchased_at": "2026-04-07",
        "expires_at": "2026-06-01",
        "unit_price": 300,
        "is_expiring_soon": true
      },
      {
        "id": "uuid-free-input",
        "product_id": null,
        "product_name": "家で買ったクラッカー",
        "quantity": 1,
        "purchased_at": "2026-04-07",
        "expires_at": "2026-05-20",
        "unit_price": 250,
        "is_expiring_soon": true
      }
    ],
    "stock_total_cost": 850
  },
  "error": null
}
```

##### 補足

- 一覧は `expires_at` 昇順を基本とする
- `stock_total_cost = Σ(unit_price × quantity)`

---

#### POST /stock-items

##### 用途

備蓄商品を登録する。

##### Request（商品マスタから選択する場合）

```json
{
  "product_id": "uuid-product",
  "product_name": "アレルギー対応ビスケット",
  "quantity": 2,
  "expires_at": "2026-06-01",
  "unit_price": 300
}
```

##### Request（自由入力の場合）

```json
{
  "product_id": null,
  "product_name": "家で買ったクラッカー",
  "quantity": 1,
  "expires_at": "2026-05-20",
  "unit_price": 250
}
```

##### Response

```json
{
  "data": {
    "stock_item_id": "uuid"
  },
  "error": null
}
```

##### 補足

- `purchased_at` は入力項目とせず、登録日時を自動保存する
- `product_id` は任意
- `product_name` は必須

---

#### DELETE /stock-items/:id

##### 用途

備蓄商品を削除する。

##### Response

```json
{
  "data": {
    "deleted": true
  },
  "error": null
}
```

---

### 7.6 Dashboard

#### GET /dashboard

##### 用途

ダッシュボード表示に必要な情報をまとめて取得する。

##### Response

```json
{
  "data": {
    "family": {
      "member_count": 3
    },
    "cost": {
      "annual_cost": 8000,
      "stock_total_cost": 5000
    },
    "expiring_items": [
      {
        "id": "uuid",
        "product_name": "アレルギー対応ビスケット",
        "expires_at": "2026-06-01",
        "days_left": 25
      }
    ],
    "plans": [
      {
        "id": "uuid",
        "title": "3日分プラン",
        "total_estimated_cost": 12000
      }
    ],
    "subscription": {
      "plan_code": "free",
      "plan_name": "無料プラン",
      "status": "active"
    }
  },
  "error": null
}
```

---

### 7.7 Payments

#### POST /payments/checkout

##### 用途

Stripe Checkout セッションを作成する。

##### Request

```json
{
  "plan_code": "premium",
  "success_url": "https://example.com/billing/success",
  "cancel_url": "https://example.com/billing"
}
```

##### Response

```json
{
  "data": {
    "checkout_url": "https://checkout.stripe.com/..."
  },
  "error": null
}
```

---

#### POST /payments/webhook

##### 用途

Stripe Webhook を受信し、契約状態を更新する。

##### Response

```json
{
  "data": {
    "received": true
  },
  "error": null
}
```

---

### 7.8 Notifications

#### POST /notifications/expiry/run

##### 用途

賞味期限30日前の商品を対象に、1日1回まとめて通知メールを送信する。

##### 認可

内部実行専用

##### Response

```json
{
  "data": {
    "processed_users": 10,
    "sent_notifications": 8
  },
  "error": null
}
```

##### 通知内容

- 期限が近い備蓄商品の一覧
- 備蓄品一覧画面へのリンク
- 確認を促す文面

---

## 8. 画面との対応

| 画面             | 主に利用するAPI                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------- | --- |
| /login           | POST /auth/login                                                                                        |
| /signup          | POST /auth/signup                                                                                       |
| /dashboard       | GET /dashboard                                                                                          |
| /family          | GET /family-members, POST /family-members, PATCH /family-members/:id, PUT /family-members/:id/allergens |
| /plan/new        | POST /plans/generate                                                                                    |
| /plans           | GET /plans, DELETE /plans/:id                                                                           |
| /plans/:id       | GET /plans/:id, POST /plans/:id/recalculate, PATCH /plans/:id, POST /plans, DELETE /plans/:id           |
| /stock-items     | GET /stock-items, POST /stock-items, PATCH /stock-items/:id, DELETE /stock-items/:id                    |
| /billing         | POST /billing/checkout                                                                                  |
| /billing/success | GET /billing/status                                                                                     |     |

---

## 9. 設計上の注意点

- `POST /plans/generate` と `POST /plans` を混同しない
- `plans` は保存済みのみ保持する
- `stock_items` は商品マスタ選択・自由入力の両方に対応する
- `stock_items.product_id` は NULL 許容だが、`product_name` は必須
- `purchased_at` は備蓄登録日時を自動保存する
- 年間維持コストと備蓄コスト目安は表示時に計算する
- 見直し専用画面はMVP対象外
- 専用の備えプラン編集画面は作らないが、備えプラン詳細画面に追加機能として限定的な編集を実装する
- 編集可能項目は `プラン名 / 人数 / 日数` に限定し、再計算対象は `商品の数量のみ` とする
- 商品情報やAI提案は最終安全判定ではないため、注意文を表示する

---

## 10. 現在の状態

- API設計: 更新済み
- 要件定義 / PRD / MVP / DB設計との整合: 反映済み
- 実装前提: 整理済み
