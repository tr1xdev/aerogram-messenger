import { type ReactNode, Suspense, memo, useState, useMemo } from "react";
import { graphql, useLazyLoadQuery } from "react-relay";
import {
  Users,
  Settings as SettingsIcon,
  Image as ImageIcon,
} from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChannelSettings } from "./channel-settings";
import { ChannelSubscribers } from "./channel-subscribers";
import type {
  channelContentQuery,
  channelContentQuery$data,
} from "./__generated__/channelContentQuery.graphql";

const ChannelQuery = graphql`
  query channelContentQuery($id: ID!) {
    me {
      id
    }
    chat(id: $id) {
      __typename
      ... on Chat {
        id
        title
        slug
        photoUrl
        membersCount
        myRole
        members {
          user {
            id
            displayName
            firstName
            photoUrl
          }
          role
        }
      }
    }
    chatInvites(chatID: $id) {
      __typename
      ... on ChatInvitesList {
        invites {
          code
          inviteLink
        }
      }
    }
  }
`;

type ChatData = Extract<
  channelContentQuery$data["chat"],
  { readonly __typename: "Chat" }
>;
type ChannelMember = NonNullable<ChatData["members"]>[number];

const Header = memo(({ chat }: { chat: ChatData }) => (
  <div className="flex items-end gap-5 shrink-0 will-change-transform">
    <div className="relative group">
      <UserAvatar
        src={chat.photoUrl ?? null}
        fallback={chat.title}
        size={112}
        className="h-28 w-28 border-[4px] border-background shadow-2xl rounded-[32px] shrink-0 object-cover bg-background transition-transform duration-500 group-hover:scale-[1.02]"
      />
    </div>
    <div className="mb-2 min-w-0 flex-1">
      <h3 className="text-2xl font-bold tracking-tight text-foreground truncate mb-1">
        {chat.title}
      </h3>
      <div className="flex items-center gap-2">
        <Badge
          variant="secondary"
          className="h-5 text-[9px] uppercase font-black px-1.5 tracking-wider bg-primary/10 text-primary border-none"
        >
          Channel
        </Badge>
        {chat.slug && (
          <span className="text-sm font-bold text-muted-foreground/80">
            @{chat.slug}
          </span>
        )}
      </div>
    </div>
  </div>
));

Header.displayName = "Header";

function ChannelContentSkeleton(): ReactNode {
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="h-32 w-full bg-muted/20" />
      <div className="px-6 pb-6 -mt-12 relative z-10 flex-1">
        <div className="flex items-end gap-5">
          <Skeleton className="h-28 w-28 rounded-[32px] border-[4px] border-background" />
          <div className="mb-2 flex-1 space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
        <div className="mt-8 space-y-4">
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-[32px]" />
        </div>
      </div>
    </div>
  );
}

const ChannelDataContent = memo(
  ({ id, isPreview }: { id: string; isPreview?: boolean }): ReactNode => {
    const [activeTab, setActiveTab] = useState("members");

    const data = useLazyLoadQuery<channelContentQuery>(
      ChannelQuery,
      { id },
      { fetchPolicy: "store-or-network" },
    );

    const chat = data.chat?.__typename === "Chat" ? data.chat : null;

    const isSelfAdmin = useMemo(() => {
      const role = chat?.myRole?.toLowerCase();
      return role === "owner" || role === "admin";
    }, [chat?.myRole]);

    const activeInvite = useMemo(() => {
      const invites = data.chatInvites;
      return invites?.__typename === "ChatInvitesList"
        ? invites.invites[0]
        : null;
    }, [data.chatInvites]);

    if (!chat) return null;

    const members: readonly ChannelMember[] = chat.members ?? [];

    return (
      <div className="flex flex-col h-full bg-background select-none overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="relative h-32 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent shrink-0">
          <div className="absolute inset-0 bg-grid-white/5 opacity-20" />
        </div>

        <div className="px-6 pb-6 -mt-12 relative z-10 flex-1 flex flex-col min-h-0">
          <Header chat={chat} />

          {!isPreview && (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="mt-6 flex-1 flex flex-col min-h-0 overflow-hidden"
            >
              <TabsList className="grid grid-cols-3 w-full bg-muted/20 p-1 h-11 shrink-0 rounded-xl">
                <TabsTrigger
                  value="members"
                  className="gap-2 text-xs font-bold rounded-lg transition-all"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {chat.membersCount} Members
                  </span>
                  <span className="sm:hidden">{chat.membersCount}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="media"
                  className="gap-2 text-xs font-bold rounded-lg"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Media</span>
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  disabled={!isSelfAdmin}
                  className="gap-2 text-xs font-bold rounded-lg"
                >
                  <SettingsIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Settings</span>
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 min-h-0 relative mt-4">
                <TabsContent
                  value="members"
                  forceMount
                  className="absolute inset-0 m-0 focus-visible:outline-none data-[state=inactive]:hidden"
                >
                  {activeTab === "members" && (
                    <ChannelSubscribers
                      chatId={chat.id}
                      members={members}
                      myRole={chat.myRole || "MEMBER"}
                      currentUserId={data.me?.id ?? ""}
                    />
                  )}
                </TabsContent>

                <TabsContent
                  value="media"
                  forceMount
                  className="absolute inset-0 m-0 focus-visible:outline-none data-[state=inactive]:hidden"
                >
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 border-2 border-dashed border-muted/20 rounded-[32px]">
                    <ImageIcon className="w-10 h-10 mb-2 opacity-10" />
                    <p className="text-xs font-bold uppercase tracking-widest">
                      Empty Gallery
                    </p>
                  </div>
                </TabsContent>

                <TabsContent
                  value="settings"
                  forceMount
                  className="absolute inset-0 m-0 focus-visible:outline-none data-[state=inactive]:hidden"
                >
                  {activeTab === "settings" && (
                    <ScrollArea className="h-full w-full">
                      <div className="pr-4 pb-6">
                        <ChannelSettings
                          chat={{
                            id: chat.id,
                            title: chat.title,
                            slug: chat.slug ?? null,
                          }}
                          invite={
                            activeInvite?.inviteLink && activeInvite?.code
                              ? {
                                  inviteLink: activeInvite.inviteLink,
                                  code: activeInvite.code,
                                }
                              : null
                          }
                        />
                      </div>
                    </ScrollArea>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          )}
        </div>
      </div>
    );
  },
);

ChannelDataContent.displayName = "ChannelDataContent";

export function ChannelContent({
  id,
  isPreview,
}: {
  id: string;
  isPreview?: boolean;
}): ReactNode {
  return (
    <Suspense fallback={<ChannelContentSkeleton />}>
      <ChannelDataContent id={id} isPreview={isPreview} />
    </Suspense>
  );
}
