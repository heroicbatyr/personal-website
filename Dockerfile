FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY api ./api
COPY database ./database
COPY services ./services
COPY public ./public
COPY server.js ./

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server.js"]
