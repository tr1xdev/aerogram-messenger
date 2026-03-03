import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import {
  Loader2,
  Monitor,
  Smartphone,
  XCircle,
  Globe,
  ShieldAlert,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface SessionsManagerProps {
  userId?: string;
}

export function SessionsManager({ userId }: SessionsManagerProps) {
  const [terminateId, setTerminateId] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery<{ sessions: Session[] }>(
    GET_SESSIONS,
    {
      variables: { userId },
      skip: !userId,
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
        <p className="text-sm text-muted-foreground">
          Loading active sessions...
        </p>
      </div>
    );
  }

  if (error)
    return (
      <p className="text-sm text-destructive p-4 text-center">
        Failed to load sessions.
      </p>
    );

  const sessions = data?.sessions || [];
  const otherSessions = sessions.filter((s) => !s.isCurrent);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold">Active Sessions</h4>
          <p className="text-[11px] text-muted-foreground">
            Manage devices currently logged into your account.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          {otherSessions.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              className="h-8 text-xs font-bold"
              disabled={isTerminatingAll}
              onClick={() => terminateOthers()}
            >
              {isTerminatingAll ? (
                <Loader2 className="h-3 w-3 animate-spin mr-2" />
              ) : (
                <LogOut className="h-3 w-3 mr-2" />
              )}
              Terminate Others
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3">
        {[...sessions]
          .sort((a, b) =>
            a.isCurrent === b.isCurrent ? 0 : a.isCurrent ? -1 : 1,
          )
          .map((session) => (
            <div
              key={session.id}
              className={`group flex items-center justify-between p-4 rounded-xl border transition-all ${
                session.isCurrent
                  ? "bg-primary/[0.03] border-primary/20 shadow-sm"
                  : "bg-card hover:bg-muted/30"
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`p-2.5 rounded-full ${session.isCurrent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                >
                  {getDeviceIcon(session.device)}
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">
                      {session.device || "Unknown Device"}
                    </span>
                    {session.isCurrent && (
                      <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 border-none text-[10px] h-4 px-1.5 font-bold uppercase tracking-tight">
                        This Device
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                    <Globe className="h-3 w-3" />
                    <span>
                      {session.location || "Unknown Location"} •{" "}
                      {session.ipAddress || "Private IP"}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                    Logged in: {new Date(session.createdAt).toLocaleString()}
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
                  <XCircle className="h-5 w-5" />
                </Button>
              )}
            </div>
          ))}
      </div>

      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
        <ShieldAlert className="h-4 w-4 text-amber-600 mt-0.5" />
        <p className="text-[11px] text-amber-700/80 leading-relaxed">
          If you see a session you don't recognize, terminate it immediately and
          change your password for better security.
        </p>
      </div>

      <AlertDialog
        open={!!terminateId}
        onOpenChange={(open) => !open && setTerminateId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminate session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately log out the selected device. They will need
              to log in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
