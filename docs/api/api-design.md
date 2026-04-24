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
- ログイン / 会員登録 / ログアウトは画面側から Supabase client を直接利用する
- API設計書では、主に `my-app/app/api` 配下の Route Handlers を対象にする
- 家族情報は `family_members` と `member_allergens` で管理する
- 商品は固定商品マスタ `products` を参照する
- 備えプランは「生成」と「保存」を分離する
- 保存済み備えプランのみDBに保持する
- 備えプラン編集機能は追加機能として限定実装する
  - 編集可能項目は `title` / `familyMemberCount` / `days` / `items[].quantity`
- 備蓄商品編集機能は実装済みとする
- 備蓄商品は商品マスタから選択して登録できるが、自由入力商品も登録可能とする
- そのため `stock_items.product_id` は NULL 許容、`product_name` は必須とする
- `purchased_at` はユーザー入力ではなく、備蓄登録日時を自動保存する
- 通知は賞味期限30日前に1日1回バッチ処理で送信する
- 各備蓄商品に対する30日前通知は1回のみ
- 同日に通知対象となった商品はユーザー単位で1通のメールにまとめて送信する
- 有料機能の差分は保存済み備えプラン件数制限の解除のみとする
- `annual_cost` はプラン保存時に保存し、ホーム表示でも利用する

---

## 3. 設計方針

### 3.1 生成と保存を分離する

- `POST /plans/generate` は備えプランの生成のみを行う
- `POST /plans` は生成済みプランの保存を行う

### 3.2 家族情報は member 単位で扱う

- 家族構成は `family_members`
- アレルゲンは `member_allergens`
- APIでもメンバー単位で扱う

### 3.3 ホームは集約APIとする

- ホーム画面で必要な情報は `GET /home` でまとめて返す
- `GET /home` は Redis キャッシュの対象とする

### 3.4 商品はマスタ参照とする

- 商品情報は `products` を参照専用で扱う
- 備蓄登録では商品マスタ選択・自由入力の両方を許容する

### 3.5 通知はバッチ実行とする

- 通知実行は `POST /batch/expire-notification`
- cron / バッチ基盤から実行する
- 通知APIは `Bearer CRON_SECRET` で保護する
- 通知メールの遷移先は備蓄品一覧画面とする

---

## 4. 認証 / 認可

| 区分     | 内容                                   |
| -------- | -------------------------------------- |
| 認証方式 | Supabase Auth セッション               |
| 認証基盤 | Supabase Auth                          |
| 必須API  | `products` と内部テスト系を除く主要API |
| Webhook  | Stripe署名検証を行う                   |
| 通知API  | 内部実行用キーで保護する               |

### 補足

