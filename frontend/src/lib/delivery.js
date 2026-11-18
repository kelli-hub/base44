// Delivery areas around the two branches, with the rider-fee rule used on the
// delivery page and at checkout. Rates match the posted fee table.

export const branches = [
  { id: 'roysambu', name: 'Roysambu', lat: -1.2160326, lng: 36.8888213 },
  { id: 'thindigua', name: 'Thindigua', lat: -1.204283, lng: 36.8324296 },
];

export const areas = [
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

export const otherArea = { id: 'other', name: "Somewhere else (we'll confirm)" };

const toRad = (deg) => (deg * Math.PI) / 180;

export function distanceKm(from, to) {
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 12742 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function deliveryFee(km) {
  if (!Number.isFinite(km)) return 100;
  const bands = Math.ceil(Math.max(0, km - 3) / 3 - 1e-9);
  return Math.min(600, 100 + bands * 50);
}

export function quoteArea(areaId) {
  if (areaId === otherArea.id) {
    return { km: null, branch: null, fee: 100, label: 'Confirmed on call', extraKm: 0 };
  }
  const area = areas.find((item) => item.id === areaId);
  if (!area) return { km: null, branch: null, fee: 100, label: 'Confirmed on call', extraKm: 0 };

  let nearest = branches[0];
  let best = distanceKm(area, nearest);
  for (const branch of branches.slice(1)) {
    const distance = distanceKm(area, branch);
    if (distance < best) {
      nearest = branch;
      best = distance;
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

export const feeTable = [
  { range: '0 – 3 km', fee: 100, text: 'Right around either shop' },
  { range: '3 – 6 km', fee: 150, text: 'Next estate over' },
  { range: '6 – 9 km', fee: 200, text: 'Short ride' },
  { range: '9 – 12 km', fee: 250, text: 'Across town' },
  { range: '12 – 15 km', fee: 300, text: 'Longer ride' },
  { range: '15 km +', fee: 350, text: 'Ask us first — capped at KSh 600' },
];
