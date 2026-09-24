const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  "http://localhost:3001";

// Mirrors the Vehicle row returned by the API (snake_case, straight from Postgres).
export type Vehicle = {
  id: number;
  slug: string;
  brand: string;
  model: string;
  price_per_day: number;
  price_extended_15: number;
  price_monthly_30: number;
  min_rental_days: number;
  description: string | null;
  image_url: string | null;
  created_at: string;
};

type VehicleFilters = {
  // ISO dates (YYYY-MM-DD). Both are required for availability filtering.
  startDate?: string;
  endDate?: string;
};

export async function getVehicles(
  filters?: VehicleFilters
): Promise<Vehicle[]> {
  const searchParams = new URLSearchParams();

  if (filters?.startDate && filters?.endDate) {
    searchParams.set("start_date", filters.startDate);
    searchParams.set("end_date", filters.endDate);
  }

  const qs = searchParams.toString();

  try {
    const res = await fetch(
      `${API_URL}/api/vehicles${qs ? `?${qs}` : ""}`,
      { cache: "no-store" }
    );

    if (!res.ok) return [];

    return res.json();
  } catch {
    return [];
  }
}

export async function getVehicleBySlug(
  slug: string
): Promise<Vehicle | null> {
  try {
    const res = await fetch(
      `${API_URL}/api/vehicles/${encodeURIComponent(slug)}`,
      { cache: "no-store" }
    );

    if (!res.ok) return null;

    return res.json();
  } catch {
    return null;
  }
}

export type ReservationResult =
  | { success: true; whatsappData: Record<string, unknown> }
  | {
      success: false;
      errorCode: string;
      errorParams?: Record<string, string | number>;
    };

export async function createReservation(
  data: Record<string, unknown>
): Promise<ReservationResult> {
  try {
    const res = await fetch(`${API_URL}/api/reservations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      cache: "no-store",
    });

    // The API sends { success: false, errorCode, errorParams? } with a 4xx status.
    // Read the body even when res.ok is false so the code reaches the form.
    const body: unknown = await res.json().catch(() => null);

    if (
      body &&
      typeof body === "object" &&
      "success" in body &&
      typeof (body as { success: unknown }).success === "boolean"
    ) {
      return body as ReservationResult;
    }

    // Non-JSON or unexpected response (e.g. a 500 error page)
    return { success: false, errorCode: "serverError" };
  } catch {
    // API unreachable
    return { success: false, errorCode: "serverError" };
  }
}