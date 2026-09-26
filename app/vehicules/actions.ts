"use server";

import { headers } from "next/headers";
import { createReservation, extractDocumentOcr, type OcrResult } from "@/lib/api-client";

// Reads the visitor's real IP off the incoming request to this server action,
// so it can be forwarded to the api app (which never sees the browser
// directly — see lib/api-client.ts).
async function getIncomingClientIp(): Promise<string | undefined> {
  const h = await headers();
  return (
    h.get("x-real-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    undefined
  );
}
type WhatsAppData = {
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
};

type ActionResult =
  | { success: true; whatsappData: WhatsAppData }
  | { success: false; errorCode: string; errorParams?: Record<string, string | number> };

export async function createReservationAction(
  formData: FormData
): Promise<ActionResult> {
  if (String(formData.get("website") || "").trim() !== "") {
    return {
      success: true,
      whatsappData: {
        vehicleLabel: "",
        prenom: "",
        nom: "",
        dateNaissance: "",
        cinNumber: "",
        licenseIssueDate: "",
        driverAddress: "",
        driverPhone: "",
        driverLicenseNumber: "",
        driverPassportNumber: "",
        hasSecondDriver: false,
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",
      },
    };
  }

  const hasSecondDriver = formData.get("has_second_driver") === "on";
  const clientIp = await getIncomingClientIp();

  const result = await createReservation({
    vehicle_id: Number(formData.get("vehicle_id")),
    prenom: String(formData.get("prenom") || "").trim(),
    nom: String(formData.get("nom") || "").trim(),
    date_naissance: String(formData.get("date_naissance") || ""),
    cin_number: String(formData.get("cin_number") || "").trim(),
    license_issue_date: String(formData.get("license_issue_date") || ""),
    driver_address: String(formData.get("driver_address") || "").trim(),
    driver_phone: String(formData.get("driver_phone") || "").trim(),
    driver_license_number: String(formData.get("driver_license_number") || "").trim(),
    driver_passport_number: String(formData.get("driver_passport_number") || "").trim(),
    has_second_driver: hasSecondDriver,
    second_driver_prenom: String(formData.get("second_driver_prenom") || "").trim(),
    second_driver_nom: String(formData.get("second_driver_nom") || "").trim(),
    second_driver_date_naissance: String(formData.get("second_driver_date_naissance") || ""),
    second_driver_address: String(formData.get("second_driver_address") || "").trim(),
    second_driver_phone: String(formData.get("second_driver_phone") || "").trim(),
    second_driver_cin_number: String(formData.get("second_driver_cin_number") || "").trim(),
    second_driver_license_number: String(formData.get("second_driver_license_number") || "").trim(),
    second_driver_passport_number: String(formData.get("second_driver_passport_number") || "").trim(),
    start_date: String(formData.get("start_date") || ""),
    end_date: String(formData.get("end_date") || ""),
    start_time: String(formData.get("start_time") || ""),
    end_time: String(formData.get("end_time") || ""),
  }, clientIp);

  return result as ActionResult;
}

// Scans a single document photo (Carte Nationale recto/verso, permis
// recto/verso, or passport) and returns a best-effort prefill for the SAME
// customer info form the manual path uses. Never saves anything — the
// reservation is only ever created via createReservationAction above, once
// the customer has reviewed and confirmed the fields.
export async function extractOcrAction(formData: FormData): Promise<OcrResult> {
  const docType = String(formData.get("doc_type") || "");
  const image = formData.get("image");

  if (!docType || !(image instanceof Blob) || image.size === 0) {
    return { success: false, errorCode: "missingImage" };
  }

  const clientIp = await getIncomingClientIp();
  return extractDocumentOcr(docType, image, clientIp);
}