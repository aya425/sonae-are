# 画面とAPIの対応整理（Screen API Mapping）

## 1. 概要

本ドキュメントは、各画面で必要となるAPIとデータ要件を整理する。

フロントエンド実装とバックエンドAPI設計の整合を取ることを目的とする。

---

## 2. 一覧（サマリ）

| 画面ID | API |
|--------|-----|
| UI-002 | POST /auth/signup |
| UI-003 | POST /auth/login |
| UI-004 | GET /dashboard |
| UI-005 | GET /families, POST /families |
| UI-006 | POST /plans/generate |
| UI-007 | GET /plans/:id, POST /plans |
| UI-008 | GET /plans, DELETE /plans/:id |
| UI-009 | GET /inventory, POST /inventory, DELETE /inventory/:id |
| UI-010 | POST /billing/checkout |
| UI-011 | GET /billing/status |

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

## UI-004 ダッシュボード

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

### API②（保存）
POST /plans

### 必要データ
- プラン条件
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
GET /inventory

### API②（登録）
POST /inventory

### API③（削除）
DELETE /inventory/:id

### 登録リクエスト
- name
- quantity
- expiryDate
- price

### 必要データ
- 期限が近い商品
- 登録済み備蓄一覧
- 合計コスト

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
- 500：サーバーエラー

---

## 5. 注意点

- AIは説明補助のみ（安全判定しない）
- 商品購入は外部サイト遷移
- 通知はメールのみ（UIなし）
- 編集機能はMVPでは非対応