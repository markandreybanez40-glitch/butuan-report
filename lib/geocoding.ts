import { BUTUAN_BARANGAYS } from "./constants/barangays";

export interface ReverseGeocodeResult {
  barangay: string | null;
  streetArea: string | null;
  landmark: string | null;
  formattedAddress: string;
}

/**
 * Normalizes a barangay string for robust fuzzy/case/accent-insensitive matching.
 * Handles "Barangay", "Brgy", "(Poblacion)", accents (e.g. ñ), and spaces.
 */
export function normalizeBarangayName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics / accents (ñ -> n)
    .toLowerCase()
    .replace(/\(poblacion\)/gi, "")
    .replace(/^barangay\s+/gi, "")
    .replace(/^brgy\.?\s+/gi, "")
    .replace(/[^a-z0-9]/gi, "")
    .trim();
}

// Pre-compute normalized map of official Butuan City barangays for O(1) lookup
const NORMALIZED_BARANGAYS_MAP = new Map<string, string>();
for (const b of BUTUAN_BARANGAYS) {
  NORMALIZED_BARANGAYS_MAP.set(normalizeBarangayName(b), b);
}

/**
 * Matches an array of location candidate names against the 86 official Butuan City barangays.
 */
export function findMatchingBarangay(candidates: (string | undefined | null)[]): string | null {
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "string") continue;
    const trimmed = candidate.trim();
    if (!trimmed) continue;

    // Direct check in normalized map
    const normalized = normalizeBarangayName(trimmed);
    const directMatch = NORMALIZED_BARANGAYS_MAP.get(normalized);
    if (directMatch) {
      return directMatch;
    }

    // Check if candidate contains or is contained in an official barangay
    for (const [normKey, officialName] of NORMALIZED_BARANGAYS_MAP.entries()) {
      if (normalized.length >= 4 && (normKey.includes(normalized) || normalized.includes(normKey))) {
        return officialName;
      }
    }
  }

  return null;
}

interface NominatimAddress {
  road?: string;
  pedestrian?: string;
  street?: string;
  footway?: string;
  path?: string;
  neighbourhood?: string;
  suburb?: string;
  quarter?: string;
  village?: string;
  city_district?: string;
  hamlet?: string;
  amenity?: string;
  building?: string;
  shop?: string;
  tourism?: string;
  historic?: string;
  office?: string;
  city?: string;
  town?: string;
  state?: string;
  country?: string;
}

interface NominatimResponse {
  name?: string;
  display_name?: string;
  address?: NominatimAddress;
}

/**
 * Extracts structured Barangay, Street/Area, Landmark, and formatted text from Nominatim payload.
 */
export function parseNominatimResponse(data: NominatimResponse): ReverseGeocodeResult {
  const addr = data.address || {};

  // 1. Resolve Barangay from geographic administrative divisions
  const barangayCandidates = [
    addr.quarter,
    addr.suburb,
    addr.village,
    addr.neighbourhood,
    addr.city_district,
    addr.hamlet,
  ];

  let matchedBarangay = findMatchingBarangay(barangayCandidates);

  // If no exact match from Butuan list, fallback to first non-city administrative candidate if in Butuan
  if (!matchedBarangay) {
    for (const cand of barangayCandidates) {
      if (cand && typeof cand === "string" && cand.toLowerCase() !== "butuan" && cand.toLowerCase() !== "poblacion") {
        matchedBarangay = cand.trim();
        break;
      }
    }
  }

  // 2. Resolve Street / Area
  const road = addr.road || addr.pedestrian || addr.street || addr.footway || addr.path || "";
  let streetArea = road.trim();

  // If there is a neighborhood/subdivision name that isn't the barangay, optionally append it
  if (addr.neighbourhood && (!matchedBarangay || normalizeBarangayName(addr.neighbourhood) !== normalizeBarangayName(matchedBarangay))) {
    if (streetArea) {
      streetArea = `${streetArea}, ${addr.neighbourhood.trim()}`;
    } else {
      streetArea = addr.neighbourhood.trim();
    }
  }

  // 3. Resolve Landmark / POI
  let landmark: string | null = null;
  const poiName = data.name?.trim();
  const amenity = addr.amenity || addr.building || addr.shop || addr.tourism || addr.historic || addr.office;

  if (poiName && poiName !== road && poiName !== matchedBarangay && poiName !== "Butuan") {
    landmark = poiName;
  } else if (amenity && amenity !== road) {
    landmark = amenity.trim();
  }

  // 4. Formatted Display Address
  let formattedAddress = data.display_name || "";
  if (!formattedAddress) {
    const parts = [landmark, streetArea, matchedBarangay, "Butuan City"].filter(Boolean);
    formattedAddress = parts.join(", ");
  }

  return {
    barangay: matchedBarangay,
    streetArea: streetArea || null,
    landmark,
    formattedAddress,
  };
}

/**
 * Calls OpenStreetMap Nominatim reverse geocoding with custom User-Agent and timeout.
 */
export async function reverseGeocodeCoordinates(
  lat: number,
  lng: number,
  timeoutMs = 6000
): Promise<ReverseGeocodeResult | null> {
  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }

  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
    lat
  )}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "ButuanReport-App/1.0 (https://butuanreport.gov.ph; support@butuanreport.gov.ph)",
      },
      next: { revalidate: 3600 }, // Cache reverse geocode hits on the server for 1 hour
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`Reverse geocoding HTTP ${res.status}: ${res.statusText}`);
      return null;
    }

    const json = (await res.json()) as NominatimResponse;
    return parseNominatimResponse(json);
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    console.warn("Reverse geocode request failed or timed out:", err instanceof Error ? err.message : err);
    return null;
  }
}
