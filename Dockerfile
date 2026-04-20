FROM node:20

WORKDIR /app

COPY my-app/package*.json ./

RUN npm install

COPY my-app .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]