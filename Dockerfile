FROM node:22-alpine AS site-builder

WORKDIR /build/redesign

COPY redesign/package*.json ./
RUN npm ci

COPY redesign ./
COPY finance-service/src/main/resources/fmp-supported-tickers.json /build/finance-service/src/main/resources/fmp-supported-tickers.json
RUN npm run build

FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY api ./api
COPY database ./database
COPY services ./services
COPY --from=site-builder /build/redesign/dist ./public
COPY server.js ./

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server.js"]
