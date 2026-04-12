import { TAROT_CARD_MAP } from '../../constants';

export default function CardFlip({
  cardId,
  isReversed,
}: {
  cardId: string;
  isReversed: boolean;
}) {
  const card = TAROT_CARD_MAP.get(cardId);

  return (
    <div className="w-[90px] md:w-[120px] rounded-xl overflow-hidden border border-amber-300/25 bg-zinc-900 shadow-lg">
      <img
        src={card?.image || '/cards/tarot-1.svg'}
        alt={card?.name || cardId}
        className={`w-full h-[140px] md:h-[180px] object-cover ${isReversed ? 'rotate-180' : ''}`}
      />
      <div className="p-2 text-[11px] leading-4 text-zinc-200">
        <div>{card?.name || cardId}</div>
        <div className="text-zinc-400">{isReversed ? '逆位' : '正位'}</div>
      </div>
    </div>
  );
}
