
/**
 * Converts a data URL string (e.g., "data:image/jpeg;base64,...") to its
 * base64 data part and mime type.
 * @param dataUrl The full data URL.
 * @returns An object with base64 data and mime type, or null if format is invalid.
 */
export const processDataUrl = (dataUrl: string): { base64Data: string; mimeType: string } | null => {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    console.error("Invalid data URL format");
    return null;
  }
  const mimeType = match[1];
  const base64Data = match[2];
  return { base64Data, mimeType };
};
