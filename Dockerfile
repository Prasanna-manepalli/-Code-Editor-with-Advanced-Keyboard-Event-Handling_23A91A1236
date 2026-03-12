# Simple Node-based dev server for Vite app
FROM node:20-alpine

WORKDIR /app

# Needed for docker-compose healthcheck (curl).
RUN apk add --no-cache curl

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
