"use client";

import { useState, useTransition, useRef } from "react";
import type { Vehicle } from "@/lib/db";
import { createReservationAction, extractOcrAction } from "@/app/vehicules/actions";
import { buildWhatsAppLink, buildReservationWhatsAppMessage } from "@/lib/site-config";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { OcrExtractedFields, OcrFieldKey } from "@/lib/api-client";

type DocType = "cin_recto" | "cin_verso" | "permis_recto" | "permis_verso" | "passport";
type EntryStep = "choice" | "scanType" | "scanning" | "form";
type CustomerNationality = "moroccan" | "foreign";

type FormValues = {
  prenom: string;
  nom: string;
  date_naissance: string;
  cin_number: string;
  cin_delivered_le: string;
  driver_license_number: string;
  license_issue_date: string;
  driver_passport_number: string;
  passport_delivered_le: string;
  driver_address: string;
  driver_phone: string;
};

const EMPTY_FORM: FormValues = {
  prenom: "",
  nom: "",
  date_naissance: "",
  cin_number: "",
  cin_delivered_le: "",
  driver_license_number: "",
  license_issue_date: "",
  driver_passport_number: "",
  passport_delivered_le: "",
  driver_address: "",
  driver_phone: "",
};

const MOROCCAN_DOCS: { key: DocType; group: string; label: string }[] = [
  { key: "cin_recto", group: "Carte Nationale", label: "Scanner le recto" },
  { key: "cin_verso", group: "Carte Nationale", label: "Scanner le verso" },
  { key: "permis_recto", group: "Permis de conduire", label: "Scanner le recto" },
  { key: "permis_verso", group: "Permis de conduire", label: "Scanner le verso" },
];

const FOREIGN_DOCS: { key: DocType; group: string; label: string }[] = [
  { key: "passport", group: "Passeport", label: "Scanner le passeport" },
  { key: "permis_recto", group: "Permis de conduire", label: "Scanner le recto" },
  { key: "permis_verso", group: "Permis de conduire", label: "Scanner le verso" },
];

// Downscales/compresses a photo client-side before upload — smaller,
// faster, and well within the OCR endpoint's size limit even for a big
// phone camera photo.
async function compressImage(file: File, maxDimension = 1800, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob ?? file), "image/jpeg", quality);
  });
}

const OCR_FIELD_TO_FORM: Partial<Record<OcrFieldKey, keyof FormValues>> = {
  prenom: "prenom",
  nom: "nom",
  date_naissance: "date_naissance",
  cin_number: "cin_number",
  cin_delivered_le: "cin_delivered_le",
  driver_license_number: "driver_license_number",
  license_issue_date: "license_issue_date",
  driver_passport_number: "driver_passport_number",
  passport_delivered_le: "passport_delivered_le",
  driver_address: "driver_address",
};

