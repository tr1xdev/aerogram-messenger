import { useState, useCallback, Suspense, useMemo } from "react";
import type { ReactElement } from "react";
import { graphql, useLazyLoadQuery, useMutation } from "react-relay";
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
import type { sessionsManagerQuery } from "./__generated__/sessionsManagerQuery.graphql";
import type { sessionsManagerTerminateMutation } from "./__generated__/sessionsManagerTerminateMutation.graphql";
import type { sessionsManagerTerminateAllOthersMutation } from "./__generated__/sessionsManagerTerminateAllOthersMutation.graphql";

const GET_SESSIONS = graphql`
  query sessionsManagerQuery {
    mySessions {
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

const TERMINATE_SESSION = graphql`
  mutation sessionsManagerTerminateMutation($id: ID!) {
    terminateSession(id: $id)
  }
`;

const TERMINATE_ALL_OTHERS = graphql`
  mutation sessionsManagerTerminateAllOthersMutation {
    terminateAllOtherSessions
  }
`;

function SessionsSkeleton(): ReactElement {
  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32 mt-1" />
        </div>
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <div className="grid gap-2">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    </div>
  );
}

function SessionsManagerContent(): ReactElement {
  const [terminateId, setTerminateId] = useState<string | null>(null);

  const data = useLazyLoadQuery<sessionsManagerQuery>(
    GET_SESSIONS,
    {},
    { fetchPolicy: "store-or-network" },
  );

  const [commitTerminate] =
    useMutation<sessionsManagerTerminateMutation>(TERMINATE_SESSION);
  const [commitTerminateOthers, isTerminatingAll] =
    useMutation<sessionsManagerTerminateAllOthersMutation>(
      TERMINATE_ALL_OTHERS,
    );

  const handleTerminateOthers = useCallback((): void => {
    commitTerminateOthers({
      variables: {},
      updater: (store): void => {
        const root = store.getRoot();
        const sessions = root.getLinkedRecords("mySessions");
        if (sessions) {
          const filtered = sessions.filter(
            (s) => s.getValue("isCurrent") === true,
          );
          root.setLinkedRecords(filtered, "mySessions");
        }
      },
    });
  }, [commitTerminateOthers]);

  const handleTerminate = useCallback((): void => {
    if (!terminateId) return;

    commitTerminate({
      variables: { id: terminateId },
      optimisticUpdater: (store): void => {
        const root = store.getRoot();
        const sessions = root.getLinkedRecords("mySessions");
        if (sessions) {
          const filtered = sessions.filter(
            (s) => s.getDataID() !== terminateId,
          );
          root.setLinkedRecords(filtered, "mySessions");
        }
      },
      onCompleted: (): void => setTerminateId(null),
    });
  }, [terminateId, commitTerminate]);

  const sortedSessions = useMemo(() => {
    return [...(data.mySessions ?? [])].sort((a, b) => {
      if (a.isCurrent) return -1;
      if (b.isCurrent) return 1;
      return 0;
    });
  }, [data.mySessions]);

  const otherSessionsCount = useMemo(
    () => (data.mySessions ?? []).filter((s) => !s.isCurrent).length,
    [data.mySessions],
  );

  const getDeviceIcon = (device?: string | null): ReactElement => {
    const d = device?.toLowerCase() || "";
    if (d.includes("iphone") || d.includes("android") || d.includes("mobile")) {
      return <Smartphone className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  };

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
          {otherSessionsCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              className="h-8 text-[11px] font-bold px-3 bg-destructive/10 text-destructive hover:bg-destructive/20 border-none"
              disabled={isTerminatingAll}
              onClick={handleTerminateOthers}
            >
              {isTerminatingAll && (
                <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
              )}
              Terminate Others
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-2">
        {sortedSessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active sessions found.
          </p>
        ) : (
          sortedSessions.map((session) => (
            <div
              key={session.id}
              className={`group flex items-center justify-between p-3.5 rounded-xl border ${
                session.isCurrent
                  ? "bg-primary/5 border-primary/20"
                  : "bg-card/50 border-border/50"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`p-2 rounded-lg ${
                    session.isCurrent
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {getDeviceIcon(session.device)}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold leading-none">
                      {session.device || "Unknown Device"}
                    </span>
                    {session.isCurrent && (
                      <Badge className="h-4 text-[9px] px-1.5 border-primary/30 text-primary font-bold bg-primary/5 uppercase">
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
                  onClick={(): void => setTerminateId(session.id)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
        <ShieldAlert className="h-4 w-4 text-primary mt-0.5" />
        <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
          If you see a session you don't recognize, terminate it immediately and{" "}
          <span className="text-foreground font-bold underline cursor-pointer">
            change your password
          </span>
          .
        </p>
      </div>

      <AlertDialog
        open={!!terminateId}
        onOpenChange={(open: boolean): void => {
          if (!open) setTerminateId(null);
        }}
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
              onClick={handleTerminate}
            >
              Terminate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function SessionsManager(): ReactElement {
  return (
    <Suspense fallback={<SessionsSkeleton />}>
      <SessionsManagerContent />
    </Suspense>
  );
}
