import { createFileRoute } from "@tanstack/react-router";
import { BotDetailView } from "@/features/bot/ui/bot-detail-view";

export const Route = createFileRoute("/(protected)/_layout/bots/$botId")({
  component: BotDetailView,
  staticData: {
    hideSidebar: true,
    hideMobileNav: true,
  },
});
