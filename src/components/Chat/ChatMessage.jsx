import { memo } from 'react';
import { Link } from 'react-router-dom';
import { User } from 'lucide-react';

const LucaAvatar = ({ size = 'sm' }) => (
  <div className={`rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-sm ${size === 'sm' ? 'size-7' : 'size-9'}`}>
    <span className={`font-bold text-white ${size === 'sm' ? 'text-[11px]' : 'text-sm'}`}>L</span>
  </div>
);

function linkify(text) {
  // Riconosce URL del sito con o senza protocollo
  const urlRegex = /((?:https?:\/\/)?(?:nolosubito\.it|nolosubito\.quixel\.it|localhost(?::\d+)?)\/[^\s),;]+)/g;
  return text.split(urlRegex).map((part, i) => {
    if (!part.match(urlRegex)) return part;
    const full = part.startsWith('http') ? part : `https://${part}`;
    const isVehicle = part.includes('/vehicle/');
    const url = new URL(full);
    const to = url.pathname + url.search;
    return (
      <Link key={i} to={to} className="text-electric underline underline-offset-2 hover:text-electric/80 font-bold">
        {isVehicle ? "Vedi l'offerta" : url.hostname}
      </Link>
    );
  });
}

export default memo(function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
      {isUser ? (
        <div className="size-7 rounded-full bg-electric/15 flex items-center justify-center shrink-0 mt-0.5">
          <User className="size-3.5 text-electric" />
        </div>
      ) : message.operatorName ? (
        <div className="shrink-0 mt-0.5">
          <div className="rounded-full bg-navy flex items-center justify-center size-7 shadow-sm">
            <span className="font-bold text-white text-[11px]">{message.operatorName.charAt(0).toUpperCase()}</span>
          </div>
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
});
