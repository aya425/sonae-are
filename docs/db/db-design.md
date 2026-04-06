# DB設計書

## 1. ドキュメント概要

### 1.1 目的

本書は、食物アレルギー家庭向け防災備蓄支援アプリ「そなえアレ」における、MVP範囲のDB設計方針およびテーブル構成を整理することを目的とする。

本アプリでは、家族情報・アレルギー情報をもとに、家族条件に合った備えプランを提案し、商品購入導線、備蓄商品の登録、期限管理、費用管理、賞味期限通知までを一気通貫で支援する。

本DB設計では、MVPとして必要なデータのみを対象とし、過剰設計を避けつつ、実装しやすさと将来の最低限の拡張性を両立する構成を採用する。

---

### 1.2 対象範囲

本書の対象範囲は以下とする。

- Supabase Auth とアプリ側テーブルの責務分離
- MVPに必要なテーブル一覧
- 各テーブルの主キー、外部キー、主要カラム、制約
- リレーション設計
- インデックス設計
- RLS方針
- MVPで省略する項目の整理
- ER図に起こせる粒度での構造整理

---

## 2. 設計方針

### 2.1 設計方針の前提

本アプリのMVPでは、以下を前提とする。

- 認証は Supabase Auth を利用する
- 商品情報は固定商品マスタで管理する
- 備えプランの「生成」と「保存」は分けて考える
- 保存済み備えプランのみDBに保持する
- 備えプラン編集機能はMVPの対象外とする
- 備蓄商品は、実際に購入した商品をユーザーが登録する
- 備蓄商品編集機能はMVPの対象外とする
- 備蓄商品は商品マスタへの外部キー参照を必須とせず、独立して登録可能とする
- 通知はメールのみとし、賞味期限30日前に1日1回バッチ処理で送信する
- 各備蓄商品に対する30日前通知は1回のみとする
- 同日に通知対象となった商品は、ユーザー単位で1通のメールにまとめて送信する
- 見直し専用画面はMVPの対象外とする
- AIは説明補助のみで使用し、最終安全判定や医療判断は行わない
- 有料機能による差分は、保存済み備えプラン件数の制限解除のみとする
- 削除は物理削除を基本とする
- 所有者ベースのデータ分離を前提に、Supabase の RLS を適用する

---

### 2.2 設計上の基本方針

本設計では、以下の考え方を採用する。

#### 2.2.1 認証情報と業務データを分離する

認証に必要な情報は Supabase Auth 側で管理し、アプリ独自の情報はアプリ側テーブルで保持する。

これにより、認証と業務データの責務を分離し、RLSも `auth.uid()` を基準に整理しやすくする。

#### 2.2.2 商品マスタとユーザー所有データを分離する

商品情報は固定商品マスタとして `products` に保持し、ユーザーごとの保存済み備えプランや備蓄商品とは分離する。

備蓄商品は、実際にユーザーが購入・保有している状態を記録するデータとして扱い、商品マスタとは独立して保持する。

#### 2.2.3 有料機能制御は最小構成で行う

有料プランとの差分は保存済み備えプラン件数の上限のみであるため、課金制御は `plans_master` と `subscriptions` の2テーブルで最小構成とする。

契約状態は `subscriptions` を正本とし、`users.plan_type` のような二重管理は行わない。

#### 2.2.4 過剰な中間構造や派生値の保存を避ける

MVP段階では、家族構成を表すための中間テーブルを増やしすぎず、`users` 直下に `family_members` を持たせる構成とする。

また、年間維持コストや備蓄コスト目安のような計算可能な派生値はDBに保持せず、必要時にアプリケーション側で算出する。

#### 2.2.5 過剰なマスタ分割を避ける

MVP段階では、アレルゲンマスタや商品カテゴリマスタなどの分割は行わず、必要最小限のカラムで保持する。

複雑な正規化よりも、実装しやすさとチーム開発の分かりやすさを優先する。

---

## 3. Supabase Auth とアプリ側テーブルの責務分離

### 3.1 Supabase Auth で管理するもの

Supabase Auth では、主に認証のために必要な情報を管理する。

- ユーザーID
- メールアドレス
- パスワードハッシュ
- 認証状態
- メール認証状態

---

### 3.2 アプリ側テーブルで管理するもの

アプリ側DBでは、業務ロジックに必要な情報を管理する。

