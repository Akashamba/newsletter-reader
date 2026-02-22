import Link from "next/link";
import type Article from "~/types/articles";

const Feed = async ({ articles }: { articles: Article[] }) => {
  return (
    <div className="min-h-screen bg-gray-900">
      {articles.map((article) => (
        <FeedPost key={article.id} article={article} />
      ))}
    </div>
  );
};

export default Feed;

const FeedPost = ({ article }: { article: Article }) => {
  return (
    <div className="block border-b border-gray-700 p-4 transition hover:bg-gray-800">
      <Link
        href={`/article/${article.uuid}`}
        className={`${!article.isRead ? "font-bold text-white" : "font-normal text-gray-300"}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="text-lg">{article.title}</div>
          <div className="shrink-0 text-xs text-gray-500">
            {formatFeedDate(article.internalDate)}
          </div>
        </div>
        <div className="mt-1 line-clamp-2 font-normal text-gray-400">
          {article.snippet}
        </div>
      </Link>
      {/* publisher info */}
      {article.publisher && (
        <div className="flex">
          <Link
            href={`/publisher/${article.publisher.id}`}
            className="content group cursor-pointer pt-4 transition"
          >
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ backgroundColor: article.publisher.defaultIconColor }}
              >
                {article.publisher.name?.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-medium text-white group-hover:underline">
                  {article.publisher?.name}
                </div>
                <div className="text-xs font-normal text-gray-400 group-hover:underline">
                  {article.publisher?.emailAddress}
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
};

export function formatFeedDate(int64UnixDate: number): string {
  const date = new Date(int64UnixDate);
  const now = new Date();

  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  // older than a week → absolute date
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: now.getFullYear() !== date.getFullYear() ? "numeric" : undefined,
  });
}
