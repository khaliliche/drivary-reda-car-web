import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getVehicles, getVehicleBySlug } from "@/lib/api-client";
import VehicleDetailContent from "@/components/vehicules/VehicleDetailContent";

export async function generateStaticParams() {
  const vehicles = await getVehicles();

  return vehicles.map((v) => ({
    slug: v.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = await getVehicleBySlug(slug);

  if (!vehicle) {
    return {
      title: "Véhicule introuvable | Drivary Reda Car",
    };
  }

  return {
    title: `Location ${vehicle.brand} ${vehicle.model} | Drivary Reda Car`,
    description: `Louez une ${vehicle.brand} ${vehicle.model} à partir de ${vehicle.price_per_day} DH/jour avec Drivary Reda Car.`,
  };
}

export default async function VehiclePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const vehicle = await getVehicleBySlug(slug);

  if (!vehicle) {
    notFound();
  }

  return <VehicleDetailContent vehicle={vehicle} />;
}
