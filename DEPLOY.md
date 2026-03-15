# Deploy — Innexar Portal (Next.js)

## Projeto
- **Nome:** innexar-portal
- **Repositório:** https://github.com/innexar-plat/innexar-portal
- **Branch:** main
- **Server Coolify:** projetos-br (VM 102 · 10.10.10.102)
- **UUID da app:** _(preencher após criar no Coolify)_

## Domínio
- App: `https://portal.innexar.com.br`
- API consumida: `https://api.innexar.com.br`

## Runtime
- Build pack: `dockerfile`
- Dockerfile: `Dockerfile`
- Porta interna: `3000`
- Tipo de build: **standalone** (`output: "standalone"` em `next.config.ts`)
- Start command:

```bash
node server.js
```

## Build Args (embutidos no build — obrigatórios)

```env
NEXT_PUBLIC_USE_WORKSPACE_API=true
NEXT_PUBLIC_WORKSPACE_API_URL=https://api.innexar.com.br
NEXT_PUBLIC_SITE_URL=https://innexar.com.br
NEXT_PUBLIC_MP_PUBLIC_KEY=<chave pública MercadoPago>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

> `NEXT_PUBLIC_*` são embutidos no bundle no momento do build. Qualquer alteração exige rebuild da imagem.

## Variáveis de runtime

```env
NODE_ENV=production
PORT=3000
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_USE_WORKSPACE_API=true
NEXT_PUBLIC_WORKSPACE_API_URL=https://api.innexar.com.br
NEXT_PUBLIC_SITE_URL=https://innexar.com.br
NEXT_PUBLIC_MP_PUBLIC_KEY=<chave pública MercadoPago>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

## Operação

Não requer migrations ou seed. Dependência de runtime: `api.innexar.com.br` disponível.

## Smoke Test

```bash
# Página de login
curl -L https://portal.innexar.com.br -o /dev/null -w "%{http_code}"
# Espera 200 ou redirect 307

# Assets estáticos (substituir o hash real)
curl -I https://portal.innexar.com.br/_next/static/chunks/main.js

# CORS check (do domínio do site)
curl -X OPTIONS https://api.innexar.com.br/auth/customer/login \
  -H "Origin: https://portal.innexar.com.br" -I
```

## Rollback

```bash
IMAGE_TAG=sha-<commit-anterior> docker compose up -d innexar-portal
```

## Riscos comuns

- `next start` usado por engano em build standalone (CMD correto é `node server.js`)
- `NEXT_PUBLIC_WORKSPACE_API_URL` apontando para URL errada no build → chamadas falhando no client
- Proxy apontando para container antigo após rebuild
- `NEXT_PUBLIC_MP_PUBLIC_KEY` vazio impede pagamentos no portal
