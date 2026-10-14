import { Check, Copy, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function TextActions({ playing, failed, copied, onListen, onCopy }: {
  playing: boolean;
  failed: boolean;
  copied: boolean;
  onListen: () => void;
  onCopy: () => void;
}) {
  const { t } = useI18n();
  const listenLabel = playing ? t("translate.stop") : t("translate.listen");
  return (
    <>
      <Button variant="ghost" onClick={onListen} title={listenLabel} aria-label={listenLabel} aria-pressed={playing}
        className={cn("h-auto gap-1.5 p-0 font-normal hover:bg-transparent", playing ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
        {failed ? <VolumeX /> : <Volume2 className={cn(playing && "animate-pulse")} />}
        {listenLabel}
      </Button>
      <Button variant="ghost" onClick={onCopy} title={t("translate.copy")} aria-label={t("translate.copy")}
        className="h-auto gap-1.5 p-0 font-normal text-muted-foreground hover:bg-transparent hover:text-foreground">
        {copied ? <Check /> : <Copy />}
        {copied ? t("translate.copied") : t("translate.copy")}
      </Button>
    </>
  );
}