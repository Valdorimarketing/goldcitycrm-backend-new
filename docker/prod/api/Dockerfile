FROM node:18-alpine3.18 AS base

RUN npm install -g npm@10.2.0

#############################################################################################
FROM base AS deps

ARG TZ='Europe/Istanbul'
ENV TZ ${TZ}
RUN apk upgrade --update \
    && apk add -U tzdata \
    && cp /usr/share/zoneinfo/${TZ} /etc/localtime \
    && echo "${TZ}" > /etc/timezone \
    && apk del tzdata \
    && rm -rf \
    /var/cache/apk/*

#############################################################################################
FROM deps AS nestjs

COPY . /build
WORKDIR /build
# Install all dependencies for building
RUN npm install
# Now build the application
RUN npm run build

#############################################################################################
FROM deps AS prod

WORKDIR /app
ENV NODE_ENV production
# Copy package files and install production dependencies only
COPY --from=nestjs /build/package*.json ./
RUN npm ci --omit=dev
# Copy built application
COPY --from=nestjs /build/dist ./dist
# Copy public folder if it exists
COPY --from=nestjs /build/public ./public
VOLUME /app
EXPOSE 3000
ENV HOST=0.0.0.0
ENV PORT=3000
RUN export TZ=${TZ}

ENV APP_IS_COMMAND="0"

CMD ["node", "dist/main"]

#############################################################################################
FROM prod