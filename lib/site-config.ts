export const siteConfig = {
  name: "Drivary Car",
  tagline: "Location de voitures au Maroc",
  phone: "+212 6 60 05 61 93",
  whatsappNumber: "212660056193",
  instagram: "https://www.instagram.com/location_drivary_car/",
  nav: [
    { label: "Accueil", href: "/" },
    { label: "Nos vehicules", href: "/vehicules" },
    { label: "Comment ca marche", href: "/#comment-ca-marche" },
    { label: "A propos", href: "/#a-propos" },
    { label: "Contact", href: "/#contact" },
    { label: "Conditions générales", href: "/conditions-generales" },
  ],
};

export function buildWhatsAppLink(message: string) {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encoded}`;
}

export function buildReservationWhatsAppMessage(data: {
  vehicleLabel: string;
  prenom: string;
  nom: string;
  dateNaissance: string;
  cinNumber: string;
  licenseIssueDate: string;
  driverAddress: string;
  driverPhone: string;
  driverLicenseNumber: string;
  driverPassportNumber: string;
  hasSecondDriver: boolean;
  secondDriverPrenom?: string;
  secondDriverNom?: string;
  secondDriverCinNumber?: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
}) {
  const lines = [
    `Nouvelle demande de reservation - Drivary Car`,
    ``,
    `Vehicule : ${data.vehicleLabel}`,
    `Client : ${data.prenom} ${data.nom} (né le ${data.dateNaissance})`,
    `CIN N° : ${data.cinNumber}`,
    `N° permis : ${data.driverLicenseNumber}`,
    `Permis obtenu le : ${data.licenseIssueDate}`,
    `Passeport N° : ${data.driverPassportNumber}`,
    `Adresse : ${data.driverAddress}`,
    `Telephone : ${data.driverPhone}`,
  ];

  if (data.hasSecondDriver) {
    lines.push(
      ``,
      `2e conducteur : ${data.secondDriverPrenom ?? ""} ${data.secondDriverNom ?? ""} (CIN ${data.secondDriverCinNumber ?? ""})`
    );
  }

  lines.push(
    ``,
    `Du : ${data.startDate} a ${data.startTime}`,
    `Au : ${data.endDate} a ${data.endTime}`
  );

  return lines.join("\n");
}
