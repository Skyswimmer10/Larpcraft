const xmlEscape = (value) => String(value || '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const initials = (label) => String(label || '')
  .split(/[^A-Za-z0-9]+/)
  .filter(Boolean)
  .slice(0, 3)
  .map((word) => word[0].toUpperCase())
  .join('');

export function mechanismImage(label, color = '#8B7BF5', category = 'Mechanism') {
  const safeLabel = xmlEscape(label);
  const safeCategory = xmlEscape(category);
  const mark = xmlEscape(initials(label) || 'M');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 210"><rect width="420" height="210" rx="18" fill="#151821"/><rect x="14" y="14" width="392" height="182" rx="14" fill="${color}" opacity=".16"/><circle cx="84" cy="93" r="49" fill="${color}" opacity=".92"/><circle cx="84" cy="93" r="36" fill="#151821" opacity=".34"/><text x="84" y="106" text-anchor="middle" fill="#fff" font-family="Segoe UI,Arial" font-size="34" font-weight="800">${mark}</text><text x="151" y="79" fill="#fff" font-family="Segoe UI,Arial" font-size="23" font-weight="700">${safeLabel}</text><text x="151" y="111" fill="#C9CEDC" font-family="Segoe UI,Arial" font-size="15">${safeCategory}</text><path d="M151 137 H366" stroke="${color}" stroke-width="5" stroke-linecap="round" opacity=".9"/><path d="M151 154 H315" stroke="#8B92A6" stroke-width="4" stroke-linecap="round" opacity=".45"/></svg>`;
  return {
    kind: 'svg',
    name: `${String(label || 'mechanism').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'mechanism'}.svg`,
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
  };
}
