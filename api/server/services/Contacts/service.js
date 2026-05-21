const { embedContactsBatch, hybridContactSearch, formatContactsContext } = require('@librechat/api');
const db = require('~/models');
const logger = require('~/config/winston');

/**
 * Generate and persist embeddings for contacts after insert/update/import.
 * @param {Array<{ _id: import('mongoose').Types.ObjectId | string, name: string, company?: string, role?: string, email?: string, notes?: string, tags?: string[], metadata?: Record<string, unknown> }>} contacts
 */
async function embedAndStoreContacts(contacts) {
  if (!contacts || contacts.length === 0) {
    return;
  }

  try {
    const embedded = await embedContactsBatch(contacts);
    const updates = contacts.map((contact, index) => ({
      contactId: contact._id,
      searchText: embedded[index]?.searchText ?? '',
      embedding: embedded[index]?.embedding ?? null,
    }));

    await db.updateContactEmbeddings(updates);
  } catch (error) {
    logger.error('[ContactsService] Failed to embed contacts:', error);
  }
}

/**
 * Hybrid lexical + vector search for contacts.
 */
async function searchContactsHybrid(userId, query, options = {}) {
  return hybridContactSearch(userId, query, options, {
    lexicalSearch: db.searchContacts.bind(db),
    fetchEmbeddableContacts: db.fetchEmbeddableContacts.bind(db),
  });
}

/**
 * Build prompt context for explicitly referenced contacts.
 */
async function buildReferencedContactsContext(userId, contactIds) {
  if (!contactIds || contactIds.length === 0) {
    return '';
  }

  const contacts = await db.getContactsByIds(userId, contactIds);
  return formatContactsContext(contacts);
}

module.exports = {
  embedAndStoreContacts,
  searchContactsHybrid,
  buildReferencedContactsContext,
};
