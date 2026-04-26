# そなえアレ

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![Upstash Redis](https://img.shields.io/badge/Upstash_Redis-00E9A3?style=flat-square&logo=redis&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=flat-square&logo=stripe&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat-square&logo=openai&logoColor=white)
![Resend](https://img.shields.io/badge/Resend-000000?style=flat-square&logo=resend&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=flat-square&logo=railway&logoColor=white)

食物アレルギー家庭向けの防災備蓄支援アプリ

- 本番環境: https://sonae-are-production.up.railway.app

---

## 概要

そなえアレは、**食物アレルギー家庭向けの防災備蓄支援アプリ**です。

家族情報やアレルギー情報をもとに、家族に合った「食べられる備え」を提案し、商品確認・購入導線・備蓄管理・期限確認まで一気通貫で支援することを目指しています。

食物アレルギーのある家庭では、一般的な非常食や配給食が家族に合わない可能性があり、災害時に「食べられるものがないかもしれない」という不安があります。

ただし本質的な課題は、不安そのものだけではなく、**家族ごとに異なるアレルギー条件に合わせて、何をどれだけ備えればよいか分からず、実際の備え行動につながりにくいこと**にあります。

---

## 開発体制・担当範囲

本アプリは、コーディングブートキャンプの最終課題としてチームで開発しました。  
私は主に、備蓄プラン確認画面、保存済みプラン一覧画面、備蓄品一覧画面、賞味期限通知機能の実装を担当しました。

### 担当範囲

- 画面設計書に沿って、提案された備蓄プランの商品確認画面を実装
- 保存済みプラン一覧画面を実装し、DBから取得したデータをカード形式で表示
- 備蓄確認画面を実装し、備蓄商品の一覧表示・登録・削除機能を実装
- 商品候補をAPIから取得し、フォーム上で選択できるように実装
- プラン作成画面に、入力項目の意味を補足する説明テキストを追加
- 保存済みプラン、備蓄品、決済関連のDB項目を確認・整備
- プラン保存後の画面遷移や、有料プラン変更時の認証エラーなど、画面操作時の不具合を修正
- Stripe決済後にサブスクリプション情報がDBへ保存されない不具合について、Stripe CLIを用いてWebhookのローカル検証を実施
- 賞味期限30日前通知のバッチAPIを実装し、対象データ取得、ユーザー単位でのメール送信、通知済み日時更新、通知ログ保存までを実装
- DockerでMailHogを導入し、ローカル環境でメール送信内容を確認できる環境を構築
- CRON_SECRETを用いて通知バッチAPIの認証保護を実装
- Postmanを使用して、通知APIの疎通、メール送信、DB更新の動作確認を実施
- 本番URLで主動線を確認し、デプロイ後の軽微な修正を実施

### 工夫した点・成果

- ユーザーが「備蓄プランを確認する、保存する、備蓄品として管理する」という流れを迷わず進められるよう、画面間の導線を意識して実装しました。
- 保存済みプランや備蓄品を確認しやすいように、カード形式のレイアウトを採用しました。
- DB接続後も画面が崩れないように、0件時の表示や一覧の折り返し表示を調整しました。
- 通知機能では、同じ備蓄品に対して重複通知が発生しないよう、通知済み日時の更新処理と通知ログ保存処理を実装しました。
- 同一ユーザーに複数の通知対象がある場合でもメールが複数通に分かれないよう、ユーザーごとに通知対象をまとめ、1通のメールとして送信できるようにしました。
- DockerでMailHogを導入し、ローカル環境でもメール送信内容を確認できる状態を整えました。
- Postmanを使用して、通知APIの疎通、メール送信、DB更新まで確認しました。
- 本番環境でも主要な導線を確認し、プラン作成から備蓄品管理、通知確認までの流れを検証しました。

---

## 特徴 / できること

そなえアレでは、提案だけで終わらず、以下の流れをつなげることを重視しています。

- 家族情報登録
- AIによる備えプラン提案
- 商品確認・購入導線
- 備えプラン保存
- 備蓄商品の登録・管理
- 賞味期限の確認
- 通知による見直し

---

## 主な機能

- ユーザー登録 / ログイン / ログアウト
- 家族情報・アレルギー情報の登録 / 編集
- AIによる備えプラン作成
- 防災食と日常転用品の出し分け表示
- 商品サイトへの外部リンク遷移
- 備えプランの保存 / 一覧 / 詳細 / 削除
- 備えプランの編集
- 備蓄商品の登録 / 一覧表示 / 削除
- 備蓄商品の編集
- 初期費用・年間維持コスト・備蓄コスト目安の表示
- 賞味期限30日前のメール通知（バッチ実行による）
- 通知メールから備蓄品一覧画面への導線
- 有料プラン決済と保存件数制御

---

## MVPスコープ

### 含まれるもの

- 家族条件に応じた備えプラン提案
- 商品購入導線
- 備えプラン保存
- 備蓄登録と期限管理
- コストの見える化
- 賞味期限通知
- 有料プランによる保存件数制御

### 含まれないもの

- 備え見直し専用画面
- ECサイト内での購入完結
- 価格・在庫のリアルタイム取得
- 商品情報の自動スクレイピング
- LINE通知 / ブラウザプッシュ通知
- 医療的な最終安全判定

### MVP外だが追加で実装した機能

- 備えプラン編集
- 備蓄商品編集

---

## 画面一覧

- `/` トップ画面
- `/signup` 会員登録画面
- `/login` ログイン画面
- `/home` ホーム
- `/family` 家族情報登録 / 編集
- `/plan/new` 備えプラン作成
- `/plans` 保存済みプラン一覧
- `/plans/temp` 生成プラン確認
- `/plans/:id` 備えプラン詳細
- `/stock-items` 備蓄品一覧
- `/billing` 料金プラン
- `/billing/success` 決済完了

---

## 利用フロー

1. トップ画面でサービス概要を確認
2. 会員登録 / ログイン
3. 家族情報・アレルギー情報を登録
4. AIで備えプランを作成
5. 候補商品を確認し、商品サイトで購入
6. 購入した商品を備蓄品一覧に登録
7. ホームで期限・費用・保存済みプランを確認
8. 賞味期限30日前の通知メールを受信
9. 通知メールから備蓄品一覧へ遷移して見直し

---

## セットアップ手順

### 1. リポジトリをクローン

```bash
git clone https://github.com/aya425/sonae-are.git
cd sonae-are
```

### 2. 環境変数の設定

本アプリは、外部サービス（Supabase / Stripe / OpenAI / Resend など）を利用しているため、
起動前に環境変数の設定が必要です。

#### ① .env を作成（ルート）

```bash
cp .env.example .env
```

#### ② `my-app/.env.local` を作成

```bash
touch my-app/.env.local
```

その後、ルートの .env.example を参考にして、必要な環境変数を手動で設定してください。

### 3. 必要な環境変数

最低限、以下の外部サービスのキーが必要です。

#### Supabase

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

#### Stripe

- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID_PREMIUM`
- `STRIPE_WEBHOOK_SECRET`

#### OpenAI

- `OPENAI_API_KEY`

#### メール（Resend）

- `RESEND_API_KEY`
- `MAIL_FROM` ← 通知メール送信に必須

#### 通知バッチ

- `CRON_SECRET` ← バッチAPI実行に必須

#### アプリ設定

- `NEXT_PUBLIC_APP_URL`

※ `MAIL_FROM` が未設定の場合、通知メールは送信されません  
※ `CRON_SECRET` が未設定の場合、通知バッチAPIは実行できません

### 4. Docker起動

```bash
docker compose build
docker compose up
```

### 5. アクセス

```bash
http://localhost:3000
```

### 補足

- .env / .env.local は Git に含めないでください
- 外部サービスの設定が不足している場合、一部機能（AI・決済・通知など）は動作しません
- Stripe Webhook はローカルでは stripe listen 等で別途設定が必要です

---

## ディレクトリ構成

```text
sonae-are/
├── README.md
├── docker-compose.yml
├── Dockerfile
├── docs/
└── my-app/
    ├── app/
    │   ├── (protected)/
    │   │   └── stock-items/
    │   └── api/
    ├── src/
    ├── public/
    └── package.json
```

---

## テスト

MVPでは、単体テストコードの実装に加えて、主要導線を中心とした手動テストを実施しました。

重点確認した内容は以下です。

### ■ 主動線（画面単位）

- 認証
- 家族情報登録
- AIによる備えプラン生成
- プラン保存
- 備蓄登録
- ダッシュボード表示
- 通知導線
- 有料プラン制御

### ■ API・ロジック

- 認証（未ログイン時のアクセス制御）
- 認可（他人データアクセス防止）
- 入力値バリデーション
- 正常系・異常系レスポンス（200 / 400 / 401 / 404）

### ■ セキュリティ確認

- XSS対策（危険なHTML描画の有無）
- SQL Injection対策（クエリの安全性）
- ログ出力確認（機密情報の非出力）
- RLS（DBレベルのアクセス制御）

---

## 補足 / 注意事項

- 商品購入はアプリ内で完結せず、外部商品サイトへの遷移で行います。
- AIは備えプラン提案と説明補助に利用し、最終的な安全判定は行いません。
- 商品情報やアレルゲン情報の最終確認は、公式情報をもとにユーザー自身で行う想定です。

---

## 今後の拡張予定

- 登録商品の拡充
- AIによるプラン生成速度の向上
- 他のユーザーの備えプランを参照できる機能
- 市町村での活用を見据えた展開

## 通知バッチについて

賞味期限30日前のメール通知は、内部バッチAPIとして実装されています。

- エンドポイント: `POST /api/batch/expire-notification`
- 認証: Bearer トークン（CRON_SECRET）
- 実行単位: 1日1回想定
- 対象: 賞味期限30日前の備蓄商品

### 実行方法（ローカル）

```bash
curl -X POST http://localhost:3000/api/batch/expire-notification \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```
