import { getSession } from "~/server/better-auth/server";
import { api, HydrateClient } from "~/trpc/server";
import Feed from "./_components/Feed";
import { auth } from "~/server/better-auth";
import { headers } from "next/headers";
import SyncButton from "./_components/SyncButton";
import type Article from "~/types/articles";
import SignedOutPage from "./_components/SignedOutPage";

export default async function Home() {
  const session = await getSession();

  const handleSignOut = async () => {
    "use server";
    await auth.api.signOut({
      headers: await headers(),
    });
  };

  if (session?.user) {
    const articles: Article[] = await api.articles.getArticles();

    return (
      <HydrateClient>
        {/* Navbar */}
        <header className="p-4">
          <div className="top-row flex justify-between py-2">
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
              Home
            </h1>

            <button
              className="cursor-pointer items-center justify-center gap-3 rounded-2xl bg-white px-3 py-1 text-base font-semibold text-[#111]"
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </div>

          <div className="my-2 flex justify-end">
            <SyncButton />
          </div>
        </header>

        {/* Content */}
        {articles.length > 0 ? (
          <Feed articles={articles} />
        ) : (
          <div className="flex h-full justify-center">Sync to add emails</div>
        )}
      </HydrateClient>
    );
  }

  return <SignedOutPage />;
}
