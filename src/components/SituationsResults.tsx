import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowUpRight, Bookmark, Check, Copy, MoreHorizontal, Speech, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n";
import { useSettings } from "@/lib/settings";
import { sendToFeature } from "@/lib/feature-state";
import { useSavedStore } from "@/lib/saved-store";
import { useSpeech } from "@/lib/speech";
import type { SituationExpression, SituationsResult } from "@/lib/situations.functions";
import { cn } from "@/lib/utils";

export function SituationsResults({ result, explanationLanguage }: { result: SituationsResult; explanationLanguage: string }) {
  const { t, ln } = useI18n();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const speech = useSpeech();
  const saved = useSavedStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const open = (feature: "listen" | "interpret" | "style", expression: SituationExpression) => {
    sendToFeature(feature, { text: expression.text, language: result.language, shortcuts: [...settings[`${feature}Shortcuts`]] });
    void navigate({ to: feature === "listen" ? "/listen" : feature === "interpret" ? "/interpret" : "/style" });
  };

  return (
    <div className="space-y-5">
      {result.groups.map((group, gi) => (
        <section key={gi}>
          {group.title && <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{group.title}</h2>}
          <ul className="mt-3 divide-y divide-border/60">
            {group.expressions.map((expression, ei) => {
              const id = `situations:${gi}:${ei}:${result.language}:${expression.text}`;
              const playing = speech.playingId === id;
              const isSaved = saved.isSaved("translation", expression.text, result.language);
              const playLabel = playing ? t("translate.stop") : t("situations.playAudio");
              return (
                <li key={id} aria-label={expression.text} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                    <p className="shrink-0 text-xs font-medium text-muted-foreground sm:w-24 sm:pt-1">{ln(result.language)}</p>
                    <div className="min-w-0 flex-1">
                      <p className="whitespace-pre-wrap break-words text-lg leading-relaxed text-foreground">{expression.text}</p>
                      {expression.meaning && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/80">{expression.meaning}</p>}
                      {expression.note && <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">{expression.note}</p>}
                      {expression.transliteration && <p className="mt-2 break-words text-xs leading-relaxed text-muted-foreground">{expression.transliteration}</p>}
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-3">
                        <Button variant="ghost" onClick={() => void speech.speak(id, expression.text, result.language)} title={playLabel} aria-pressed={playing}
                          className="h-auto gap-1.5 p-0 font-normal text-muted-foreground hover:bg-transparent hover:text-foreground">
                          {speech.errorId === id ? <VolumeX /> : <Volume2 className={cn(playing && "animate-pulse")} />}{playLabel}
                        </Button>
                        <Button variant="ghost" onClick={() => open("listen", expression)} className="h-auto gap-1.5 whitespace-normal p-0 text-left font-normal text-muted-foreground hover:bg-transparent hover:text-foreground">
                          <Speech />{t("situations.practicePronunciation")}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-auto gap-1.5 p-0 font-normal text-muted-foreground hover:bg-transparent hover:text-foreground">
                              <MoreHorizontal />{t("situations.moreActions")}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" aria-label={t("situations.moreActions")}>
                            <DropdownMenuItem onSelect={() => void navigator.clipboard.writeText(expression.text).then(() => { setCopiedId(id); setTimeout(() => setCopiedId(null), 1600); })}>
                              {copiedId === id ? <Check /> : <Copy />}{copiedId === id ? t("translate.copied") : t("translate.copy")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => saved.toggle({ kind: "translation", text: expression.text, language: result.language, source: expression.meaning, sourceLanguage: explanationLanguage, ...(expression.transliteration ? { transliteration: expression.transliteration } : {}), ...(expression.note ? { detail: expression.note } : {}) })}>
                              <Bookmark className={cn(isSaved && "fill-current text-primary")} />{isSaved ? t("saved.unsave") : t("saved.save")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => open("interpret", expression)}><ArrowUpRight />{t("nav.interpret")}</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => open("style", expression)}><ArrowUpRight />{t("nav.style")}</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}