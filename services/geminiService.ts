
import { GoogleGenAI, Modality } from "@google/genai";

/**
 * Edits an image using a text prompt with the Gemini 2.5 Flash Image model.
 * @param base64Data The base64 encoded image data (without prefix).
 * @param mimeType The MIME type of the image.
 * @param prompt The text prompt for the edit.
 * @returns A promise that resolves to the base64 data URL of the generated image.
 */
export const editImageWithPrompt = async (
  base64Data: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  // Best practice: Initialize right before use to ensure latest API key.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
        const generatedBase64 = part.inlineData.data;
        const generatedMimeType = part.inlineData.mimeType;
        return `data:${generatedMimeType};base64,${generatedBase64}`;
      }
    }

    throw new Error("No image found in Gemini API response.");
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        // Provide a more user-friendly error message.
        if (error.message.includes('API key not valid')) {
            throw new Error('The provided API key is not valid. Please check your configuration.');
        }
        throw new Error(`An error occurred while communicating with the AI model: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the image.");
  }
};
