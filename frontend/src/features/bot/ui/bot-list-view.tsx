import * as React from "react";
import { useQuery } from "@apollo/client/react";
import { BotCard } from "./bot-card";
import { BotListHeader } from "./bot-list-header";
import { GET_MY_BOTS } from "@/features/bot/api";

interface BotUser {
  id: string;
  username: string;
  firstName: string;
  botDescription?: string;
  status: string;
  isVerified: boolean;
}

interface GetMyBotsData {
  myBots: BotUser[];
}

export const BotListView: React.FC = () => {
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const { data, loading, error } = useQuery<GetMyBotsData>(GET_MY_BOTS, {
    fetchPolicy: "cache-and-network",
  });

  const bots: BotUser[] = data?.myBots ?? [];

  const filteredBots: BotUser[] = bots.filter(
    (bot) =>
      bot.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bot.username.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-red-500 text-[13px]">
        Failed to load bots: {error.message}
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-background selection:bg-primary/10">
      <div className="container mx-auto max-w-5xl px-4 py-6">
        <BotListHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <div className="flex flex-col border border-muted/10 rounded-lg overflow-hidden bg-muted/5">
          {loading && bots.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground/50 text-[13px]">
              Loading your bots...
            </div>
          ) : (
            <>
              {filteredBots.map((bot) => (
                <BotCard
                  key={bot.id}
                  id={bot.id}
                  username={bot.username}
                  firstName={bot.firstName}
                  description={bot.botDescription}
                />
              ))}

              {filteredBots.length === 0 && !loading && (
                <div className="py-12 text-center text-muted-foreground/50 text-[13px] font-medium">
                  {bots.length === 0
                    ? "You haven't created any bots yet"
                    : `No bots matching "${searchQuery}"`}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
