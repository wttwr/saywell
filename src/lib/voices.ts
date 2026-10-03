/** ElevenLabs multilingual voices users can pick for Listen. */
export const VOICES = [
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", tone: { en: "Warm, soft", it: "Calda, morbida", zh: "温暖柔和" } },
  { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice", tone: { en: "Clear, confident", it: "Chiara, sicura", zh: "清晰自信" } },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", tone: { en: "Friendly, bright", it: "Amichevole, vivace", zh: "友好明快" } },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", tone: { en: "Gentle, calm", it: "Delicata, calma", zh: "轻柔平静" } },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", tone: { en: "Deep, storyteller", it: "Profonda, narrativa", zh: "低沉叙事" } },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", tone: { en: "Steady, articulate", it: "Pacata, nitida", zh: "沉稳清楚" } },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", tone: { en: "Young, energetic", it: "Giovane, energica", zh: "年轻活力" } },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian", tone: { en: "Relaxed, natural", it: "Rilassata, naturale", zh: "放松自然" } },
] as const;

export const DEFAULT_VOICE = VOICES[0].id;
export const VOICE_IDS: string[] = VOICES.map((v) => v.id);
