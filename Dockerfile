# Chainwalkers - Elastos Mainchain

FROM node:12-alpine@sha256:1dd4309479f031295f3dfb61cf3afc3efeb1a991b012e105d1a95efc038b72f6
LABEL maintainer="clarenceliu"

# add bash
RUN apk update
RUN apk add --no-cache curl
RUN apk add --no-cache bash
RUN apk add --no-cache jq

WORKDIR /chainwalkers_parser

COPY package.json .

RUN npm install --only=production

COPY dist ./dist
COPY temp ./temp
COPY .env .
COPY get_height.sh .
COPY parse_blocks.sh .
