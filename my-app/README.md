## 開発環境の起動方法（Docker）

### 1. 環境変数ファイルを作成

```bash
cp .env.example .env.local
```

### 2. Dockerコンテナを起動

```
docker compose build
docker compose up
```
※ コマンドはリポジトリのルートディレクトリで実行してください

### 3. ブラウザでアクセス

http://localhost:3000

