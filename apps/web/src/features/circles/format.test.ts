import { describe, expect, it } from 'vitest';

import {
  formatCircleStats,
  formatCircleStatsShort,
  formatCount,
  formatLongDate,
  formatPlural,
  formatRelativeDate,
  getFirstName,
  getInitials,
} from './format';

describe('formatLongDate', () => {
  it('pinta el día completo en es-ES con mayúscula inicial', () => {
    expect(formatLongDate(new Date(2026, 9, 17, 12))).toBe('Sábado, 17 de octubre');
  });

  it('devuelve cadena vacía para una fecha inválida', () => {
    expect(formatLongDate('no-es-una-fecha')).toBe('');
  });
});

describe('formatRelativeDate', () => {
  const now = new Date(2026, 9, 17, 18);

  it('usa Hoy para el mismo día', () => {
    expect(formatRelativeDate(new Date(2026, 9, 17, 9), now)).toBe('Hoy');
  });

  it('usa Ayer para el día anterior', () => {
    expect(formatRelativeDate(new Date(2026, 9, 16, 9), now)).toBe('Ayer');
  });

  it('cuenta los días de la última semana', () => {
    expect(formatRelativeDate(new Date(2026, 9, 14, 9), now)).toBe('Hace 3 días');
  });

  it('a partir de una semana usa la fecha corta', () => {
    expect(formatRelativeDate(new Date(2026, 8, 12, 9), now)).toBe('12 sept');
  });

  it('no anuncia días negativos si el servidor va por delante', () => {
    expect(formatRelativeDate(new Date(2026, 9, 18, 9), now)).toBe('Hoy');
  });
});

describe('números y plurales', () => {
  it('fuerza el separador de miles de es-ES', () => {
    expect(formatCount(1240)).toBe('1.240');
    expect(formatCount(912)).toBe('912');
  });

  it('concuerda singular y plural', () => {
    expect(formatPlural(1, 'persona', 'personas')).toBe('1 persona');
    expect(formatPlural(8, 'persona', 'personas')).toBe('8 personas');
    expect(formatPlural(1, 'álbum', 'álbumes')).toBe('1 álbum');
  });

  it('compone las stats largas y cortas', () => {
    const stats = { membersCount: 8, albumsCount: 12, photosCount: 1240 };

    expect(formatCircleStats(stats)).toBe('8 personas · 12 álbumes · 1.240 fotos');
    expect(formatCircleStatsShort(stats)).toBe('8 personas · 1.240 fotos');
  });
});

describe('nombres', () => {
  it('extrae hasta dos iniciales', () => {
    expect(getInitials('Familia García')).toBe('FG');
    expect(getInitials('  Amigas   de la uni ')).toBe('AD');
    expect(getInitials('')).toBe('?');
  });

  it('usa el primer nombre para el saludo', () => {
    expect(getFirstName('Sofía Martín')).toBe('Sofía');
    expect(getFirstName('  ')).toBe('');
  });
});
