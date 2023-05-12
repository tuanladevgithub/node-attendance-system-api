FROM node:18.16-alpine3.16

WORKDIR /app

COPY package.json .

RUN yarn install

COPY . .

RUN yarn build

CMD yarn migration:run && yarn start:dev
