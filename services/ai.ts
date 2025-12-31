
import { GoogleGenAI, Type } from "@google/genai";
import { storage } from "./storage";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are 'AI-Hub Brain', the core processing unit of the AI-Hub platform.
Your objective: Increase information density and community engagement.
You control:
1. 'News Bridge' (📡): Scans global trends for high-value summaries.
2. 'Reddit Ambassador' (🌎): Bridges the gap between global Reddit culture and local users.
3. 'Wiki Scholar' (📚): Synthesizes fragmented discussions into structured wiki knowledge.
Response: Korean only, data-centric, professional but slightly witty.
`;

export const aiService = {
  // Autonomous Swarm Trigger
  runSwarmActivity: async () => {
    const chance = Math.random();
    if (chance < 0.15) {
      await aiService.agentNewsBridge();
    } else if (chance < 0.25) {
      await aiService.agentRedditAmbassador();
    } else if (chance < 0.30) {
      await aiService.agentWikiScholar();
    }
  },

  agentNewsBridge: async () => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Find a breaking tech or financial news in Korea and format it as a community post. Title must start with [AI 속보]. Include your analytical opinion.",
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: SYSTEM_INSTRUCTION + " Act as 'News Bridge'."
        }
      });
      
      const text = response.text || "";
      const lines = text.split('\n');
      const title = lines[0].replace('제목:', '').trim();
      const content = lines.slice(1).join('\n').trim();

      if (title && content) {
        const botUser = storage.getBotUser('news');
        await storage.savePost({
          title, content, board_id: 'stock', category: '뉴스',
          author_id: botUser.id, author: { ...botUser, created_at: new Date().toISOString() },
          view_count: 0, upvotes: 0, downvotes: 0, liked_users: [], comment_count: 0,
          ai_agent_type: 'news',
          created_at: new Date().toISOString()
        });
        await storage.saveAiLog('swarm_activity', 'news', `뉴스 전파: ${title}`);
      }
    } catch (e) { console.error("News Bridge Error", e); }
  },

  agentRedditAmbassador: async () => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Search for a high-engagement tech topic on Reddit and explain it for a Korean audience. Title starts with [Reddit 트렌드].",
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: SYSTEM_INSTRUCTION + " Act as 'Reddit Ambassador'."
        }
      });
      
      const text = response.text || "";
      const lines = text.split('\n');
      const title = (lines[0] || "").replace('제목:', '').trim();
      const content = lines.slice(1).join('\n').trim();

      if (title && content) {
        const botUser = storage.getBotUser('reddit');
        await storage.savePost({
          title, content, board_id: 'dev', category: 'AI',
          author_id: botUser.id, author: { ...botUser, created_at: new Date().toISOString() },
          view_count: 0, upvotes: 0, downvotes: 0, liked_users: [], comment_count: 0,
          ai_agent_type: 'reddit',
          created_at: new Date().toISOString()
        });
        await storage.saveAiLog('swarm_activity', 'reddit', `레딧 트렌드 공유: ${title}`);
      }
    } catch (e) { console.error("Reddit Ambassador Error", e); }
  },

  agentWikiScholar: async () => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: "Suggest a trending keyword in Korea that we don't have a wiki for yet. Research it and provide a full wiki documentation in Markdown. Include 'slug' and 'title'.",
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction: SYSTEM_INSTRUCTION + " Act as 'Wiki Scholar'. Provide JSON response.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              slug: { type: Type.STRING },
              title: { type: Type.STRING },
              content: { type: Type.STRING }
            },
            required: ["slug", "title", "content"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      if (data.slug && data.content) {
        const botUser = storage.getBotUser('wiki');
        await storage.saveWikiPage({
            slug: data.slug,
            title: data.title,
            content: data.content,
            last_updated: new Date().toISOString(),
            last_editor: botUser.username
        });
        await storage.saveAiLog('wiki', data.slug, `위키 문서 자동 생성: ${data.title}`);
      }
    } catch (e) { console.error("Wiki Scholar Error", e); }
  },

  summarize: async (content: string): Promise<string> => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `다음 게시글을 3줄로 핵심만 요약해줘:\n\n${content}`,
      config: { systemInstruction: SYSTEM_INSTRUCTION }
    });
    return response.text || "요약에 실패했습니다.";
  },

  factCheck: async (content: string) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `다음 글의 사실 여부를 검증하고 근거를 제시해줘:\n\n${content}`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: SYSTEM_INSTRUCTION + " Act as Fact Checker."
      }
    });
    
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks.map((chunk: any) => ({
      title: chunk.web?.title || '참조',
      uri: chunk.web?.uri || ''
    })).filter((s: any) => s.uri);

    return {
      text: response.text || "검증 중 오류가 발생했습니다.",
      sources
    };
  },

  generateComment: async (postContent: string) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `이 글에 대해 짧은 댓글을 작성해줘:\n\n${postContent}`,
      config: { systemInstruction: SYSTEM_INSTRUCTION }
    });
    return response.text || "";
  },

  generateWikiDraft: async (title: string) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `'${title}'에 대한 위키 문서를 작성해줘.`,
      config: { systemInstruction: SYSTEM_INSTRUCTION }
    });
    return response.text || "초안 생성 실패.";
  },

  moderateContent: async (text: string) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Moderation: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
           type: Type.OBJECT,
           properties: { isSafe: { type: Type.BOOLEAN }, reason: { type: Type.STRING } },
           required: ["isSafe"]
        }
      }
    });
    return JSON.parse(response.text || '{"isSafe":true}');
  }
};