- ログインユーザーに紐づくデータのみ操作可能とする
- `family_members`、`member_allergens`、`plans`、`plan_items`、`stock_items`、`subscriptions` は本人データのみ取得・操作可能とする
- `products` は現行実装では未認証でも取得可能
- `plans_master` はサーバー側処理から参照する

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
    "details": null
  }
}
```

### 5.3 ステータスコード

| コード | 意味                      |
| ------ | ------------------------- |
| 200    | 成功                      |
| 201    | 作成成功                  |
| 400    | 入力エラー                |
| 401    | 未認証                    |
| 403    | 業務ルール違反 / 実行不可 |
| 404    | データなし                |
| 500    | サーバエラー              |

### 5.4 実装上の補足

- `400`: 必須項目不足、形式不正、数量不正、日付不正など
- `403`: 無料プラン保存件数上限到達など
- 一部の旧実装APIでは `message` が英語、`details` が省略される場合がある

---

## 6. API一覧

| カテゴリ      | メソッド | エンドポイント                | 概要                           |
| ------------- | -------- | ----------------------------- | ------------------------------ |
| Me            | GET      | /me                           | 自分情報取得                   |
| Family        | GET      | /family-members               | 家族一覧取得                   |
| Family        | POST     | /family-members               | 家族メンバー登録               |
| Family        | PATCH    | /family-members/:id           | 家族メンバー更新               |
| Family        | DELETE   | /family-members/:id           | 家族メンバー削除               |
| Family        | PUT      | /family-members/:id/allergens | アレルゲン一覧更新             |
| Plans         | POST     | /plans/generate               | 備えプラン生成                 |
| Plans         | GET      | /plans                        | 保存済みプラン一覧取得         |
| Plans         | GET      | /plans/:id                    | 保存済みプラン詳細取得         |
| Plans         | POST     | /plans/:id/recalculate        | 備えプラン数量再計算           |
| Plans         | PATCH    | /plans/:id                    | 保存済み備えプラン更新         |
| Plans         | POST     | /plans                        | 備えプラン保存                 |
| Plans         | DELETE   | /plans/:id                    | 保存済みプラン削除             |
| Products      | GET      | /products                     | 商品一覧取得                   |
| StockItems    | GET      | /stock-items                  | 備蓄一覧取得                   |
| StockItems    | POST     | /stock-items                  | 備蓄登録                       |
| StockItems    | PATCH    | /stock-items/:id              | 備蓄更新                       |
| StockItems    | DELETE   | /stock-items/:id              | 備蓄削除                       |
| Home          | GET      | /home                         | ホーム集約情報取得             |
| Payments      | POST     | /payments/checkout            | Stripe Checkout セッション作成 |
| Payments      | POST     | /payments/cancel              | Stripe定期課金の解約予約       |
| Payments      | POST     | /payments/webhook             | Stripe Webhook受信             |
| Notifications | POST     | /batch/expire-notification    | 賞味期限通知実行               |

---

## 7. API詳細

### 7.1 Me

#### GET /me

##### 用途

ログインユーザー情報と契約状態を取得する。

##### Response

```json
{
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "planCode": "free",
    "isPremium": false,
    "subscription": {
      "planCode": "free",
      "status": null,
      "currentPeriodEnd": null,
      "cancelAtPeriodEnd": false
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
  "data": [
    {
      "id": "uuid-parent",
      "role": "母",
      "age_group": "adult",
      "notes": "",
      "created_at": "2026-04-09T10:00:00.000Z",
      "updated_at": "2026-04-09T10:00:00.000Z",
      "allergens": ["小麦", "乳"]
    }
  ],
  "error": null
}
```

#### POST /family-members

##### 用途

家族メンバーを新規登録する。

##### Request

```json
{
  "role": "母",
  "age_group": "adult",
  "notes": ""
}
```

##### Response

```json
{
  "data": {
    "id": "uuid",
    "role": "母",
    "age_group": "adult",
    "notes": "",
    "created_at": "2026-04-09T10:00:00.000Z",
    "updated_at": "2026-04-09T10:00:00.000Z",
    "allergens": []
  },
  "error": null
}
```

#### PATCH /family-members/:id

##### 用途

家族メンバー情報を更新する。

##### Request

```json
{
  "role": "子ども",
  "age_group": "child",
  "notes": "中学生"
}
```

##### Response

```json
{
  "data": {
    "id": "uuid",
    "role": "子ども",
    "age_group": "child",
    "notes": "中学生",
    "created_at": "2026-04-09T10:00:00.000Z",
    "updated_at": "2026-04-10T10:00:00.000Z"
  },
  "error": null
}
```

#### DELETE /family-members/:id

##### 用途

家族メンバーを削除する。

##### Response

```json
{
  "data": {
    "id": "uuid"
  },
  "error": null
}
```

#### PUT /family-members/:id/allergens

##### 用途

対象メンバーのアレルゲン一覧をまとめて更新する。

##### Request

```json
{
  "allergens": ["卵", "小麦"]
}
```

##### Response

```json
{
  "data": {
    "family_member_id": "uuid",
    "allergens": ["卵", "小麦"]
  },
  "error": null
}
```

---

### 7.3 Products

#### GET /products

##### 用途

商品一覧を取得する。

##### Response

```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "アレルギー対応ビスケット",
        "category": "おやつ",
        "productType": "daily_item",
        "isFreeFrom28": true,
        "price": 300,
        "purchaseUrl": "https://example.com/item",
        "shelfLifeMonths": 12,
        "isActive": true
      }
    ]
  },
  "error": null
}
```

##### 補足

- 現行実装では `is_active = true` の商品のみ返す
- 現行実装では認証チェックを行っていない

---

### 7.4 Plans

#### POST /plans/generate

##### 用途

家族情報・商品マスタ・条件をもとにAIが備えプランを生成する。生成結果は保存しない。

##### Request

```json
{
  "days": 3,
  "includeDailyItems": true,
  "priorityPolicy": "balanced"
}
```

##### Response

```json
{
  "data": {
    "generatedPlan": {
      "title": "3日分プラン",
      "familyMemberCount": 3,
      "days": 3,
      "includeDailyItems": true,
      "priorityPolicy": "balanced",
      "totalCost": 12000,
      "annualCost": 8000,
      "explanation": "主食を優先しつつ、日常品も含めて提案しています。",
      "warnings": [
        "購入前に必ず商品ページやパッケージで原材料・アレルゲン表示を確認してください。"
      ],
      "items": [
        {
          "id": "uuid",
          "name": "アルファ米",
          "category": "主食",
          "productType": "emergency_food",
          "isFreeFrom28": true,
          "price": 400,
          "purchaseUrl": "https://example.com/item",
          "shelfLifeMonths": 60,
          "isActive": true,
          "quantity": 6,
          "subtotal": 2400,
          "priority": "high",
          "reason": "災害時のエネルギー確保の中心になる主食として選びました。"
        }
      ]
    }
  },
  "error": null
}
```

#### GET /plans

##### 用途

保存済み備えプラン一覧を取得する。

##### Response

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "3日分プラン",
      "familyMemberCount": 3,
      "totalEstimatedCost": 12000,
      "annualCost": 8000,
      "updatedAt": "2026-04-07T10:00:00Z"
    }
  ],
  "error": null
}
```

