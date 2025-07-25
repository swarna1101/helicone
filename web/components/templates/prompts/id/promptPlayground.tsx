import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MODEL_LIST } from "../../playground/new/modelList";
import {
  getMessages,
  getRequestMessages,
  getResponseMessage,
} from "@helicone-package/llm-mapper/utils/messageUtils";

import { Input } from "./MessageInput";
import MessageRendererComponent from "./MessageRendererComponent";
import { PlaygroundChatTopBar, PROMPT_MODES } from "./playgroundChatTopBar";
import { Message, PromptMessage } from "@helicone-package/llm-mapper/types";

export type PromptObject = {
  model: string;
  messages: PromptMessage[];
};

interface PromptPlaygroundProps {
  prompt: string | PromptObject;
  selectedInput: Input | undefined;
  onSubmit?: (history: PromptMessage[], model: string) => void;
  submitText: string;
  initialModel?: string;
  isPromptCreatedFromUi?: boolean;
  defaultEditMode?: boolean;
  editMode?: boolean;
  chatType?: "request" | "response" | "request-response";
  playgroundMode?: "prompt" | "experiment" | "experiment-compact";
  handleCreateExperiment?: () => void;
  onExtractPromptVariables?: (
    variables: Array<{ original: string; heliconeTag: string; value: string }>,
  ) => void;
  onPromptChange?: (prompt: string | PromptObject) => void;
  className?: string;
}

