/** ElevenLabs multilingual voices users can pick for Listen. */
export const VOICES = [
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", tone: { en: "Warm, soft", it: "Calda, morbida", zh: "温暖柔和" } },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", tone: { en: "Friendly, bright", it: "Amichevole, vivace", zh: "友好明快" } },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", tone: { en: "Deep, storyteller", it: "Profonda, narrativa", zh: "低沉叙事" } },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", tone: { en: "Young, energetic", it: "Giovane, energica", zh: "年轻活力" } },
] as const;

export const DEFAULT_VOICE = VOICES[0].id;
export const VOICE_IDS: string[] = VOICES.map((v) => v.id);
