FROM node:10-alpine

RUN npm install -g yarn 
RUN yarn global add aurelia-cli 
RUN yarn global add http-server

WORKDIR /app

COPY ./ui/package.json .
RUN yarn
RUN npm rebuild node-sass

COPY ./ui .
RUN npm run build

EXPOSE 8082

CMD [ "http-server", "dist" ]
