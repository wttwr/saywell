import { createServerFn } from "@tanstack/react-start";
import { GatewayError, generateResponse } from "@lovable.dev/ai-gateway";
import { LANGUAGES } from "./languages";
import { listenTipsInput, listenTipsInstructions, validateListenTips, type ListenTips } from "./listen-tips";

export const getListenTips = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => listenTipsInput.parse(input))
  .handler(async ({ data }): Promise<{ result: ListenTips | null; error: "credits" | "unavailable" | null }> => {
    try {
      const response = await generateResponse({
        model: "openai/gpt-6-astra",
        reasoning: { effort: "low" },
        instructions: listenTipsInstructions(data),
        input: JSON.stringify(data),
        text: { format: {
          type: "json_schema", name: "pronunciation_guidance", strict: true,
          schema: {
            type: "object", additionalProperties: false,
            properties: {
              detectedLanguage: { type: "string", enum: [...LANGUAGES] },
              languageConfident: { type: "boolean" },
              tips: { type: "array", maxItems: 4, items: {
                type: "object", additionalProperties: false,
                properties: { phrase: { type: "string" }, guidance: { type: "string" } },
                required: ["phrase", "guidance"],
              } },
            },
            required: ["detectedLanguage", "languageConfident", "tips"],
          },
        } },
      });
      const raw = response.output.flatMap((item) => item.type === "message"
        ? item.content.flatMap((part) => part.type === "output_text" ? [part.text] : []) : []).join("");
      return { result: validateListenTips(JSON.parse(raw), data.reference), error: null };
    } catch (error) {
      if (error instanceof GatewayError) {
        console.error("Listen guidance failed", { code: error.code, status: error.httpStatus, outcome: error.outcome, ids: error.ids });
        return { result: null, error: error.code === "payment_required" ? "credits" : "unavailable" };
      }
      console.error("Listen guidance response could not be read", error);
      return { result: null, error: "unavailable" };
    }
  });