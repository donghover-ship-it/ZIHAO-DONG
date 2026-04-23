import { GoogleGenAI, GenerateContentParameters, GenerateContentResponse } from "@google/genai";
import { globalErrorBus } from "../components/ErrorSystem";

// Simple session cache to prevent duplicate requests
const sessionCache = new Map<string, { response: GenerateContentResponse, timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Calls Gemini API with retry logic for 5xx errors, and specific handling for 429.
 */
export async function generateContentWithRetry(
  params: GenerateContentParameters,
  maxRetries = 5,
  initialDelay = 5000
): Promise<GenerateContentResponse> {
  // 1. Check cache first (only for text models)
  const isImageModel = params.model === 'gemini-2.5-flash-image';
  const cacheKey = JSON.stringify(params);
  
  if (!isImageModel) {
    const cached = sessionCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      console.log("AI Utils: Returning cached response");
      return cached.response;
    }
  }

  let retries = maxRetries;
  
  while (retries > 0) {
    try {
      let apiKey = '';
      try {
        apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) || '';
      } catch (e) {}
      
      if (!apiKey) {
        try {
          apiKey = process.env.GEMINI_API_KEY || '';
        } catch (e) {}
      }

      if (!apiKey) {
        throw new Error("No API key found");
      }
      
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent(params);
      
      // Cache successful response (only for text models)
      if (!isImageModel) {
        sessionCache.set(cacheKey, { response, timestamp: Date.now() });
      }
      return response;
      
    } catch (err: any) {
      const errStatus = err.status || (err.error && err.error.code) || 0;
      const errStatusText = err.statusText || (err.error && err.error.status) || '';
      
      let errMessage = '';
      if (typeof err.message === 'string') {
        errMessage = err.message;
      } else if (err.error && typeof err.error.message === 'string') {
        errMessage = err.error.message;
      } else {
        try { errMessage = JSON.stringify(err); } catch (e) {}
      }

      const is429 = errStatus === 429 || 
                    errMessage.includes('429') || 
                    errMessage.includes('RESOURCE_EXHAUSTED') ||
                    errMessage.includes('Too Many Requests') ||
                    errMessage.includes('quota') ||
                    errStatusText === 'Too Many Requests' ||
                    errStatusText === 'RESOURCE_EXHAUSTED';

      // Special handling for 429: No automatic retry, throw specific error for UI to handle
      if (is429) {
        globalErrorBus.emit({
          type: '429',
          message: '请求频率过高 (429)',
          details: 'Gemini API 资源配额已耗尽'
        });
        const error = new Error("AI_BUSY_429");
        (error as any).status = 429;
        throw error;
      }

      // Check for connection closed or network errors
      if (errMessage.includes('CONNECTION_CLOSED') || errMessage.includes('Failed to fetch')) {
        globalErrorBus.emit({
          type: 'CONNECTION_CLOSED',
          message: '网络连接异常',
          details: 'ERR_CONNECTION_CLOSED'
        });
      }

      // Retry for other transient errors (5xx)
      const isRetryable = 
        errStatus === 500 || 
        errStatus === 502 || 
        errStatus === 503 || 
        errStatus === 504 ||
        errMessage.includes('500') ||
        errMessage.includes('502') ||
        errMessage.includes('Internal Server Error') ||
        errMessage.includes('Bad Gateway') ||
        errStatusText === 'Internal Server Error' ||
        errStatusText === 'Bad Gateway' ||
        errMessage.includes('disturbed or locked') ||
        errMessage.includes('Unexpected end of JSON input') ||
        errMessage.includes('ReadableStreamDefaultController');

      if (isRetryable && retries > 1) {
        const delay = (initialDelay * Math.pow(2, maxRetries - retries)) + (Math.random() * 1000);
        console.warn(`Gemini API ${errStatus || 'transient'} error. Retrying in ${Math.round(delay)}ms... (${retries - 1} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries--;
        continue;
      }
      throw err;
    }
  }
  throw new Error("Max retries exceeded for Gemini API call.");
}

/**
 * Parses an error from a Gemini API call into a user-friendly message.
 */
export function parseAIError(err: any, prefix = "操作失败"): string {
  if (err.message === "AI_BUSY_429" || err.status === 429) {
    return "AI_BUSY_429"; // Special token for UI to handle 15s countdown
  }

  let errorMessage = `${prefix}，请检查网络或稍后重试。`;
  
  try {
    const fullErrorStr = typeof err === 'string' ? err : JSON.stringify(err);
    
    if (fullErrorStr.includes('Internal Server Error') || fullErrorStr.includes('500')) {
      errorMessage = `${prefix}：服务器内部错误（500 Internal Server Error）。请稍后再试。`;
    } else if (err.message && typeof err.message === 'string') {
      errorMessage = `${prefix}: ${err.message}`;
    } else if (err.error && err.error.message) {
      errorMessage = `${prefix}: ${err.error.message}`;
    } else {
      errorMessage = `${prefix}: ${fullErrorStr}`;
    }
  } catch (e) {
    if (err.message) {
      errorMessage = `${prefix}: ${err.message}`;
    }
  }
  
  return errorMessage;
}
