import { getVehicles } from "@/lib/api-client";
import VehicleCard from "@/components/home/VehicleCard";

type SearchParams = {
  ville?: string;
  depart?: string;
  retour?: string;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const { ville, depart, retour } = params;

  // Only filter by availability when both dates are valid ISO dates
  // and the return date is not before the departure date.
  const hasValidDates = Boolean(
    depart &&
      retour &&
      ISO_DATE.test(depart) &&
      ISO_DATE.test(retour) &&
      retour >= depart
  );
  const hasSearch = Boolean(ville && hasValidDates);

  const vehicles = await getVehicles(
    hasSearch ? { startDate: depart, endDate: retour } : undefined
  );

  return (
    <main className="pb-20 pt-24 sm:pt-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10">
        <div className="max-w-2xl">
          <h1 className="font-display text-3xl font-extrabold text-[var(--color-ink)] sm:text-4xl">
            Nos véhicules
          </h1>

          {hasSearch ? (
            <p className="mt-2 font-body text-sm text-black/60 sm:mt-3 sm:text-base">
              Disponibilité à {ville} du {depart} au {retour}.
            </p>
          ) : (
            <p className="mt-2 font-body text-sm text-black/60 sm:mt-3 sm:text-base">
              Toute notre flotte.
            </p>
          )}
        </div>

        {vehicles.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-2 border border-dashed border-black/15 py-16 text-center">
            <p className="font-body text-black/60">
              {hasSearch
                ? "Aucun véhicule disponible pour ces dates."
                : "Aucun véhicule pour le moment."}
            </p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}