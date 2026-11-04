import type { InterpretResult } from "./interpret.functions";

/** Immutable inputs/settings attached to one interpretation, shared by both views. */
export type InterpretSubmission = {
  text: string;
  context: string;
  language: string;
  explanationLanguage: string;
  voiceId: string;
  speechSpeed: number;
};

export type SubmittedInterpretResult = InterpretResult & { submission: InterpretSubmission };

export function matchesInterpretSubmission(submitted: InterpretSubmission, draft: InterpretSubmission) {
  return submitted.text === draft.text
    && submitted.context === draft.context
    && submitted.language === draft.language
    && submitted.explanationLanguage === draft.explanationLanguage
    && submitted.voiceId === draft.voiceId
    && submitted.speechSpeed === draft.speechSpeed;
}