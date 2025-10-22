import { GoogleGenAI } from "@google/genai";
import type { Article, GroundingSource, FilterOptions } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Translates Chinese keywords to English using the Gemini API.
 * @param keywords A string of comma-separated Chinese keywords.
 * @returns A promise that resolves to a string of comma-separated English keywords.
 */
async function translateKeywords(keywords: string): Promise<string> {
  try {
    const prompt = `将以下中文关键词翻译成英文。请只返回翻译后的英文关键词，并用逗号分隔。
    中文关键词：${keywords}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
          temperature: 0,
      }
    });

    // Clean up the response to ensure it's just comma-separated keywords
    return response.text.trim().replace(/\.$/, '');
  } catch (error) {
    console.warn("Keyword translation failed, proceeding with original keywords.", error);
    return ''; // Return empty string on failure, so we just use the original keywords.
  }
}


/**
 * Parses the text response from the Gemini API into an array of Article objects.
 * This new parser is much more robust. It uses a single regular expression to find all
 * article blocks and correctly handles both full-width (：) and half-width (:) colons,
 * as well as variable whitespace. It also extracts the first valid URL from the source field.
 * @param text The raw text response from the API.
 * @returns An array of parsed articles.
 */
function parseArticleResponse(text: string): Article[] {
    const articles: Article[] = [];
    // This regex captures title, summary, and source for each article entry.
    // - It handles both full-width and half-width colons: [：:]
    // - It captures any character including newlines non-greedily: [\s\S]*?
    // - It stops at the next "标题" or the end of the string: (?=标题[：:]|$)
    const regex = /标题[：:]([\s\S]*?)摘要[：:]([\s\S]*?)来源[：:]([\s\S]*?)(?=标题[：:]|$)/g;

    let match;
    while ((match = regex.exec(text)) !== null) {
        const title = match[1].trim();
        const summary = match[2].trim();
        let source = match[3].trim();

        // Extract the first valid URL from the source string.
        // This handles cases where the model might add extra text or markdown.
        const urlMatch = source.match(/https?:\/\/[^\s"'\)<>]+/);
        if (urlMatch) {
            source = urlMatch[0];
        }

        if (title && summary && source) {
            articles.push({ title, summary, source });
        }
    }
    return articles;
}

export async function fetchDigitalEconomyArticles(filters: FilterOptions): Promise<{ articles: Article[]; sources: GroundingSource[] }> {
  try {
    const today = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const startDate = formatDate(oneWeekAgo);
    const endDate = formatDate(today);

    let topicFocusInstruction = '';
    if (filters.subTopic) {
      const translatedKeywords = await translateKeywords(filters.subTopic);
      let combinedKeywords = filters.subTopic;
      if (translatedKeywords) {
          combinedKeywords += `, ${translatedKeywords}`;
      }
      topicFocusInstruction = `4.  **主题聚焦 (Topic Focus):** 文章内容必须聚焦于以下一个或多个主题：“${combinedKeywords}”。`;
    }

    const prompt = `
**任务：**
为我查找关于“数字经济”的最新、最权威的研究资料。

**核心指令 (必须严格遵守):**

1.  **视角层级 (Scope):** 结果必须是宏观层面的。只关注国家级政策、跨国研究或重要的全球/全国性行业趋势。**严格排除**任何只关注特定省、市或地区的内容。

2.  **内容类型 (Content-Type):** 结果**必须以学术论文（特别是SCI收录的）和深度行业报告为主体**。新闻文章和政府出版物可以作为补充，但不是主要部分。

3.  **语言均衡 (Language Balance):** 最终返回的结果中，中文文献和英文文献的数量**必须大致各占一半 (50/50)**。

${topicFocusInstruction}

5.  **时间范围 (Timeframe):** 发布日期必须在 ${startDate} 和 ${endDate} 之间。

6.  **排序标准 (Sorting):** 请根据权威性和信息量对所有结果进行综合排序，将最相关的、质量最高的结果放在最前面。

**输出格式 (Output Format):**
请严格按照以下格式为每篇文章或论文提供信息，不要添加任何介绍性文字、编号或总结。
标题：[文章或论文的完整标题]
摘要：[一段简洁的文章或论文摘要]
来源：[文章或论文的直接网址]

每个条目之间请用一个空行分隔。
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro", // Using a more powerful model for better instruction following
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const articles = parseArticleResponse(response.text);
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = groundingChunks
      .map((chunk: any) => ({
        uri: chunk.web?.uri || '',
        title: chunk.web?.title || '',
      }))
      .filter((source: GroundingSource) => source.uri);

    // Deduplicate sources based on URI
    const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());

    return { articles, sources: uniqueSources };

  } catch (error) {
    console.error("Error fetching articles from Gemini API:", error);
    throw new Error("获取文章失败。API 可能不可用或请求失败。");
  }
}