import { useState } from "react";
import type { ReactElement } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription, // Добавили импорт
} from "@/components/ui/dialog";
import { ChatTypeSelector } from "./chat-type-selector";
import { ChatDetailsForm } from "./chat-details-form";
import { ParticipantSelector } from "./participant-selector";
import { useChatActions } from "../../lib/chat/use-chat-management";
import { useNavigate } from "@tanstack/react-router";
import type { ChatType } from "../../lib/chat/__generated__/useChatManagementCreateComplexMutation.graphql";

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

export function NewChatDialog({
  open,
  onOpenChange,
  initialMode = "SELECT",
}: NewChatDialogProps): ReactElement {
  const [step, setStep] = useState<Step>("TYPE");
  const [type, setType] = useState<ChatType>("PRIVATE");
  const [details, setDetails] = useState<ChatFormData | null>(null);
  const [prevOpen, setPrevOpen] = useState<boolean>(open);

  const { createChat, createGroupOrChannel } = useChatActions();
  const navigate = useNavigate();

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      if (initialMode === "GROUP") {
        setType("GROUP");
        setStep("DETAILS");
      } else if (initialMode === "CHANNEL") {
        setType("CHANNEL");
        setStep("DETAILS");
      } else {
        setType("PRIVATE");
        setStep("TYPE");
      }
    }
  }

  const handleFinish = (id: string): void => {
    onOpenChange(false);
    navigate({
      to: "/chat/$chatId",
      params: { chatId: id },
    });
  };

  const handleCreate = (userIds: string[]): void => {
    if (type === "PRIVATE" && userIds.length > 0) {
      createChat(userIds[0], { onCompleted: handleFinish });
    } else if ((type === "GROUP" || type === "CHANNEL") && details) {
      // Теперь вызываем мутацию, а не просто лог
      createGroupOrChannel(
        {
          type,
          title: details.title,
          slug: details.slug,
          participantIds: userIds,
        },
        { onCompleted: handleFinish },
      );
    }
  };

  const handleTypeSelect = (selectedType: ChatType): void => {
    setType(selectedType);
    setStep(selectedType === "PRIVATE" ? "PARTICIPANTS" : "DETAILS");
  };

  const handleDetailsSubmit = (data: ChatFormData): void => {
    setDetails(data);
    setStep("PARTICIPANTS");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o: boolean): void => {
        onOpenChange(o);
        if (!o) setStep("TYPE");
      }}
    >
      <DialogContent className="sm:max-w-[420px] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {step === "TYPE" && "New Message"}
            {step === "DETAILS" && `Create ${type.toLowerCase()}`}
            {step === "PARTICIPANTS" &&
              (type === "PRIVATE" ? "Select User" : "Add Members")}
          </DialogTitle>
          {/* Исправляет Warning: Missing Description */}
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
            isMulti={type !== "PRIVATE"}
            onBack={(): void =>
              setStep(type === "PRIVATE" ? "TYPE" : "DETAILS")
            }
            onSelect={handleCreate}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
