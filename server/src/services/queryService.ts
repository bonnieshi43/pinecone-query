import { ChatOpenAI } from "@langchain/openai";
import { ProxyAgent, setGlobalDispatcher } from "undici";
import dotenv from "dotenv";

dotenv.config();

let cachedLLM: ChatOpenAI | null = null;
let proxyConfigured = false;

/**
 * 按需配置全局代理，避免重复设置
 */
function ensureProxy() {
  if (proxyConfigured) return;

  const proxyUrl = process.env.HTTP_PROXY || process.env.HTTPS_PROXY || process.env.PROXY_URL;
  if (proxyUrl) {
    setGlobalDispatcher(new ProxyAgent(proxyUrl));
    proxyConfigured = true;
  }
}

function getLLM(): ChatOpenAI {
  if (cachedLLM) {
    return cachedLLM;
  }

  ensureProxy();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured. Please set it in your .env file.");
  }

  cachedLLM = new ChatOpenAI({
    openAIApiKey: apiKey,
    modelName: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
    temperature: 0.7,
  });

  return cachedLLM;
}

/**
 * 处理 query：根据用户提供的 prompt 处理 query
 * 使用 OpenAI API 通过 LangChain 进行实际处理
 */
export async function processQuery(
  query: string,
  prompt: string
): Promise<string> {
  try {
    // 构建完整的 prompt
    // 将用户的 prompt 作为指令，query 作为要处理的内容
    const fullPrompt = `${prompt}\n\n要处理的内容: "${query}"`;
    
    const llm = getLLM();
    
    // 调用 LLM 处理
    const response = await llm.invoke(fullPrompt);
    
    // 提取结果文本 - LangChain 返回的是 AIMessage 对象
    let result: string;
    if (typeof response === 'string') {
      result = response;
    } else if (response && typeof response === 'object' && 'content' in response) {
      result = String(response.content);
    } else {
      result = String(response);
    }
    
    if (!result || result.trim().length === 0) {
      throw new Error("LLM returned empty response");
    }
    
    return result.trim();
  } catch (error: any) {
    console.error("Error processing query with LLM:", error);
    
    // 如果是因为 API key 未配置，给出明确的错误提示
    if (error.message?.includes("OPENAI_API_KEY")) {
      throw new Error("OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env file.");
    }
    
    throw new Error(`Failed to process query: ${error.message || "Unknown error"}`);
  }
}

