import { NextRequest, NextResponse } from "next/server";
import { reverseGeocodeCoordinates } from "@/lib/geocoding";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const latStr = searchParams.get("lat");
  const lngStr = searchParams.get("lng");

  if (!latStr || !lngStr) {
    return NextResponse.json(
      { success: false, error: "Latitude and longitude query parameters are required." },
      { status: 400 }
    );
  }

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json(
      { success: false, error: "Invalid coordinate values provided." },
      { status: 400 }
    );
  }

  try {
    const result = await reverseGeocodeCoordinates(lat, lng);

    if (!result) {
      return NextResponse.json({
        success: false,
        error: "Address could not be determined for the selected coordinates.",
      });
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: unknown) {
    console.error("Geocoding API error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to reverse geocode location." },
      { status: 500 }
    );
  }
}
