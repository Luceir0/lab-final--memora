import { describe, expect, it } from 'vitest';

import themeCss from './theme.css?raw';
import tokensCss from './tokens.css?raw';

describe('theme.css', () => {
  it('deja color-scheme en tokens.css y no lo duplica', () => {
    expect(tokensCss).toMatch(/:root\s*\{[\s\S]*color-scheme:\s*light/);
    expect(tokensCss).toMatch(/\[data-theme='dark'\]\s*\{[\s\S]*color-scheme:\s*dark/);
    expect(themeCss).not.toMatch(/color-scheme\s*:/);
  });

  it('declara la base de html/body con tokens', () => {
    expect(themeCss).toContain('@layer base');
    expect(themeCss).toMatch(/html\s*\{[\s\S]*background-color:\s*var\(--memora-bg\)/);
    expect(themeCss).toMatch(/html\s*\{[\s\S]*font-family:\s*var\(--memora-font-sans\)/);
    expect(themeCss).toMatch(/body\s*\{[\s\S]*-webkit-font-smoothing:\s*antialiased/);
    expect(themeCss).toMatch(/::selection\s*\{[\s\S]*var\(--memora-primary-soft\)/);
  });

  it('no fija scroll-behavior global', () => {
    expect(themeCss).not.toMatch(/html\s*\{[^}]*scroll-behavior/);
  });

  it('incluye el foco visible global con el token de foco', () => {
    expect(themeCss).toMatch(
      /:where\(a, button, input, select, textarea, summary, \[tabindex\]\):focus-visible\s*\{[\s\S]*outline:\s*2px solid var\(--memora-focus\)/,
    );
    expect(themeCss).toContain('outline-offset: 2px');
  });

  it('lleva animaciones, transiciones y scroll a 0 con reduced motion', () => {
    expect(themeCss).toContain('@media (prefers-reduced-motion: reduce)');
    expect(themeCss).toMatch(/--memora-duration-fast:\s*0ms/);
    expect(themeCss).toMatch(/animation-duration:\s*0ms !important/);
    expect(themeCss).toMatch(/transition-duration:\s*0ms !important/);
    expect(themeCss).toMatch(/scroll-behavior:\s*auto !important/);
  });

  it('no contiene hex sueltos: todo sale de tokens', () => {
    expect(themeCss).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });
});
