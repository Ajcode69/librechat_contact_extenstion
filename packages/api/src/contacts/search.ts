import type { Types } from 'mongoose';
import { logger } from '@librechat/data-schemas';
import { embedTexts, getEmbeddingConfig, isEmbeddingConfigured } from './embedding';
import { cosineSimilarity } from './similarity';

export type ContactSearchDocument = {
  _id: Types.ObjectId | string;
  name: string;
  company?: string;
  role?: string;
  email?: string;
  notes?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  embedding?: number[];
  searchText?: string;
  updatedAt?: Date;
};

type HybridSearchDeps = {
  lexicalSearch: (
    userId: string | Types.ObjectId,
    query: string,
    options: { limit?: number; field?: string },
  ) => Promise<ContactSearchDocument[]>;
  fetchEmbeddableContacts: (
    userId: string | Types.ObjectId,
    limit: number,
  ) => Promise<ContactSearchDocument[]>;
};

const VECTOR_WEIGHT = 0.7;
const LEXICAL_WEIGHT = 0.3;
const DEFAULT_VECTOR_SCAN_LIMIT = parseInt(process.env.CONTACTS_VECTOR_SCAN_LIMIT || '10000', 10);

function contactKey(contact: ContactSearchDocument): string {
  return typeof contact._id === 'string' ? contact._id : contact._id.toString();
}

function lexicalScore(query: string, contact: ContactSearchDocument): number {
  const haystack = [
    contact.name,
    contact.company,
    contact.role,
    contact.email,
    contact.notes,
    contact.tags?.join(' '),
    contact.searchText,
    contact.metadata ? JSON.stringify(contact.metadata) : '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 1);

  if (terms.length === 0) {
    return 0;
  }

  let hits = 0;
  for (const term of terms) {
    if (haystack.includes(term)) {
      hits++;
    }
  }

  return hits / terms.length;
}

/** Merge lexical DB results with vector similarity over stored embeddings. */
export async function hybridContactSearch(
  userId: string | Types.ObjectId,
  query: string,
  options: { limit?: number; field?: string },
  deps: HybridSearchDeps,
): Promise<ContactSearchDocument[]> {
  const limit = Math.min(options.limit ?? 20, 50);
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return [];
  }

  const lexicalResults = await deps.lexicalSearch(userId, cleanQuery, {
    limit: Math.max(limit * 2, 30),
    field: options.field,
  });

  if (!isEmbeddingConfigured()) {
    return lexicalResults.slice(0, limit);
  }

  try {
    const config = getEmbeddingConfig();
    if (!config) {
      return lexicalResults.slice(0, limit);
    }

    const [queryEmbedding] = await embedTexts([cleanQuery]);
    if (!queryEmbedding) {
      return lexicalResults.slice(0, limit);
    }

    const embeddableContacts = await deps.fetchEmbeddableContacts(
      userId,
      DEFAULT_VECTOR_SCAN_LIMIT,
    );

    const merged = new Map<
      string,
      { contact: ContactSearchDocument; score: number; vectorScore: number; lexicalScore: number }
    >();

    for (const contact of lexicalResults) {
      const key = contactKey(contact);
      const score = lexicalScore(cleanQuery, contact);
      merged.set(key, {
        contact,
        score: score * LEXICAL_WEIGHT,
        vectorScore: 0,
        lexicalScore: score,
      });
    }

    for (const contact of embeddableContacts) {
      if (!contact.embedding || contact.embedding.length === 0) {
        continue;
      }

      const vectorScore = cosineSimilarity(queryEmbedding, contact.embedding);
      const key = contactKey(contact);
      const existing = merged.get(key);
      const lexScore = existing?.lexicalScore ?? lexicalScore(cleanQuery, contact);
      const combined = vectorScore * VECTOR_WEIGHT + lexScore * LEXICAL_WEIGHT;

      merged.set(key, {
        contact,
        score: combined,
        vectorScore,
        lexicalScore: lexScore,
      });
    }

    return Array.from(merged.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((entry) => entry.contact);
  } catch (error) {
    logger.error('[contacts/search] Hybrid search failed, using lexical fallback:', error);
    return lexicalResults.slice(0, limit);
  }
}
