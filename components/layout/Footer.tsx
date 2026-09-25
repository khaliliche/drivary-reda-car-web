"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="relative overflow-hidden bg-[var(--color-ink)] pb-10 pt-14 sm:pt-20">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.04]" />

      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-red-primary)]/70 to-transparent" />

      <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[36rem] -translate-x-1/2 rounded-full bg-[var(--color-red-primary)]/10 blur-[80px]" />

      <div className="relative mx-auto max-w-6xl px-6 lg:px-10">
        <div className="mb-12 flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:justify-between">
          <Image
            src="/drivary-car-logo.png"
            alt="Drivary Car"
            width={150}
            height={50}
            className="h-10 w-auto object-contain opacity-95 transition-opacity hover:opacity-100"
          />

          <nav className="flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-8 sm:gap-y-3">
            <Link
              href="/"
              className="font-body text-sm text-white/50 transition-all duration-200 hover:text-[var(--color-red-primary)]"
            >
              {t("nav.home")}
            </Link>

            <Link
              href="/vehicules"
              className="font-body text-sm text-white/50 transition-all duration-200 hover:text-[var(--color-red-primary)]"
            >
              {t("nav.vehicles")}
            </Link>

            <Link
              href="/#comment-ca-marche"
              className="font-body text-sm text-white/50 transition-all duration-200 hover:text-[var(--color-red-primary)]"
            >
              {t("nav.howItWorks")}
            </Link>

            <Link
              href="/#a-propos"
              className="font-body text-sm text-white/50 transition-all duration-200 hover:text-[var(--color-red-primary)]"
            >
              {t("nav.about")}
            </Link>

            <Link
              href="/#contact"
              className="font-body text-sm text-white/50 transition-all duration-200 hover:text-[var(--color-red-primary)]"
            >
              {t("nav.contact")}
            </Link>
          </nav>
        </div>

        <div className="border-t border-white/[0.07] pt-8 text-center">
          <span className="font-body text-xs tracking-wide text-white/30">
            © {new Date().getFullYear()} Drivary Car. {t("footer.rights")}
          </span>
        </div>
      </div>
    </footer>
  );
}