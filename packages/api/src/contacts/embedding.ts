import axios from 'axios';
import { logger } from '@librechat/data-schemas';
import { flattenContact, type ContactLike } from './flatten';

const DEFAULT_BATCH_SIZE = 100;
const DEFAULT_GOOGLE_MODEL = 'text-embedding-004';
const DEFAULT_OPENAI_MODEL = 'text-embedding-3-small';
const DEFAULT_AZURE_API_VERSION = '2024-08-01-preview';

type EmbeddingProvider = 'azure' | 'openai' | 'google';

type AzureEmbeddingConfig = {
  provider: 'azure';
  apiKey: string;
  deploymentName: string;
  apiVersion: string;
  /** Full base URL, e.g. https://resource.cognitiveservices.azure.com */
  endpoint?: string;
  /** Legacy resource name for *.openai.azure.com URLs */
  instanceName?: string;
};

type OpenAIEmbeddingConfig = {
  provider: 'openai';
  apiKey: string;
  model: string;
};

type GoogleEmbeddingConfig = {
  provider: 'google';
  apiKey: string;
  model: string;
};

type EmbeddingConfig = AzureEmbeddingConfig | OpenAIEmbeddingConfig | GoogleEmbeddingConfig;

type AzureEmbeddingResponse = {
  data?: Array<{ embedding?: number[]; index?: number }>;
};

type OpenAIEmbeddingResponse = {
  data?: Array<{ embedding?: number[]; index?: number }>;
};

type GoogleEmbedContentResponse = {
  embedding?: { values?: number[] };
};

type GoogleBatchEmbedResponse = {
  embeddings?: Array<{ values?: number[] }>;
};

function resolveAzureApiKey(): string | undefined {
  return (
    process.env.CONTACTS_AZURE_API_KEY ||
    process.env.AZURE_OPENAI_API_KEY ||
    process.env.AZURE_API_KEY ||
    undefined
  );
}

function resolveAzureInstanceName(): string | undefined {
  return (
    process.env.CONTACTS_AZURE_INSTANCE_NAME ||
    process.env.AZURE_OPENAI_API_INSTANCE_NAME ||
    undefined
  );
}

function resolveAzureEndpoint(): string | undefined {
  const endpoint = process.env.CONTACTS_AZURE_ENDPOINT || process.env.AZURE_OPENAI_ENDPOINT;
  if (!endpoint) {
    return undefined;
  }
  return endpoint.trim().replace(/\/$/, '');
}

function resolveAzureEmbeddingsDeployment(): string | undefined {
  return (
    process.env.CONTACTS_AZURE_EMBEDDINGS_DEPLOYMENT ||
    process.env.AZURE_OPENAI_API_EMBEDDINGS_DEPLOYMENT_NAME ||
    process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT ||
    undefined
  );
}

function resolveAzureApiVersion(): string {
  return (
    process.env.CONTACTS_AZURE_API_VERSION ||
    process.env.AZURE_OPENAI_API_VERSION ||
    DEFAULT_AZURE_API_VERSION
  );
}

function resolveGoogleApiKey(): string | undefined {
  const key =
    process.env.CONTACTS_EMBEDDING_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_KEY ||
    undefined;
  return key && key !== 'user_provided' ? key : undefined;
}

function resolveOpenAIApiKey(): string | undefined {
  const key = process.env.CONTACTS_OPENAI_API_KEY || process.env.OPENAI_API_KEY || undefined;
  return key && key !== 'user_provided' ? key : undefined;
}

function getAzureConfig(): AzureEmbeddingConfig | null {
  const apiKey = resolveAzureApiKey();
  const deploymentName = resolveAzureEmbeddingsDeployment();
  const endpoint = resolveAzureEndpoint();
  const instanceName = resolveAzureInstanceName();
  if (!apiKey || !deploymentName) {
    return null;
  }
  if (!endpoint && !instanceName) {
    return null;
  }
  return {
    provider: 'azure',
    apiKey,
    deploymentName,
    apiVersion: resolveAzureApiVersion(),
    endpoint,
    instanceName,
  };
}

function getOpenAIConfig(): OpenAIEmbeddingConfig | null {
  const apiKey = resolveOpenAIApiKey();
  if (!apiKey) {
    return null;
  }
  return {
    provider: 'openai',
    apiKey,
    model: process.env.CONTACTS_OPENAI_EMBEDDING_MODEL || DEFAULT_OPENAI_MODEL,
  };
}

function getGoogleConfig(): GoogleEmbeddingConfig | null {
  const apiKey = resolveGoogleApiKey();
  if (!apiKey) {
    return null;
  }
  return {
    provider: 'google',
    apiKey,
    model: process.env.CONTACTS_GOOGLE_EMBEDDING_MODEL || DEFAULT_GOOGLE_MODEL,
  };
}

/** Resolve which embedding backend to use (Azure preferred when configured). */
export function getEmbeddingConfig(): EmbeddingConfig | null {
  const forced = process.env.CONTACTS_EMBEDDING_PROVIDER?.toLowerCase();

  if (forced === 'azure') {
    return getAzureConfig();
  }
  if (forced === 'openai') {
    return getOpenAIConfig();
  }
  if (forced === 'google') {
    return getGoogleConfig();
  }

  return getAzureConfig() ?? getOpenAIConfig() ?? getGoogleConfig();
}

/** @deprecated Use getEmbeddingConfig — kept for callers expecting a raw key. */
export function getEmbeddingApiKey(): string | undefined {
  const config = getEmbeddingConfig();
  if (!config) {
    return undefined;
  }
  if (config.provider === 'azure') {
    return config.apiKey;
  }
  return config.apiKey;
}

