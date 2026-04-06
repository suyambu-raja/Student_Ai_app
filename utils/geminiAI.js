import app from './firebase';
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';

// Initialize Firebase AI with Google AI backend
// This routes all Gemini API calls through Firebase — no API key exposed in frontend code
const ai = getAI(app, { backend: new GoogleAIBackend() });

/**
 * Get a Gemini generative model instance via Firebase AI.
 * @param {string} modelName - The model to use (default: gemini-2.0-flash)
 * @param {object} config - Generation config (temperature, etc.)
 * @param {string} systemInstruction - System prompt for the model
 * @returns {GenerativeModel}
 */
export function getGeminiModel(modelName = 'gemini-2.0-flash', config = {}, systemInstruction = '') {
  const modelConfig = { model: modelName };
  
  if (systemInstruction) {
    modelConfig.systemInstruction = systemInstruction;
  }
  
  if (config.temperature !== undefined || config.maxOutputTokens !== undefined) {
    modelConfig.generationConfig = {};
    if (config.temperature !== undefined) modelConfig.generationConfig.temperature = config.temperature;
    if (config.maxOutputTokens !== undefined) modelConfig.generationConfig.maxOutputTokens = config.maxOutputTokens;
  }
  
  return getGenerativeModel(ai, modelConfig);
}

export { ai };
