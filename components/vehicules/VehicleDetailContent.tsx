"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

import type { Vehicle } from "@/lib/db";
import ReservationSection from "@/components/vehicules/ReservationSection";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function VehicleDetailContent({ vehicle }: { vehicle: Vehicle }) {
  const { t } = useLanguage();

  return (
    <main className="pb-28 pt-28 sm:pb-20 sm:pt-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10">
        <Link
          href="/vehicules"
          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black/60 shadow-sm transition-all hover:border-black/25 hover:text-black hover:shadow"
        >
          <ArrowLeft size={16} />
          {t("vehicleDetail.back")}
        </Link>

        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-14">
          <div className="relative aspect-[16/11] overflow-hidden rounded-3xl bg-[var(--color-ink)] shadow-[var(--shadow-lift)] ring-1 ring-black/[0.06] sm:aspect-[16/10] lg:aspect-[4/3]">
            {vehicle.image_url ? (
              <Image
                src={vehicle.image_url}
                alt={`${vehicle.brand} ${vehicle.model}`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 58vw"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-body text-sm text-white/40">
                {t("vehicleDetail.noPhoto")}
              </div>
            )}

            <div className="absolute bottom-5 left-5 rounded-2xl border border-white/10 bg-[var(--color-ink)]/90 px-5 py-3 shadow-xl backdrop-blur-sm">
              <p className="font-display text-2xl font-extrabold leading-none text-[var(--color-gold)]">
                {vehicle.price_per_day} DH
              </p>
              <p className="mt-1 font-body text-xs text-white/60">{t("vehicleDetail.perDay")}</p>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-red-primary)]">
                {vehicle.brand}
              </p>

              <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-[var(--color-ink)] sm:text-5xl">
                {vehicle.brand} {vehicle.model}
              </h1>

              <span
                className="mt-4 block h-1 w-14 rounded-full bg-[var(--color-red-primary)]"
                aria-hidden="true"
              />
            </div>

            {vehicle.description && (
              <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[var(--shadow-card)]">
                <p className="whitespace-pre-line font-body leading-relaxed text-black/70">
                  {vehicle.description}
                </p>
              </div>
            )}

            <ReservationSection vehicle={vehicle} />
          </div>
        </div>
      </div>
    </main>
  );
}