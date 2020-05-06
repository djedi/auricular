FROM node:10-alpine

WORKDIR /app

COPY ./ui/package.json .
COPY ./ui .

RUN \
    npm install -g yarn \
    && yarn global add aurelia-cli \
    && yarn global add http-server \
    && yarn
    && npm rebuild node-sass
    && npm run build

EXPOSE 8082

CMD [ "http-server", "dist" ]