#### GET /plans/:id

##### 用途

保存済み備えプラン詳細を取得する。

##### Response

```json
{
  "data": {
    "id": "uuid",
    "title": "3日分プラン",
    "days": 3,
    "familyMemberCount": 3,
    "totalEstimatedCost": 12000,
    "annualCost": 8000,
    "priorityPolicy": "balanced",
    "includeDailyItems": true,
    "aiComment": "主食を優先しています",
    "warnings": ["購入前に原材料表示を確認してください。"],
    "items": [
      {
        "id": "uuid",
        "name": "アルファ米",
        "category": "主食",
        "productType": "emergency_food",
        "isFreeFrom28": true,
        "price": 400,
        "purchaseUrl": "https://example.com/item",
        "shelfLifeMonths": 60,
        "isActive": true,
        "quantity": 6,
        "subtotal": 2400,
        "priority": "high",
        "reason": "主食を確保するため"
      }
    ]
  },
  "error": null
}
```

#### POST /plans/:id/recalculate

##### 用途

保存済み備えプランの人数・日数変更時に、商品の数量のみを再計算する。

##### Request

```json
{
  "familyMemberCount": 4,
  "days": 7
}
```

##### Response

```json
{
  "data": {
    "summary": {
      "familyMemberCount": 4,
      "days": 7,
      "totalEstimatedCost": 18000,
      "annualCost": 12000
    },
    "items": [
      {
        "productId": "uuid",
        "name": "アルファ米",
        "category": "主食",
        "productType": "emergency_food",
        "quantity": 12,
        "subtotal": 4800,
        "priority": "high",
        "reason": "主食を確保するため",
        "purchaseUrl": "https://example.com/item"
      }
    ]
  },
  "error": null
}
```

#### PATCH /plans/:id

##### 用途

