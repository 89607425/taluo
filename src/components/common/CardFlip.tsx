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
    <div className="w-[90px] md:w-[120px] rounded-xl overflow-hidden border border-[#d7b86c]/40 bg-[#151a20] shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
      <img
        src={card?.image || '/cards/tarot-1.svg'}
        alt={card?.name || cardId}
        className={`w-full h-[140px] md:h-[180px] object-cover ${isReversed ? 'rotate-180' : ''}`}
      />
      <div className="p-2 text-[11px] leading-4 text-[#efe7d6]">
        <div>{card?.name || cardId}</div>
        <div className="text-[#acc9ba]">{isReversed ? '逆位' : '正位'}</div>
      </div>
    </div>
  );
}
