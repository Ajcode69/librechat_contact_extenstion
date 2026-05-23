const { embedContactsBatch, hybridContactSearch, formatContactsContext } = require('@librechat/api');
const mongoose = require('mongoose');
const db = require('~/models');
const logger = require('~/config/winston');

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function searchContactMentions(userId, query, options = {}) {
  const Contact = mongoose.models.Contact;
  const cleanQuery = (query || '').trim();
  const limit = Math.min(parseInt(options.limit, 10) || 20, 100);
  const baseQuery = {
    user: new mongoose.Types.ObjectId(userId),
    deletedAt: null,
  };

  if (!cleanQuery) {
    return Contact.find(baseQuery).sort({ name: 1 }).limit(limit).lean();
  }

  const startsWith = new RegExp(`^${escapeRegExp(cleanQuery)}`, 'i');
  const contains = new RegExp(escapeRegExp(cleanQuery), 'i');
  const isNumericPrefix = /^\d+$/.test(cleanQuery);

  const fields = isNumericPrefix
    ? [
        { 'metadata.mobile': startsWith },
        { 'metadata.phone': startsWith },
        { 'metadata.mobile_number': startsWith },
        { email: startsWith },
        { name: startsWith },
      ]
    : [
        { name: startsWith },
        { company: startsWith },
        { email: startsWith },
        { role: contains },
        { searchText: contains },
      ];

  return Contact.find({ ...baseQuery, $or: fields }).sort({ name: 1 }).limit(limit).lean();
}

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
  if (options.field === 'mention') {
    return searchContactMentions(userId, query, options);
  }

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
