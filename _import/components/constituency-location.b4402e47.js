export async function detectConstituencyFromLocation({
  constituencyGeoJSON,
  availableConstituencies = [],
  timeout = 6500,
} = {}) {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return { ok: false, reason: "unsupported" };
  }

  const position = await new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (value) => resolve({ ok: true, value }),
      (error) => resolve({ ok: false, error }),
      {
        enableHighAccuracy: false,
        timeout,
        maximumAge: 10 * 60 * 1000,
      },
    );
  });

  if (!position.ok) {
    const reason = position.error?.code === 1
      ? "denied"
      : position.error?.code === 3
        ? "timeout"
        : "unavailable";
    return { ok: false, reason };
  }

  const { latitude, longitude } = position.value.coords;
  const feature = (constituencyGeoJSON?.features ?? []).find((candidate) => {
    try {
      return geometryContainsPoint(candidate?.geometry, [longitude, latitude]);
    } catch {
      return false;
    }
  });
  const constituency = cleanConstituencyName(feature?.properties?.ENG_NAME_VALUE);

  if (!constituency || !availableConstituencies.includes(constituency)) {
    return { ok: false, reason: "outside" };
  }

  return { ok: true, constituency };
}

function cleanConstituencyName(value) {
  return String(value ?? "").replace(/\s*\(\d+\)\s*$/, "").trim();
}

function geometryContainsPoint(geometry, point) {
  if (geometry?.type === "Polygon") {
    return polygonContainsPoint(geometry.coordinates, point);
  }

  if (geometry?.type === "MultiPolygon") {
    return geometry.coordinates.some((polygon) => polygonContainsPoint(polygon, point));
  }

  return false;
}

function polygonContainsPoint(rings, point) {
  if (!rings?.length || !ringContainsPoint(rings[0], point)) return false;
  return !rings.slice(1).some((hole) => ringContainsPoint(hole, point));
}

function ringContainsPoint(ring, [x, y]) {
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const crosses = yi > y !== yj > y
      && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }

  return inside;
}
