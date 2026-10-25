# ADR-0012: Privacidad y datos de imágenes

- Estado: aceptado
- Fecha: 2026-10-25

## Contexto

Memora almacena recuerdos personales. Las fotos pueden contener metadatos sensibles, especialmente coordenadas GPS. La privacidad no puede depender de ocultar botones: debe estar en el servidor, en el almacenamiento y en los logs.

## Decisión

- **No se persisten coordenadas GPS.** Se leen en memoria para geocodificar y se descartan.
- Se guarda solo `placeName` (texto legible) y, si aplica, `takenAt`.
- Se eliminan metadatos EXIF de originales y derivadas; la orientación se aplica antes.
- Bucket privado; las imágenes se sirven por la API con cookie y autorización por recurso.
- La preview de invitación solo muestra nombre del círculo e imagen genérica.
- Tokens de invitación hasheados; nunca se registran en claro.
- Logs sin PII, cookies, tokens ni rutas privadas.
- Las fotos y etiquetas de un miembro expulsado no se filtran a otros círculos.
- La eliminación de fotos borra también sus objetos y etiquetas.
- Los datos de demo son ficticios y las fotos tienen licencia.

## Alternativas

- Guardar GPS para mapas: descartado; no está en el producto y aumenta el riesgo.
- Bucket público con URLs opacas: descartado; una URL filtrada da acceso.
- Conservar EXIF “por si acaso”: descartado por privacidad.

## Consecuencias

- No se puede mostrar un mapa ni buscar por coordenadas en el MVP.
- La geocodificación es best-effort y puede dejar `placeName` vacío.
- La entrega de imágenes pasa por la API; si el rendimiento se vuelve crítico, se evaluarán URLs firmadas sin cambiar el contrato.
- La privacidad se verifica con tests negativos y revisión de logs.

## Referencias

- `AGENTS.md`
- `docs/03-architecture/data-model.md`
- `docs/03-architecture/uploads.md`
- `docs/03-architecture/api-contract.md`
- `docs/05-quality/security-checklist.md`
