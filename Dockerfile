# Dockerfile para Innexar Portal
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --no-audit --fund=false

COPY . .

ARG NEXT_PUBLIC_USE_WORKSPACE_API
ARG NEXT_PUBLIC_WORKSPACE_API_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_MP_PUBLIC_KEY
ENV NEXT_PUBLIC_USE_WORKSPACE_API=$NEXT_PUBLIC_USE_WORKSPACE_API
ENV NEXT_PUBLIC_WORKSPACE_API_URL=$NEXT_PUBLIC_WORKSPACE_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_MP_PUBLIC_KEY=$NEXT_PUBLIC_MP_PUBLIC_KEY

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

CMD ["node", "server.js"]