- 表示名などのユーザー情報
- 家族メンバー情報
- 家族メンバーごとのアレルゲン
- 商品マスタ
- 保存済み備えプラン
- 備えプラン内の商品候補
- 実際に備えている備蓄商品
- 通知履歴
- プラン定義
- ユーザーごとの契約状態

---

### 3.3 採用方針

- `auth.users` を認証情報の正本とする
- アプリ側ユーザー情報は `users` に持つ
- `auth.users` と `users` は役割を分離して扱う
- 有料 / 無料の判定は `subscriptions` と `plans_master` を参照する
- `users.plan_type` は持たない

---

## 4. 採用テーブル一覧

### 4.1 採用推奨テーブル

本MVPで採用するテーブルは以下の10テーブルとする。

- `users`
- `family_members`
- `member_allergens`
- `products`
- `plans`
- `plan_items`
- `stock_items`
- `notification_logs`
- `plans_master`
- `subscriptions`

---

### 4.2 省略可能テーブル

以下はMVPでは必須としない。

- `payments`

`payments` は決済履歴確認やWebhookイベント記録に利用できるが、今回のMVPでは有料 / 無料判定に必要な最小要素としては `subscriptions` を優先する。

---

## 5. リレーション設計

### 5.1 1対1

- `auth.users` 1 : 1 `users`
- `users` 1 : 1 `subscriptions`

---

### 5.2 1対多

- `users` 1 : N `family_members`
- `family_members` 1 : N `member_allergens`
- `users` 1 : N `plans`
- `plans` 1 : N `plan_items`
- `products` 1 : N `plan_items`
- `users` 1 : N `stock_items`
- `users` 1 : N `notification_logs`
- `stock_items` 1 : N `notification_logs`
- `plans_master` 1 : N `subscriptions`

---

### 5.3 多対多

- `plans` と `products` は `plan_items` を介して多対多となる

---

## 6. テーブル定義

### 6.1 `users`

#### テーブル名

`users`

#### 用途

認証済みユーザーに紐づくアプリ側ユーザー情報を保持する。

#### 主キー

- `id uuid`

#### 外部キー

- `id -> auth.users.id`

#### 主要カラム

- `id`
- `display_name`
- `created_at`
- `updated_at`

#### 制約

- `id NOT NULL`
- `created_at NOT NULL`
- `updated_at NOT NULL`

#### 備考

- メールアドレスは Auth 側を正本とするため保持しない
- 有料 / 無料情報は保持しない

---

### 6.2 `family_members`

#### テーブル名

`family_members`

#### 用途

家族メンバー単位の情報を保持する。

#### 主キー

- `id uuid`

#### 外部キー

- `user_id -> users.id`

#### 主要カラム

- `id`
- `user_id`
- `role`
- `age_group`
- `notes`
- `created_at`
- `updated_at`

#### 制約

- `user_id NOT NULL`
- `role NOT NULL`
- `age_group NOT NULL`
- `created_at NOT NULL`
- `updated_at NOT NULL`

#### 備考

- `role` は続柄の表現に使う
- `age_group` は `adult / child` 程度の区分で運用する
- 家族人数は独立した保存値は持たず、`family_members` の登録件数によって表現する
- これにより、家族構成の実データを正として扱い、人数とメンバー情報の不整合を防ぐ

---

### 6.3 `member_allergens`

#### テーブル名

`member_allergens`

#### 用途

家族メンバーごとのアレルゲン情報を保持する。

#### 主キー

- `id uuid`

#### 外部キー

- `family_member_id -> family_members.id`

#### 主要カラム

- `id`
- `family_member_id`
- `allergen_name`
- `created_at`
- `updated_at`

#### 制約

- `family_member_id NOT NULL`
- `allergen_name NOT NULL`
- `created_at NOT NULL`
- `updated_at NOT NULL`
- `UNIQUE (family_member_id, allergen_name)`

#### 備考

- MVPではアレルゲンマスタを分割せず、文字列で保持する

---

### 6.4 `products`

#### テーブル名

`products`

#### 用途

提案対象となる固定商品マスタを保持する。

#### 主キー

- `id uuid`

#### 外部キー

- なし

#### 主要カラム

- `id`
- `name`
- `category`
- `product_type`
- `is_free_from_28`
- `price`
- `purchase_url`
- `shelf_life_months`
- `note`
- `is_active`
- `created_at`
- `updated_at`

