"use client";

import { useState } from "react";
import { authClient } from "~/server/better-auth/client";
import type { Article } from "~/server/db/schema";
import { api } from "~/trpc/react";

export default function Post() {
  const session = authClient.useSession();

  const [article, setArticle] = useState<Article>();
  const [articleIndex, setArticleIndex] = useState<number>(40);

  const syncOne = api.articles.syncOneArticle.useMutation();

  const syncAndFetchOneArticle = async () => {
    setArticleIndex((prev) => {
      return (prev + 1) % 200;
    });
    const newArticle: Article = (await syncOne.mutateAsync({
      index: articleIndex - 1,
    })) as Article;
    if (newArticle) {
      console.log("object", newArticle.id);
      setArticle(newArticle);
    }
  };

  if (!session.data?.user) {
    return <div>Sign In</div>;
  }

  return (
    <div>
      <button
        className="cursor-pointer rounded-full bg-black/10 px-10 py-3 font-semibold no-underline transition hover:bg-black/20"
        onClick={syncAndFetchOneArticle}
        disabled={syncOne.isPending}
      >
        {syncOne.isPending ? "Syncing..." : "Refresh"}
      </button>
      <div>{articleIndex}</div>
      {article ? (
        <div dangerouslySetInnerHTML={{ __html: article.content }}></div>
      ) : (
        <div>No article yet</div>
      )}
    </div>
  );
}
