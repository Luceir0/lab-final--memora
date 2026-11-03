# Créditos de las imágenes de acceso y registro

Fotos usadas en el collage de `/login` y `/register` (F16). Están versionadas en
`apps/web/public/auth/`, servidas desde la raíz pública (`/auth/...`) y
recomprimidas a 700 px de ancho con mozjpeg, **sin EXIF ni metadatos**.

Origen: [Pexels](https://www.pexels.com). Licencia
[Pexels](https://www.pexels.com/license/): uso gratuito, incluido comercial, sin
atribución obligatoria. Esta tabla se mantiene por trazabilidad, no porque la
licencia la exija. No hay _hotlinking_: las imágenes están descargadas en el
repositorio.

## Acceso (`/login`)

| Archivo | Título | Autor | Fuente |
| --- | --- | --- | --- |
| `collage-01.jpg` | Stairs on Sea Shore in Town in Greece | AXP Photography | <https://www.pexels.com/photo/18774914/> |
| `collage-02.jpg` | Father with Children on Beach | iddea photo | <https://www.pexels.com/photo/17374510/> |
| `collage-03.jpg` | Colorful Birthday Balloons Celebration | Jonathan Cooper | <https://www.pexels.com/photo/34008663/> |
| `collage-04.jpg` | Tram on Street in Lisbon | Marcelo Verfe | <https://www.pexels.com/photo/19513489/> |
| `collage-05.jpg` | Silhouette Group of People Standing on Grass Field | Afta Putta Gunawan | <https://www.pexels.com/photo/1250346/> |
| `collage-06.jpg` | Turquoise Mountain Lake | Photo.crazy | <https://www.pexels.com/photo/16641791/> |

## Registro (`/register`)

| Archivo | Título | Autor | Fuente |
| --- | --- | --- | --- |
| `collage-register-01.jpg` | Anonymous friends standing together at sunset in mountains | Helena Lopes | <https://www.pexels.com/photo/4453153/> |
| `collage-register-02.jpg` | A Girl with Paint on Her Face | Gabriel Frank | <https://www.pexels.com/photo/13693785/> |
| `collage-register-03.jpg` | Silhouette of Friends Standing Together at Sunset | No registrado en la ficha consultada | <https://www.pexels.com/photo/16958800/> |
| `collage-register-04.jpg` | Serene Beach at Sunset with Calm Ocean Waves | No registrado en la ficha consultada | <https://www.pexels.com/photo/38205879/> |
| `collage-register-05.jpg` | Group of Friends Sitting Behind a Bonfire | Askar Abayev | <https://www.pexels.com/photo/5638829/> |
| `collage-register-06.jpg` | Family Walking Through Countryside Path in Spring | Alexander Mass | <https://www.pexels.com/photo/40321749/> |
| `collage-register-07.jpg` | Shallow Focus Photography of String Lights | Dzenina Lukac | <https://www.pexels.com/photo/754263/> |

## Uso

- Decorativas: `alt=""` y `aria-hidden="true"` en el componente
  `apps/web/src/features/auth/auth-collage.tsx`.
- Sustituyen al collage de los diseños canónicos
  (`assets/design/screens/acceso-*.png`, `registro-*.png`), que no incluye los
  archivos originales.
- Para cambiarlas: descargar, reescalar a 700 px como máximo, recomprimir sin
  metadatos y actualizar esta tabla.