export function isEmbeddingConfigured(): boolean {
  return getEmbeddingConfig() != null;
}

function buildAzureEmbeddingsUrl(config: AzureEmbeddingConfig): string {
  if (config.endpoint) {
    return `${config.endpoint}/openai/deployments/${config.deploymentName}/embeddings?api-version=${config.apiVersion}`;
  }
  return `https://${config.instanceName}.openai.azure.com/openai/deployments/${config.deploymentName}/embeddings?api-version=${config.apiVersion}`;
}

async function embedAzureTexts(
  texts: string[],
  config: AzureEmbeddingConfig,
): Promise<(number[] | null)[]> {
  const results: (number[] | null)[] = new Array(texts.length).fill(null);
  const baseUrl = buildAzureEmbeddingsUrl(config);

  for (let offset = 0; offset < texts.length; offset += DEFAULT_BATCH_SIZE) {
    const chunk = texts.slice(offset, offset + DEFAULT_BATCH_SIZE);
    try {
      const response = await axios.post<AzureEmbeddingResponse>(
        baseUrl,
        { input: chunk },
        {
          headers: {
            'api-key': config.apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 120000,
        },
      );

      for (const item of response.data?.data ?? []) {
        const index = item.index ?? 0;
        if (item.embedding && item.embedding.length > 0) {
          results[offset + index] = item.embedding;
        }
      }
    } catch (error) {
      logger.error('[contacts/embedding] Azure batch embed failed:', error);
    }
  }

  return results;
}

async function embedOpenAITexts(
  texts: string[],
  config: OpenAIEmbeddingConfig,
): Promise<(number[] | null)[]> {
  const results: (number[] | null)[] = new Array(texts.length).fill(null);

  for (let offset = 0; offset < texts.length; offset += DEFAULT_BATCH_SIZE) {
    const chunk = texts.slice(offset, offset + DEFAULT_BATCH_SIZE);
    try {
      const response = await axios.post<OpenAIEmbeddingResponse>(
        'https://api.openai.com/v1/embeddings',
        { input: chunk, model: config.model },
        {
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 120000,
        },
      );

      for (const item of response.data?.data ?? []) {
        const index = item.index ?? 0;
        if (item.embedding && item.embedding.length > 0) {
          results[offset + index] = item.embedding;
        }
      }
    } catch (error) {
      logger.error('[contacts/embedding] OpenAI batch embed failed:', error);
    }
  }

  return results;
}

async function embedGoogleSingle(text: string, config: GoogleEmbeddingConfig): Promise<number[] | null> {
  try {
    const response = await axios.post<GoogleEmbedContentResponse>(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:embedContent`,
      {
        model: `models/${config.model}`,
        content: { parts: [{ text }] },
      },
      {
        params: { key: config.apiKey },
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      },
    );
    const values = response.data?.embedding?.values;
    return values && values.length > 0 ? values : null;
  } catch (error) {
    logger.error('[contacts/embedding] Google embed failed:', error);
    return null;
  }
}

async function embedGoogleTexts(
  texts: string[],
  config: GoogleEmbeddingConfig,
): Promise<(number[] | null)[]> {
  const results: (number[] | null)[] = new Array(texts.length).fill(null);

  for (let offset = 0; offset < texts.length; offset += DEFAULT_BATCH_SIZE) {
    const chunk = texts.slice(offset, offset + DEFAULT_BATCH_SIZE);
    try {
      const response = await axios.post<GoogleBatchEmbedResponse>(
        `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:batchEmbedContents`,
        {
          requests: chunk.map((text) => ({
            model: `models/${config.model}`,
            content: { parts: [{ text }] },
          })),
        },
        {
          params: { key: config.apiKey },
          headers: { 'Content-Type': 'application/json' },
          timeout: 120000,
        },
      );

      const embeddings = response.data?.embeddings ?? [];
      for (let i = 0; i < chunk.length; i++) {
        const values = embeddings[i]?.values;
        results[offset + i] = values && values.length > 0 ? values : null;
      }
    } catch (error) {
      logger.error('[contacts/embedding] Google batch failed, falling back to singles:', error);
      for (let i = 0; i < chunk.length; i++) {
        results[offset + i] = await embedGoogleSingle(chunk[i], config);
      }
    }
  }

  return results;
}

/** Embed many texts using the configured provider (Azure OpenAI by default when set). */
export async function embedTexts(texts: string[]): Promise<(number[] | null)[]> {
  if (texts.length === 0) {
    return [];
  }

  const config = getEmbeddingConfig();
  if (!config) {
    return texts.map(() => null);
  }

  if (config.provider === 'azure') {
    return embedAzureTexts(texts, config);
  }
  if (config.provider === 'openai') {
    return embedOpenAITexts(texts, config);
  }
  return embedGoogleTexts(texts, config);
}

export async function embedContact(
  contact: ContactLike,
): Promise<{ searchText: string; embedding: number[] | null }> {
  const searchText = flattenContact(contact);
  if (!isEmbeddingConfigured()) {
    return { searchText, embedding: null };
  }

  const [embedding] = await embedTexts([searchText]);
  return { searchText, embedding: embedding ?? null };
}

export async function embedContactsBatch(
  contacts: ContactLike[],
): Promise<Array<{ searchText: string; embedding: number[] | null }>> {
  const searchTexts = contacts.map((contact) => flattenContact(contact));
  const embeddings = await embedTexts(searchTexts);
  return searchTexts.map((searchText, index) => ({
    searchText,
    embedding: embeddings[index],
  }));
}
