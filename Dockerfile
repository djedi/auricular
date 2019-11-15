FROM jrottenberg/ffmpeg:4.1-alpine
FROM node:10-alpine

COPY --from=0 / /

RUN \
    echo "---- INSTALL BUILD DEPENDENCIES ----" \
    && apk add --no-cache --update --upgrade --virtual=build-dependencies \
    autoconf \
    automake \
    boost-dev \
    build-base \
    gcc \
    lame-dev \
    libogg-dev \
    yasm \
    nasm \
    yasm-dev \
    zlib-dev \
    freetype-dev \
    libogg-dev \
    libtheora-dev \
    libvorbis-dev \
    openssl-dev \
    opus-dev \
    git \
    wget && \
    echo "---- COMPILE SANDREAS MP4V2 ----" \
    && cd /tmp/ \
    && wget https://github.com/sandreas/mp4v2/archive/master.zip \
    && unzip master.zip \
    && rm master.zip \
    && cd mp4v2-master \
    && ./configure && make -j4 && make install && make distclean && rm -rf /tmp/* 

WORKDIR /usr/src/app

COPY ./package.json .
RUN npm install -g yarn nodemon aurelia-cli
RUN yarn

EXPOSE 8082

CMD [ "node", "api.js" ]