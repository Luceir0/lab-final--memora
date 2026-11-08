# Checklist de entrega

> **Cierre de F43 · 2026-11-08.** Solo se marca lo **probado**. Lo que no se ha podido
> comprobar queda abierto con su motivo; nada se marca por suposición.
> Evidencia de referencia: [demo.md](demo.md), [defense.md](defense.md),
> [deployment.md](deployment.md), [security-report.md](../05-quality/security-report.md) y
> [performance-report.md](../05-quality/performance-report.md).

## Producto

- [x] Registro, login, logout y sesión persistente.
      _Login real `200` y `GET /api/me` `200` con `lucia@memora.test` y `mateo@memora.test`;
      logout `204` y `/api/me` `401` después; `401` sin sesión. Registro cubierto por tests de
      `apps/web` y `apps/api`, no re-probado a mano en esta sesión._
- [x] Círculos, álbumes e invitaciones.
      _`GET /api/circles` devuelve «Familia Ferrer» y «Danza» con settings; alta de álbum `201`
      y borrado `204`; invitación pendiente en el seed y correo verificado en Mailpit (F42)._
- [x] Subida desde móvil y escritorio.
      _Pipeline real: multipart `201` → `original` `200` → borrado `204` → `404`. La subida
      desde cámara/galería en móvil físico no se ha probado; la cola web está cubierta por
      tests de F26/F27._
- [x] Galería, visor, metadatos y etiquetas.
      _Datos del seed con 6 fotos y 2 etiquetas; axe sin violaciones en `/circles`; visor y
      etiquetado cubiertos por la suite web. Recorrido manual en el ensayo (pendiente)._
- [x] Descarga individual, selección y álbum.
      _`original` con sesión `200`, sin sesión `401`, miembro sin permiso `403`; el ZIP tiene
      job, límites y expiración con tests. No se ha generado un ZIP nuevo en esta sesión._
- [x] Perfil, tema y permisos.
      _Tema claro/oscuro medido con axe y `prefers-color-scheme`; permisos de círculo
      comprobados en servidor (`403` al crear álbum en «Danza» como member)._
- [x] Subidas globales.
      _Cola global con barra, panel y anunciador; 141 tests en `features/uploads`. Sin prueba
      manual en esta sesión._
      _Actividad (F35) queda fuera de la entrega por decisión del 2026-11-07._
- [x] Ayuda, FAQ y Privacidad.
      _`/help` y `/privacy` `200` desde el build; 0 violaciones de axe a 375 y 1440, claro y
      oscuro._
- [x] PWA instalable.
      _Manifiesto, iconos `any`/`maskable` y `Page.getInstallabilityErrors: []` medidos en F14;
      sin service worker por ADR-0013. No se ha reinstalado en esta sesión._

## Calidad

- [x] Tests unitarios, API, componentes y **E2E**.
      _Vitest, RTL y MSW en verde (cifras en el handoff). **E2E: no existe**; F37/F38 quedan
      fuera por decisión del 2026-11-08 y se declaran en las limitaciones._
- [x] Casos negativos de acceso.
      _Login sin `Origin` `403`; contraseña incorrecta `401`; mutación sin CSRF `403`; círculo
      ajeno `404`; member borrando foto ajena `403`; member creando álbum sin permiso `403`;
      descarga sin sesión `401`._
- [x] axe sin errores críticos.
      _**16 pasadas, 0 violaciones** sobre el build de producción: `/login`, `/help`, `/privacy`
      y `/circles` a 375 y 1440 px, claro y oscuro (axe-core 4.14 vía CDP)._
- [ ] Teclado y lector de pantalla.
      _No verificado por el agente: requiere interacción humana. Guion y checklist en
      [demo.md](demo.md) y [a11y-checklist.md](../05-quality/a11y-checklist.md); se cierra en el
      ensayo con NVDA._
- [x] Responsive 320–1440.
      _Medido a 375 y 1440 en esta sesión; 320 px y los anchos intermedios están cubiertos por
      las auditorías de F11–F32 y por tests de layout, no re-medidos hoy._
- [x] Claro y oscuro.
      _Las 16 pasadas de axe se hicieron en ambos temas con `prefers-color-scheme` emulado._
- [x] Sin errores de consola/hidratación.
      _Consola limpia (0 errores y 0 avisos) en `/login` y `/circles` sobre el build; sin avisos
      de hidratación._
