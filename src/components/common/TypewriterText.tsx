export default function TypewriterText({ text }: { text: string }) {
  return <div className="whitespace-pre-wrap leading-7 text-sm md:text-base text-emerald-950/90">{text || '...'}</div>;
}
