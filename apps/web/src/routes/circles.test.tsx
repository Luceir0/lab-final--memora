import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CirclesPage } from '../features/spike/circles-page';
import { Route } from './circles';

describe('route /circles', () => {
  it('declara ssr: false', () => {
    expect(Route.options.ssr).toBe(false);
  });

  it('renderiza el h1 de la zona privada', () => {
    render(<CirclesPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Tus círculos' })).toBeTruthy();
  });
});