- [ ] Lighthouse móvil dentro del presupuesto.
      _**Parcial**: Performance 93/91, Accessibility 100/100 y Best Practices 100/100 dentro de
      presupuesto; **LCP 3,2 s y 3,5 s frente a 2,5 s**. Causa y plan en
      [performance-report.md](../05-quality/performance-report.md)._
- [ ] LCP ≤ 2,5 s, CLS ≤ 0,1, INP ≤ 200 ms.
      _CLS 0 y 0,004 (**cumple**); **LCP no cumple** en simulación (observado 174/351 ms);
      **INP no es medible en laboratorio** — se usa TBT 20 ms como proxy y se declara._
- [x] Seguridad revisada.
      _[security-report.md](../05-quality/security-report.md): sin bloqueantes ni mayores
      abiertos; H-01 (2 moderadas de Swagger UI, dev-only) y H-05 (rate limit en memoria)
      abiertas y aceptadas._
- [x] Privacidad EXIF/GPS verificada.
      _GPS solo en memoria para `placeName`; no se persiste ni se registra; metadatos
      eliminados del original y de las derivadas; comprobado en código y tests de F25/F41._

## Documentación

- [x] README con instalación y scripts.
- [x] ADRs. _14 ADRs en `docs/03-architecture/adr/`._
- [x] OpenAPI. _`GET /api/openapi.json` `200`, **29 rutas**; Swagger UI solo en desarrollo._
- [x] Diagrama de entidades. _[data-model.md](../03-architecture/data-model.md)._
- [x] Bitácora de IA. _[ai-log.md](../06-process/ai-log.md)._
- [x] Mapa del temario con evidencias. _[coverage-map.md](../07-curriculum/coverage-map.md)._
- [x] Limitaciones. _Sección explícita en [defense.md](defense.md) (AC-06)._
- [x] Guía de demo y defensa. _[demo.md](demo.md), [defense.md](defense.md),
      [slides.md](slides.md) y [video-script.md](video-script.md)._
- [x] Dossier técnico. _[technical-dossier.md](technical-dossier.md): inventario de
      dependencias con su función, arquitectura, los 14 ADRs con alternativa y deuda,
      30 preguntas lógicas, 15 trampa y límites enlazados a `defense.md`._

## Entrega

- [x] Seed demo.
      _Determinista e idempotente: 2 usuarios, 2 círculos, 2 álbumes, 6 fotos, 2 etiquetas,
      1 invitación y 4 actividades; **18 objetos de fotos** en el bucket privado `memora` (más
      4 ZIP de descargas de sesiones anteriores que el mantenimiento purga a las 24 h)._
- [x] Credenciales demo.
      _`lucia@memora.test` (owner) y `mateo@memora.test` (member), contraseña `memora-demo`._
- [ ] Vídeo de respaldo.
      _Solo **guion** ([video-script.md](video-script.md)); la grabación la hace el usuario._
- [x] Diapositivas.
      _[slides.md](slides.md), formato Marp, 14 diapositivas exportables a PDF/HTML._
- [ ] Flujo probado con dos usuarios y dos círculos.
      _El flujo de API está probado con los dos usuarios y los dos círculos; el recorrido
      completo en navegador (dos perfiles, móvil y escritorio) es el **ensayo** y queda abierto._
- [ ] App instalada en Android.
      _No verificada: no hay dispositivo físico. F14 midió instalabilidad en Chrome de
      escritorio; F42 la dejó pendiente._
- [x] URL o demo local.
      _Demo local reproducible con el atajo local **`demo.bat`** (en el escritorio, fuera del
      repo): Docker + healthchecks reales, dependencias, variables desde `.env.example` (y
      `.env` si existe), bucket, Prisma generate, migraciones, seed, imágenes, compilación de
      paquetes, API y web en dos ventanas, espera de `/api/health` y `/login` y apertura del
      navegador y Mailpit. Probado el 2026-11-08 lanzándolo desde el escritorio, con login
      real de los dos usuarios. Sin URL pública por decisión de alcance. Los pasos manuales
      siguen en [deployment.md](deployment.md)._
- [ ] Commit final revisado.
      _Commits `76edee4` y `7a5a88e` y PR #63 **mergeados** en `main` (`ee0c5ad`), con CI en
      verde; falta la revisión independiente y la aceptación del usuario. La rama
      `feat/S6-defense` (PR #65) contiene el dossier; el atajo de demo es local y no se
      versiona._