保存済み備えプランのプラン名・人数・日数・数量を更新保存する。

##### Request

```json
{
  "title": "7日分見直しプラン",
  "familyMemberCount": 4,
  "days": 7,
  "totalEstimatedCost": 18000,
  "annualCost": 12000,
  "items": [
    {
      "productId": "uuid",
      "quantity": 12
    }
  ]
}
```

##### Response

```json
{
  "data": {
    "id": "uuid",
    "title": "7日分見直しプラン",
    "familyMemberCount": 4,
    "days": 7,
    "totalEstimatedCost": 18000,
    "annualCost": 12000,
    "updatedAt": "2026-04-10T10:00:00.000Z"
  },
  "error": null
}
```

#### POST /plans

##### 用途

生成済みの備えプランを保存する。

##### Request

```json
{
  "title": "3日分プラン",
  "days": 3,
  "priorityPolicy": "balanced",
  "includeDailyItems": true,
  "familyMemberCount": 3,
  "totalEstimatedCost": 12000,
  "annualCost": 8000,
  "aiComment": "主食を優先しています",
  "warnings": ["購入前に原材料表示を確認してください。"],
  "items": [
    {
      "productId": "uuid",
      "quantity": 6,
      "priority": "high",
      "purposeNote": "主食を確保するため"
    }
  ]
}
```

##### Response

```json
{
  "data": {
    "id": "uuid",
    "title": "3日分プラン",
    "familyMemberCount": 3,
    "totalEstimatedCost": 12000,
    "annualCost": 8000,
    "updatedAt": "2026-04-07T10:00:00Z"
  },
  "error": null
}
```

##### 業務ルール

- 無料プランは保存可能件数1件まで
- 有料プランは保存件数制限を解除する
- 保存件数上限を超える場合は `403` を返す

#### DELETE /plans/:id

##### 用途

保存済み備えプランを削除する。

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

### 7.5 StockItems

#### GET /stock-items

##### 用途

備蓄品一覧を取得する。通知メールの遷移先としても利用する。

