import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";
import { useSocket } from "../hooks/useSocket";
import { fetchConversations, fetchConversationMessages } from "../services/conversationService";
import ChatBubble from "../components/ChatBubble";
import { getImageUrl } from "../services/api";

export default function MessagesPage() {
  const { user } = useAuthStore();
  const {
    conversations,
    setConversations,
    activeConversation,
    setActiveConversation,
    messages,
    setMessages,
    typingUsers,
    onlineUsers,
  } = useChatStore();

  const { sendMessage, startTyping, stopTyping, markAsRead, joinConversation } = useSocket();
  const [inputText, setInputText] = useState("");
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(true);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load conversation thread list
  useEffect(() => {
    async function loadConversations() {
      try {
        const data = await fetchConversations();
        setConversations(data);
      } catch (err) {
        console.error("Failed to load conversations", err);
      } finally {
        setConversationsLoading(false);
      }
    }
    loadConversations();
  }, [setConversations]);

  // Load message history on selecting a thread
  useEffect(() => {
    if (!activeConversation) return;

    async function loadMessages() {
      setIsHistoryLoading(true);
      try {
        const data = await fetchConversationMessages(activeConversation._id);
        setMessages(data);
        joinConversation(activeConversation._id);
        markAsRead(activeConversation._id);
      } catch (err) {
        console.error("Failed to load messages", err);
      } finally {
        setIsHistoryLoading(false);
      }
    }
    loadMessages();
  }, [activeConversation, setMessages]);

  // Auto scroll to bottom of chat thread on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  // Handle message sending
  function handleSend(e) {
    e.preventDefault();
    if (!inputText.trim() || !activeConversation) return;

    sendMessage(activeConversation._id, inputText.trim());
    setInputText("");

    // Stop typing immediately
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    stopTyping(activeConversation._id);
  }

  // Handle typing indicator keypress triggers
  function handleInputChange(e) {
    setInputText(e.target.value);
    if (!activeConversation) return;

    startTyping(activeConversation._id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(activeConversation._id);
    }, 2000);
  }

  // Get recipient profile details
  function getRecipient(conversation) {
    return conversation.participants.find((p) => p._id !== user.id) || { name: "Deleted User" };
  }

  const activeRecipient = activeConversation ? getRecipient(activeConversation) : null;
  const isActiveOnline = activeRecipient && onlineUsers.includes(activeRecipient._id);
  const isTyping = activeConversation && typingUsers[activeConversation._id]?.length > 0;

  return (
    <div className="bg-background min-h-screen pt-4 pb-24 md:pb-8 selection:bg-primary-container selection:text-on-primary-container">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop h-[calc(100vh-100px)]">
        <div className="bg-surface-container-lowest rounded-[32px] border border-outline-variant/30 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] overflow-hidden h-full flex flex-col md:flex-row">

          {/* Left Column: Conversation List */}
          <div className={`w-full md:w-[350px] flex flex-col border-r border-outline-variant/30 ${activeConversation ? "hidden md:flex" : "flex"}`}>
            <div className="p-6 border-b border-outline-variant/30 bg-surface/50 backdrop-blur-md sticky top-0 z-10">
              <h1 className="font-headline-lg text-2xl text-on-surface">Messages</h1>
            </div>

            <div className="overflow-y-auto flex-1 custom-scrollbar">
              {conversationsLoading && (
                <div className="flex justify-center py-10">
                   <span className="material-symbols-outlined animate-spin text-primary text-2xl">progress_activity</span>
                </div>
              )}
              {!conversationsLoading && conversations.length === 0 && (
                <div className="p-10 text-center flex flex-col items-center">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-2">forum</span>
                  <p className="text-sm font-body-md text-on-surface-variant italic">No conversations yet.</p>
                </div>
              )}
              {conversations.map((conv) => {
                const recipient = getRecipient(conv);
                const isSelected = activeConversation && activeConversation._id === conv._id;
                const isOnline = onlineUsers.includes(recipient._id);
                const avatar = recipient.avatarUrl ? getImageUrl(recipient.avatarUrl) : null;

                return (
                  <button
                    key={conv._id}
                    onClick={() => setActiveConversation(conv)}
                    className={`w-full p-5 flex items-center gap-4 text-left border-b border-outline-variant/10 transition-colors cursor-pointer group ${
                      isSelected ? "bg-primary/5" : "hover:bg-surface-container-low"
                    }`}
                  >
                    {/* Avatar wrapper with online status dot */}
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-surface bg-surface-container-high flex items-center justify-center shadow-sm group-hover:border-primary/20 transition-colors">
                        {avatar ? (
                          <img src={avatar} alt={recipient.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg font-bold text-primary uppercase">
                            {recipient.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-surface rounded-full shadow-sm"></span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className="font-headline-md text-on-surface text-base truncate pr-2">{recipient.name}</h4>
                        {conv.lastMessage?.timestamp && (
                          <span className="text-[11px] font-label-sm text-on-surface-variant flex-shrink-0">
                            {new Date(conv.lastMessage.timestamp).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm font-body-md truncate ${conv.unreadCount > 0 && !isSelected ? "text-on-surface font-semibold" : "text-on-surface-variant"}`}>
                        {conv.lastMessage?.text || "Started a chat..."}
                      </p>
                    </div>

                    {/* Unread count badge */}
                    {conv.unreadCount > 0 && !isSelected && (
                      <span className="w-6 h-6 bg-primary text-on-primary rounded-full text-[11px] font-label-md flex items-center justify-center flex-shrink-0 shadow-sm shadow-primary/20">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Chat history & input */}
          <div className={`flex-1 flex flex-col bg-surface ${!activeConversation ? "hidden md:flex" : "flex"}`}>
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 md:px-8 border-b border-outline-variant/30 bg-surface/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setActiveConversation(null)}
                      className="md:hidden w-10 h-10 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    
                    <div className="relative">
                       <div className="w-10 h-10 rounded-full overflow-hidden border border-outline-variant/30 bg-surface-container flex items-center justify-center">
                          {activeRecipient?.avatarUrl ? (
                            <img src={getImageUrl(activeRecipient.avatarUrl)} alt={activeRecipient?.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-primary uppercase">
                              {activeRecipient?.name?.charAt(0)}
                            </span>
                          )}
                       </div>
                       {isActiveOnline && (
                         <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-surface rounded-full"></span>
                       )}
                    </div>
                    
                    <div>
                      <h3 className="font-headline-md text-on-surface text-lg">{activeRecipient?.name}</h3>
                      <p className="text-[12px] font-label-sm text-on-surface-variant flex items-center gap-1.5 mt-0.5">
                        {isActiveOnline ? (
                          <>
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Active Now
                          </>
                        ) : (
                          "Offline"
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                     <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer">
                        <span className="material-symbols-outlined text-[20px]">info</span>
                     </button>
                  </div>
                </div>

                {/* Message scroll container */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 flex flex-col custom-scrollbar bg-surface/50">
                  {isHistoryLoading && (
                     <div className="flex justify-center py-4">
                        <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                     </div>
                  )}
                  {!isHistoryLoading && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                       <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4">waving_hand</span>
                       <p className="text-sm font-body-md text-on-surface-variant max-w-xs">Say hello to {activeRecipient?.name}! Start the conversation below.</p>
                    </div>
                  )}
                  
                  {messages.map((msg, index) => {
                     // We could group messages by date here if we wanted to get fancy
                     return <ChatBubble key={msg._id} message={msg} isOwn={msg.sender._id === user.id} />;
                  })}

                  {/* Ephemeral typing status */}
                  {isTyping && (
                    <div className="self-start flex gap-2 items-center bg-surface-container-high px-4 py-2 rounded-2xl rounded-tl-none text-xs font-body-sm text-on-surface-variant shadow-sm border border-outline-variant/20">
                      <div className="flex gap-1">
                         <span className="w-1.5 h-1.5 bg-on-surface-variant/50 rounded-full animate-bounce"></span>
                         <span className="w-1.5 h-1.5 bg-on-surface-variant/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                         <span className="w-1.5 h-1.5 bg-on-surface-variant/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                      <span className="ml-1">{activeRecipient?.name} is typing</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} className="h-1" />
                </div>

                {/* Chat Input form */}
                <div className="p-4 md:px-8 md:py-5 bg-surface border-t border-outline-variant/30">
                  <form onSubmit={handleSend} className="flex gap-3">
                    <button type="button" className="hidden md:flex w-12 h-12 rounded-xl items-center justify-center text-on-surface-variant bg-surface-container hover:bg-surface-container-highest transition-colors cursor-pointer border border-outline-variant/30">
                       <span className="material-symbols-outlined">attach_file</span>
                    </button>
                    <input
                      type="text"
                      placeholder={`Message ${activeRecipient?.name}...`}
                      value={inputText}
                      onChange={handleInputChange}
                      className="flex-1 px-5 py-3.5 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-sm font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
                    />
                    <button
                      type="submit"
                      disabled={!inputText.trim()}
                      className="bg-primary hover:bg-primary/90 text-on-primary font-label-md px-6 py-3.5 rounded-xl text-sm transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:shadow-none cursor-pointer flex items-center justify-center group"
                    >
                      <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-surface/50">
                <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center mb-6 shadow-sm border border-outline-variant/20">
                  <span className="material-symbols-outlined text-5xl text-primary/40">forum</span>
                </div>
                <h3 className="font-headline-lg text-on-surface text-xl mb-2">Your Messages</h3>
                <p className="text-sm font-body-md text-on-surface-variant max-w-sm mx-auto">
                  Select a conversation from the sidebar to view your chat history or send a new message.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
