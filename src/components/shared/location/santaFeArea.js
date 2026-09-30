// Barangay Santa Fe, Dasmariñas, Cavite: the area residents can report from.
//
// Boundary: OpenStreetMap relation 8785711 ("Santa Fe", admin boundary),
// trimmed at Pablo Campos Avenue (lat 14.32233) to match the barangay's
// outline on Google Maps -- OSM's version also includes the Burol Avenue /
// Grace Baptist Church area north of it. West edge: Congressional Avenue;
// east: the creek; south: Fatima Rd / Tomas Hemrodaro Rd.
// Points are [latitude, longitude]. To adjust the area, edit this list.
export const SANTA_FE_BOUNDARY = [
  [14.32233, 120.963616], [14.322298, 120.963619], [14.322122, 120.96364], [14.321945, 120.96366],
  [14.321748, 120.963683], [14.321726, 120.963685], [14.321546, 120.963706], [14.321369, 120.963726],
  [14.321187, 120.963747], [14.321014, 120.963767], [14.320821, 120.963789], [14.320624, 120.963812],
  [14.320535, 120.963822], [14.320359, 120.963842], [14.320162, 120.963865], [14.31997, 120.963888],
  [14.319852, 120.963902], [14.319562, 120.96393], [14.319384, 120.963949], [14.319207, 120.963968],
  [14.31903, 120.963986], [14.318856, 120.964005], [14.318766, 120.964014], [14.318664, 120.96403],
  [14.318629, 120.964036], [14.318586, 120.964045], [14.31853, 120.964059], [14.318472, 120.964077],
  [14.318432, 120.964091], [14.318399, 120.964104], [14.318304, 120.964143], [14.31813, 120.964223],
  [14.317966, 120.964293], [14.317813, 120.964361], [14.317679, 120.96442], [14.317539, 120.964481],
  [14.31743, 120.964527], [14.317474, 120.964625], [14.317532, 120.964773], [14.317591, 120.964926],
  [14.317649, 120.965071], [14.317709, 120.965218], [14.317774, 120.965376], [14.317844, 120.965552],
  [14.317911, 120.965722], [14.31798, 120.965889], [14.31805, 120.966058], [14.318102, 120.966183],
  [14.318182, 120.966154], [14.318239, 120.966135], [14.318381, 120.966189], [14.318463, 120.966188],
  [14.318586, 120.966164], [14.318646, 120.966163], [14.318699, 120.96616], [14.318749, 120.966168],
  [14.318793, 120.966177], [14.318821, 120.966195], [14.318853, 120.966217], [14.318918, 120.966249],
  [14.318953, 120.966253], [14.319012, 120.966241], [14.319079, 120.966227], [14.319127, 120.966194],
  [14.319227, 120.966097], [14.319246, 120.96601], [14.319256, 120.965854], [14.319277, 120.965815],
  [14.319302, 120.965785], [14.319414, 120.96579], [14.31946, 120.965793], [14.319484, 120.965808],
  [14.319508, 120.965829], [14.31957, 120.965891], [14.319649, 120.965914], [14.3197, 120.965889],
  [14.319791, 120.965752], [14.319886, 120.965667], [14.319995, 120.965604], [14.320091, 120.965559],
  [14.320199, 120.965513], [14.320305, 120.965468], [14.320424, 120.965378], [14.320493, 120.965343],
  [14.32055, 120.965315], [14.320975, 120.965171], [14.321075, 120.965108], [14.321165, 120.964978],
  [14.321232, 120.964982], [14.321325, 120.965013], [14.321386, 120.965022], [14.321425, 120.965006],
  [14.321473, 120.96495], [14.32152, 120.964944], [14.32155, 120.964967], [14.321595, 120.965036],
  [14.321641, 120.965061], [14.321806, 120.965012], [14.322018, 120.964965], [14.322112, 120.964924],
  [14.32224, 120.964767], [14.32233, 120.964669]
];

export const SANTA_FE_CENTER = { lat: 14.3203, lng: 120.9648 };

// Pins this close to the boundary (in meters) still count as inside: GPS is
// only accurate to ~10-30 m, and houses facing a boundary road (e.g.
// Congressional Ave) shouldn't be rejected for a pin dropped on the road.
export const BOUNDARY_TOLERANCE_M = 25;

// Ray casting: is the point inside the polygon?
const insidePolygon = (lat, lng, poly) => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [yi, xi] = poly[i];
    const [yj, xj] = poly[j];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
};

// Shortest distance (meters) from the point to the boundary line. Flat-earth
// approximation, accurate enough at barangay scale.
const distanceToBoundaryM = (lat, lng, poly) => {
  const mPerDegLat = 111320;
  const mPerDegLng = 111320 * Math.cos((lat * Math.PI) / 180);
  const toXY = ([pLat, pLng]) => [(pLng - lng) * mPerDegLng, (pLat - lat) * mPerDegLat];
  let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const [ax, ay] = toXY(poly[i]);
    const [bx, by] = toXY(poly[(i + 1) % poly.length]);
    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    const t = lenSq ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lenSq)) : 0;
    best = Math.min(best, Math.hypot(ax + t * dx, ay + t * dy));
  }
  return best;
};

export const isWithinSantaFe = (lat, lng) =>
  insidePolygon(lat, lng, SANTA_FE_BOUNDARY)
  || distanceToBoundaryM(lat, lng, SANTA_FE_BOUNDARY) <= BOUNDARY_TOLERANCE_M;

export const OUTSIDE_SANTA_FE_MESSAGE =
  "The pinned location is outside the jurisdiction of Barangay Sta. Fe. Please move the pin to where the incident is happening inside Sta. Fe.";
