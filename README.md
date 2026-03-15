# Innexar Portal

Portal web da Innexar.

## Desenvolvimento

```bash
npm ci
npm run dev
```

## Producao

```bash
npm run build
npm run start
```

## Docker

```bash
docker compose up -d --build
```

## CI

Este app inclui workflows proprios em `.github/workflows` para uso no repositorio individual:

- `ci.yml`: lint e build
- `docker.yml`: build e publish da imagem no GHCR