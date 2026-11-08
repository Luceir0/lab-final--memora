# Tasks — F43 Paquete de entrega y defensa

## Antes de empezar

- [x] Leer `AGENTS.md` y `spec.md`.
- [x] Comprobar dependencias: F41 y F42 `review` con la PR #62 mergeada (`5ff213e`); F39 y
      F40 con la excepción de dependencia autorizada el 2026-11-08 y registrada en el plan.
- [x] Comprobar Definition of Ready con la excepción documentada.
- [x] Proponer plan y esperar confirmación (G1 del 2026-11-08: merge de #62 autorizado,
      Marp, `npx lighthouse`, solo guion del vídeo y `/circles` como página autenticada).

## Implementación

- [x] Seed demo verificado (2 usuarios, 2 círculos, 2 álbumes, 6 fotos, 2 etiquetas,
      1 invitación, 4 actividades y 18 objetos en el bucket).
- [x] README final revisado como índice (sin cambios: ya describía el monorepo y los scripts).
- [x] ADRs (14) y OpenAPI (29 rutas) comprobados y enlazados desde el checklist.
- [x] Bitácora actualizada con la sesión S5.
- [x] Cobertura del temario actualizada con F40 y F43.
- [x] Informes: seguridad (F41) y rendimiento (F40).
- [x] Diapositivas en Marp (`slides.md`, 14 diapositivas).
- [x] Guion del vídeo (`video-script.md`); **grabación no ejecutada**.
- [ ] Ensayo cronometrado con dos navegadores: lo ejecuta el usuario.
- [x] Pasada automática de accesibilidad sobre el build (16 pasadas, 0 violaciones) y
      checklist manual preparada.

## Criterios de aceptación

- [x] AC-01: Checklist de entrega completo. **Documento cerrado**: cada ítem tiene evidencia y
      los **6 abiertos** (teclado/lector, Lighthouse-LCP, vídeo, ensayo con dos usuarios,
      Android físico y commit final) se declaran con su motivo.
- [x] AC-02: Demo con dos usuarios. Documento cerrado y flujo de API probado con Lucía y
      Mateo; el recorrido en navegador es el ensayo.
- [ ] AC-03: Vídeo de respaldo. **Solo guion**; la grabación la hace el usuario.
- [x] AC-04: Diapositivas.
- [x] AC-05: Mapa del temario con evidencias.
- [x] AC-06: Limitaciones explícitas (10 puntos en `defense.md`).
- [ ] AC-07: Ensayo cronometrado. **No ejecutado** por el agente.

## Verificación

- [x] Revisar checklist con evidencia real.
- [x] Demo verificada por API: login de los dos usuarios, negativos 401/403/404, subida,
      descarga, borrado y logout.
- [x] Lighthouse móvil en `/login` y `/circles` (cifras en el informe de rendimiento).
- [ ] Ensayo de 15–20 min en navegador (usuario).

## Cierre

- [ ] Revisión independiente.
- [ ] Aceptación del usuario.
- [x] `handoff.md` completo.
- [x] Tablero actualizado.
- [x] Bitácora y cobertura actualizadas.
- [x] Commit propuesto (sin ejecutar).
