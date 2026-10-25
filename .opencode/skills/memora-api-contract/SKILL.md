---
name: Memora API Contract
description: Contratos Zod, REST, errores, auth, paginación, subidas y descargas.
---

# Contrato de API de Memora

## Fuente de verdad

Los esquemas Zod viven en `packages/shared`. La API valida y la web infiere tipos. No dupliques DTOs.

## Reglas

- Autorización por recurso en cada endpoint.
- Errores uniformes: `{ code, message, details? }`.
- Códigos HTTP correctos: 400, 401, 403, 404, 409, 413, 415, 422, 429, 500.
- Paginación por cursor; nunca todas las fotos de golpe.
- `GET /api/invitations/:token` devuelve lo mínimo.
- No exponer `objectKey`, tokens ni datos de otros círculos.
- Descargas autenticadas.
- OpenAPI generado desde los esquemas.

## Subidas

- Multipart a la API.
- Validación por magic bytes, tamaño y píxeles.
- Idempotencia con `clientUploadId`.
- Variantes thumb/display/original.
- Sin GPS persistido; solo `placeName`.

## Referencias

- `docs/03-architecture/api-contract.md`
- `docs/03-architecture/auth.md`
- `docs/03-architecture/uploads.md`
- `docs/03-architecture/downloads.md`
