"use client";

import { RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

const SyncButton = () => {
  const router = useRouter();
  const sync = api.articles.syncWithGmail.useMutation({
    onSuccess: async () => {
      router.refresh();
    },
  });

  return (
    <button
      className="anima inline-flex cursor-pointer items-center justify-center gap-3 rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-gray-800 active:bg-gray-900"
      onClick={() => sync.mutate()}
      disabled={sync.isPending}
    >
      <RefreshCcw
        className={
          sync.isPending ? "animate-[spin_1s_linear_reverse_infinite]" : ""
        }
      />
      {sync.isPending ? "Syncing..." : "Sync"}
    </button>
  );
};

export default SyncButton;
