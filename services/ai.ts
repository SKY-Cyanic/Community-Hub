
import { GoogleGenAI, Type } from "@google/genai";
import { storage } from "./storage";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are 'AI_Manager' (nickname: Phaddak/파딱), an AI operator for a Korean community website.
Your personality is:
1. Efficient and slightly dry/cynical but helpful.
2. You use Korean community slang moderately (e.g., 'ㅇㅇ', '팩트임', 'ㄴㄴ').
3. You are objective and neutral.
`;

export const aiService = {
  // 1. 3-Line Summary
  summarize: async (content: string): Promise<string> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Summarize the following community post into exactly 3 bullet points in Korean. Keep it casual but accurate.\n\nContent:\n${content}`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        }
      });
      storage.saveAiLog('summary', 'post', 'Generated 3-line summary');
      return response.text || "요약에 실패했습니다.";
    } catch (e) {
      console.error(e);
      return "AI 통신 오류로 요약할 수 없습니다.";
    }
  },

  // 2. Fact Check (Grounding)
  factCheck: async (content: string): Promise<{ text: string, sources: { title: string, uri: string }[] }> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Check the facts in this post. If it contains specific claims, verify them using Google Search. 
        If it's just an opinion or humor, say "Verification not applicable".
        Output in Korean.
        
        Post Content: "${content}"`,
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: SYSTEM_INSTRUCTION + " Be a rigorous fact-checker."
        }
      });

      const text = response.text || "확인 불가";
      const sources: { title: string, uri: string }[] = [];

      // Extract sources from grounding metadata
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        groundingChunks.forEach((chunk: any) => {
          if (chunk.web?.uri) {
            sources.push({
              title: chunk.web.title || 'Source',
              uri: chunk.web.uri
            });
          }
        });
      }

      storage.saveAiLog('fact_check', 'post', `Checked facts with ${sources.length} sources`);
      return { text, sources };
    } catch (e) {
      console.error(e);
      return { text: "팩트체크 중 오류가 발생했습니다.", sources: [] };
    }
  },

  // 3. Clean Bot (Moderation)
  moderateContent: async (text: string): Promise<{ isSafe: boolean, reason?: string }> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze the following comment for toxicity, hate speech, or extreme profanity.
        Return JSON.
        
        Comment: "${text}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
             type: Type.OBJECT,
             properties: {
                isSafe: { type: Type.BOOLEAN },
                reason: { type: Type.STRING }
             },
             required: ["isSafe"]
          }
        }
      });
      
      const result = JSON.parse(response.text || '{}');
      if (!result.isSafe) {
        storage.saveAiLog('moderation', 'comment', `Blocked/Warned: ${result.reason}`);
      }
      return result;
    } catch (e) {
      console.error(e);
      // Fail safe: allow if AI fails
      return { isSafe: true };
    }
  },

  // 4. Engagement Bot
  generateComment: async (postContent: string): Promise<string> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Read this post and write a short, engaging first comment to encourage discussion. 
        Don't be too generic. Use a casual community tone.
        
        Post: "${postContent}"`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION
        }
      });
      
      const text = response.text || "";
      if (text) {
        storage.saveAiLog('comment', 'post', 'Auto-generated engagement comment');
      }
      return text;
    } catch (e) {
      return "";
    }
  },

  // 5. Wiki Helper
  generateWikiDraft: async (title: string): Promise<string> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Write a draft for a wiki page titled "${title}". 
        Structure it with Markdown (headers, bullet points). 
        Keep it informative and objective.
        If you don't know the topic, admit it but provide a template.`,
        config: {
           tools: [{ googleSearch: {} }], // Use search to get info
           systemInstruction: SYSTEM_INSTRUCTION
        }
      });
      
      storage.saveAiLog('wiki', 'wiki_draft', `Generated draft for ${title}`);
      return response.text || "";
    } catch (e) {
      return "초안 생성 실패";
    }
  }
};
