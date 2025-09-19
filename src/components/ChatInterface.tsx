"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Users, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Message {
  id: string;
  content: string;
  type: string;
  senderId: string;
  jobId?: string;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: string;
  };
  job?: {
    id: string;
    title: string;
    name: string;
  };
}

interface ChatInterfaceProps {
  jobId?: string;
  className?: string;
}

export function ChatInterface({ jobId, className }: ChatInterfaceProps) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load initial messages
  useEffect(() => {
    if (!session?.user?.id) return;

    const loadMessages = async () => {
      try {
        const params = new URLSearchParams();
        if (jobId) params.append("jobId", jobId);
        params.append("limit", "50");

        const response = await fetch(`/api/messages?${params}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages);
        }
      } catch (error) {
        console.error("Error loading messages:", error);
      }
    };

    loadMessages();
  }, [session?.user?.id, jobId]);

  // Setup SSE connection for real-time updates
  useEffect(() => {
    if (!session?.user?.id || !jobId) return;

    const connectToSSE = () => {
      const eventSource = new EventSource(`/api/ws?jobId=${jobId}`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "message") {
            setMessages((prev) => [...prev, data]);
            scrollToBottom();
          } else if (data.type === "typing") {
            setTypingUsers((prev) => {
              const newSet = new Set(prev);
              if (data.isTyping) {
                newSet.add(data.userId);
              } else {
                newSet.delete(data.userId);
              }
              return newSet;
            });
          }
        } catch (error) {
          console.error("Error parsing SSE data:", error);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource.close();
        // Reconnect after 3 seconds
        setTimeout(connectToSSE, 3000);
      };
    };

    connectToSSE();

    return () => {
      eventSourceRef.current?.close();
      setIsConnected(false);
    };
  }, [session?.user?.id, jobId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle typing indicators
  const handleTyping = async (isTyping: boolean) => {
    if (!jobId) return;

    try {
      await fetch("/api/messages/typing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobId, isTyping }),
      });
    } catch (error) {
      console.error("Error sending typing indicator:", error);
    }
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing indicator
    if (value.length > 0) {
      handleTyping(true);
      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        handleTyping(false);
      }, 2000);
    } else {
      handleTyping(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;

    setIsLoading(true);
    handleTyping(false);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          jobId,
          type: "text",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, data.message]);
        setNewMessage("");
        scrollToBottom();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-destructive text-destructive-foreground";
      case "PM":
        return "bg-primary text-primary-foreground";
      case "FOREMAN":
        return "bg-warning text-warning-foreground";
      case "SHOP":
        return "bg-secondary text-secondary-foreground";
      case "FIELD":
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (!session?.user) {
    return (
      <Card className={cn("h-96", className)}>
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Please sign in to access chat</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("flex flex-col h-96", className)}>
      <CardHeader className="pb-ds-2">
        <CardTitle className="flex items-center justify-between font-heading text-lg">
          <span>Team Chat</span>
          <div className="flex items-center gap-ds-2">
            {isConnected ? (
              <Badge variant="secondary" className="bg-success text-success-foreground">
                <Users className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-warning text-warning-foreground">
                <Clock className="w-3 h-3 mr-1" />
                Connecting...
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-ds-3 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-ds-2 pr-ds-2">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-sm">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-ds-2",
                  message.senderId === session.user.id ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[70%] rounded-lg px-ds-2 py-ds-1",
                    message.senderId === session.user.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {message.senderId !== session.user.id && (
                    <div className="flex items-center gap-ds-1 mb-1">
                      <span className="text-xs font-medium text-foreground">
                        {message.sender.name || message.sender.email}
                      </span>
                      <Badge
                        variant="secondary"
                        className={cn("text-xs py-0", getRoleColor(message.sender.role))}
                      >
                        {message.sender.role}
                      </Badge>
                    </div>
                  )}
                  <p className="text-sm font-body">{message.content}</p>
                  <div className="flex items-center gap-ds-1 mt-1">
                    <span className="text-xs opacity-70">
                      {format(new Date(message.createdAt), "HH:mm")}
                    </span>
                    {message.isEdited && (
                      <span className="text-xs opacity-50">(edited)</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Typing indicator */}
          {typingUsers.size > 0 && (
            <div className="flex gap-ds-2">
              <div className="bg-muted text-muted-foreground rounded-lg px-ds-2 py-ds-1">
                <p className="text-sm font-body">
                  {typingUsers.size === 1 ? "Someone is" : `${typingUsers.size} people are`} typing...
                </p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <div className="flex gap-ds-2">
          <Input
            value={newMessage}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={isLoading}
            className="flex-1 font-body"
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isLoading}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}