export default function ReservationSection({ vehicle }: { vehicle: Vehicle }) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSecondDriver, setHasSecondDriver] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState<EntryStep>("choice");
  const [nationality, setNationality] = useState<CustomerNationality | null>(null);
  const [cameFromScan, setCameFromScan] = useState(false);

  const [formValues, setFormValues] = useState<FormValues>(EMPTY_FORM);
  const [fieldConfidence, setFieldConfidence] = useState<Partial<Record<keyof FormValues, "high" | "low">>>({});

  const [scannedDocs, setScannedDocs] = useState<Partial<Record<DocType, boolean>>>({});
  const [scanningDoc, setScanningDoc] = useState<DocType | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const fileInputRefs = useRef<Partial<Record<DocType, HTMLInputElement | null>>>({});

  function resetAll() {
    setStep("choice");
    setNationality(null);
    setCameFromScan(false);
    setFormValues(EMPTY_FORM);
    setFieldConfidence({});
    setScannedDocs({});
    setScanningDoc(null);
    setScanError(null);
    setError(null);
    setHasSecondDriver(false);
  }

  function updateField(key: keyof FormValues, value: string) {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    // Once the customer edits a field themselves, it's no longer "OCR, to verify".
    setFieldConfidence((prev) => ({ ...prev, [key]: undefined }));
  }

  function mergeExtractedFields(extracted: OcrExtractedFields) {
    setFormValues((prevValues) => {
      const next = { ...prevValues };
      setFieldConfidence((prevConfidence) => {
        const nextConfidence = { ...prevConfidence };
        for (const [ocrKey, field] of Object.entries(extracted)) {
          const formKey = OCR_FIELD_TO_FORM[ocrKey as OcrFieldKey];
          if (!formKey || !field) continue;
          const alreadyHigh = prevConfidence[formKey] === "high" && next[formKey];
          // Never silently clobber a value the customer already confirmed
          // as high-confidence (or manually typed); a fresh high-confidence
          // read can still upgrade an earlier low-confidence guess.
          if (next[formKey] && alreadyHigh) continue;
          if (next[formKey] && prevConfidence[formKey] === undefined) continue;
          next[formKey] = field.value;
          nextConfidence[formKey] = field.confidence;
        }
        return nextConfidence;
      });
      return next;
    });
  }

  async function handleScanFile(docType: DocType, file: File) {
    setScanError(null);
    setScanningDoc(docType);
    try {
      const compressed = await compressImage(file);
      const body = new FormData();
      body.set("doc_type", docType);
      body.set("image", compressed, "document.jpg");

      const result = await extractOcrAction(body);
      if (!result.success) {
        setScanError(t(`reservationErrors.${result.errorCode}`));
        return;
      }
      // TEMP DEBUG: open the browser console (F12) after a scan to see
      // exactly what Tesseract read from the document — this is what lets
      // the extraction rules get tuned against real output.
      // eslint-disable-next-line no-console
      console.log(`[OCR ${docType}] raw text:`, result.debugRawText);
      // eslint-disable-next-line no-console
      console.log(`[OCR ${docType}] extracted fields:`, result.fields);
      mergeExtractedFields(result.fields);
      setScannedDocs((prev) => ({ ...prev, [docType]: true }));
    } catch {
      setScanError(t("reservationErrors.ocrFailed"));
    } finally {
      setScanningDoc(null);
    }
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createReservationAction(formData);
      if (!result.success) {
        setError(t(`reservationErrors.${result.errorCode}`, result.errorParams));
        return;
      }
      const message = buildReservationWhatsAppMessage(result.whatsappData);
      const link = buildWhatsAppLink(message);
      setIsOpen(false);
      resetAll();
      window.open(link, "_blank", "noopener,noreferrer");
    });
  }

  const requiredDocs = nationality === "moroccan" ? MOROCCAN_DOCS : nationality === "foreign" ? FOREIGN_DOCS : [];
  const allDocsScanned = requiredDocs.length > 0 && requiredDocs.every((d) => scannedDocs[d.key]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center rounded-xl bg-[var(--color-red-primary)] px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-[var(--color-red-primary)]/25 transition-all duration-200 hover:bg-[var(--color-red-dark)] hover:shadow-[var(--color-red-primary)]/40 active:scale-[0.98]"
      >
        Réserver ce véhicule
      </button>

      <div className="safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-black/5 bg-white p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] sm:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-red-primary)] text-sm font-bold text-white transition-all active:scale-[0.98]"
        >
          Réserver - {vehicle.price_per_day} DH/j
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-[var(--color-ink)]">
                Réserver {vehicle.brand} {vehicle.model}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  resetAll();
                }}
                className="text-black/40 hover:text-black"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            {/* STEP 1 — Manual vs scan choice */}
            {step === "choice" && (
              <div className="mt-6 flex flex-col gap-4">
                <p className="text-sm font-semibold text-[var(--color-ink)]">
                  Comment souhaitez-vous renseigner vos informations ?
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCameFromScan(false);
                    setStep("form");
                  }}
                  className="rounded-xl border border-black/15 px-4 py-3 text-left text-sm font-semibold transition-colors hover:border-[var(--color-red-primary)]/60"
                >
                  Remplissage manuel
                  <span className="mt-1 block text-xs font-normal text-black/50">
                    Je remplis le formulaire moi-même.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCameFromScan(true);
                    setStep("scanType");
                  }}
                  className="rounded-xl border border-black/15 px-4 py-3 text-left text-sm font-semibold transition-colors hover:border-[var(--color-red-primary)]/60"
                >
                  Scanner mes documents
                  <span className="mt-1 block text-xs font-normal text-black/50">
                    Le système remplit le formulaire automatiquement à partir de mes documents.
                  </span>
                </button>
              </div>
            )}

            {/* STEP 2 — Nationality choice */}
            {step === "scanType" && (
              <div className="mt-6 flex flex-col gap-4">
                <p className="text-sm font-semibold text-[var(--color-ink)]">Vous êtes :</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setNationality("moroccan");
                      setStep("scanning");
                    }}
                    className="rounded-xl border border-black/15 px-4 py-3 text-sm font-semibold transition-colors hover:border-[var(--color-red-primary)]/60"
                  >
                    Marocain
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNationality("foreign");
                      setStep("scanning");
                    }}
                    className="rounded-xl border border-black/15 px-4 py-3 text-sm font-semibold transition-colors hover:border-[var(--color-red-primary)]/60"
                  >
                    Étranger
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setStep("choice")}
                  className="self-start text-xs font-semibold text-black/50 hover:text-black"
                >
                  ◀ Retour
                </button>
              </div>
            )}

            {/* STEP 3 — Document scanning */}
            {step === "scanning" && (
              <div className="mt-6 flex flex-col gap-4">
                <p className="text-sm text-black/60">
                  Scannez vos documents un par un. Vous pourrez vérifier et corriger toutes les
                  informations avant de confirmer.
                </p>

                {Object.entries(
                  requiredDocs.reduce<Record<string, typeof requiredDocs>>((acc, doc) => {
                    (acc[doc.group] ||= []).push(doc);
                    return acc;
                  }, {})
                ).map(([group, docs]) => (
                  <div key={group} className="rounded-lg border border-black/10 p-3">
                    <p className="mb-2 text-sm font-semibold">{group}</p>
                    <div className="flex flex-col gap-2">
                      {docs.map((doc) => {
                        const done = Boolean(scannedDocs[doc.key]);
                        const scanning = scanningDoc === doc.key;
                        return (
                          <div key={doc.key} className="flex items-center justify-between gap-2">
                            <button
                              type="button"
                              disabled={scanning}
                              onClick={() => fileInputRefs.current[doc.key]?.click()}
                              className={`flex-1 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors ${
                                done
                                  ? "border-green-200 bg-green-50 text-green-700"
                                  : "border-black/15 hover:border-[var(--color-red-primary)]/60"
                              } disabled:opacity-60`}
                            >
                              {scanning ? "Lecture en cours..." : done ? `✓ ${doc.label}` : doc.label}
                            </button>
                            <input
                              ref={(el) => {
                                fileInputRefs.current[doc.key] = el;
                              }}
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                e.target.value = "";
                                if (file) void handleScanFile(doc.key, file);
                              }}
                            />
                            {done && (
                              <button
                                type="button"
                                onClick={() => fileInputRefs.current[doc.key]?.click()}
                                className="text-xs font-semibold text-black/50 hover:text-black"
                              >
                                Reprendre
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {scanError && (
                  <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
                    {scanError}
                  </p>
                )}

                <button
                  type="button"
                  disabled={!allDocsScanned}
                  onClick={() => setStep("form")}
                  className="mt-2 rounded-xl bg-[var(--color-red-primary)] px-4 py-3 font-semibold text-white shadow-lg shadow-[var(--color-red-primary)]/25 transition-all hover:bg-[var(--color-red-dark)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continuer
                </button>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <button type="button" onClick={() => setStep("scanType")} className="text-black/50 hover:text-black">
                    ◀ Retour
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCameFromScan(false);
                      setStep("form");
                    }}
                    className="text-black/50 hover:text-black"
                  >
                    Remplir manuellement à la place
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4 — Customer info form (SAME form/fields for both paths) */}
            {step === "form" && (
              <form action={handleSubmit} className="mt-4 flex flex-col gap-4">
                <input type="hidden" name="vehicle_id" value={vehicle.id} />

                <input
                  type="text"
                  name="website"
                  autoComplete="off"
                  tabIndex={-1}
                  aria-hidden="true"
                  className="hidden"
                />

                {cameFromScan && (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    Vérifiez les informations ci-dessous et corrigez si besoin avant de confirmer.
                    {" "}
                    Les champs marqués <span className="font-semibold">à vérifier</span> ont une lecture
                    incertaine.
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-semibold">
                      Prénom
                      {fieldConfidence.prenom === "low" && (
                        <span className="ml-1 text-xs font-normal text-amber-600">à vérifier</span>
                      )}
                    </span>
                    <input
                      type="text"
                      name="prenom"
                      required
                      value={formValues.prenom}
                      onChange={(e) => updateField("prenom", e.target.value)}
                      className="rounded-lg border border-black/15 px-3 py-2"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-semibold">
                      Nom
                      {fieldConfidence.nom === "low" && (
                        <span className="ml-1 text-xs font-normal text-amber-600">à vérifier</span>
                      )}
                    </span>
                    <input
                      type="text"
                      name="nom"
                      required
                      value={formValues.nom}
                      onChange={(e) => updateField("nom", e.target.value)}
                      className="rounded-xl border border-black/10 bg-[var(--color-paper)] px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-red-primary)]/60 focus:ring-2 focus:ring-[var(--color-red-primary)]/15"
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold">
                    Date de naissance
                    {fieldConfidence.date_naissance === "low" && (
                      <span className="ml-1 text-xs font-normal text-amber-600">à vérifier</span>
                    )}
                  </span>
                  <input
                    type="date"
                    name="date_naissance"
                    required
                    value={formValues.date_naissance}
                    onChange={(e) => updateField("date_naissance", e.target.value)}
                    className="rounded-lg border border-black/15 px-3 py-2"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold">
                    Numéro de carte nationale (CIN)
                    {fieldConfidence.cin_number === "low" && (
                      <span className="ml-1 text-xs font-normal text-amber-600">à vérifier</span>
                    )}
                  </span>
                  <input
                    type="text"
                    name="cin_number"
                    required
                    value={formValues.cin_number}
                    onChange={(e) => updateField("cin_number", e.target.value)}
                    className="rounded-lg border border-black/15 px-3 py-2"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-black/60">
                    CIN délivrée le <span className="font-normal">(optionnel)</span>
                  </span>
                  <input
                    type="date"
                    name="cin_delivered_le"
                    value={formValues.cin_delivered_le}
                    onChange={(e) => updateField("cin_delivered_le", e.target.value)}
                    className="rounded-lg border border-black/15 px-3 py-2"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold">
                    Numéro de permis de conduire
                    {fieldConfidence.driver_license_number === "low" && (
                      <span className="ml-1 text-xs font-normal text-amber-600">à vérifier</span>
                    )}
                  </span>
                  <input
                    type="text"
                    name="driver_license_number"
                    required
                    value={formValues.driver_license_number}
                    onChange={(e) => updateField("driver_license_number", e.target.value)}
                    className="rounded-lg border border-black/15 px-3 py-2"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold">
                    Date d&apos;obtention du permis
                    {fieldConfidence.license_issue_date === "low" && (
                      <span className="ml-1 text-xs font-normal text-amber-600">à vérifier</span>
                    )}
                  </span>
                  <input
                    type="date"
                    name="license_issue_date"
                    required
                    value={formValues.license_issue_date}
                    onChange={(e) => updateField("license_issue_date", e.target.value)}
                    className="rounded-lg border border-black/15 px-3 py-2"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold">
                    Numéro de passeport
                    {fieldConfidence.driver_passport_number === "low" && (
                      <span className="ml-1 text-xs font-normal text-amber-600">à vérifier</span>
                    )}
                  </span>
                  <input
                    type="text"
                    name="driver_passport_number"
                    required
                    value={formValues.driver_passport_number}
                    onChange={(e) => updateField("driver_passport_number", e.target.value)}
                    className="rounded-lg border border-black/15 px-3 py-2"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-black/60">
                    Passeport délivré le <span className="font-normal">(optionnel)</span>
                  </span>
                  <input
                    type="date"
                    name="passport_delivered_le"
                    value={formValues.passport_delivered_le}
                    onChange={(e) => updateField("passport_delivered_le", e.target.value)}
                    className="rounded-lg border border-black/15 px-3 py-2"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold">
                    Adresse
                    {fieldConfidence.driver_address === "low" && (
                      <span className="ml-1 text-xs font-normal text-amber-600">à vérifier</span>
                    )}
                  </span>
                  <input
                    type="text"
                    name="driver_address"
                    required
                    value={formValues.driver_address}
                    onChange={(e) => updateField("driver_address", e.target.value)}
                    className="rounded-lg border border-black/15 px-3 py-2"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold">Téléphone</span>
                  <input
                    type="tel"
                    name="driver_phone"
                    required
                    value={formValues.driver_phone}
                    onChange={(e) => updateField("driver_phone", e.target.value)}
                    className="rounded-lg border border-black/15 px-3 py-2"
                  />
                </label>

                <label className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    name="has_second_driver"
                    checked={hasSecondDriver}
                    onChange={(e) => setHasSecondDriver(e.target.checked)}
                    className="h-4 w-4 rounded border-black/25"
                  />
                  <span className="text-sm font-semibold">Ajouter un 2e conducteur</span>
                </label>

                {hasSecondDriver && (
                  <div className="flex flex-col gap-4 rounded-lg border border-black/10 bg-black/[0.02] p-3">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1">
                        <span className="text-sm font-semibold">Prénom (2e conducteur)</span>
                        <input
                          type="text"
                          name="second_driver_prenom"
                          required={hasSecondDriver}
                          className="rounded-lg border border-black/15 bg-white px-3 py-2"
                        />
                      </label>

                      <label className="flex flex-col gap-1">
                        <span className="text-sm font-semibold">Nom (2e conducteur)</span>
                        <input
                          type="text"
                          name="second_driver_nom"
                          required={hasSecondDriver}
                          className="rounded-lg border border-black/15 bg-white px-3 py-2"
                        />
                      </label>
                    </div>

                    <label className="flex flex-col gap-1">
                      <span className="text-sm font-semibold">CIN (2e conducteur)</span>
                      <input
                        type="text"
                        name="second_driver_cin_number"
                        required={hasSecondDriver}
                        className="rounded-lg border border-black/15 bg-white px-3 py-2"
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-sm font-semibold">Téléphone (2e conducteur)</span>
                      <input
                        type="tel"
                        name="second_driver_phone"
                        className="rounded-lg border border-black/15 bg-white px-3 py-2"
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-sm font-semibold">Adresse (2e conducteur)</span>
                      <input
                        type="text"
                        name="second_driver_address"
                        className="rounded-lg border border-black/15 bg-white px-3 py-2"
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-sm font-semibold">Numéro de permis (2e conducteur)</span>
                      <input
                        type="text"
                        name="second_driver_license_number"
                        className="rounded-lg border border-black/15 bg-white px-3 py-2"
                      />
                    </label>

                    <label className="flex flex-col gap-1">
                      <span className="text-sm font-semibold">Numéro de passeport (2e conducteur)</span>
                      <input
                        type="text"
                        name="second_driver_passport_number"
                        className="rounded-lg border border-black/15 bg-white px-3 py-2"
                      />
                    </label>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-semibold">Du</span>
                    <input
                      type="date"
                      name="start_date"
                      required
                      className="rounded-lg border border-black/15 px-3 py-2"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-semibold">Au</span>
                    <input
                      type="date"
                      name="end_date"
                      required
                      className="rounded-lg border border-black/15 px-3 py-2"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-semibold">Heure de prise en charge</span>
                    <input
                      type="time"
                      name="start_time"
                      defaultValue="10:00"
                      required
                      className="rounded-lg border border-black/15 px-3 py-2"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-semibold">Heure de retour</span>
                    <input
                      type="time"
                      name="end_time"
                      defaultValue="10:00"
                      required
                      className="rounded-lg border border-black/15 px-3 py-2"
                    />
                  </label>
                </div>

                {error && (
                  <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isPending}
                  className="mt-2 rounded-xl bg-[var(--color-red-primary)] px-4 py-3 font-semibold text-white shadow-lg shadow-[var(--color-red-primary)]/25 transition-all hover:bg-[var(--color-red-dark)] disabled:opacity-60"
                >
                  {isPending ? "Envoi..." : "Confirmer et envoyer sur WhatsApp"}
                </button>

                <button
                  type="button"
                  onClick={() => resetAll()}
                  className="self-center text-xs font-semibold text-black/50 hover:text-black"
                >
                  ◀ Recommencer
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}