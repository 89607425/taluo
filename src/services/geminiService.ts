import { GoogleGenAI, Type } from "@google/genai";
import { TarotCard, SpreadType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function generateTarotInterpretation(
  question: string,
  spread: SpreadType,
  cards: { card: TarotCard; isReversed: boolean; position: string }[]
) {
  const model = "gemini-3-flash-preview";
  
  const cardDetails = cards.map(c => 
    `${c.position}: ${c.card.name} ${c.isReversed ? '(Reversed)' : '(Upright)'}`
  ).join('\n');

  const prompt = `
    You are an expert Tarot reader and spiritual guide for the app "Spring Breeze".
    The user has asked: "${question}"
    The spread used is: ${spread}
    The cards drawn are:
    ${cardDetails}

    Provide a deep, mystical, and insightful interpretation.
    Format your response in Markdown.
    Include:
    1. A central theme or "Alchemist's Synthesis" at the end.
    2. Specific insights for each card in its position.
    3. Use a poetic and encouraging tone.
    4. Translate to Chinese (Simplified) as the primary language, but keep card names in English where appropriate.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "Unable to generate interpretation at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The stars are clouded. Please try again later.";
  }
}
