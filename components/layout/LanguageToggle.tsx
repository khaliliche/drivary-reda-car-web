"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Language } from "@/lib/i18n/translations";

const options: Language[] = ["fr", "en", "ar"];

export default function LanguageToggle({
  variant = "desktop",
}: {
  variant?: "desktop" | "mobile";
}) {
  const { language, setLanguage, t } = useLanguage();

  const baseButton =
    "rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-200";

  const wrapperClass =
    variant === "desktop"
      ? "flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.06] p-1 shadow-inner shadow-black/20"
      : "flex items-center gap-1 self-start rounded-full border border-white/15 bg-white/[0.06] p-1 shadow-inner shadow-black/20";

  return (
    <div className={wrapperClass} role="group" aria-label="Language switcher">
      {options.map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => setLanguage(lang)}
          className={`${baseButton} ${
            language === lang
              ? "bg-[var(--color-red-primary)] text-white shadow-md shadow-[var(--color-red-primary)]/30"
              : "text-white/55 hover:bg-white/5 hover:text-white"
          }`}
          aria-pressed={language === lang}
        >
          {t(`languageToggle.${lang}`)}
        </button>
      ))}
    </div>
  );
}