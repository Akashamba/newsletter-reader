import React from "react";
import { Mail, Shield, RefreshCcw } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "~/server/better-auth";

export default function SignedOutPage() {
  async function handleSignIn() {
    "use server";
    const res = await auth.api.signInSocial({
      body: {
        provider: "google",
        callbackURL: "/",
      },
    });

    if (!res.url) {
      throw new Error("No URL returned from signInSocial");
    }

    redirect(res.url);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1220] to-[#0e1726] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col px-5 py-10 sm:px-6 sm:py-14 md:max-w-md lg:max-w-lg">
        {/* Header */}
        <header className="mb-10 sm:mb-14">
          <h1 className="text-2xl font-bold tracking-tight text-white/90 sm:text-3xl">
            Newsletter Reader
          </h1>
          <p className="mt-2 text-xs text-white/50 sm:text-sm">
            All your newsletters. One clean feed.
          </p>
        </header>

        {/* Main */}
        <main className="flex flex-1 flex-col justify-center">
          <div>
            <p className="mb-2 text-[11px] tracking-wider text-white/40 uppercase sm:text-xs">
              Sign in to continue
            </p>

            <h2 className="text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              Read without
              <span className="block text-white/60">inbox clutter.</span>
            </h2>

            <p className="mt-4 text-sm text-white/50 sm:text-base">
              Connect your Google account to sync and read your newsletters in a
              clean, distraction-free feed.
            </p>

            {/* CTA */}
            <div className="mt-8 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleSignIn}
                className="inline-flex cursor-pointer items-center justify-center gap-3 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-black/40 transition hover:opacity-90 sm:text-base"
              >
                <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                Continue with Google
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-white/40 sm:text-xs">
                <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Read-only access. No spam.</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="my-10 h-px w-full bg-white/10 sm:my-12" />

          {/* Features */}
          <section className="space-y-6">
            <FeatureRow
              icon={<Mail className="h-4 w-4" />}
              title="Unified feed"
              desc="All newsletters in one chronological timeline."
            />
            <FeatureRow
              icon={<RefreshCcw className="h-4 w-4" />}
              title="One-click sync"
              desc="Refresh anytime to pull in new issues."
            />
            <FeatureRow
              icon={<Shield className="h-4 w-4" />}
              title="Private by default"
              desc="Disconnect whenever you want."
            />
          </section>
        </main>

        {/* Footer */}
        <footer className="mt-12 border-t border-white/10 pt-6 text-[11px] text-white/35 sm:text-xs">
          <div className="flex items-center gap-3">
            <a href="/privacy" className="hover:text-white/60">
              Privacy Policy
            </a>
            <span>•</span>
            <a href="/terms" className="hover:text-white/60">
              Terms of Service
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}

function FeatureRow({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="border-b border-white/10 pb-4">
      <div className="mb-1 flex items-center gap-2 text-white/80">
        <div className="rounded-md bg-white/5 p-1.5 text-white/70">{icon}</div>
        <h3 className="text-sm font-semibold sm:text-base">{title}</h3>
      </div>
      <p className="text-xs text-white/50 sm:text-sm">{desc}</p>
    </div>
  );
}
