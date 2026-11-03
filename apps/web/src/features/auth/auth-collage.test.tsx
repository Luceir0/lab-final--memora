import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AuthCollage, LOGIN_COLLAGE_PHOTOS, REGISTER_COLLAGE_PHOTOS } from './auth-collage';

function expectDecoratedImages(container: HTMLElement, count: number, pattern: RegExp) {
  const images = Array.from(container.querySelectorAll('img'));

  expect(images).toHaveLength(count);

  for (const image of images) {
    expect(image.getAttribute('alt')).toBe('');
    expect(image.getAttribute('loading')).toBe('lazy');
    expect(image.getAttribute('decoding')).toBe('async');
    expect(Number(image.getAttribute('width'))).toBeGreaterThan(0);
    expect(Number(image.getAttribute('height'))).toBeGreaterThan(0);
    expect(image.getAttribute('src')).toMatch(pattern);
  }

  expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
}

describe('AuthCollage', () => {
  it('usa las seis fotos de acceso y sus dimensiones', () => {
    const { container } = render(
      <AuthCollage variant="login" surface="hero" photos={LOGIN_COLLAGE_PHOTOS} />,
    );

    expectDecoratedImages(container, 6, /^\/auth\/collage-0[1-6]\.jpg$/);
  });

  it('usa las siete fotos de registro y sus dimensiones', () => {
    const { container } = render(
      <AuthCollage variant="register" surface="panel" photos={REGISTER_COLLAGE_PHOTOS} />,
    );

    expectDecoratedImages(container, 7, /^\/auth\/collage-register-0[1-7]\.jpg$/);
  });
});
