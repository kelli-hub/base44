// Shared shop data: categories, branches, delivery areas and the rider-fee rule.

const branches = [
  { id: 'roysambu', name: 'Roysambu', lat: -1.2160326, lng: 36.8888213 },
  { id: 'thindigua', name: 'Thindigua', lat: -1.204283, lng: 36.8324296 },
];

const categories = [
  { id: 'whisky', label: 'Whisky', blurb: 'Scotch, bourbon & Irish', image: '/img/cat-whisky.webp' },
  { id: 'wine', label: 'Wine', blurb: 'Red, white & rosé', image: '/img/cat-wine.webp' },
  { id: 'beer', label: 'Beer', blurb: 'Lagers, stouts & ciders', image: '/img/cat-beer.webp' },
  { id: 'gin', label: 'Gin', blurb: 'London dry & botanical', image: '/img/tanqueray.webp' },
  { id: 'cognac', label: 'Cognac', blurb: 'VS, VSOP & XO', image: '/img/hennessy.webp' },
  { id: 'champagne', label: 'Champagne', blurb: 'For the toast', image: '/img/cat-champagne.webp' },
  { id: 'vodka', label: 'Vodka', blurb: 'Clean, crisp & mixable', image: '/img/cat-spirits.webp' },
  { id: 'rum', label: 'Rum', blurb: 'White, spiced & dark', image: '/img/cat-spirits.webp' },
  { id: 'liqueur', label: 'Liqueur', blurb: 'Sweet sips & shooters', image: '/img/cat-spirits.webp' },
];

const areas = [
  { id: 'roysambu', name: 'Roysambu', lat: -1.2195, lng: 36.889, note: 'At the shop' },
  { id: 'lumumba', name: 'Lumumba Drive / Zimmerman', lat: -1.2225, lng: 36.883 },
  { id: 'kahawa-wendani', name: 'Kahawa Wendani', lat: -1.2115, lng: 36.898 },
  { id: 'kasarani', name: 'Kasarani / Mwiki', lat: -1.2265, lng: 36.9025 },
  { id: 'garden-estate', name: 'Garden Estate', lat: -1.227, lng: 36.862 },
  { id: 'ridgeways', name: 'Ridgeways / Kiambu Rd', lat: -1.214, lng: 36.86 },
  { id: 'runda', name: 'Runda', lat: -1.211, lng: 36.853 },
  { id: 'thindigua', name: 'Thindigua', lat: -1.2043, lng: 36.8324, note: 'At the shop' },
  { id: 'kiambu-town', name: 'Kiambu Town', lat: -1.171, lng: 36.835 },
  { id: 'kinoo', name: 'Kinoo / Uthiru', lat: -1.24, lng: 36.77 },
  { id: 'muthaiga', name: 'Muthaiga / Pangani', lat: -1.235, lng: 36.835 },
  { id: 'westlands', name: 'Westlands / Parklands', lat: -1.267, lng: 36.806 },
  { id: 'cbd', name: 'Nairobi CBD', lat: -1.284, lng: 36.823 },
  { id: 'kilimani', name: 'Kilimani / Kileleshwa', lat: -1.29, lng: 36.786 },
  { id: 'ruiru', name: 'Ruiru / Juja', lat: -1.145, lng: 36.96 },
  { id: 'karen', name: 'Karen / Langata', lat: -1.32, lng: 36.71 },
];

const OTHER_AREA = { id: 'other', name: "Somewhere else (we'll confirm)" };
const PAYMENT_METHODS = ['mpesa', 'card', 'cash'];
const ORDER_STATUSES = ['new', 'confirmed', 'dispatched', 'delivered', 'cancelled'];

const toRad = (deg) => (deg * Math.PI) / 180;

function distanceKm(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.min(1, Math.sqrt(h)));
}

// First 3 km is KSh 100, then KSh 50 for every extra 3 km, capped at KSh 600.
function deliveryFee(km) {
  if (!Number.isFinite(km)) return 100;
  const extra = Math.max(0, km - 3);
  const bands = Math.ceil(extra / 3 - 1e-9);
  return Math.min(600, 100 + bands * 50);
}

function quoteArea(areaId) {
  if (areaId === OTHER_AREA.id || !areas.some((a) => a.id === areaId)) {
    return { km: null, branch: null, fee: 100, label: 'Confirmed on call', extraKm: 0 };
  }
  const area = areas.find((a) => a.id === areaId);
  let nearest = branches[0];
  let best = distanceKm(area, nearest);
  for (const branch of branches.slice(1)) {
    const d = distanceKm(area, branch);
    if (d < best) {
      nearest = branch;
      best = d;
    }
  }
  const km = Math.round(best * 10) / 10;
  return {
    km,
    branch: nearest.name,
    fee: deliveryFee(km),
    label: km <= 3 ? 'Neighbourhood rate' : `${km} km from ${nearest.name}`,
    extraKm: Math.max(0, Math.round((km - 3) * 10) / 10),
  };
}

module.exports = {
  branches,
  categories,
  areas,
  OTHER_AREA,
  PAYMENT_METHODS,
  ORDER_STATUSES,
  quoteArea,
  deliveryFee,
  distanceKm,
};
