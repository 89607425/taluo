export default function TypewriterText({ text }: { text: string }) {
  return <div className="whitespace-pre-wrap leading-7 text-sm md:text-base text-zinc-100/95">{text || '...'}</div>;
}
