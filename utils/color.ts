/**
 * 색상 유틸리티
 * - 다크 모드에서 너무 어두운 카테고리 색상의 명도를 자동 보정
 */

/** hex → RGB */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** RGB → hex */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
}

/** RGB → HSL (h: 0-360, s: 0-1, l: 0-1) */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return [0, 0, l];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return [h * 360, s, l];
}

/** HSL → RGB */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

/**
 * sRGB 상대 밝기(luminance) 계산 (WCAG 2.0 기준)
 * 반환값: 0 (완전히 어두움) ~ 1 (완전히 밝음)
 */
function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** 다크 모드 배경(#0A0A0A) 대비 최소 명도 임계값 */
const DARK_BG_LUMINANCE = 0.005; // #0A0A0A
const MIN_CONTRAST_RATIO = 3; // WCAG AA (large text / UI components)

/**
 * 다크 모드에서 너무 어두운 색상의 명도를 높여 가독성을 확보한다.
 * 밝은 색상은 그대로 반환한다.
 *
 * @param hex - 원본 hex 색상 (e.g. "#1A3B00")
 * @param isDark - 다크 모드 여부
 * @returns 보정된 hex 색상
 */
export function ensureReadableColor(hex: string, isDark: boolean): string {
  if (!isDark) return hex;

  const [r, g, b] = hexToRgb(hex);
  const lum = relativeLuminance(r, g, b);

  // contrast ratio = (L1 + 0.05) / (L2 + 0.05) where L1 > L2
  const contrast = (lum + 0.05) / (DARK_BG_LUMINANCE + 0.05);
  if (contrast >= MIN_CONTRAST_RATIO) return hex;

  // 명도가 부족 → HSL에서 lightness를 올림
  const [h, s, l] = rgbToHsl(r, g, b);
  // 목표 luminance 역산: targetLum = MIN_CONTRAST_RATIO * (DARK_BG_LUMINANCE + 0.05) - 0.05
  const targetLum = MIN_CONTRAST_RATIO * (DARK_BG_LUMINANCE + 0.05) - 0.05;

  // 이진 탐색으로 적절한 lightness 찾기
  let lo = l;
  let hi = 0.9; // 최대 90%까지만
  let bestL = hi;
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) / 2;
    const [tr, tg, tb] = hslToRgb(h, s, mid);
    const testLum = relativeLuminance(tr, tg, tb);
    if (testLum >= targetLum) {
      bestL = mid;
      hi = mid;
    } else {
      lo = mid;
    }
  }

  const [nr, ng, nb] = hslToRgb(h, s, bestL);
  return rgbToHex(nr, ng, nb);
}
