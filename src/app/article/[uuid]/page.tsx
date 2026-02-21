import Link from "next/link";
import { api } from "~/trpc/server";

const index = async ({ params }: { params: Promise<{ uuid: string }> }) => {
  const paramsObject = await params;
  try {
    const article = await api.articles.getFullArticle({
      uuid: paramsObject.uuid,
    });
    return <div dangerouslySetInnerHTML={{ __html: article.content }} />;
  } catch {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 px-4 text-gray-100">
        <h1 className="mb-4 text-6xl font-bold">404</h1>
        <h2 className="mb-6 text-2xl">Article Not Found</h2>
        <p className="mb-6 max-w-md text-center text-gray-400">
          Sorry, we could not find the article you are looking for. It might
          have been removed or the link is broken.
        </p>
        <Link
          href="/"
          className="rounded-md bg-gray-700 px-6 py-3 transition hover:bg-gray-600"
        >
          Go Back Home
        </Link>
      </div>
    );
  }
};

export default index;
