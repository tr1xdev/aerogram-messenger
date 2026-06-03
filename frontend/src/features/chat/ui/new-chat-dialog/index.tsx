import { useState } from "react";
import type { ReactElement } from "react";
import { useLazyLoadQuery, graphql } from "react-relay";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ChatTypeSelector } from "./chat-type-selector";
import { ChatDetailsForm } from "./chat-details-form";
import { ParticipantSelector } from "./participant-selector";
import { useChatActions } from "../../lib/chat/use-chat-management";
import { useNavigate } from "@tanstack/react-router";
import type { ChatType } from "../../lib/chat/__generated__/useChatManagementCreateComplexMutation.graphql";
import type { newChatDialogQuery } from "./__generated__/newChatDialogQuery.graphql";

const meQuery = graphql`
  query newChatDialogQuery {
    me {
      id
      username
    }
  }
`;

type Step = "TYPE" | "DETAILS" | "PARTICIPANTS";
type ChatDialogMode = "SELECT" | "GROUP" | "CHANNEL";

interface ChatFormData {
  title: string;
  slug?: string;
}

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialMode?: ChatDialogMode;
}

interface NewChatDialogInnerProps extends NewChatDialogProps {
  readonly meData: newChatDialogQuery["response"];
}

function NewChatDialogInner({
  onOpenChange,
  initialMode = "SELECT",
  meData,
}: NewChatDialogInnerProps): ReactElement {
  const [type, setType] = useState<ChatType>((): ChatType => {
    if (initialMode === "GROUP") return "GROUP";
    if (initialMode === "CHANNEL") return "CHANNEL";
    return "PRIVATE";
  });

  const [step, setStep] = useState<Step>((): Step => {
    if (initialMode === "GROUP" || initialMode === "CHANNEL") return "DETAILS";
    return "TYPE";
  });

  const { createChat, createGroupOrChannel } = useChatActions();
  const navigate = useNavigate();

  const handleFinish = (id: string): void => {
    onOpenChange(false);
    navigate({
      to: "/chat/$chatId",
      params: { chatId: id },
    });
  };

  const handleCreatePrivate = (userIds: string[]): void => {
    if (type === "PRIVATE" && userIds.length > 0) {
      createChat(userIds[0], { onCompleted: handleFinish });
    }
  };

  const handleTypeSelect = (selectedType: ChatType): void => {
    setType(selectedType);
    setStep(selectedType === "PRIVATE" ? "PARTICIPANTS" : "DETAILS");
  };

  const handleDetailsSubmit = (data: ChatFormData): void => {
    if (type === "GROUP" || type === "CHANNEL") {
      createGroupOrChannel(
        {
          type,
          title: data.title,
          slug: data.slug,
          participantIds: [],
        },
        { onCompleted: handleFinish },
      );
    }
  };

  return (
    <DialogContent className="sm:max-w-[380px] rounded-2xl overflow-hidden p-5 gap-4 border">
      <DialogHeader className="space-y-1">
        <DialogTitle className="text-base font-semibold tracking-tight">
          {step === "TYPE" && "New Message"}
          {step === "DETAILS" && `New ${type.toLowerCase()}`}
          {step === "PARTICIPANTS" && "Select User"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Create a new chat, group, or broadcast channel.
        </DialogDescription>
      </DialogHeader>

      {step === "TYPE" && <ChatTypeSelector onSelect={handleTypeSelect} />}

      {step === "DETAILS" && (type === "GROUP" || type === "CHANNEL") && (
        <ChatDetailsForm
          type={type}
          onBack={(): void => setStep("TYPE")}
          onSubmit={handleDetailsSubmit}
        />
      )}

      {step === "PARTICIPANTS" && (
        <ParticipantSelector
          currentUserId={meData.me?.id}
          currentUsername={meData.me?.username ?? undefined}
          onBack={(): void => setStep("TYPE")}
          onSelect={handleCreatePrivate}
        />
      )}
    </DialogContent>
  );
}

export function NewChatDialog(props: NewChatDialogProps): ReactElement {
  const data = useLazyLoadQuery<newChatDialogQuery>(
    meQuery,
    {},
    { fetchPolicy: "store-or-network" },
  );

  return (
    <Dialog
      open={props.open}
      onOpenChange={(o: boolean): void => {
        props.onOpenChange(o);
      }}
    >
      {props.open && (
        <NewChatDialogInner key={props.initialMode} {...props} meData={data} />
      )}
    </Dialog>
  );
}
