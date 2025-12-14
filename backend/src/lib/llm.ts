import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { env } from '../config/env.js';

// Initialize OpenAI client
const llm = new ChatOpenAI({
  modelName: env.LLM_MODEL,
  openAIApiKey: env.OPENAI_API_KEY,
  configuration: {
    baseURL: env.OPENAI_BASE_URL,
  },
  temperature: 0.3,
});

const embeddings = new OpenAIEmbeddings({
  modelName: env.EMBEDDING_MODEL,
  openAIApiKey: env.OPENAI_API_KEY,
  configuration: {
    baseURL: env.OPENAI_BASE_URL,
  },
});

export interface FeedAnalysis {
  title: string;
  description: string;
  contentType: string;
  language: string;
  categories: string[];
  tags: string[];
  postingFrequency: string;
}

export async function analyzeFeed(
  feedUrl: string,
  feedTitle: string | null,
  feedDescription: string | null,
  samplePosts: { title: string; content: string }[]
): Promise<FeedAnalysis> {
  const postsText = samplePosts
    .slice(0, 5)
    .map((p, i) => `Post ${i + 1}: ${p.title}\n${p.content?.slice(0, 500) || ''}`)
    .join('\n\n');

  const prompt = `Analyze this RSS feed and provide structured information.

Feed URL: ${feedUrl}
${feedTitle ? `Feed Title: ${feedTitle}` : ''}
${feedDescription ? `Feed Description: ${feedDescription}` : ''}

Sample Posts:
${postsText}

Provide a JSON response with the following fields:
- title: A concise, descriptive title for this feed (use existing if good, or improve it)
- description: A 1-2 sentence description of what this feed covers
- contentType: One of: blog, news, podcast, newsletter, video, social, forum, other
- language: ISO 639-1 language code (e.g., "en", "es", "fr")
- categories: Array of 1-3 relevant categories from: Technology, Programming, Web Development, AI & Machine Learning, News, World News, Science, Business, Finance, Entertainment, Gaming, Sports, Health, Design, Podcasts
- tags: Array of 3-5 lowercase tags describing the content (e.g., "javascript", "startup", "tutorial")
- postingFrequency: One of: hourly, daily, weekly, monthly, irregular

Respond with ONLY valid JSON, no markdown or explanation.`;

  const response = await llm.invoke(prompt);
  const content = typeof response.content === 'string' 
    ? response.content 
    : JSON.stringify(response.content);
  
  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse LLM response as JSON');
  }
  
  return JSON.parse(jsonMatch[0]) as FeedAnalysis;
}

export async function getEmbedding(text: string): Promise<number[]> {
  const result = await embeddings.embedQuery(text);
  return result;
}

export async function generateFeedEmbedding(
  title: string,
  description: string,
  categories: string[],
  tags: string[]
): Promise<number[]> {
  const text = `${title}. ${description}. Categories: ${categories.join(', ')}. Tags: ${tags.join(', ')}`;
  return getEmbedding(text);
}
