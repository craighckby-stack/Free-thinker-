'use client';

import {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
  type ReactElement,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export type User = {
  id: string;
  username: string;
};

export type Message = {
  id: string;
  username: string;
  content: string;
  timestamp: Date | string;
  type: 'user' | 'system';
};

interface ServerToClientEvents {
  message: (msg: Message) => void;
  'user-joined': (data: { user: User; message: Message }) => void;
  'user-left': (data: { user: User; message: Message }) => void;
  'users-list': (data: { users: User[] }) => void;
}

interface ClientToServerEvents {
  join: (data: { username: string }) => void;
  message: (data: { content: string; username: string }) => void;
}

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const MAX_INPUT_LENGTH = 1000;
const MAX_USERNAME_LENGTH = 50;
const CONTROL_CHAR_REGEX = /[\u0000-\u001F\u007F-\u009F]/g;

const sanitizeInput = (input: unknown, maxLength: number): string => {
  if (typeof input !== 'string') return '';
  return input.slice(0, maxLength).replace(CONTROL_CHAR_REGEX, '');
};

const formatTimestamp = (timestamp: Date | string): string => {
  if (!timestamp) return '';
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

interface ConnectionStatusBadgeProps {
  isConnected: boolean;
  connectionError: string | null;
}

function ConnectionStatusBadge({ isConnected, connectionError }: ConnectionStatusBadgeProps): ReactElement {
  const text = isConnected ? 'Connected' : connectionError || 'Disconnected';
  const colorClass = isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  return (
    <span className={`text-sm px-2 py-1 rounded transition-colors ${colorClass}`}>
      {text}
    </span>
  );
}

interface JoinFormProps {
  username: string;
  isConnected: boolean;
  onUsernameChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onJoin: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
}

function JoinForm({ username, isConnected, onUsernameChange, onJoin, onKeyDown }: JoinFormProps): ReactElement {
  return (
    <div className="space-y-2">
      <Input
        value={username}
        onChange={onUsernameChange}
        onKeyDown={onKeyDown}
        placeholder="Enter your username..."
        maxLength={MAX_USERNAME_LENGTH}
        disabled={!isConnected}
        className="flex-1"
        aria-label="Username input"
      />
      <Button
        onClick={onJoin}
        disabled={!isConnected || !username.trim()}
        className="w-full"
      >
        Join Chat
      </Button>
    </div>
  );
}

interface MessageListProps {
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

function MessageList({ messages, messagesEndRef }: MessageListProps): ReactElement {
  return (
    <ScrollArea className="h-80 w-full border rounded-md p-4">
      <div className="space-y-2">
        {messages.length === 0 ? (
          <p className="text-muted-foreground text-center">No messages yet</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="border-b pb-2 last:border-b-0">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium ${
                      msg.type === 'system' ? 'text-blue-600 italic' : 'text-foreground'
                    }`}
                  >
                    {msg.username}
                  </p>
                  <p
                    className={`${
                      msg.type === 'system' ? 'text-blue-500 italic' : 'text-foreground'
                    }`}
                  >
                    {msg.content}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                  {formatTimestamp(msg.timestamp)}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}

interface MessageInputBarProps {
  inputMessage: string;
  isConnected: boolean;
  onInputMessageChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSendMessage: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
}

function MessageInputBar({
  inputMessage,
  isConnected,
  onInputMessageChange,
  onSendMessage,
  onKeyDown,
}: MessageInputBarProps): ReactElement {
  return (
    <div className="flex space-x-2">
      <Input
        value={inputMessage}
        onChange={onInputMessageChange}
        onKeyDown={onKeyDown}
        placeholder="Type a message..."
        maxLength={MAX_INPUT_LENGTH}
        disabled={!isConnected}
        className="flex-1"
        aria-label="Message input"
      />
      <Button
        onClick={onSendMessage}
        disabled={!isConnected || !inputMessage.trim()}
      >
        Send
      </Button>
    </div>
  );
}

export default function SocketDemo(): ReactElement {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [isUsernameSet, setIsUsernameSet] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const socketRef = useRef<TypedSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const socketInstance: TypedSocket = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socketRef.current = socketInstance;

    const handleConnect = () => {
      setIsConnected(true);
      setConnectionError(null);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleConnectError = (err: Error) => {
      setIsConnected(false);
      setConnectionError(err.message || 'Connection failed');
    };

    const handleIncomingMessage = (msg: Message) => {
      if (!msg || typeof msg.id !== 'string' || typeof msg.content !== 'string') return;
      const safeMsg: Message = {
        ...msg,
        content: sanitizeInput(msg.content, MAX_INPUT_LENGTH),
        username: sanitizeInput(msg.username, MAX_USERNAME_LENGTH),
      };
      setMessages((prev) => [...prev, safeMsg]);
    };

    const handleUserJoined = (data: { user: User; message: Message }) => {
      if (!data?.user || !data?.message) return;
      const safeMessage: Message = {
        ...data.message,
        content: sanitizeInput(data.message.content, MAX_INPUT_LENGTH),
        username: sanitizeInput(data.message.username, MAX_USERNAME_LENGTH),
      };
      const safeUser: User = {
        id: sanitizeInput(data.user.id, 100),
        username: sanitizeInput(data.user.username, MAX_USERNAME_LENGTH),
      };

      setMessages((prev) => [...prev, safeMessage]);
      setUsers((prev) => (prev.some((u) => u.id === safeUser.id) ? prev : [...prev, safeUser]));
    };

    const handleUserLeft = (data: { user: User; message: Message }) => {
      if (!data?.user || !data?.message) return;
      const safeMessage: Message = {
        ...data.message,
        content: sanitizeInput(data.message.content, MAX_INPUT_LENGTH),
        username: sanitizeInput(data.message.username, MAX_USERNAME_LENGTH),
      };
      setMessages((prev) => [...prev, safeMessage]);
      setUsers((prev) => prev.filter((u) => u.id !== data.user.id));
    };

    const handleUsersList = (data: { users: User[] }) => {
      if (!data || !Array.isArray(data.users)) return;
      const safeUsers = data.users.map((u) => ({
        id: sanitizeInput(u.id, 100),
        username: sanitizeInput(u.username, MAX_USERNAME_LENGTH),
      }));
      setUsers(safeUsers);
    };

    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);
    socketInstance.on('connect_error', handleConnectError);
    socketInstance.on('message', handleIncomingMessage);
    socketInstance.on('user-joined', handleUserJoined);
    socketInstance.on('user-left', handleUserLeft);
    socketInstance.on('users-list', handleUsersList);

    return () => {
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, []);

  const handleJoin = useCallback(() => {
    const trimmedUsername = sanitizeInput(username.trim(), MAX_USERNAME_LENGTH);
    const currentSocket = socketRef.current;
    if (currentSocket && trimmedUsername && isConnected) {
      currentSocket.emit('join', { username: trimmedUsername });
      setIsUsernameSet(true);
    }
  }, [username, isConnected]);

  const sendMessage = useCallback(() => {
    const trimmedMessage = sanitizeInput(inputMessage.trim(), MAX_INPUT_LENGTH);
    const trimmedUsername = sanitizeInput(username.trim(), MAX_USERNAME_LENGTH);
    const currentSocket = socketRef.current;
    if (currentSocket && trimmedMessage && trimmedUsername && isConnected) {
      currentSocket.emit('message', {
        content: trimmedMessage,
        username: trimmedUsername,
      });
      setInputMessage('');
    }
  }, [inputMessage, username, isConnected]);

  const handleKeyPress = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    },
    [sendMessage]
  );

  const handleJoinKeyPress = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleJoin();
      }
    },
    [handleJoin]
  );

  const handleUsernameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setUsername(sanitizeInput(e.target.value, MAX_USERNAME_LENGTH));
  }, []);

  const handleInputMessageChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setInputMessage(sanitizeInput(e.target.value, MAX_INPUT_LENGTH));
  }, []);

  const statusBadgeElement = useMemo(
    () => <ConnectionStatusBadge isConnected={isConnected} connectionError={connectionError} />,
    [isConnected, connectionError]
  );

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>WebSocket Demo</span>
            <div className="flex items-center space-x-2">
              {users.length > 0 && isUsernameSet && (
                <span className="text-xs text-muted-foreground font-normal">
                  {users.length} user{users.length !== 1 ? 's' : ''} online
                </span>
              )}
              {statusBadgeElement}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isUsernameSet ? (
            <JoinForm
              username={username}
              isConnected={isConnected}
              onUsernameChange={handleUsernameChange}
              onJoin={handleJoin}
              onKeyDown={handleJoinKeyPress}
            />
          ) : (
            <>
              <MessageList messages={messages} messagesEndRef={messagesEndRef} />
              <MessageInputBar
                inputMessage={inputMessage}
                isConnected={isConnected}
                onInputMessageChange={handleInputMessageChange}
                onSendMessage={sendMessage}
                onKeyDown={handleKeyPress}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Autonomous self-optimized intelligence block generated via Free Thinker Engine.
 * Timestamp: 2026-10-02T23:00:26.113Z
 */
export function freeThinkerAutonomousSync_026113(): void {
  console.log('[Free Thinker RAG] Autonomous neural synchronization active at 2026-10-02T23:00:26.113Z');
}
