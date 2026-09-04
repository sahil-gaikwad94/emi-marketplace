function deviceSvg(label: string, body: string, screen: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 700"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${body}"/><stop offset="1" stop-color="#f8f6f0"/></linearGradient></defs><rect width="500" height="700" fill="url(#g)"/><g transform="translate(125 38) rotate(6 125 310)"><rect width="250" height="620" rx="35" fill="#171b19"/><rect x="10" y="10" width="230" height="600" rx="29" fill="${screen}"/><rect x="78" y="20" width="94" height="20" rx="10" fill="#171b19"/><circle cx="74" cy="79" r="14" fill="#171b19"/><circle cx="108" cy="79" r="14" fill="#171b19"/><circle cx="142" cy="79" r="14" fill="#171b19"/><path d="M35 530h180" stroke="white" stroke-opacity=".4" stroke-width="3"/></g><text x="28" y="665" font-family="Arial,sans-serif" font-size="15" font-weight="700" fill="#1e211d">${label}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export const fallbackImages = {
  Apple: deviceSvg("iPhone 17 Pro", "#d87845", "#e68d53"),
  Samsung: deviceSvg("Galaxy S24 Ultra", "#8996b6", "#273149"),
  OnePlus: deviceSvg("OnePlus 13", "#8b83ac", "#28302b"),
  default: deviceSvg("Fundora device", "#d6cdbd", "#353b35"),
};

export function fallbackForBrand(brand?: string) {
  return fallbackImages[brand as keyof typeof fallbackImages] ?? fallbackImages.default;
}
