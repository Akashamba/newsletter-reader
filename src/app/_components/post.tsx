"use client";

import { useState } from "react";
import type { Article } from "~/server/db/schema";
import { api } from "~/trpc/react";

export default function Post() {
  const [article, setArticle] = useState<Article>();

  const syncOne = api.articles.syncOneArticle.useMutation();

  const syncAndFetchOneArticle = async () => {
    const newArticle: Article = (await syncOne.mutateAsync()) as Article;
    if (newArticle) {
      setArticle(newArticle);
    }
  };

  return (
    <div>
      {article ? (
        <div dangerouslySetInnerHTML={{ __html: article.content }}></div>
      ) : (
        <div>No article yet</div>
      )}

      <button onClick={syncAndFetchOneArticle} disabled={syncOne.isPending}>
        {syncOne.isPending ? "Syncing..." : "Hello"}
      </button>
    </div>
  );
}
