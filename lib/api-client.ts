const API_URL = process.env.DRIVARY_API_URL!;

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

export async function getVehicles(startDate?: string, endDate?: string): Promise<Vehicle[]> {
  const params = new URLSearchParams();
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);
  const qs = params.toString();

  const res = await fetch(`${API_URL}/api/vehicles${qs ? `?${qs}` : ""}`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function getVehicleBySlug(slug: string): Promise<Vehicle | null> {
  const res = await fetch(`${API_URL}/api/vehicles/${slug}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export type CreateReservationInput = {
  vehicle_id: number;

  prenom: string;
  nom: string;
  date_naissance: string;
  cin_number: string;
  license_issue_date: string;
  driver_address: string;
  driver_phone: string;
  driver_license_number: string;
  driver_passport_number: string;

  has_second_driver: boolean;
  second_driver_prenom?: string;
  second_driver_nom?: string;
  second_driver_address?: string;
  second_driver_phone?: string;
  second_driver_cin_number?: string;
  second_driver_license_number?: string;
  second_driver_passport_number?: string;

  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
};

export type CreateReservationResult =
  | { success: true; whatsappData: Record<string, unknown> }
  | { success: false; errorCode: string; errorParams?: Record<string, string | number> };

export async function createReservation(
  data: CreateReservationInput
): Promise<CreateReservationResult> {
  const res = await fetch(`${API_URL}/api/reservations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}
