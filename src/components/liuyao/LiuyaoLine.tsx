export function LiuyaoLine({ line, moving, index }: { line: number; moving: boolean; index: number }) {
  const isYang = line === 1 || line === 3;
  return (
    <div key={index} className="relative mb-2">
      {isYang ? (
        <div className={`h-2.5 rounded ${moving ? 'bg-[#52B788] animate-pulse' : 'bg-[#171817]'}`} />
      ) : (
        <div className="flex gap-3">
          <div className={`h-2.5 flex-1 rounded ${moving ? 'bg-[#52B788] animate-pulse' : 'bg-[#171817]'}`} />
          <div className={`h-2.5 flex-1 rounded ${moving ? 'bg-[#52B788] animate-pulse' : 'bg-[#171817]'}`} />
        </div>
      )}
    </div>
  );
}
