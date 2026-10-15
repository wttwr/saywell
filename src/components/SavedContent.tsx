import { useState } from "react";
import { TextActions } from "@/components/TextActions";
import { useI18n } from "@/lib/i18n";
import type { SavedItem } from "@/lib/saved-store";
import { useSpeech } from "@/lib/speech";

export function SavedContent({ group }: { group: SavedItem[] }) {
  const { t, ln } = useI18n();
  const speech = useSpeech();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const first = group[0];
  if (!first) return null;
  const entry = first.dictionaryEntry;
  const actions = (id: string, text: string, language: string) => (
    <div className="mt-3 flex flex-wrap items-center gap-4">
      <TextActions playing={speech.playingId === id} failed={speech.errorId === id} copied={copiedId === id}
        onListen={() => void speech.speak(id, text, language)}
        onCopy={() => void navigator.clipboard.writeText(text).then(() => {
          setCopiedId(id);
          setTimeout(() => setCopiedId(null), 1600);
        })} />
    </div>
  );
  return (
    <div className="rounded-2xl bg-secondary/40 p-5 md:p-6">
      {first.source && first.kind !== "dictionary" && (
        <section className="mb-6">
          <p className="text-xs text-muted-foreground">{first.sourceLanguage ? `${ln(first.sourceLanguage)} · ` : ""}{t("translate.sourceLabel")}</p>
          <p className="mt-2 whitespace-pre-wrap break-words text-xl leading-relaxed text-foreground">{first.source}</p>
          {first.sourceLanguage && actions(`source:${first.id}`, first.source, first.sourceLanguage)}
        </section>
      )}
      <div className={first.groupId ? "divide-y divide-border/60" : ""}>
        {group.map((row) => (
          <section key={row.id} className={first.groupId ? "py-5 first:pt-0 last:pb-0" : ""}>
            <p className="text-xs font-medium text-muted-foreground">{ln(row.language)}</p>
            <p className="mt-2 whitespace-pre-wrap break-words text-xl leading-relaxed text-foreground">{row.text}</p>
            {row.transliteration && <p className="mt-1 text-sm text-muted-foreground">{row.transliteration}</p>}
            {actions(row.id, row.text, row.language)}
            {(row.detail || entry?.meaning) && <p className="mt-5 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">{entry?.meaning ?? row.detail}</p>}
          </section>
        ))}
      </div>
      {entry?.expandedForm && <section className="mt-6"><h2 className="text-xs text-muted-foreground">{t("vocab.expandedForm")}</h2><p className="mt-1 break-words text-foreground">{entry.expandedForm}</p></section>}
      {entry?.imageUrl && <img src={entry.imageUrl} alt={entry.text} loading="lazy" className="mt-6 max-h-64 w-full rounded-xl object-cover" />}
      {entry && entry.senses.length > 0 && <ul className="mt-6 space-y-5 border-t border-border pt-5">
        {entry.senses.map((sense, index) => <li key={index}>
          <p className="break-words text-sm leading-relaxed text-foreground">{sense.partOfSpeech && <span className="mr-2 italic text-muted-foreground">{sense.partOfSpeech}</span>}{sense.definition}</p>
          {sense.example && <div className="mt-2"><p className="break-words text-sm leading-relaxed text-muted-foreground">{sense.example}</p>{actions(`example:${first.id}:${index}`, sense.example, first.language)}{sense.exampleTranslation && <p className="mt-2 break-words text-sm text-muted-foreground">{sense.exampleTranslation}</p>}</div>}
        </li>)}
      </ul>}
      {entry?.etymology && <section className="mt-6 border-t border-border pt-5"><h2 className="text-xs text-muted-foreground">{t("vocab.etymology")}</h2><p className="mt-1 break-words text-sm leading-relaxed text-foreground/80">{entry.etymology}</p></section>}
      {entry?.note && <p className="mt-5 break-words text-sm text-muted-foreground">{entry.note}</p>}
    </div>
  );
}