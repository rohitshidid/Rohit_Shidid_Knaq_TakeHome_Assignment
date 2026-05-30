# Knaq web — Next.js 16, built then served
FROM node:22-slim AS build
WORKDIR /app/web
COPY package.json package-lock.json ./
RUN npm ci
COPY . ./
RUN npm run build

FROM node:22-slim AS run
WORKDIR /app/web
ENV NODE_ENV=production
COPY --from=build /app/web/package.json ./package.json
COPY --from=build /app/web/node_modules ./node_modules
COPY --from=build /app/web/.next ./.next
COPY --from=build /app/web/public ./public
EXPOSE 3000
# Bind all interfaces so the host can reach it.
CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