#### 制約

- `name NOT NULL`
- `category NOT NULL`
- `product_type NOT NULL`
- `price >= 0`
- `shelf_life_months > 0`
- `created_at NOT NULL`
- `updated_at NOT NULL`

#### 備考

- `product_type` は `emergency_food / daily_item` を想定する
- `category` は `主食 / おかず / おやつ / 飲料` などを想定する
- `is_active` により表示対象のON/OFFを管理できる

---

### 6.5 `plans`

#### テーブル名

`plans`

#### 用途

保存済みの備えプラン本体を保持する。

#### 主キー

- `id uuid`

#### 外部キー

- `user_id -> users.id`

#### 主要カラム

- `id`
- `user_id`
- `title`
- `family_member_count`
- `days`
- `priority_policy`
- `include_daily_items`
- `total_estimated_cost`
- `ai_comment`
- `created_at`
- `updated_at`

#### 制約

- `user_id NOT NULL`
- `title NOT NULL`
- `family_member_count NOT NULL`
- `family_member_count > 0`
- `days NOT NULL`
- `days > 0`
- `total_estimated_cost >= 0`
- `created_at NOT NULL`
- `updated_at NOT NULL`

#### 備考

- 保存済みプランのみを保持する
- 生成途中の一時プランは保持しない
- 備えプラン編集機能はMVP対象外とする
- `family_member_count` は備えプラン作成時点の家族人数を保持する
- `total_estimated_cost` は備えプラン作成時点の初期費用を保持する
- 年間維持コストは保持せず、保存済み備えプランのうち `updated_at` が最新の1件を算出元として、表示時に動的計算する
- 保存件数制御は `subscriptions` と `plans_master` を参照してアプリ側で判定する

---

### 6.6 `plan_items`

#### テーブル名

`plan_items`

#### 用途

備えプランに含まれる商品候補一覧を保持する。

#### 主キー

- `id uuid`

#### 外部キー

- `plan_id -> plans.id`
- `product_id -> products.id`

#### 主要カラム

- `id`
- `plan_id`
- `product_id`
- `quantity`
- `priority`
- `purpose_note`
- `created_at`
- `updated_at`

#### 制約

- `plan_id NOT NULL`
- `product_id NOT NULL`
- `quantity NOT NULL`
- `quantity > 0`
- `created_at NOT NULL`
- `updated_at NOT NULL`
- `UNIQUE (plan_id, product_id)`

#### 備考

- 同一プラン内で同一商品は重複登録しない前提とする
- `priority` は `high / medium / low` などを想定する

---

### 6.7 `stock_items`

#### テーブル名

`stock_items`

#### 用途

ユーザーが実際に購入・保有している備蓄商品を保持する。

#### 主キー

- `id uuid`

#### 外部キー

- `user_id -> users.id`

#### 主要カラム

- `id`
- `user_id`
- `product_name`
- `quantity`
- `purchased_at`
- `expires_at`
- `unit_price`
- `notified_30days_at`
- `created_at`
- `updated_at`

#### 制約

- `user_id NOT NULL`
- `product_name NOT NULL`
- `quantity NOT NULL`
- `quantity > 0`
- `unit_price >= 0`
- `purchased_at NOT NULL`
- `expires_at NOT NULL`
- `expires_at > purchased_at`
- `created_at NOT NULL`
- `updated_at NOT NULL`

#### 備考

- `products` とは独立して保持する
- 実際の購入商品を自由に登録できるようにするため、商品名を直接保持する
- `purchased_at` はユーザー入力項目とはせず、備蓄登録日時を購入日として自動保存する
- `notified_30days_at` は30日前通知済み判定に使用する
- 商品マスタ価格とは別に、実際の購入単価を保持する
- 備蓄商品編集機能はMVP対象外とする

---

### 6.8 `notification_logs`

#### テーブル名

`notification_logs`

#### 用途

通知送信履歴を保持する。

#### 主キー

- `id uuid`

#### 外部キー

- `user_id -> users.id`
- `stock_item_id -> stock_items.id`

#### 主要カラム

- `id`
- `user_id`
- `stock_item_id`
- `notification_type`
- `sent_at`
- `created_at`
- `updated_at`

#### 制約

