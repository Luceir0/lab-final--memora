import type { UploadItem, UploadSource } from './types';

const TIME_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  hour: '2-digit',
  minute: '2-digit',
});

const GENERIC_FILE_NAME = /^(?:img|image|photo|foto|capture|blob|file)[-_ ]?\d*(?:\.[a-z0-9]+)?$/i;

const SOURCE_LABELS: Readonly<Record<UploadSource, string>> = {
  gallery: 'Galería',
  camera: 'Cámara',
  desktop: 'Del ordenador',
};

const MEGABYTE = 1024 * 1024;

export function formatUploadSource(source: UploadSource): string {
  return SOURCE_LABELS[source];
}

/** «En cola», «Subiendo · 72 %», «Completada», «Cancelada» o «Error». */
export function formatUploadStatus(item: UploadItem): string {
  switch (item.status) {
    case 'pending':
      return 'En cola';
    case 'uploading':
      return `Subiendo · ${item.progress} %`;
    case 'done':
      return 'Completada';
    case 'cancelled':
      return 'Cancelada';
    case 'error':
      return 'Error';
  }
}

export function isGenericUploadFileName(name: string): boolean {
  return GENERIC_FILE_NAME.test(name.trim());
}

function formatCaptureTime(lastModified: number): string | null {
  if (!Number.isFinite(lastModified) || lastModified <= 0) {
    return null;
  }

  return TIME_FORMATTER.format(new Date(lastModified));
}

/**
 * Nombre visible. Las capturas de cámara suelen llegar como `image.jpg` o
 * `IMG_1234.jpg`; en ese caso se prefiere «Foto de la cámara · HH:MM».
 */
export function formatUploadItemName(
  item: Pick<UploadItem, 'originalName' | 'source' | 'file'>,
): string {
  const time = formatCaptureTime(item.file.lastModified);

  if (item.source === 'camera' && isGenericUploadFileName(item.originalName) && time !== null) {
    return `Foto de la cámara · ${time}`;
  }

  return item.originalName;
}

/** «4 de 12 subidas» (o «1 de 1 subida»). */
export function formatUploadQueueCount(completed: number, total: number): string {
  return `${completed} de ${total} ${total === 1 ? 'subida' : 'subidas'}`;
}

/** «1 con error» / «N con errores». */
export function formatUploadFailedCount(count: number): string {
  return count === 1 ? '1 con error' : `${count} con errores`;
}

/** «1 cancelada» / «N canceladas». */
export function formatUploadCancelledCount(count: number): string {
  return count === 1 ? '1 cancelada' : `${count} canceladas`;
}

/** «1,5», «38», «59». */
export function formatMegabytes(bytes: number): string {
  const megabytes = Math.max(0, bytes) / MEGABYTE;
  const maximumFractionDigits = megabytes >= 10 ? 0 : 1;

  return new Intl.NumberFormat('es-ES', { maximumFractionDigits }).format(megabytes);
}

/** «X de Y MB». */
export function formatUploadBytes(uploadedBytes: number, totalBytes: number): string {
  return `${formatMegabytes(uploadedBytes)} de ${formatMegabytes(totalBytes)} MB`;
}
