import { createFileRoute } from "@tanstack/react-router";
import { useMe } from "@/features/chat/lib";
import { MobileSettingsView } from "@/features/settings/ui/mobile-settings-view";
import { type ReactNode } from "react";
import { type User } from "@/entities/chat/model/types";

const SettingsPage = (): ReactNode => {
  const meData = useMe();

  return <MobileSettingsView user={meData?.me as unknown as User} />;
};

export const Route = createFileRoute("/_authenticated/settings/")({
  component: SettingsPage,
});
