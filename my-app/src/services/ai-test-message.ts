import { openai } from "@/src/lib/openai";

type GenerateTestMessageInput = {
  userMessage: string;
};

export async function generateTestMessage({
  userMessage,
}: GenerateTestMessageInput): Promise<string> {
  const response = await openai.responses.create({
    model: "gpt-5-nano",
    input: userMessage,
  });

  return response.output_text ?? "";
}
