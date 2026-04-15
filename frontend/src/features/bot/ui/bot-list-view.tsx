import * as React from "react";
import { graphql, useLazyLoadQuery, useFragment } from "react-relay";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useDeferredValue, useMemo, useState, type ReactNode } from "react";
import { BotCard } from "./bot-card";
import { BotListHeader } from "./bot-list-header";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchX, Terminal } from "lucide-react";

import type {
  botListViewQuery,
  botListViewQuery$data,
} from "./__generated__/botListViewQuery.graphql";
import type {
  botListView_user$key,
  botListView_user$data,
} from "./__generated__/botListView_user.graphql";

const BotUserFragment = graphql`
  fragment botListView_user on User {
    id
    username
    firstName
    lastName
    botDescription
    photoUrl
    status
    isVerified
  }
`;

const BotListQuery = graphql`
  query botListViewQuery {
    myBots {
      id
      username
      firstName
      photoUrl
      ...botListView_user
    }
  }
`;

type BotNode = NonNullable<botListViewQuery$data["myBots"]>[number];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

export const BotListView: React.FC = (): ReactNode => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const deferredSearch: string = useDeferredValue(searchQuery);

  const data = useLazyLoadQuery<botListViewQuery>(
    BotListQuery,
    {},
    { fetchPolicy: "store-and-network" },
  );

  const bots = useMemo((): readonly BotNode[] => {
    return data.myBots ?? [];
  }, [data.myBots]);

  const filteredBots = useMemo((): readonly BotNode[] => {
    const q: string = deferredSearch.toLowerCase().trim();
    if (!q) return bots;

    return bots.filter((bot: BotNode): boolean => {
      const name: string = bot.firstName?.toLowerCase() ?? "";
      const username: string = bot.username?.toLowerCase() ?? "";
      return name.includes(q) || username.includes(q);
    });
  }, [bots, deferredSearch]);

  return (
    <div className="h-full w-full overflow-y-auto bg-background selection:bg-primary/10">
      <div className="container mx-auto max-w-5xl px-4 py-8 lg:py-16">
        <BotListHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <div className="mt-8 relative border border-border/40 rounded-[32px] bg-muted/5 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 items-start">
            <AnimatePresence mode="popLayout" initial={false}>
              {filteredBots.length > 0 ? (
                <motion.div
                  key="list-layer"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="col-start-1 row-start-1 divide-y divide-border/20 w-full"
                >
                  {filteredBots.map((bot: BotNode, idx: number) => (
                    <BotItem key={bot.id} botRef={bot} index={idx} />
                  ))}
                </motion.div>
              ) : (
                <EmptyState
                  key="empty-layer"
                  isSearch={searchQuery.length > 0}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

interface BotItemProps {
  botRef: botListView_user$key;
  index: number;
}

const BotItem: React.FC<BotItemProps> = React.memo(
  ({ botRef, index }): ReactNode => {
    const bot: botListView_user$data = useFragment(BotUserFragment, botRef);

    return (
      <motion.div
        layoutId={index < 5 ? `card-${bot.id}` : undefined}
        variants={itemVariants}
        className="bg-background/40 backdrop-blur-sm transition-all hover:bg-muted/20 active:scale-[0.99] cursor-pointer"
      >
        <BotCard
          id={bot.id}
          username={bot.username}
          firstName={bot.firstName}
          photoUrl={bot.photoUrl ?? undefined}
          description={bot.botDescription ?? undefined}
        />
      </motion.div>
    );
  },
);

const EmptyState: React.FC<{ isSearch: boolean }> = ({
  isSearch,
}): ReactNode => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="col-start-1 row-start-1 py-32 flex flex-col items-center justify-center text-center"
  >
    <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-4 text-muted-foreground/40">
      {isSearch ? (
        <SearchX className="h-6 w-6" />
      ) : (
        <Terminal className="h-6 w-6" />
      )}
    </div>
    <div className="text-muted-foreground/30 text-[11px] font-bold uppercase tracking-[0.3em]">
      {isSearch ? "No matching modules" : "Registry is empty"}
    </div>
  </motion.div>
);

export const BotListSkeleton: React.FC = (): ReactNode => (
  <div className="divide-y divide-border/10 w-full">
    {[1, 2, 3, 4].map((i: number) => (
      <div key={`skel-${i}`} className="flex items-center gap-4 p-5">
        <Skeleton className="h-12 w-12 rounded-2xl shrink-0 opacity-20" />
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-4 w-32 opacity-30" />
          <Skeleton className="h-3 w-56 opacity-10" />
        </div>
        <Skeleton className="h-8 w-20 rounded-xl opacity-5" />
      </div>
    ))}
  </div>
);
