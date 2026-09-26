import { getVehicles } from "@/lib/api-client";
import VehiclesPageContent from "@/components/vehicules/VehiclesPageContent";

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
    <VehiclesPageContent
      vehicles={vehicles}
      ville={ville}
      depart={depart}
      retour={retour}
    />
  );
}