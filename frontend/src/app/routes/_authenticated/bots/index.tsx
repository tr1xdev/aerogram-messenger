import { createFileRoute } from "@tanstack/react-router";
import { BotListView } from "@/features/bot/ui/bot-list-view";

export const Route = createFileRoute("/_authenticated/bots/")({
  component: BotListView,
  staticData: {
    hideSidebar: true,
    hideMobileNav: true,
  },
});
