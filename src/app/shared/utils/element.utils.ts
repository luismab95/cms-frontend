export enum ElementCode {
  button = 'button',
  label = 'label',
  image = 'image',
  paragraph = 'paragraph',
  language = 'language',
  card = 'card',
  video = 'video',
  iframe = 'iframe',
  html = 'html',
}

/**
 * Get safe url
 * @param value
 * @param baseUrl
 * @returns
 */
export function SafeUrl(value: string, baseUrl: string) {
  try {
    const base = baseUrl
      ? new URL(baseUrl, window.location.origin)
      : new URL('/', window.location.origin);
    const url = new URL(value.trim().replace(/\\/g, '/'), base);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    return url.href;
  } catch {
    return '';
  }
}
