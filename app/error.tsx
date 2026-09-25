"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center bg-[var(--color-mist)] px-6 py-24 text-center">
      <div className="w-full max-w-md rounded-3xl border border-black/[0.06] bg-white p-8 shadow-[var(--shadow-card)] sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-red-primary)]/10 text-[var(--color-red-dark)]">
          !
        </div>

        <h1 className="mt-6 font-display text-3xl font-extrabold text-[var(--color-ink)]">
          Une erreur est survenue
        </h1>

        <p className="mt-3 font-body text-black/60">
          Something went wrong while loading this page.
        </p>

        <button
          onClick={reset}
          className="mt-8 rounded-full bg-[var(--color-ink)] px-8 py-3 font-body text-sm font-semibold text-white transition-all hover:bg-[var(--color-red-dark)] hover:shadow-lg"
        >
          Réessayer
        </button>
      </div>
    </main>
  );
}