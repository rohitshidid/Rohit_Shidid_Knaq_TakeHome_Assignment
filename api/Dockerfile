# Knaq API — Node + tsx + Prisma 7
FROM node:22-slim
WORKDIR /app/api

# Prisma engine + pg need openssl
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# Install deps first (skip postinstall — the schema isn't copied yet)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# App source, then generate the Prisma client
COPY . ./
RUN npx prisma generate

EXPOSE 8000

# On boot: apply migrations, seed, ingest, then serve. All three are idempotent,
# so restarts are safe. Reads the messages from the mounted /app/data volume.
CMD ["sh", "-c", "npx prisma migrate deploy && npm run seed && npm run ingest && npm start"]
