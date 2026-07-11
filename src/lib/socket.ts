import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const initializeSocket = (token?: string): Socket => {
  if (socket?.connected) {
    return socket;
  }

  // If no token provided, try to get it from cookies
  let authToken = token;
  if (!authToken) {
    authToken = typeof document !== 'undefined' 
      ? document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1]
      : undefined;
  }

  if (!authToken) {
    console.warn("[Socket] No authentication token available for WebSocket connection");
  }

  socket = io({
    auth: {
      token: authToken || "",
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 10,
    transports: ["websocket", "polling"],
    withCredentials: true,
    rejectUnauthorized: false,
  });

  socket.on("connect", () => {
    console.log("✅ Connected to WebSocket");
  });

  socket.on("disconnect", (reason: string) => {
    console.log(`❌ Disconnected from WebSocket. Reason: ${reason}`);
  });

  socket.on("error", (error: string) => {
    console.error("❌ WebSocket error:", error);
  });

  socket.on("connect_error", (error: any) => {
    console.error("❌ WebSocket connection error:", error.message);
    console.error("❌ Connection error details:", error);
    console.error("❌ Error type:", error.type);
    console.error("❌ Error data:", error.data);
  });

  socket.io.engine.on("upgrade", (transport) => {
    console.log(`🔄 Transport upgraded to: ${transport.name}`);
  });

  socket.io.engine.on("error", (error: any) => {
    console.error("❌ Socket.io engine error:", error);
  });

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Event emitters
export const joinConversation = (conversationId: string) => {
  socket?.emit("join_conversation", conversationId);
};

export const leaveConversation = (conversationId: string) => {
  socket?.emit("leave_conversation", conversationId);
};

export const emitTyping = (conversationId: string) => {
  socket?.emit("typing_start", { conversationId });
};

export const emitStopTyping = (conversationId: string) => {
  socket?.emit("typing_stop", { conversationId });
};

export const emitNewMessage = (conversationId: string, message: any) => {
  socket?.emit("new_message", { conversationId, message });
};

export const emitMessageRead = (conversationId: string, messageId: string) => {
  socket?.emit("message_read", { conversationId, messageId });
};
