export { flattenContact, formatContactsContext, type ContactLike } from './flatten';
export { cosineSimilarity } from './similarity';
export {
  embedContact,
  embedContactsBatch,
  embedTexts,
  getEmbeddingApiKey,
  getEmbeddingConfig,
  isEmbeddingConfigured,
} from './embedding';
export { hybridContactSearch, type ContactSearchDocument } from './search';
export { extractContactIds } from './context';
