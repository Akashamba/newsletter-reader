import Feed from "~/app/_components/Feed";
import { api } from "~/trpc/server";

const index = async ({ params }: { params: Promise<{ uuid: string }> }) => {
  const paramsObject = await params;
  const articles = await api.articles.getArticles({
    publisherId: paramsObject.uuid,
  });
  const publisher = await api.publisher.getPublisher({
    id: paramsObject.uuid,
  });

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
        {publisher?.name}
      </h1>
      <Feed articles={articles} />
    </div>
  );
};

export default index;
