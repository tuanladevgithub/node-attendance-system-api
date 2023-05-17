FROM node:18.16-alpine3.16

WORKDIR /app

COPY package.json .

RUN yarn install

COPY . .

CMD yarn build && yarn migration:run && yarn start
