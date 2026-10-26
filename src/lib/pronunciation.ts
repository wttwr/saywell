/** Word-level comparison between a reference sentence and what speech-to-text recognised. */
export type DiffOp =
  | { type: "match"; word: string }
  | { type: "missing"; word: string }
  | { type: "extra"; word: string }
  | { type: "different"; word: string; heard: string };

const CJK = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uac00-\ud7af]/;

/** Splits into comparable tokens: words for spaced scripts, single characters for CJK. */
export function tokenize(text: string): string[] {
  const out: string[] = [];
  for (const chunk of text.split(/\s+/)) {
    let buf = "";
    for (const ch of chunk) {
      if (CJK.test(ch)) {
        if (buf) out.push(buf), (buf = "");
        out.push(ch);
      } else buf += ch;
    }
    if (buf) out.push(buf);
  }
  return out.filter((t) => normalize(t) !== "");
}

export function normalize(token: string): string {
  return token.toLowerCase().normalize("NFC").replace(/[\p{P}\p{S}]/gu, "").replace(/’/g, "'");
}

/** LCS alignment; adjacent missing+extra pairs are merged into "different". */
export function compareWords(reference: string, heard: string): DiffOp[] {
  const a = tokenize(reference);
  const b = tokenize(heard);
  const na = a.map(normalize);
  const nb = b.map(normalize);
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      dp[i]![j] = na[i] === nb[j] ? dp[i + 1]![j + 1]! + 1 : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
  const raw: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && na[i] === nb[j]) raw.push({ type: "match", word: a[i++]! }), j++;
    else if (j < b.length && (i >= a.length || dp[i]![j + 1]! >= dp[i + 1]![j]!)) raw.push({ type: "extra", word: b[j++]! });
    else raw.push({ type: "missing", word: a[i++]! });
  }
  // Merge runs of missing/extra between matches into "different" pairs.
  const out: DiffOp[] = [];
  let k = 0;
  while (k < raw.length) {
    if (raw[k]!.type === "match") { out.push(raw[k++]!); continue; }
    const miss: string[] = [];
    const extra: string[] = [];
    while (k < raw.length && raw[k]!.type !== "match") {
      const op = raw[k++]!;
      (op.type === "missing" ? miss : extra).push(op.word);
    }
    const n = Math.min(miss.length, extra.length);
    for (let x = 0; x < n; x++) out.push({ type: "different", word: miss[x]!, heard: extra[x]! });
    for (const w of miss.slice(n)) out.push({ type: "missing", word: w });
    for (const w of extra.slice(n)) out.push({ type: "extra", word: w });
  }
  return out;
}

export function summarize(ops: DiffOp[]) {
  const count = (t: DiffOp["type"]) => ops.filter((o) => o.type === t).length;
  return { match: count("match"), missing: count("missing"), different: count("different"), extra: count("extra") };
}
