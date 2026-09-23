const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  "http://localhost:3001";

export type Vehicle = {
  id: string;
  slug: string;
  name?: string;
  brand?: string;
  model?: string;
  category?: string;
  transmission?: string;
  seats?: number;
  pricePerDay?: number;
  price?: number;
  imageUrl?: string;
  images?: string[];
  [key: string]: unknown;
};

export async function getVehicles(
  params?: {
    category?: string;
    transmission?: string;
    seats?: number;
  },
  transmission?: string
): Promise<Vehicle[]> {
  const searchParams = new URLSearchParams();

  if (typeof params === "string") {
    searchParams.set("category", params);
    if (transmission) searchParams.set("transmission", transmission);
  } else {
    if (params?.category) searchParams.set("category", params.category);
    if (params?.transmission) {
      searchParams.set("transmission", params.transmission);
    }
    if (params?.seats) searchParams.set("seats", String(params.seats));
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

export async function createReservation(data: Record<string, unknown>) {
  const res = await fetch(`${API_URL}/api/reservations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to create reservation");
  }

  return res.json();
}