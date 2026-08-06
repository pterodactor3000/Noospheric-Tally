export default function Home() {
  return (
    <main className="flex min-h-screen items-center bg-background px-6 py-12 text-foreground sm:px-10">
      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-3xl border border-foreground/10 bg-white/70 p-8 shadow-sm backdrop-blur sm:p-12 dark:bg-black/20">
          <div className="mb-12 flex items-center justify-between gap-4">
            <p className="font-mono text-xs font-semibold tracking-[0.24em] text-foreground/70 uppercase">
              Noospheric Tally
            </p>
            <span className="inline-flex items-center gap-2 rounded-full border border-foreground/10 px-3 py-1 font-mono text-xs text-foreground/70">
              <span
                aria-hidden
                className="size-2 rounded-full bg-emerald-500"
              />
              HTTPS ready
            </span>
          </div>

          <div className="max-w-xl">
            <p className="mb-4 text-sm font-medium text-foreground/60">
              Household inventory
            </p>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              Know what is at home before you shop.
            </h1>
            <p className="mt-6 max-w-lg text-pretty text-base leading-7 text-foreground/70 sm:text-lg">
              Noospheric Tally keeps everyday supplies visible at the moment
              stock changes. The deployment foundation is in place for the
              inventory experience to follow.
            </p>
          </div>

          <div className="mt-12 grid gap-4 border-t border-foreground/10 pt-6 sm:grid-cols-2">
            <section>
              <h2 className="font-mono text-xs font-semibold tracking-[0.18em] text-foreground/60 uppercase">
                Next milestone
              </h2>
              <p className="mt-2 text-sm leading-6 text-foreground/80">
                Sign in and create a household inventory.
              </p>
            </section>
            <section>
              <h2 className="font-mono text-xs font-semibold tracking-[0.18em] text-foreground/60 uppercase">
                Platform
              </h2>
              <p className="mt-2 text-sm leading-6 text-foreground/80">
                Secure web delivery for phone-ready barcode scanning.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
