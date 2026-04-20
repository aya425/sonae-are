## 6-2 大枠テスト実施記録

| No | 対象 | 確認内容 | 結果 | 備考 |
|---|---|---|---|---|
| 1 | /api/family-members | 未ログインGETで401 | OK | 認証制御確認 |
| 2 | /api/family-members | 不正入力POSTで400 | OK | 入力値検証確認 |
| 3 | /api/family-members/[id] | 他人IDでPATCH不可 | OK | 404確認 |
| 4 | /api/family-members/[id]/allergens | 配列以外で400 | OK | 型チェック確認 |
| 5 | /api/plans | 未ログインGETで401 | OK | 認証制御確認 |
| 6 | /api/plans | 無料で2件目保存不可 | OK | UI制御確認 |
| 7 | /api/plans/[id] | 他人IDでGET不可 | OK | 404確認 |
| 8 | /api/plans/[id] | 他人IDでDELETE不可 | OK | 404確認 |
| 9 | /api/stock-items | 未ログインGETで401 | OK | 認証制御確認 |
| 10 | /api/stock-items | quantity=0で400 | OK | バリデーション確認 |
| 11 | /api/stock-items | unitPrice負値で400 | OK | バリデーション確認 |
| 12 | /api/stock-items | expiresAt過去日で400 | OK | バリデーション確認 |
| 13 | /api/stock-items/[id] | 他人IDでDELETE不可 | OK | 404確認 |

---

## ■ 単体テスト実施

| No | 対象 | テスト内容 | 結果 |
|---|---|---|---|
| 1 | stock-items | quantity / unitPrice / expiresAt | OK |
| 2 | allergens | trim / 空文字除去 / 重複除去 | OK |

---

## ■ 実行環境
- Vitest を導入
- `npm test -- --run` で実行確認

---

## ■ 備考
- /api/plans/[id] は UUID形式不正時に500 → 改善余地あり
- /api/dashboard は取得経路が異なるため対象外

---

## ■ 結論
- 主要APIの認証・認可・入力値検証は正常に機能している
- 重要ロジックは単体テストで担保できている