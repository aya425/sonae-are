# Family API 仕様

## 概要

家族メンバー情報と、各メンバーに紐づくアレルゲン情報を扱うAPI仕様。

対象エンドポイントは以下。

- `GET /api/family-members`
- `POST /api/family-members`
- `PATCH /api/family-members/:id`
- `DELETE /api/family-members/:id`
- `PUT /api/family-members/:id/allergens`

---

## 共通仕様

### 認証

- すべての Family API はログイン必須
- 未認証時は `401` を返す

### データ構造

- 家族本体は `family_members`
- アレルゲンは `member_allergens`
- GET系では、フロントが扱いやすいようにメンバー単位へ整形して返す

### フィールド説明

| フィールド | 型       | 説明                          |
| ---------- | -------- | ----------------------------- |
| id         | string   | 家族メンバーID                |
| role       | string   | 続柄                          |
| age_group  | string   | 年齢区分（`adult` / `child`） |
| notes      | string   | メモ。未入力時は空文字        |
| allergens  | string[] | アレルゲン一覧                |
| created_at | string   | 作成日時                      |
| updated_at | string   | 更新日時                      |

---

## GET /api/family-members

### 概要

ログインユーザーの家族情報一覧を取得する。

### 正常系レスポンス

```json
{
  "data": [
    {
      "id": "uuid-1",
      "role": "母",
      "age_group": "adult",
      "notes": "",
      "created_at": "2026-04-09T10:00:00.000Z",
      "updated_at": "2026-04-09T10:00:00.000Z",
      "allergens": ["小麦", "乳"]
    },
    {
      "id": "uuid-2",
      "role": "子ども",
      "age_group": "child",
      "notes": "",
      "created_at": "2026-04-09T10:05:00.000Z",
      "updated_at": "2026-04-09T10:05:00.000Z",
      "allergens": ["落花生"]
    }
  ],
  "error": null
}
```

### 家族未登録時

```json
{
  "data": [],
  "error": null
}
```

### 未認証時

```json
{
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "認証が必要です。",
    "details": null
  }
}
```

### 補足

- `notes` は未入力時でも空文字で返す
- `allergens` は `member_allergens` を `string[]` に整形して返す
- 並び順は `created_at` 昇順

---

## POST /api/family-members

### 概要

家族メンバーを1件登録する。

### リクエスト

```json
{
  "role": "母",
  "age_group": "adult",
  "notes": ""
}
```

### 正常系レスポンス

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

### 未認証時

```json
{
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "認証が必要です。",
    "details": null
  }
}
```

### 入力エラー時

```json
{
  "data": null,
  "error": {
    "code": "BAD_REQUEST",
    "message": "家族情報の入力値が不正です。",
    "details": null
  }
}
```

### バリデーション

- `role`: 必須
- `age_group`: 必須（`adult` / `child`）
- `notes`: 任意

---

## PATCH /api/family-members/:id

### 概要

家族メンバー情報を更新する。

### リクエスト

```json
{
  "role": "子ども",
  "age_group": "child",
  "notes": "中学生"
}
```

### 正常系レスポンス

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

### 主なエラー例

#### ID不足

```json
{
  "data": null,
  "error": {
    "code": "BAD_REQUEST",
    "message": "family member id is required",
    "details": null
  }
}
```

#### 未認証

```json
{
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Unauthorized",
    "details": null
  }
}
```

#### 対象なし

```json
{
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "Family member not found",
    "details": null
  }
}
```

#### 他人データ更新

```json
{
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "Forbidden",
    "details": null
  }
}
```

### バリデーション

- `role`: 必須
- `age_group`: 必須（`adult` / `child`）
- `notes`: 文字列または `null`

---

## DELETE /api/family-members/:id

### 概要

家族メンバーを削除する。

### 正常系レスポンス

```json
{
  "data": {
    "id": "uuid"
  },
  "error": null
}
```

### 主なエラー例

#### ID不足

```json
{
  "data": null,
  "error": {
    "code": "BAD_REQUEST",
    "message": "family member id is required",
    "details": null
  }
}
```

#### 未認証

```json
{
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Unauthorized",
    "details": null
  }
}
```

#### 対象なし

```json
{
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "Family member not found",
    "details": null
  }
}
```

#### 他人データ削除

```json
{
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "Forbidden",
    "details": null
  }
}
```

---

## PUT /api/family-members/:id/allergens

### 概要

対象メンバーのアレルゲン一覧をまとめて更新する。

既存アレルゲンは一度全削除し、送られてきた配列で置き換える。

### リクエスト

```json
{
  "allergens": ["卵", "小麦"]
}
```

### 正常系レスポンス

```json
{
  "data": {
    "family_member_id": "uuid",
    "allergens": ["卵", "小麦"]
  },
  "error": null
}
```

### 空配列で全削除する場合

```json
{
  "data": {
    "family_member_id": "uuid",
    "allergens": []
  },
  "error": null
}
```

### 主なエラー例

#### 未認証

```json
{
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Unauthorized"
  }
}
```

#### 入力エラー

```json
{
  "data": null,
  "error": {
    "code": "BAD_REQUEST",
    "message": "allergens must be an array"
  }
}
```

#### 対象なし

```json
{
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "Family member not found"
  }
}
```

### バリデーション / 整形ルール

- `allergens` は配列必須
- 各要素は `trim` される
- 空文字は除去する
- 重複は除去する

---

## フロント利用想定

- `GET /api/family-members` の `data` をそのまま一覧描画に使う
- `POST /api/family-members` で新規メンバー作成後、そのまま画面状態へ追加できる
- `PATCH /api/family-members/:id` で続柄・年齢区分・メモを更新する
- `DELETE /api/family-members/:id` で対象メンバーを一覧から除去する
- `PUT /api/family-members/:id/allergens` でチェックボックス選択結果を丸ごと保存する

---

## 補足

- 本仕様は現行の Route Handler 実装を正として整理している
- レスポンスメッセージは、日本語APIと英語APIが混在しているが、現状実装どおりに記載している
- 実装変更時は本ドキュメントも更新する
