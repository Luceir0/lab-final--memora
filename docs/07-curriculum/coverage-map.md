# Cobertura del temario

Estado: **F01–F03 cubren los temas transversales** (organización, documentación, IA agente, revisión y activos). El resto está planificado y se actualiza al cerrar cada feature con evidencias reales.

**Fuente del temario:** `assets/design/temario-tecnologias.png` y la especificación histórica `docs/archive/spec-v1.md` §7. No hay una transcripción oficial en texto; este mapa es la referencia operativa.

## Transversales (F01–F03)

| Tema | Dónde se aplica | Evidencia | Estado |
| --- | --- | --- | --- |
| Organización y documentación | README, docs, ADRs, specs | `README.md`, `docs/` | Cubierto |
| IA agente | Agentes, comandos, skills, workflow | `.opencode/`, `AGENTS.md` | Cubierto |
| Revisión y calidad | Protocolo de revisión, DoD, auditoría | `docs/06-process/`, `docs/05-quality/` | Cubierto |
| Diseño y activos | Normalización, manifest, screens | `assets/design/`, `docs/02-design/screens.md` | Cubierto |

## 1. Maquetación

| Contenido | Dónde se aplica | Evidencia | Estado |
| --- | --- | --- | --- |
| HTML semántico | App shell, fotos, formularios, diálogos | axe; componentes | Pendiente |
| CSS moderno | Tokens, `clamp`, `dvh`, safe areas, focus, reduced motion | `packages/ui` | Pendiente |
| Flexbox | Navegación, cabeceras, miembros, avatares | App shell | Pendiente |
| Grid | Galería, círculos, layout escritorio | Galería | Pendiente |
| Responsive | 320–1440; bottom nav/sidebar | Capturas + E2E | Pendiente |
| Container queries | Tarjetas de álbum/círculo/foto | `packages/ui` | Pendiente |
| PostCSS | Pipeline Tailwind 4 | Configuración | Pendiente |
| Tailwind CSS | Utilidades y tokens | `packages/ui` | Pendiente |
| IA para maquetación | Variantes y revisión visual | Bitácora | Pendiente |

## 2. Lenguaje

| Contenido | Dónde se aplica | Evidencia | Estado |
| --- | --- | --- | --- |
| TypeScript core | `strict`, sin `any` | `tsc` CI | Pendiente |
| Union types y narrowing | Upload state, roles, tema, ApiResult | `useUploadQueue`, api-client | Pendiente |
| Genéricos | `Paginated<T>`, `ApiResult<T>`, `request<T>` | `shared`, `api-client` | Pendiente |
| Utility types | `Omit`, `Partial`, `Pick`, `Record` | DTOs | Pendiente |
| Tipos inferidos de Zod | `z.infer` como fuente | `shared` | Pendiente |
| Inmutabilidad | Reducer y caché | Upload reducer | Pendiente |
| Funciones puras | Permisos, filtros, formatos | Tests unitarios | Pendiente |
| IA para tipados | Revisión de contratos | Bitácora | Pendiente |

## 3. Bundlers

| Contenido | Dónde se aplica | Evidencia | Estado |
| --- | --- | --- | --- |
| Vite y bundling | Start sobre Vite, proxy, env, splitting | Configuración | Pendiente |
| SPA | Rutas privadas `ssr: false` | Tabla de rutas | Pendiente |
| SSR | Login, registro, invitación | Preview real | Pendiente |
| SSG | Ayuda y privacidad | HTML de build | Pendiente |
| MPA | No se fuerza; ADR | ADR-0002 | Pendiente |
| Turborepo | Monorepo, caché, CI | `turbo.json` | Pendiente |
| Paquetes compartidos | `shared`, `api-client`, `ui`, `config` | Imports | Pendiente |

## 4. Frameworks

| Contenido | Dónde se aplica | Evidencia | Estado |
| --- | --- | --- | --- |
| React componentes | UI kit y features | `packages/ui` | Pendiente |
| Hooks | `useUploadQueue`, `useMediaQuery`, `useTheme`, `useShare` | Tests de hooks | Pendiente |
| Formularios | RHF + Zod | Auth, círculo, álbum, metadatos | Pendiente |
| APIs | TanStack Query: caché, infinito, optimista | Etiquetas, galería | Pendiente |
| Metaframework | TanStack Start | ADR-0001 | Pendiente |
| Next.js | Comparación documentada | ADR-0001 | Pendiente |
| IA agente | Tareas acotadas y revisadas | Bitácora | Pendiente |

## 5. Testing

| Contenido | Dónde se aplica | Evidencia | Estado |
| --- | --- | --- | --- |
| Componentes | Formularios, galería, navegación, tema | RTL | Pendiente |
| Testing Library | Roles y texto accesible | Tests | Pendiente |
| Mocking APIs | MSW con contratos; 401/403/500 | Handlers | Pendiente |
| Hooks | `renderHook` | Tests | Pendiente |
| Revisión con IA | Casos límite | Bitácora | Pendiente |
| Además | API, E2E, axe | CI | Pendiente |

## 6. API REST

| Contenido | Dónde se aplica | Evidencia | Estado |
| --- | --- | --- | --- |
| API REST I y II | Recursos, verbos, códigos, paginación, subida, cookie | OpenAPI | Pendiente |
| Consumo de APIs | Cliente tipado en web y SSR | `api-client` | Pendiente |
| Servicios externos | S3, email, geocoding, Content Island | Adaptadores + `.env.example` | Pendiente |

## Evidencias de entrega

- [ ] README con instalación y scripts.
- [ ] ADRs.
- [ ] OpenAPI.
- [ ] Tests en CI.
- [ ] Informe de accesibilidad.
- [ ] Capturas 375/768/1440.
- [ ] Bitácora.
- [ ] Defensa.

## Regla

No se marca “cubierto” sin enlace verificable. Si algo no se cubre, se explica por qué en este documento y en el README.
