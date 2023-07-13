FROM node:18.16-alpine3.16

RUN apk add --no-cache tzdata

ENV TZ=Asia/Ho_Chi_Minh

WORKDIR /app

COPY package.json .

RUN yarn install

COPY . .

CMD yarn build && yarn migration:run && yarn start
