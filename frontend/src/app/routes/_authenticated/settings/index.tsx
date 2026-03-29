import { createFileRoute } from "@tanstack/react-router";
import { useMe } from "@/features/chat/lib";
import { MobileSettingsView } from "@/features/settings/ui/mobile-settings-view";

const SettingsPage = () => {
  const { data: userData } = useMe();
  return <MobileSettingsView user={userData?.me} />;
};

export const Route = createFileRoute("/_authenticated/settings/")({
  component: SettingsPage,
});