- `user_id NOT NULL`
- `stock_item_id NOT NULL`
- `notification_type NOT NULL`
- `sent_at NOT NULL`
- `created_at NOT NULL`
- `updated_at NOT NULL`
- `UNIQUE (stock_item_id, notification_type)`

#### 備考

- `notification_type` は MVP では `expiry_30days` を想定する
- 同日に1通へまとめる仕様自体は、DBではなくバッチ処理で実現する

---

### 6.9 `plans_master`

#### テーブル名

`plans_master`

#### 用途

無料 / 有料プランの定義を保持する。

#### 主キー

- `id uuid`

#### 外部キー

- なし

#### 主要カラム

- `id`
- `plan_code`
- `plan_name`
- `max_saved_plans`
- `is_active`
- `created_at`
- `updated_at`

#### 制約

- `plan_code NOT NULL`
- `plan_code UNIQUE`
- `plan_name NOT NULL`
- `max_saved_plans NOT NULL`
- `max_saved_plans > 0`
- `is_active NOT NULL`
- `created_at NOT NULL`
- `updated_at NOT NULL`

#### 備考

- 今回のMVPでは保存件数制御のみを持つ
- 想定データ例
  - `free / 無料プラン / 1`
  - `premium / 有料プラン / 999`

---

### 6.10 `subscriptions`

#### テーブル名

`subscriptions`

#### 用途

各ユーザーが現在どのプランを利用中かを保持する。

#### 主キー

- `id uuid`

#### 外部キー

- `user_id -> users.id`
- `plan_id -> plans_master.id`

#### 主要カラム

- `id`
- `user_id`
- `plan_id`
- `stripe_customer_id`
- `stripe_subscription_id`
- `status`
- `current_period_end`
- `created_at`
- `updated_at`

#### 制約

- `user_id NOT NULL`
- `user_id UNIQUE`
- `plan_id NOT NULL`
- `status NOT NULL`
- `created_at NOT NULL`
- `updated_at NOT NULL`

#### 備考

- 無料ユーザーも1レコード持たせる
- 無料ユーザーは `plan_id = free`
- 有料ユーザーは `plan_id = premium`
- `status` は `active / canceled / past_due` などを想定する
- 有料機能制御は `subscriptions.plan_id` から `plans_master.max_saved_plans` を参照して行う

---

## 7. 制約設計

### 7.1 NOT NULL

原則として以下は NOT NULL とする。

- すべての主キー
- すべての外部キー
- `created_at`
- `updated_at`
- `plans.title`
- `plans.family_member_count`
- `plans.days`
- `plan_items.quantity`
- `products.name`
- `products.category`
- `products.product_type`
- `stock_items.product_name`
- `stock_items.quantity`
- `stock_items.purchased_at`
- `stock_items.expires_at`
- `plans_master.plan_code`
- `plans_master.plan_name`
- `plans_master.max_saved_plans`
- `subscriptions.user_id`
- `subscriptions.plan_id`
- `subscriptions.status`

---

### 7.2 UNIQUE

以下は重複禁止とする。

- `member_allergens (family_member_id, allergen_name)`
- `plan_items (plan_id, product_id)`
- `notification_logs (stock_item_id, notification_type)`
- `plans_master.plan_code`
- `subscriptions.user_id`

---

### 7.3 CHECK

以下のチェック制約を設定する。

- `family_member_count > 0`
- `days > 0`
- `quantity > 0`
- `price >= 0`
- `unit_price >= 0`
- `total_estimated_cost >= 0`
- `expires_at > purchased_at`
- `max_saved_plans > 0`

必要に応じて、実装時に以下の列挙制約も検討する。

- `products.product_type`
- `plan_items.priority`
- `subscriptions.status`

ただし、MVP段階ではアプリ側のバリデーションで先に制御してもよい。

---

## 8. インデックス設計

以下の検索・参照効率を考慮し、インデックスを設定する。

- `family_members.user_id`
- `member_allergens.family_member_id`
- `plans.user_id`
- `plan_items.plan_id`
- `plan_items.product_id`
- `stock_items.user_id`
- `stock_items (user_id, expires_at)`
- `stock_items (expires_at)`
- `notification_logs.user_id`
- `notification_logs.stock_item_id`
- `subscriptions.user_id`
- `subscriptions.plan_id`
- `plans_master.plan_code`

通知対象抽出や期限順表示を考慮し、`stock_items.expires_at` 系のインデックスは優先度が高い。

