# Principios de diseño

## Identidad

- **La fotografía manda.** Interfaz neutra (grises fríos, blanco, azul-negro). El violeta se reserva para la acción principal y la selección.
- **Una sola familia tipográfica:** Plus Jakarta Sans, jerarquía por tamaño y peso.
- **Superficies redondeadas y ligeras:** tarjetas de 20–24 px, bordes de 1 px, sombras suaves.
- **Oscuro ≠ negro:** fondos azul-negro, elevación por superficies más claras y bordes.
- **Nunca un hex en un componente:** siempre token semántico.
- **Movimiento discreto:** nunca necesario para entender; se desactiva con `prefers-reduced-motion`.

## Referencias

- Sistema de diseño v0.1: `assets/design/design-system-v0.1.png`
- Tokens: `docs/02-design/tokens.md`
- Componentes: `docs/02-design/components.md`
- Pantallas: `docs/02-design/screens.md`

## Fidelidad

| Elemento | Fidelidad |
| --- | --- |
| Colores, tipografía, radios, sombras, espaciado | Exacta, vía tokens |
| Estructura y navegación | Exacta |
| Medidas de bloques | Orientativa; manda el contenido real y el responsive |
| Fotografías | Marcadores sustituidos por fotos con licencia |
| Textos y datos | Ejemplos; en la app vienen de la API |

## Regla de oro

Si una pantalla necesita un valor que no existe como token, se para y se propone añadirlo al sistema; no se improvisa.
