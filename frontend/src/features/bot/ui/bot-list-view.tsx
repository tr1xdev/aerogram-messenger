import * as React from "react";
import { useQuery } from "@apollo/client/react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { BotCard } from "./bot-card";
import { BotListHeader } from "./bot-list-header";
import { GET_MY_BOTS } from "@/features/bot/api";
import { Skeleton } from "@/components/ui/skeleton";

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

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.03, delayChildren: 0.01 },
  },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, scale: 0.98, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

const BotListSkeleton: React.FC = () => (
  <motion.div
    key="skeleton-view"
    variants={containerVariants}
    initial="hidden"
    animate="visible"
    exit="exit"
    className="divide-y divide-muted/5 w-full"
  >
    {[1, 2, 3].map((i: number) => (
      <motion.div
        key={`skel-${i}`}
        layoutId={`card-shadow-${i}`}
        className="flex items-center gap-4 p-4"
      >
        <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-40 opacity-40" />
        </div>
        <Skeleton className="h-8 w-16 rounded-lg opacity-30" />
      </motion.div>
    ))}
  </motion.div>
);

export const BotListView: React.FC = () => {
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const { data, loading, error } = useQuery<GetMyBotsData>(GET_MY_BOTS, {
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    notifyOnNetworkStatusChange: true,
  });

  const bots: BotUser[] = data?.myBots ?? [];

  const filteredBots: BotUser[] = React.useMemo(() => {
    const q: string = searchQuery.toLowerCase().trim();
    return q
      ? bots.filter(
          (b) =>
            b.firstName.toLowerCase().includes(q) ||
            b.username.toLowerCase().includes(q),
        )
      : bots;
  }, [bots, searchQuery]);

  const isInitialLoading: boolean = loading && bots.length === 0;

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-destructive font-medium text-[13px]">
        <div className="mb-2 opacity-50">Unable to reach registry</div>
        <div className="font-mono text-[11px] uppercase tracking-tighter">
          {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-background selection:bg-primary/10">
      <div className="container mx-auto max-w-5xl px-4 py-8 lg:py-16">
        <BotListHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <div className="mt-8 relative border border-muted/10 rounded-[24px] bg-muted/5 shadow-sm overflow-hidden">
          {/* Использование grid позволяет наложить контент друг на друга в момент анимации */}
          <div className="grid grid-cols-1 items-start">
            <AnimatePresence mode="popLayout" initial={false}>
              {isInitialLoading ? (
                <div
                  key="loader-layer"
                  className="col-start-1 row-start-1 w-full"
                >
                  <BotListSkeleton />
                </div>
              ) : filteredBots.length > 0 ? (
                <motion.div
                  key="list-layer"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="col-start-1 row-start-1 divide-y divide-muted/10 w-full"
                >
                  {filteredBots.map((bot, idx) => (
                    <motion.div
                      key={bot.id}
                      layoutId={idx < 3 ? `card-shadow-${idx + 1}` : undefined}
                      variants={itemVariants}
                      className="bg-background/40 backdrop-blur-sm transition-colors hover:bg-muted/10"
                    >
                      <BotCard
                        id={bot.id}
                        username={bot.username}
                        firstName={bot.firstName}
                        description={bot.botDescription}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="empty-layer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="col-start-1 row-start-1 py-32 text-center"
                >
                  <div className="text-muted-foreground/30 text-[11px] font-bold uppercase tracking-[0.3em]">
                    No modules found
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