const PromptPlayground: React.FC<PromptPlaygroundProps> = ({
  prompt,
  selectedInput,
  onSubmit,
  initialModel,
  isPromptCreatedFromUi,
  defaultEditMode = false,
  playgroundMode = "prompt",
  onExtractPromptVariables,
  onPromptChange,
  className = "border rounded-md",
}) => {
  const replaceTemplateVariables = (
    content: string,
    inputs: Record<string, string>,
  ) => {
    return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return inputs[key] || match;
    });
  };

  const parsePromptToMessages = (
    promptInput: string | PromptObject,
    inputs?: Record<string, string>,
  ): PromptMessage[] => {
    if (typeof promptInput === "string") {
      return promptInput
        .split("\n\n")
        .filter((msg) => msg.trim() !== "")
        .map((content, index) => ({
          id: `msg-${index}`,
          role: (content.startsWith("<helicone-prompt-static>")
            ? "system"
            : "user") as "system" | "user",
          content: inputs ? replaceTemplateVariables(content, inputs) : content,
          _type: "message",
        }));
    }

    const promptObject = promptInput as PromptObject;
    return (
      promptObject?.messages.map((msg, index) => {
        if (typeof msg === "string") {
          return msg;
        }
        return {
          id: `msg-${index}`,
          role: msg.role as "user" | "assistant" | "system",
          content: inputs
            ? replaceTemplateVariables(
                Array.isArray(msg.content)
                  ? msg.content.map((c) => c.text).join("\n")
                  : (msg.content ?? ""),
                inputs,
              )
            : Array.isArray(msg.content)
              ? msg.content.map((c) => c.text).join("\n")
              : msg.content,
          _type: "message",
        };
      }) || []
    );
  };

  const [mode, setMode] = useState<(typeof PROMPT_MODES)[number]>("Pretty");
  const [isEditMode, setIsEditMode] = useState(defaultEditMode);
  const [currentChat, setCurrentChat] = useState<PromptMessage[]>(() =>
    parsePromptToMessages(prompt, selectedInput?.inputs),
  );

  const { requestMessages, responseMessage, messages } = useMemo(() => {
    const requestMessages = getRequestMessages(undefined, prompt);
    const responseMessage = getResponseMessage(
      undefined,
      selectedInput?.response_body || {},
      (prompt as PromptObject).model,
    );
    const messages = getMessages(requestMessages, responseMessage, 200);
    return { requestMessages, responseMessage, messages };
  }, [prompt, selectedInput]);
  const [promptVariables, setPromptVariables] = useState<
    Array<{ original: string; heliconeTag: string; value: string }>
  >([]);
  const [expandedChildren, setExpandedChildren] = useState<
    Record<string, boolean>
  >({});
  const [selectedModel, setSelectedModel] = useState(initialModel);

  // Add this useEffect to update selectedModel when initialModel changes
  useEffect(() => {
    setSelectedModel(initialModel);
  }, [initialModel]);

  const handleAddMessage = () => {
    const newMessage: PromptMessage = {
      id: `msg-${currentChat.length}`,
      role: "user",
      content: "",
      _type: "message",
    };
    setCurrentChat([...currentChat, newMessage]);
  };

  const handleUpdateMessage = (
    index: number,
    newContent: string,
    newRole: string,
  ) => {
    console.log("handleUpdateMessage", index, newContent, newRole);
    const updatedChat = [...currentChat];
    if (typeof updatedChat[index] === "string") {
      return;
    } else {
      updatedChat[index] = {
        ...(updatedChat[index] as Message),
        content: newContent,
        role: newRole as "user" | "assistant" | "system",
      };
    }
    setCurrentChat(updatedChat);
  };

  const handleDeleteMessage = (index: number) => {
    const updatedChat = currentChat.filter((_, i) => i !== index);
    setCurrentChat(updatedChat);
  };

  const onExtractVariables = useCallback(
    (variables: Array<{ original: string; heliconeTag: string }>) => {
      setPromptVariables((prevVariables) => {
        const variablesMap = new Map(prevVariables.map((v) => [v.original, v]));

        variables.forEach((variable) => {
          if (!variablesMap.has(variable.original)) {
            variablesMap.set(variable.original, {
              ...variable,
              value: "", // initialize value to empty string
            });
          }
          // else, keep the existing variable with its value
        });

        return Array.from(variablesMap.values());
      });
    },
    [],
  );

  useEffect(() => {
    if (onExtractPromptVariables) {
      onExtractPromptVariables(promptVariables);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promptVariables]);

  useEffect(() => {
    if (onPromptChange) {
      const promptObject: PromptObject = {
        model: selectedModel || initialModel || "",
        messages: currentChat.map((message) => {
          if (typeof message === "string") {
            return {
              content: message,
              _type: "message",
            };
          }
          return {
            id: message.id,
            role: message.role as "user" | "assistant" | "system",
            content: Array.isArray(message.content)
              ? message.content.join(" ")
              : (message.content ?? ""),
            _type: "message",
          };
        }),
      };
      onPromptChange(promptObject);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChat, selectedModel]);

  if (
    playgroundMode === "experiment-compact" ||
    playgroundMode === "experiment"
  ) {
    return (
      <div
        className={cn(
          "h-full rounded-md",
          playgroundMode === "experiment-compact" && "space-y-2",
          playgroundMode === "experiment" &&
            "border border-slate-200 dark:border-slate-800",
        )}
      >
        <MessageRendererComponent
          messages={messages}
          mode={mode}
          playgroundMode={playgroundMode}
          isEditMode={isEditMode}
          expandedChildren={expandedChildren}
          setExpandedChildren={setExpandedChildren}
          selectedInput={selectedInput}
          onExtractVariables={onExtractVariables}
          handleUpdateMessage={handleUpdateMessage}
          handleDeleteMessage={handleDeleteMessage}
          requestMessages={requestMessages}
          responseMessage={responseMessage}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      <div
        className={`w-full ${className} h-full divide-y divide-slate-300 dark:divide-slate-700`}
      >
        <PlaygroundChatTopBar
          isPromptCreatedFromUi={isPromptCreatedFromUi}
          mode={mode}
          setMode={setMode}
          isEditMode={isEditMode}
          setIsEditMode={setIsEditMode}
        />
        <div className="flex-grow overflow-auto rounded-b-md">
          <MessageRendererComponent
            messages={messages}
            mode={mode}
            playgroundMode={playgroundMode}
            isEditMode={isEditMode}
            expandedChildren={expandedChildren}
            setExpandedChildren={setExpandedChildren}
            selectedInput={selectedInput}
            onExtractVariables={onExtractVariables}
            handleUpdateMessage={handleUpdateMessage}
            handleDeleteMessage={handleDeleteMessage}
            requestMessages={requestMessages}
            responseMessage={responseMessage}
          />
        </div>
        {isEditMode && (
          <div className="flex items-center justify-between rounded-b-lg border-t border-slate-300 bg-white px-8 py-4 dark:border-slate-700 dark:bg-black">
            <p className="text-sm text-slate-500">
              Use &#123;&#123; sample_variable &#125;&#125; to insert variables
              into your prompt.
            </p>
          </div>
        )}
        {isEditMode && (
          <div className="flex items-center justify-between space-x-2 rounded-b-lg border-t border-slate-300 bg-white px-8 py-4 dark:border-slate-700 dark:bg-black">
            <div className="flex w-full space-x-2">
              <Button onClick={handleAddMessage} variant="outline" size="sm">
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Message
              </Button>
            </div>
            <div className="flex w-full items-center justify-end space-x-4">
              <div className="font-normal">Model</div>
              <Select
                value={selectedModel}
                onValueChange={setSelectedModel}
                defaultValue={initialModel}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {MODEL_LIST.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {playgroundMode === "prompt" && (
                <Button
                  onClick={() =>
                    onSubmit && onSubmit(currentChat, selectedModel || "")
                  }
                  variant="default"
                  size="sm"
                  className="px-4 font-normal"
                >
                  Save prompt
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptPlayground;
