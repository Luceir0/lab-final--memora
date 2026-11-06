import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { UploadDropzone } from './upload-dropzone';

function imageFile(name: string): File {
  return new File(['contenido'], name, { type: 'image/jpeg' });
}

function dataTransfer(files: readonly File[], types: readonly string[] = ['Files']): DataTransfer {
  return {
    files,
    items: files.map((file) => ({
      kind: 'file',
      type: file.type,
      getAsFile: () => file,
    })),
    types,
    dropEffect: 'none',
  } as unknown as DataTransfer;
}

describe('UploadDropzone', () => {
  it('muestra la capa al arrastrar archivos y la mantiene hasta el último dragleave', () => {
    render(<UploadDropzone albumTitle="Verano en Mallorca" onFiles={vi.fn()} />);
    const transfer = dataTransfer([imageFile('a.jpg'), imageFile('b.jpg')]);

    fireEvent.dragEnter(window, { dataTransfer: transfer });

    expect(screen.getByText('Suelta para subir 2 fotos')).toBeTruthy();
    expect(screen.getByText('Se añadirán a Verano en Mallorca · en calidad original')).toBeTruthy();

    fireEvent.dragEnter(window, { dataTransfer: transfer });
    fireEvent.dragLeave(window, { dataTransfer: transfer });

    expect(screen.getByText('Suelta para subir 2 fotos')).toBeTruthy();

    fireEvent.dragLeave(window, { dataTransfer: transfer });

    expect(screen.queryByText('Suelta para subir 2 fotos')).toBeNull();
  });

  it('al soltar entrega los archivos y cierra la capa', () => {
    const onFiles = vi.fn();
    render(<UploadDropzone albumTitle="Verano" onFiles={onFiles} />);
    const files = [imageFile('a.jpg'), imageFile('b.jpg')];
    const transfer = dataTransfer(files);

    fireEvent.dragEnter(window, { dataTransfer: transfer });
    expect(fireEvent.dragOver(window, { dataTransfer: transfer })).toBe(false);
    fireEvent.drop(window, { dataTransfer: transfer });

    expect(onFiles).toHaveBeenCalledWith(files);
    expect(screen.queryByText('Suelta para subir 2 fotos')).toBeNull();
  });

  it('ignora arrastres que no llevan archivos', () => {
    const onFiles = vi.fn();
    render(<UploadDropzone albumTitle="Verano" onFiles={onFiles} />);
    const transfer = dataTransfer([], ['text/plain']);

    fireEvent.dragEnter(window, { dataTransfer: transfer });

    expect(screen.queryByText(/Suelta para subir/)).toBeNull();

    fireEvent.drop(window, { dataTransfer: transfer });

    expect(onFiles).not.toHaveBeenCalled();
  });

  it('no captura arrastres dentro de la cola', () => {
    const onFiles = vi.fn();
    render(
      <>
        <div data-upload-queue="" data-testid="queue" />
        <UploadDropzone albumTitle="Verano" onFiles={onFiles} />
      </>,
    );
    const queue = screen.getByTestId('queue');
    const transfer = dataTransfer([imageFile('a.jpg')]);

    fireEvent.dragEnter(queue, { dataTransfer: transfer });
    const dropResult = fireEvent.drop(queue, { dataTransfer: transfer });

    expect(dropResult).toBe(false);
    expect(screen.queryByText(/Suelta para subir/)).toBeNull();
    expect(onFiles).not.toHaveBeenCalled();
  });

  it('no captura arrastres dentro de un overlay abierto', () => {
    const onFiles = vi.fn();
    render(
      <>
        <div data-memora-overlay-root="" data-testid="overlay">
          <div data-testid="overlay-content">Contenido del diálogo</div>
        </div>
        <UploadDropzone albumTitle="Verano" onFiles={onFiles} />
      </>,
    );
    const target = screen.getByTestId('overlay-content');
    const transfer = dataTransfer([imageFile('a.jpg')]);

    fireEvent.dragEnter(target, { dataTransfer: transfer });
    const dropResult = fireEvent.drop(target, { dataTransfer: transfer });

    expect(dropResult).toBe(false);
    expect(screen.queryByText(/Suelta para subir/)).toBeNull();
    expect(onFiles).not.toHaveBeenCalled();
  });

  it('no escucha si el permiso de subida está desactivado, pero cancela el default', () => {
    const onFiles = vi.fn();
    render(<UploadDropzone albumTitle="Verano" onFiles={onFiles} enabled={false} />);
    const transfer = dataTransfer([imageFile('a.jpg')]);

    fireEvent.dragEnter(window, { dataTransfer: transfer });

    expect(screen.queryByText(/Suelta para subir/)).toBeNull();

    const dropResult = fireEvent.drop(window, { dataTransfer: transfer });

    expect(dropResult).toBe(false);
    expect(onFiles).not.toHaveBeenCalled();
  });
});
