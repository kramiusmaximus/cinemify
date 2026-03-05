# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --no-audit --progress=false

FROM node:22-alpine AS build
WORKDIR /app
# package.json is needed for `npm run build`
COPY package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY tsconfig.json ./
COPY openapi.yaml ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY openapi.yaml ./
EXPOSE 8080
CMD ["node", "dist/index.js"]
