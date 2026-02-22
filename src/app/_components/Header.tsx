import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./shadcn/dropdown-menu";
import { Button } from "./shadcn/Button";
import { Avatar, AvatarFallback, AvatarImage } from "./shadcn/avatar";
import { headers } from "next/headers";
import SyncButton from "./SyncButton";
import { getSession } from "~/server/better-auth/server";
import type { User } from "better-auth";
import { auth } from "~/server/better-auth";
import { ChevronRight } from "lucide-react";

const Header = async () => {
  const session = await getSession();

  return (
    <header className="p-4">
      <div className="top-row flex justify-between py-2">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
          Home
        </h1>

        {session?.user && <UserAvatarWithMenu user={session?.user} />}
      </div>

      <div className="my-2 flex justify-start">
        <SyncButton />
      </div>
    </header>
  );
};

export default Header;

const UserAvatarWithMenu = async ({ user }: { user: User }) => {
  const handleSignOut = async () => {
    "use server";
    await auth.api.signOut({
      headers: await headers(),
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar>
            <AvatarImage src={user.image ?? ""} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem className="flex items-center gap-2 py-2" disabled>
          <div className="w-full">
            <span className="flex items-center truncate text-sm text-gray-600 group-hover:text-gray-600">
              View Profile <ChevronRight />
            </span>
            <div className="truncate">{user.email}</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem disabled>Settings</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={handleSignOut}
            variant="destructive"
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