##### Response

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "アレルギー対応ビスケット",
      "quantity": 2,
      "expiresAt": "2026-06-01",
      "unitPrice": 300
    }
  ],
  "error": null
}
```

#### POST /stock-items

##### 用途

備蓄商品を登録する。

##### Request

```json
{
  "productId": "uuid-product",
  "productName": "アレルギー対応ビスケット",
  "quantity": 2,
  "expiresAt": "2026-06-01",
  "unitPrice": 300
}
```

##### Response

```json
{
  "data": {
    "id": "uuid",
    "name": "アレルギー対応ビスケット",
    "quantity": 2,
    "expiresAt": "2026-06-01",
    "unitPrice": 300
  },
  "error": null
}
```

##### 補足

- `purchased_at` は入力項目とせず、登録日時を自動保存する
- `productId` は任意
- `productName` は必須

#### PATCH /stock-items/:id

##### 用途

備蓄商品の数量・単価・賞味期限を更新する。

##### Request

```json
{
  "quantity": 3,
  "unitPrice": 280,
  "expiresAt": "2026-07-01"
}
```

##### Response

```json
{
  "data": {
    "id": "uuid",
    "name": "アレルギー対応ビスケット",
    "quantity": 3,
    "expiresAt": "2026-07-01",
    "unitPrice": 280
  },
  "error": null
}
```

#### DELETE /stock-items/:id

##### 用途

備蓄商品を削除する。

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

### 7.6 Home

#### GET /home

##### 用途

ホーム表示に必要な情報をまとめて取得する。

##### Response

```json
{
  "data": {
    "familySummary": {
      "memberCount": 3,
      "hasFamily": true
    },
    "costSummary": {
      "annualCost": 8000,
      "sourcePlanId": "uuid"
    },
    "expiringItems": {
      "count": 1,
      "items": [
        {
          "id": "uuid",
          "productName": "アレルギー対応ビスケット",
          "expiresAt": "2026-06-01",
          "daysLeft": 25
        }
      ]
    },
    "stockSummary": {
      "count": 5
    },
    "savedPlans": [
      {
        "id": "uuid",
        "title": "3日分プラン",
        "days": 3,
        "familyMemberCount": 3,
        "totalEstimatedCost": 12000,
        "annualCost": 8000,
        "updatedAt": "2026-04-07T10:00:00Z"
      }
    ],
    "billingSummary": {
      "planCode": "free",
      "maxSavedPlans": 1
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

リクエストボディなし

##### Response

```json
{
  "data": {
    "url": "https://checkout.stripe.com/..."
  },
  "error": null
}
```

#### POST /payments/cancel

##### 用途

Stripe定期課金の自動更新停止を予約する。

##### Request

リクエストボディなし

##### Response

```json
{
  "data": {
    "message": "自動更新を停止しました。次回更新日までは利用できます。",
    "cancelAtPeriodEnd": true,
    "currentPeriodEnd": "2026-05-01T00:00:00.000Z"
  },
  "error": null
}
```

##### 既に解約済みの場合

```json
{
  "data": {
    "message": "すでに解約済みです。"
  },
  "error": null
}
```

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

##### 補足

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

を主に処理する。

---

### 7.8 Notifications

#### POST /batch/expire-notification

##### 用途

賞味期限30日前の商品を対象に、1日1回まとめて通知メールを送信する。

##### 認可

`Authorization: Bearer <CRON_SECRET>`

##### Response

```json
{
  "ok": true,
  "message": "Expire notification batch completed",
  "data": {
    "targetUsers": 2,
    "targetItems": 3,
    "failedUsers": 0
  }
}
```

##### 対象0件の場合

```json
{
  "ok": true,
  "message": "No expiring items found",
  "data": {
    "targetUsers": 0,
    "targetItems": 0,
    "failedUsers": 0
  }
}
```

##### 通知内容

- 期限が近い備蓄商品の一覧
- 備蓄品一覧画面へのリンク
- 確認を促す文面

---

## 8. 画面との対応

| 画面             | 主に利用するAPI                                                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| /home            | GET /home, GET /me                                                                                                                  |
| /family          | GET /family-members, POST /family-members, PATCH /family-members/:id, DELETE /family-members/:id, PUT /family-members/:id/allergens |
| /plan/new        | POST /plans/generate, GET /family-members                                                                                           |
| /plans           | GET /plans, DELETE /plans/:id                                                                                                       |
| /plans/:id       | GET /plans/:id, POST /plans/:id/recalculate, PATCH /plans/:id, DELETE /plans/:id                                                    |
| /plans/temp      | POST /plans                                                                                                                         |
| /stock-items     | GET /stock-items, POST /stock-items, PATCH /stock-items/:id, DELETE /stock-items/:id                                                |
| /billing         | POST /payments/checkout, POST /payments/cancel, GET /me                                                                             |
| /billing/success | GET /me                                                                                                                             |

---

## 9. 設計上の注意点

- `POST /plans/generate` と `POST /plans` を混同しない
- `plans` は保存済みのみ保持する
- `stock_items` は商品マスタ選択・自由入力の両方に対応する
- `stock_items.product_id` は NULL 許容だが、`product_name` は必須
- `purchased_at` は備蓄登録日時を自動保存する
- `annualCost` は保存済みプランとホーム表示で利用する
- 専用の備えプラン編集画面は作らないが、備えプラン詳細画面に限定的な編集を実装する
- 編集可能項目は `プラン名 / 人数 / 日数 / 数量` に限定する
- 商品情報やAI提案は最終安全判定ではないため、注意文を表示する
- 認証系は Route Handler API ではなく Supabase Auth client を利用する

---

## 10. 現在の状態

- API設計: 現行実装ベースに更新済み
- 対象: `my-app/app/api` 配下の主要Route Handlers
- 内部テスト用API: 本書の対象外
