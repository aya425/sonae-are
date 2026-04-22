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
- 賞味期限30日前のメール通知
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
- `/plan/temp` 生成プラン確認
- `/plans/:id` 備えプラン詳細
- `/inventory` 備蓄品一覧
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

リポジトリをクローンした後、ルートディレクトリでコンテナをビルドして起動します。

```bash
git clone https://github.com/ms-engineer-bc26-02/sonae-are.git
cd sonae-are
docker compose build
docker compose up
```

起動後は、以下にアクセスするとローカル環境でアプリを利用できます。

```text
http://localhost:3000
```

---

## ディレクトリ構成

```text
sonae-are/
├── README.md
└── my-app/
    ├── app/
    ├── docs/
    ├── src/
    ├── public/
    ├── package.json
    └── README.md
```

- `README.md`: プロジェクト全体の説明
- `my-app/`: アプリ本体

---

## テスト

MVPでは、単体テストコードの実装に加えて、主要導線を中心とした手動テストを実施します。

重点確認する内容は以下です。

- 認証
- 家族情報登録
- AIによる備えプラン生成
- プラン保存
- 備蓄登録
- ダッシュボード表示
- 通知導線
- 有料プラン制御

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
