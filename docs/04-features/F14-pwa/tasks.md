# Tasks — F14 PWA e instalación

## Antes de empezar

- [ ] Leer `AGENTS.md` y `spec.md`.
- [ ] Comprobar dependencias: F10, F13.
- [ ] Comprobar Definition of Ready.
- [ ] Proponer plan y esperar confirmación.

## Implementación

- [ ] manifest.webmanifest
- [ ] Iconos 192/512/maskable
- [ ] apple-touch-icon
- [ ] theme-color
- [ ] display standalone
- [ ] InstallAppRow
- [ ] Detección de beforeinstallprompt
- [ ] Decisión sobre service worker

## Criterios de aceptación

- [ ] AC-01: Manifest válido.
- [ ] AC-02: Iconos existen y son correctos.
- [ ] AC-03: Android ofrece instalar.
- [ ] AC-04: La app instalada abre en /circles.
- [ ] AC-05: Perfil explica cómo instalar.
- [ ] AC-06: No se promete offline.

## Verificación

- [ ] `Lighthouse`
- [ ] `Chrome DevTools > Application > Manifest`

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [ ] `handoff.md` completo.
- [ ] Tablero actualizado.
- [ ] Bitácora y cobertura actualizadas.
- [ ] Commit propuesto (sin ejecutar).
