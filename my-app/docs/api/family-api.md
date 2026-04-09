# Family API 仕様

## GET /api/family-members

### 概要
ログインユーザーの家族情報一覧を取得する

---

## レスポンス

### 正常系

{
  "data": [
    {
      "id": "uuid-1",
      "role": "母",
      "age_group": "adult",
      "notes": "",
      "allergens": ["小麦", "乳"],
      "created_at": "2026-04-09T10:00:00.000Z",
      "updated_at": "2026-04-09T10:00:00.000Z"
    },
    {
      "id": "uuid-2",
      "role": "子ども",
      "age_group": "child",
      "notes": "",
      "allergens": ["落花生"],
      "created_at": "2026-04-09T10:05:00.000Z",
      "updated_at": "2026-04-09T10:05:00.000Z"
    }
  ],
  "error": null
}

---

### 家族未登録時

{
  "data": [],
  "error": null
}

---

### 未認証時

{
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Unauthorized"
  }
}

---

### フィールド説明

| フィールド | 型 | 説明 |
|------------|----|------|
| id | string | 家族メンバーID |
| role | string | 続柄 |
| age_group | string | 年齢区分（adult / child） |
| notes | string \| null | メモ |
| allergens | string[] | アレルゲン一覧 |
| created_at | string | 作成日時 |
| updated_at | string | 更新日時 |

---

## POST /api/family

### 概要
家族メンバーを1件登録する

---

### リクエスト

{
  "role": "母",
  "age_group": "adult",
  "notes": ""
}

---

### レスポンス

{
  "data": {
    "id": "uuid",
    "role": "母",
    "age_group": "adult",
    "notes": "",
    "created_at": "...",
    "updated_at": "..."
  },
  "error": null
}

---

## POST /api/family-members

### リクエスト

{
  "role": "母",
  "age_group": "adult",
  "notes": ""
}

---

### バリデーション

- role：必須
- age_group：必須（adult / child）
- notes：任意

---

### 設計意図

- DB上は family_members と member_allergens に分かれているが、フロントでは家族メンバー単位で扱いたいため、1つの配列に整形した形で返す
- allergens は string[] で返し、画面側でそのまま一覧表示・タグ表示・カンマ区切り表示に使えるようにする
- data をそのままループ描画できる形にして、フロント実装時の変換処理を減らす

### フロント利用想定
- data をそのまま家族一覧描画に使う
- role を続柄表示に使う
- age_group を大人 / 子ども表示の判定に使う
- allergens をタグ表示や join(", ") での表示に使う
- notes は任意表示とする

### 補足
- 本仕様は、C担当がフロント実装を先に進められるようにするためのレスポンス仕様共有を目的とする
- 実装と差分が出た場合は、実装側を正として本ドキュメントを更新する