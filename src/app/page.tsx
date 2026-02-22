import { getSession } from "~/server/better-auth/server";
import { api, HydrateClient } from "~/trpc/server";
import Feed from "./_components/Feed";
import { auth } from "~/server/better-auth";
import { headers } from "next/headers";
import type Article from "~/types/articles";
import SignedOutPage from "./_components/SignedOutPage";
import Header from "./_components/Header";

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
        <Header />

        {/* Content */}
        {articles.length > 0 ? (
          <Feed articles={articles} />
        ) : (
          <div className="flex h-full justify-center">Sync to add emails</div>
        )}
      </HydrateClient>
    );
  } else {
    return <SignedOutPage />;
  }
}
