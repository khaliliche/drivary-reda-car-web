"use server";

import { createReservation } from "@/lib/api-client";

type WhatsAppData = {
  vehicleLabel: string;
  fullName: string;
  age: number;
  cinNumber: string;
  licenseIssueDate: string;
  driverAddress: string;
  driverPhone: string;
  driverLicenseNumber: string;
  driverPassportNumber: string;
  hasSecondDriver: boolean;
  secondDriverFullName?: string;
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
        fullName: "",
        age: 0,
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

  const result = await createReservation({
    vehicle_id: Number(formData.get("vehicle_id")),
    vehicle_label: "",
    full_name: String(formData.get("full_name") || "").trim(),
    age: Number(formData.get("age")),
    cin_number: String(formData.get("cin_number") || "").trim(),
    license_issue_date: String(formData.get("license_issue_date") || ""),
    driver_address: String(formData.get("driver_address") || "").trim(),
    driver_phone: String(formData.get("driver_phone") || "").trim(),
    driver_license_number: String(formData.get("driver_license_number") || "").trim(),
    driver_passport_number: String(formData.get("driver_passport_number") || "").trim(),
    has_second_driver: hasSecondDriver,
    second_driver_full_name: String(formData.get("second_driver_full_name") || "").trim(),
    second_driver_address: String(formData.get("second_driver_address") || "").trim(),
    second_driver_phone: String(formData.get("second_driver_phone") || "").trim(),
    second_driver_cin_number: String(formData.get("second_driver_cin_number") || "").trim(),
    second_driver_license_number: String(formData.get("second_driver_license_number") || "").trim(),
    second_driver_passport_number: String(formData.get("second_driver_passport_number") || "").trim(),
    start_date: String(formData.get("start_date") || ""),
    end_date: String(formData.get("end_date") || ""),
    start_time: String(formData.get("start_time") || ""),
    end_time: String(formData.get("end_time") || ""),
  });

  return result as ActionResult;
}