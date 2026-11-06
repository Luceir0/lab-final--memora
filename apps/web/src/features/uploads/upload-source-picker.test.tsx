import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { UploadSourcePicker, UPLOAD_ACCEPT } from './upload-source-picker';

function imageFile(name = 'foto.jpg'): File {
  return new File(['contenido'], name, { type: 'image/jpeg' });
}

function mockDesktop(): void {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: query.includes('min-width: 1024px'),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('UploadSourcePicker', () => {
  it('en móvil ofrece cámara y galería con los atributos del contrato', () => {
    render(<UploadSourcePicker albumTitle="Verano" onFiles={vi.fn()} />);

    const camera = screen.getByLabelText('Hacer una foto con la cámara') as HTMLInputElement;
    const gallery = screen.getByLabelText('Elegir fotos de la galería') as HTMLInputElement;
    const desktop = screen.getByLabelText('Elegir fotos del ordenador') as HTMLInputElement;

    expect(camera.type).toBe('file');
    expect(camera.getAttribute('capture')).toBe('environment');
    expect(camera.multiple).toBe(false);
    expect(gallery.multiple).toBe(true);
    expect(desktop.multiple).toBe(true);

    for (const input of [camera, gallery, desktop]) {
      expect(input.accept).toBe(UPLOAD_ACCEPT);
    }
  });

  it('abre la hoja con las dos acciones y devuelve el origen correcto', async () => {
    const onFiles = vi.fn();
    const file = imageFile('playa.jpg');

    render(<UploadSourcePicker albumTitle="Verano" onFiles={onFiles} />);

    fireEvent.click(screen.getByRole('button', { name: 'Subir fotos' }));

    expect(screen.getByRole('heading', { name: 'Subir fotos' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Hacer foto' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Elegir de la galería' })).toBeTruthy();

    const gallery = screen.getByLabelText('Elegir fotos de la galería') as HTMLInputElement;
    await userEvent.upload(gallery, file);

    expect(onFiles).toHaveBeenCalledWith([file], 'gallery');
    expect(gallery.value).toBe('');
  });

  it('marca las fotos de cámara con su origen y limpia el input', async () => {
    const onFiles = vi.fn();
    const file = imageFile('captura.jpg');

    render(<UploadSourcePicker albumTitle="Verano" onFiles={onFiles} />);

    const camera = screen.getByLabelText('Hacer una foto con la cámara') as HTMLInputElement;
    await userEvent.upload(camera, file);

    expect(onFiles).toHaveBeenCalledWith([file], 'camera');
    expect(camera.value).toBe('');
  });

  it('en escritorio abre directamente el selector múltiple sin hoja', () => {
    mockDesktop();
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click');

    render(<UploadSourcePicker albumTitle="Verano" onFiles={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Subir fotos' }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});
