# 画面とAPIの対応整理（Screen API Mapping）

## 1. 概要

本ドキュメントは、各画面で必要となるAPIとデータ要件を整理する。

フロントエンド実装とバックエンドAPI設計の整合を取ることを目的とする。

今回の追加対応として、備蓄品一覧画面（UI-009）における登録済み備蓄商品の編集機能を扱う。
編集対象は `数量 / 単価 / 賞味期限` の3項目に限定し、カード上で編集して保存できる前提とする。

---

## 2. 一覧（サマリ）

| 画面ID | API                                                                                  |
| ------ | ------------------------------------------------------------------------------------ |
| UI-002 | POST /auth/signup                                                                    |
| UI-003 | POST /auth/login                                                                     |
| UI-004 | GET /dashboard                                                                       |
| UI-005 | GET /families, POST /families                                                        |
| UI-006 | POST /plans/generate                                                                 |
| UI-007 | GET /plans/:id, POST /plans/:id/recalculate, PATCH /plans/:id, POST /plans           |
| UI-008 | GET /plans, DELETE /plans/:id                                                        |
| UI-009 | GET /stock-items, POST /stock-items, PATCH /stock-items/:id, DELETE /stock-items/:id |
| UI-010 | POST /billing/checkout                                                               |
| UI-011 | GET /billing/status                                                                  |

---

## 3. 各画面詳細

---

## UI-002 会員登録

### API

POST /auth/signup

### リクエスト

- email
- password

### レスポンス

- userId
- token

---

## UI-003 ログイン

### API

POST /auth/login

### リクエスト

- email
- password

### レスポンス

- userId
- token

---

## UI-004 ホーム

### API

GET /dashboard

### 必要データ

- 家族人数
- 保存済みプラン数
- 年間維持コスト
- 期限が近い商品一覧（最大3件）
  - 商品名
  - 期限日
- 備蓄品数

---

## UI-005 家族情報

### API①（取得）

GET /families

### API②（登録・更新）

POST /families

### リクエスト

- familyMembers[]
  - role（続柄）
  - ageGroup（大人/子ども）
  - allergens[]
  - memo

### レスポンス

- familyId

---

## UI-006 備えプラン作成

### API

POST /plans/generate

### リクエスト

- days（3 or 7）
- policy（最低限 / バランス）
- includeDailyItems（boolean）

### レスポンス

- plan（未保存）
  - items[]
  - totalCost
  - annualCost
  - explanation

---

## UI-007 備えプラン詳細

### API①（取得）

GET /plans/:id

### API②（再計算）

POST /plans/:id/recalculate

### API③（更新保存）

PATCH /plans/:id

### API④（初回保存）

POST /plans

### 必要データ

- プラン条件
  - プラン名
  - 人数
  - 日数
- 初期費用
- 年間維持コスト
- 商品一覧
  - 商品名
  - 数量
  - カテゴリ
  - 商品種別（防災食 / 日常品）
  - 価格
  - 商品URL
- AI説明
- 注意文

### 補足

- 備えプラン編集機能は当初MVP対象外として整理していたが、追加機能として UI-007 に対するAPI対応を整理する
- 編集可能項目は `プラン名 / 人数 / 日数` に限定する
- 人数・日数変更時の再計算対象は `商品の数量のみ` とする
- 再計算は保存と分けて扱う
- POST /plans は初回保存用として扱い、保存済みプランの更新保存とは分ける

---

## UI-008 保存済みプラン一覧

### API①（一覧取得）

GET /plans

### API②（削除）

DELETE /plans/:id

### 必要データ

- プラン一覧
  - id
  - 日数
  - 人数
  - 費用
  - 作成日

---

## UI-009 備蓄品一覧

### API①（一覧取得）

GET /stock-items

### API②（登録）

POST /stock-items

### API③（更新）

PATCH /stock-items/:id

### API④（削除）

DELETE /stock-items/:id

### 登録リクエスト

- name
- quantity
- expiryDate
- price

### 更新リクエスト

- quantity
- expiryDate
- price

### 更新対象

- 数量
- 単価
- 賞味期限

### 必要データ

- 期限が近い商品
- 登録済み備蓄一覧
- 合計コスト
- 各備蓄商品の編集対象値
  - quantity
  - expiryDate
  - price

### 補足

- 登録済み備蓄商品のカードは、表示兼編集フォームとして扱う
- 商品名は表示のみとし、編集対象外とする
- 保存ボタン押下時にのみ更新APIを呼ぶ
- 削除ボタンは従来どおり個別商品削除に利用する
- 保存と削除の導線が混乱しないよう、カード単位で動作を分ける

---

## UI-010 料金プラン

### API

POST /billing/checkout

### リクエスト

- planType（free / premium）

### レスポンス

- checkoutUrl

---

## UI-011 決済完了

### API

GET /billing/status

### レスポンス

- status（success / fail）
- planType

---

## 4. 共通仕様

### 認証

- Bearer Token（JWT）

### エラーハンドリング

- 400：入力エラー
- 401：未認証
- 404：対象データなし
- 422：業務ルール違反
- 500：サーバーエラー

---

## 5. 注意点

- AIは説明補助のみ（安全判定しない）
- 商品購入は外部サイト遷移
- 通知はメールのみ（UIなし）
- 専用の編集画面は作らないが、備えプラン詳細画面（UI-007）に追加機能として限定的な編集を実装する
- 編集可能項目は `プラン名 / 人数 / 日数` に限定し、再計算対象は `商品の数量のみ` とする
- 備蓄品一覧画面では、登録済み備蓄商品の `数量 / 単価 / 賞味期限` のみ編集対象とする
- 備蓄商品更新APIでは、本人データのみ更新可能とする
- 備蓄商品更新時も、数量・単価・賞味期限のバリデーションを行う
