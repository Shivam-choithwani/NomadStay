import { getImageUrl } from "../services/api";

export default function ChatBubble({ message, isOwn }) {
  const { sender, text, imageUrl, createdAt } = message;
  const timeStr = new Date(createdAt).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const avatarUrl = sender?.avatarUrl ? getImageUrl(sender.avatarUrl) : null;

  return (
    <div className={`flex gap-3 max-w-[80%] ${isOwn ? "self-end flex-row-reverse" : "self-start"}`}>
      {/* Avatar (only show on other's messages for clean alignment) */}
      {!isOwn && (
        <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant/30 bg-surface flex items-center justify-center flex-shrink-0 shadow-sm">
          {avatarUrl ? (
            <img src={avatarUrl} alt={sender.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[10px] font-bold text-primary uppercase">
              {sender.name.charAt(0)}
            </span>
          )}
        </div>
      )}

      <div className="space-y-1">
        {/* Content bubble */}
        <div
          className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm font-body-md ${
            isOwn
              ? "bg-primary text-on-primary rounded-tr-none shadow-primary/20"
              : "bg-surface-container-high text-on-surface rounded-tl-none border border-outline-variant/20"
          }`}
        >
          {imageUrl && (
            <div className="mb-2 max-w-xs rounded-xl overflow-hidden border border-outline-variant/30">
              <img src={imageUrl} alt="Uploaded attachment" className="w-full h-auto object-cover max-h-48" />
            </div>
          )}
          {text && <p className="whitespace-pre-wrap leading-relaxed">{text}</p>}
        </div>

        {/* Timestamp */}
        <p className={`text-[10px] font-label-sm text-on-surface-variant ${isOwn ? "text-right" : "text-left"}`}>
          {timeStr}
        </p>
      </div>
    </div>
  );
}
