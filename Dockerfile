FROM node:20

WORKDIR /app

# my-appのpackage.jsonをコピー
COPY my-app/package*.json ./

RUN npm install

# アプリ全体コピー
COPY my-app .

EXPOSE 3000

CMD ["npm", "run", "dev"]