import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import { getDB } from '../core/database.js';

export class AIProvider {
  constructor() { this.db = getDB(); this.providers = {}; this.activeProvider = null; this.initFromConfig(); }

  initFromConfig() {
    try {
      const config = this.db.prepare(`SELECT * FROM ai_config WHERE is_active = 1`).get();
      if (config) this.setProvider(config.provider, config.api_key, config.model);
    } catch (e) {}
  }

  setProvider(providerName, apiKey, model) {
    switch (providerName) {
      case 'openai': this.activeProvider = new OpenAIProvider(apiKey, model); break;
      case 'gemini': this.activeProvider = new GeminiProvider(apiKey, model); break;
      case 'claude': this.activeProvider = new ClaudeProvider(apiKey, model); break;
      default: throw new Error(`Unknown provider: ${providerName}`);
    }
    return true;
  }

  isReady() { return this.activeProvider !== null; }
  getActiveProviderName() { return this.activeProvider?.name || null; }

  async chat(systemPrompt, userMessage, options = {}) {
    if (!this.activeProvider) return { success: false, error: 'AI প্রোভাইডার কনফিগার করা হয়নি।', fallback: true };
    try {
      const response = await this.activeProvider.chat(systemPrompt, userMessage, options);
      return { success: true, content: response, provider: this.activeProvider.name, model: this.activeProvider.model };
    } catch (error) {
      return { success: false, error: error.message, fallback: true };
    }
  }

  getAvailableProviders() {
    return [
      { id: 'openai', name: 'OpenAI', icon: '🟢', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'], description: 'GPT-4o - সবচেয়ে শক্তিশালী', pricing: 'Pay per token', apiKeyUrl: 'https://platform.openai.com/api-keys', recommended: true },
      { id: 'gemini', name: 'Google Gemini', icon: '🔵', models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'], description: 'Gemini - দ্রুত ও ফ্রি!', pricing: 'Free tier available', apiKeyUrl: 'https://aistudio.google.com/apikey', recommended: false },
      { id: 'claude', name: 'Anthropic Claude', icon: '🟣', models: ['claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'], description: 'Claude - নিরাপদ ও বুদ্ধিমান', pricing: 'Pay per token', apiKeyUrl: 'https://console.anthropic.com/settings/keys', recommended: false }
    ];
  }
}

class OpenAIProvider {
  constructor(apiKey, model = 'gpt-4o-mini') { this.name = 'openai'; this.model = model; this.client = new OpenAI({ apiKey }); }
  async chat(systemPrompt, userMessage, options = {}) {
    const response = await this.client.chat.completions.create({ model: this.model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }], temperature: options.temperature || 0.7, max_tokens: options.maxTokens || 2000 });
    return response.choices[0].message.content;
  }
}

class GeminiProvider {
  constructor(apiKey, model = 'gemini-1.5-flash') { this.name = 'gemini'; this.model = model; this.client = new GoogleGenerativeAI(apiKey); }
  async chat(systemPrompt, userMessage, options = {}) {
    const genModel = this.client.getGenerativeModel({ model: this.model, systemInstruction: systemPrompt });
    const result = await genModel.generateContent(userMessage);
    return result.response.text();
  }
}

class ClaudeProvider {
  constructor(apiKey, model = 'claude-sonnet-4-20250514') { this.name = 'claude'; this.model = model; this.client = new Anthropic({ apiKey }); }
  async chat(systemPrompt, userMessage, options = {}) {
    const response = await this.client.messages.create({ model: this.model, max_tokens: options.maxTokens || 2000, system: systemPrompt, messages: [{ role: 'user', content: userMessage }] });
    return response.content[0].text;
  }
}

let aiProviderInstance = null;
export function getAIProvider() { if (!aiProviderInstance) aiProviderInstance = new AIProvider(); return aiProviderInstance; }
export function resetAIProvider() { aiProviderInstance = null; }
