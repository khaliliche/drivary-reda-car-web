import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions Générales | Drivary Reda Car",
  description: "Conditions générales de location de voiture — STÉ DRIVARY CAR S.A.R.L.",
};

const articles = [
  {
    title: "Article 1 : Utilisation de la voiture",
    body: [
      "Le locataire s'engage à ne pas laisser conduire la voiture que par les personnes désignées au contrat.",
      "Il est interdit d'utiliser le véhicule à des fins illicites, pour le transport de marchandises interdites, le remorquage ou le transport de personnes à titre onéreux.",
      "Il est interdit d'utiliser le véhicule sur des pistes non goudronnées.",
    ],
  },
  {
    title: "Article 2 : État de la voiture",
    body: [
      "Le véhicule est livré en parfait état de propreté, mécanique, électrique et pneumatique, et doit être rendu dans le même état.",
      "Le nombre de kilomètres autorisé par jour est fixé à 250 km. Au-delà, un dépassement est facturé 1,40 dirham par kilomètre supplémentaire.",
      "La société décline toute responsabilité en cas de panne due à la négligence du locataire.",
      "Le locataire n'a pas droit à un véhicule de remplacement.",
    ],
  },
  {
    title: "Article 3 : Entretiens et réparations",
    body: [
      "Toute opération d'entretien ou de réparation doit être accordée au préalable par l'agence, par e-mail ou SMS.",
      "Le locataire doit vérifier les niveaux (huile, eau, liquides) si la durée de location dépasse 24 heures.",
      "Toute panne causée par la négligence du client sera facturée à sa charge.",
      "L'agence n'est pas responsable des violations liées aux feux du véhicule ni de l'absence de moyens de signalisation (triangle de panne).",
    ],
  },
  {
    title: "Article 4 : Assurance",
    body: [
      "Le véhicule est couvert par une assurance responsabilité civile uniquement. Le locataire assume l'entière responsabilité de la réparation du véhicule pendant toute la période de location.",
      "Le locataire doit immédiatement informer l'agence en cas d'accident.",
    ],
  },
  {
    title: "Article 5 : Prolongation de la location",
    body: [
      "Le paiement de la location est payable à l'avance. Toute prolongation doit être signalée au moins 2 jours à l'avance.",
      "En cas de retard de plus de 2 heures à la restitution, une journée supplémentaire complète sera facturée.",
      "La société se réserve le droit de mettre fin au contrat sans préavis ni compensation en cas de non-respect des termes du contrat.",
      "En cas de prolongation non autorisée par l'agence, le locataire devra régler une somme forfaitaire de 100 DH par heure de retard.",
    ],
  },
  {
    title: "Article 6 : Papiers de la voiture",
    body: [
      "En cas de perte des papiers du véhicule, tous les frais engendrés (immobilisation, renouvellement de papiers, etc.) sont à la charge du locataire.",
    ],
  },
  {
    title: "Article 7 : Responsabilités",
    body: [
      "Le locataire est responsable des amendes, contraventions et infractions relevées par les autorités durant la période de location.",
      "Le conducteur reste responsable financièrement des dommages causés au véhicule en cas de conduite sous l'emprise d'alcool, de drogue, ou de médicaments interdits lors de la conduite.",
      "Le locataire ne peut pas renoncer à la voiture, quelle que soit la raison de l'arrêt, sans en assumer les conséquences financières.",
      "Le client doit assumer la responsabilité de rembourser tout dégât matériel en cas d'accident ou d'absence de permis de conduire valide.",
      "Si le locataire dépasse la vitesse autorisée de 50 km/h, la société se réserve le droit de récupérer le véhicule sans justification ni indemnité.",
    ],
  },
  {
    title: "Article 8 : Droits du locataire",
    body: [
      "Tous les droits accordés au locataire en vertu du présent contrat seront exclus en cas d'accident ou de non-respect d'une clause du contrat.",
      "En cas d'accident causé par un conducteur autre que celui désigné au contrat, la société n'est pas responsable des dommages, et le locataire assume l'ensemble des conséquences.",
    ],
  },
];

export default function ConditionsGeneralesPage() {
  return (
    <main className="pb-20 pt-24 sm:pt-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-10">
        <h1 className="font-display text-3xl font-extrabold text-[var(--color-ink)] sm:text-4xl">
          Conditions Générales
        </h1>
        <p className="mt-2 font-body text-sm text-black/60">
          STÉ DRIVARY CAR S.A.R.L — Location de voitures
        </p>

        <div className="mt-10 space-y-8">
          {articles.map((article) => (
            <section key={article.title}>
              <h2 className="font-display text-lg font-bold text-[var(--color-ink)]">
                {article.title}
              </h2>
              <div className="mt-2 space-y-2">
                {article.body.map((paragraph, i) => (
                  <p key={i} className="font-body text-sm text-black/70">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