---

## 9. RLS設計方針

### 9.1 基本方針

本アプリでは、ユーザー所有データを他ユーザーから完全に分離するため、Supabase の RLS を利用する。

所有者ベースのデータアクセス制御を基本とし、本人が所有するデータのみ操作可能とする。

---

### 9.2 RLS適用対象

以下のテーブルにRLSを適用する。

- `users`
- `family_members`
- `member_allergens`
- `plans`
- `plan_items`
- `stock_items`
- `notification_logs`
- `subscriptions`

---

### 9.3 マスタ系テーブルの扱い

以下のテーブルは、認証済みユーザー全員が参照可能なマスタとして扱う。

- `products`
- `plans_master`

これらは一般ユーザーの `INSERT / UPDATE / DELETE` を許可しない。

---

### 9.4 テーブル別RLS方針

#### `users`

- 本人のみ `SELECT / INSERT / UPDATE` 可
- 条件: `id = auth.uid()`

#### `family_members`

- 本人のみ `SELECT / INSERT / UPDATE / DELETE` 可
- 条件: `user_id = auth.uid()`

#### `member_allergens`

- `family_members` をたどって本人所有を判定する
- 本人が所有するメンバー配下のみ操作可

#### `plans`

- 本人のみ `SELECT / INSERT / UPDATE / DELETE` 可
- 条件: `user_id = auth.uid()`

#### `plan_items`

- 親の `plans.user_id = auth.uid()` であるもののみ操作可

#### `stock_items`

- 本人のみ `SELECT / INSERT / UPDATE / DELETE` 可
- 条件: `user_id = auth.uid()`

#### `notification_logs`

- 本人の通知履歴のみ `SELECT` 可
- 通知バッチからの `INSERT` は server role / service role で行う

#### `subscriptions`

- 本人のみ `SELECT` 可
- 更新は決済Webhookなどサーバー側主体で行うことを想定する

#### `products`

- 認証ユーザー全員が `SELECT` 可
- 一般ユーザーの更新は不可

#### `plans_master`

- 認証ユーザー全員が `SELECT` 可
- 一般ユーザーの更新は不可

---

## 10. 通知設計上の扱い

### 10.1 通知対象

通知対象は、賞味期限30日前となった `stock_items` とする。

---

### 10.2 重複通知防止

各備蓄商品に対する30日前通知は1回のみとするため、以下の2つで重複通知を防止する。

- `stock_items.notified_30days_at`
- `notification_logs` の `UNIQUE (stock_item_id, notification_type)`

---

### 10.3 まとめ送信

同日に通知対象となった商品は、ユーザー単位で1通のメールにまとめて送信する。

この仕様はDBテーブルではなく、通知バッチ処理で実現する。

そのため、MVPでは `notification_batches` のような追加テーブルは持たない。

通知メールは、期限が近い商品を知らせることを主目的とし、必要に応じてユーザーがダッシュボードまたは備蓄一覧画面で備え状況を確認できる前提とする。

---

## 11. 有料機能制御設計

### 11.1 基本方針

今回のMVPにおける有料機能差分は、保存済み備えプラン件数の制限解除のみとする。

- 無料プラン: 保存済み備えプラン 1件まで
- 有料プラン: 複数件保存可能

---

### 11.2 管理方法

プラン定義は `plans_master` で管理し、ユーザーの現在契約中プランは `subscriptions` で管理する。

- `plans_master.max_saved_plans`
- `subscriptions.plan_id`

を参照して、保存可否をアプリ側で判定する。

---

### 11.3 判定方針

プラン保存時に以下を行う。

1. ユーザーの `subscriptions` を取得する
2. 紐づく `plans_master.max_saved_plans` を取得する
3. ユーザーの現在保存済み `plans` 件数を数える
4. 上限内であれば保存可、超過していれば保存不可とする

---

### 11.4 コスト算出値の扱い

本システムでは、コスト関連の表示値として以下を扱う。

- 初期費用
- 年間維持コスト
- 備蓄コスト目安

これらのうち、DBに保存する値と、表示時に算出する派生値を明確に分ける。

#### 初期費用

初期費用は、保存済み備えプランに含まれる各商品の単価と数量をもとに算出する。

算出式：

`初期費用 = Σ（商品単価 × 数量）`

MVPでは、保存済み備えプランの作成時点での費用把握を優先するため、`plans.total_estimated_cost` に保存する。

