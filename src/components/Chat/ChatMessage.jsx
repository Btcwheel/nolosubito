import { User } from 'lucide-react';

const LucaAvatar = ({ size = 'sm' }) => (
  <div className={`rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-sm ${size === 'sm' ? 'w-7 h-7' : 'w-9 h-9'}`}>
    <span className={`font-bold text-white ${size === 'sm' ? 'text-[11px]' : 'text-sm'}`}>L</span>
  </div>
);

function linkify(text) {
  const urlRegex = /(https?:\/\/[^\s)]+)/g;
  return text.split(urlRegex).map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-electric underline underline-offset-2 hover:text-electric/80 font-medium"
        >
          {part.replace(/https?:\/\//, '')}
        </a>
      );
    }
    return part;
  });
}

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      {isUser ? (
        <div className="w-7 h-7 rounded-full bg-electric/15 flex items-center justify-center shrink-0 mt-0.5">
          <User className="w-3.5 h-3.5 text-electric" />
        </div>
      ) : (
        <div className="shrink-0 mt-0.5">
          <LucaAvatar size="sm" />
        </div>
      )}
      <div
        className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'rounded-tr-sm bg-electric text-white'
            : 'rounded-tl-sm bg-muted/60 text-foreground border border-border/40'
        }`}
      >
        {linkify(message.content)}
      </div>
    </div>
  );
}
