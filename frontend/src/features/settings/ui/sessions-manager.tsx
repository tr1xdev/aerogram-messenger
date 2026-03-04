import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import {
  Monitor,
  Smartphone,
  XCircle,
  Globe,
  ShieldAlert,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Session } from "@/entities/chat/model/types";

const GET_SESSIONS = gql`
  query GetSessions($userId: ID!) {
    sessions(userId: $userId) {
      id
      device
      ipAddress
      location
      isActive
      isCurrent
      createdAt
    }
  }
`;

const TERMINATE_SESSION = gql`
  mutation TerminateSession($id: ID!) {
    terminateSession(id: $id)
  }
`;

const TERMINATE_ALL_OTHERS = gql`
  mutation TerminateAllOtherSessions {
    terminateAllOtherSessions
  }
`;

export function SessionsManager({ userId }: { userId?: string }) {
  const [terminateId, setTerminateId] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery<{ sessions: Session[] }>(
    GET_SESSIONS,
    {
      variables: { userId },
      skip: !userId,
      notifyOnNetworkStatusChange: true,
    },
  );

  const [terminateSession] = useMutation(TERMINATE_SESSION, {
    onCompleted: () => refetch(),
  });

  const [terminateOthers, { loading: isTerminatingAll }] = useMutation(
    TERMINATE_ALL_OTHERS,
    {
      onCompleted: () => refetch(),
    },
  );

  const getDeviceIcon = (device?: string | null) => {
    const d = device?.toLowerCase() || "";
    if (d.includes("iphone") || d.includes("android") || d.includes("mobile")) {
      return <Smartphone className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  };

  const sessions = data?.sessions || [];
  const otherSessions = sessions.filter((s) => !s.isCurrent);

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h4 className="text-[13px] font-bold">Active Devices</h4>
          <p className="text-[11px] text-muted-foreground font-medium">
            Logged in instances
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => refetch()}
            disabled={loading}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
          </Button>
          {otherSessions.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              className="h-8 text-[11px] font-bold px-3 bg-destructive/10 text-destructive hover:bg-destructive/20 border-none"
              disabled={isTerminatingAll || loading}
              onClick={() => terminateOthers()}
            >
              Terminate Others
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-2">
        {loading && sessions.length === 0 ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : (
          sessions
            .slice()
            .sort((a, b) =>
              a.isCurrent === b.isCurrent ? 0 : a.isCurrent ? -1 : 1,
            )
            .map((session) => (
              <div
                key={session.id}
                className={`group flex items-center justify-between p-3.5 rounded-xl border ${
                  session.isCurrent
                    ? "bg-primary/[0.02] border-primary/20"
                    : "bg-card/50 border-border/50"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`p-2 rounded-lg ${session.isCurrent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                  >
                    {getDeviceIcon(session.device)}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold leading-none">
                        {session.device || "Unknown Device"}
                      </span>
                      {session.isCurrent && (
                        <Badge
                          variant="outline"
                          className="h-4 text-[9px] px-1.5 border-primary/30 text-primary font-bold bg-primary/5 uppercase tracking-tighter"
                        >
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium mt-1">
                      <Globe className="h-3 w-3 opacity-70" />
                      <span>
                        {session.location || "Private"} • {session.ipAddress}
                      </span>
                    </div>
                  </div>
                </div>

                {!session.isCurrent && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                    onClick={() => setTerminateId(session.id)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))
        )}
      </div>

      <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/[0.03] border border-primary/10 dark:bg-muted/20 dark:border-border/40">
        <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
          <ShieldAlert className="h-4 w-4" />
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
          If you see a session you don't recognize, terminate it immediately and{" "}
          <span className="text-foreground font-bold underline decoration-primary/30 cursor-pointer">
            change your password
          </span>{" "}
          for better security.
        </p>
      </div>

      <AlertDialog
        open={!!terminateId}
        onOpenChange={(o) => !o && setTerminateId(null)}
      >
        <AlertDialogContent className="rounded-2xl border-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">
              Terminate session?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Selected device will be logged out immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-none bg-muted font-bold text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90 rounded-xl font-bold text-xs shadow-lg shadow-destructive/20"
              onClick={async () => {
                if (terminateId) {
                  await terminateSession({ variables: { id: terminateId } });
                  setTerminateId(null);
                }
              }}
            >
              Terminate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