#### 年間維持コスト

年間維持コストは、保存済み備えプランのうち `updated_at` が最も新しい1件を算出元として、当該プランに含まれる各商品の単価、数量、賞味期限（月）をもとに算出する。

算出式：

`年間維持コスト = Σ（商品単価 × 数量 × 12 ÷ 賞味期限（月））`

補足：

- 算出元とする備えプランは、対象ユーザーの保存済み備えプランのうち `updated_at` が最新の1件とする
- 商品単価は `products.price` を使用する
- 数量は `plan_items.quantity` を使用する
- 賞味期限（月）は `products.shelf_life_months` を使用する
- 小数点を含む場合は、表示時に四捨五入する
- 年間維持コストは保存値ではなく、表示時に算出する派生値として扱う
- 複数の保存済み備えプランが存在する場合でも、年間維持コスト表示には最新更新プランのみを使用する

この方針により、複数プラン保存に対応しつつ、年間維持コストの算出元を明確にした状態で表示できるようにする。

#### 備蓄コスト目安

備蓄コスト目安は、備蓄一覧に登録された各商品の単価と数量をもとに算出する。

算出式：

`備蓄コスト目安 = Σ（単価 × 数量）`

補足：

- 単価は `stock_items.unit_price` を使用する
- 数量は `stock_items.quantity` を使用する
- 備蓄コスト目安は保存値ではなく、表示時に算出する派生値として扱う

#### 保存値と派生値の整理

MVPにおけるコスト関連項目の扱いは以下の通りとする。

- `plans.total_estimated_cost`
  - 初期費用の保存値として保持する
- 年間維持コスト
  - 保存済み備えプランのうち最新の1件を算出元とし、`products.price`、`plan_items.quantity`、`products.shelf_life_months` をもとに表示時に算出する
- 備蓄コスト目安
  - `stock_items.unit_price`、`stock_items.quantity` をもとに表示時に算出する

過剰な派生値保存を避けるため、年間維持コストおよび備蓄コスト目安はDBには保持せず、アプリケーション側で計算する。

---

## 12. ER図作成方針

ER図は draw.io で作成し、以下を中心に記載する。

- テーブル名
- 主キー
- 外部キー
- 主要カラム
- リレーション

ER図には全制約やRLSの詳細は載せず、全体構造の把握に必要な情報に絞る。

詳細な制約やRLS方針は本設計書本文を正本とする。

---

## 13. MVPで省略するもの

### 13.1 省略するテーブル

以下はMVPでは採用しない。

- `payments`
- `allergens_master`
- `product_categories`
- `notification_batches`
- `ai_usage_logs`

---

### 13.2 省略するカラム

以下のような項目は、MVPでは保持しない。

#### `users`

- `email`
- `plan_type`

#### `products`

- `image_url`
- `ingredient_details`
- `brand`
- `jan_code`

#### `plans`

- `version_no`
- `status`
- `generation_prompt`
- 年間維持コストの保存用カラム

#### `stock_items`

- `product_id`
- `storage_location`
- `opened_at`
- `consumed_at`
- `lot_no`

#### `notification_logs`

- `retry_count`
- `error_reason`
- `provider_message_id`

---

### 13.3 省略する機能

以下はMVPでは対象外とする。

- 備えプラン編集
- 備蓄商品編集
- 見直し専用画面

---

## 14. 最終結論

本システムでは、認証を Supabase Auth で管理し、アプリ側の業務データを `users` 以下のテーブルで管理する。

家族情報、アレルギー情報、商品マスタ、保存済み備えプラン、備蓄商品、通知履歴を分離して保持し、所有者ベースのRLSにより他ユーザーのデータにアクセスできないようにする。

有料 / 無料の判定は `subscriptions` と `plans_master` によって行い、今回のMVPでは保存済み備えプラン件数の上限のみを制御対象とする。

また、通知は `stock_items.notified_30days_at` と `notification_logs` により、各備蓄商品に対する30日前1回通知を担保し、同日対象商品のまとめ送信はバッチ処理で実現する。

MVPでは過剰設計を避け、固定商品マスタ前提、物理削除前提、最小限の契約管理構成を採用し、備えプラン編集、備蓄商品編集、見直し専用画面は対象外として、3週間の開発期間で実装可能な現実的なDB設計とする。
