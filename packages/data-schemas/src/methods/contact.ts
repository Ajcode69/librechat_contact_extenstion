import { Types } from 'mongoose';
import logger from '~/config/winston';
import type * as t from '~/types/contact';

export function createContactMethods(mongoose: typeof import('mongoose')) {
  /**
   * Create a single contact
   */
  async function createContact(
    params: t.CreateContactParams & { tenantId?: string },
  ): Promise<t.IContact> {
    try {
      const Contact = mongoose.models.Contact;
      const contact = await Contact.create({
        user: new Types.ObjectId(params.userId),
        name: params.name,
        company: params.company || '',
        role: params.role || '',
        email: params.email || '',
        notes: params.notes || '',
        tags: params.tags || [],
        metadata: params.metadata || new Map(),
        importBatch: params.importBatch || '',
        tenantId: params.tenantId,
      });
      return contact;
    } catch (error) {
      logger.error('Failed to create contact:', error);
      throw new Error(`Failed to create contact: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a contact by ID for a user
   */
  async function getContact(
    userId: string | Types.ObjectId,
    contactId: string | Types.ObjectId,
  ): Promise<t.IContactLean | null> {
    try {
      const Contact = mongoose.models.Contact;
      const query = {
        _id: new Types.ObjectId(contactId),
        user: new Types.ObjectId(userId),
        deletedAt: null,
      };
      return await Contact.findOne(query).lean() as t.IContactLean | null;
    } catch (error) {
      logger.error('Failed to get contact:', error);
      throw new Error(`Failed to get contact: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a contact by ID for a user
   */
  async function updateContact(
    userId: string | Types.ObjectId,
    contactId: string | Types.ObjectId,
    updates: t.UpdateContactParams,
  ): Promise<t.IContactLean | null> {
    try {
      const Contact = mongoose.models.Contact;
      const query = {
        _id: new Types.ObjectId(contactId),
        user: new Types.ObjectId(userId),
        deletedAt: null,
      };

      // Prepare updates
      const updateData: any = {};
      if (updates.name !== undefined) {
        updateData.name = updates.name;
      }
      if (updates.company !== undefined) {
        updateData.company = updates.company;
      }
      if (updates.role !== undefined) {
        updateData.role = updates.role;
      }
      if (updates.email !== undefined) {
        updateData.email = updates.email;
      }
      if (updates.notes !== undefined) {
        updateData.notes = updates.notes;
      }
      if (updates.tags !== undefined) {
        updateData.tags = updates.tags;
      }
      if (updates.metadata !== undefined) {
        updateData.metadata = updates.metadata;
      }

      return await Contact.findOneAndUpdate(query, { $set: updateData }, { new: true }).lean() as t.IContactLean | null;
    } catch (error) {
      logger.error('Failed to update contact:', error);
      throw new Error(`Failed to update contact: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Soft-delete a contact
   */
  async function deleteContact(
    userId: string | Types.ObjectId,
    contactId: string | Types.ObjectId,
  ): Promise<boolean> {
    try {
      const Contact = mongoose.models.Contact;
      const query = {
        _id: new Types.ObjectId(contactId),
        user: new Types.ObjectId(userId),
        deletedAt: null,
      };
      const result = await Contact.findOneAndUpdate(query, {
        $set: { deletedAt: new Date() },
      });
      return !!result;
    } catch (error) {
      logger.error('Failed to delete contact:', error);
      throw new Error(`Failed to delete contact: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get contacts with cursor pagination
   */
  async function getContactsByCursor(
    userId: string | Types.ObjectId,
    options: t.GetContactsOptions,
  ): Promise<{ contacts: t.IContactLean[]; nextCursor: string | null; total: number }> {
    try {
      const Contact = mongoose.models.Contact;
      const limit = Math.min(options.limit || 50, 100);
      const query: any = {
        user: new Types.ObjectId(userId),
        deletedAt: null,
      };

      if (options.tag) {
        query.tags = options.tag;
      }
      if (options.company) {
        query.company = new RegExp(options.company, 'i');
      }

      if (options.search) {
        query.$or = [
          { name: new RegExp(options.search, 'i') },
          { company: new RegExp(options.search, 'i') },
          { role: new RegExp(options.search, 'i') },
          { email: new RegExp(options.search, 'i') },
          { tags: new RegExp(options.search, 'i') },
          { notes: new RegExp(options.search, 'i') },
          { searchText: new RegExp(options.search, 'i') },
        ];
      }

      // Cursor logic: based on _id
      if (options.cursor) {
        query._id = { $lt: new Types.ObjectId(options.cursor) };
      }

      const contacts = await Contact.find(query)
        .sort({ _id: -1 })
        .limit(limit + 1)
        .lean() as t.IContactLean[];

      const hasNext = contacts.length > limit;
      if (hasNext) {
        contacts.pop();
      }

      const nextCursor = hasNext ? contacts[contacts.length - 1]._id.toString() : null;
      const total = await Contact.countDocuments({ user: new Types.ObjectId(userId), deletedAt: null });

      return {
        contacts,
        nextCursor,
        total,
      };
    } catch (error) {
      logger.error('Failed to get contacts by cursor:', error);
      throw new Error(`Failed to get contacts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search contacts (for chat integration/tools)
   */
  async function searchContacts(
    userId: string | Types.ObjectId,
    searchQuery: string,
    options: { limit?: number; field?: string } = {},
  ): Promise<t.IContactLean[]> {
    try {
      const Contact = mongoose.models.Contact;
      const limit = Math.min(options.limit || 20, 50);
      const query: any = {
        user: new Types.ObjectId(userId),
        deletedAt: null,
      };

      if (searchQuery) {
        const cleanQuery = searchQuery.trim();
        const field = options.field || 'all';

        if (field === 'name') {
          query.name = new RegExp(cleanQuery, 'i');
        } else if (field === 'company') {
          query.company = new RegExp(cleanQuery, 'i');
        } else if (field === 'role') {
          query.role = new RegExp(cleanQuery, 'i');
        } else if (field === 'email') {
          query.email = new RegExp(cleanQuery, 'i');
        } else if (field === 'tags') {
          query.tags = new RegExp(cleanQuery, 'i');
        } else {
          // Use text search score if query is multi-word, otherwise regex OR for precision
          if (cleanQuery.includes(' ')) {
            query.$text = { $search: cleanQuery };
          } else {
            query.$or = [
              { name: new RegExp(cleanQuery, 'i') },
              { company: new RegExp(cleanQuery, 'i') },
              { role: new RegExp(cleanQuery, 'i') },
              { email: new RegExp(cleanQuery, 'i') },
              { tags: new RegExp(cleanQuery, 'i') },
              { notes: new RegExp(cleanQuery, 'i') },
              { searchText: new RegExp(cleanQuery, 'i') },
            ];
          }
        }
      }

      // If text index was used, sort by score
      const cursor = Contact.find(query);
      if (query.$text) {
        cursor.select({ score: { $meta: 'textScore' } }).sort({ score: { $meta: 'textScore' } });
      } else {
        cursor.sort({ updatedAt: -1 });
      }

      return await cursor.limit(limit).lean() as t.IContactLean[];
    } catch (error) {
      logger.error('Failed to search contacts:', error);
      throw new Error(`Failed to search contacts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch contacts that have embeddings for vector similarity scoring.
   */
  async function fetchEmbeddableContacts(
    userId: string | Types.ObjectId,
    limit = 10000,
  ): Promise<t.IContactLean[]> {
    try {
      const Contact = mongoose.models.Contact;
      return (await Contact.find({
        user: new Types.ObjectId(userId),
        deletedAt: null,
        'embedding.0': { $exists: true },
      })
        .select('name company role email notes tags metadata searchText embedding updatedAt')
        .sort({ updatedAt: -1 })
        .limit(limit)
        .lean()) as t.IContactLean[];
    } catch (error) {
      logger.error('Failed to fetch embeddable contacts:', error);
      throw new Error(
        `Failed to fetch embeddable contacts: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Fetch multiple contacts by ID for a user.
   */
  async function getContactsByIds(
    userId: string | Types.ObjectId,
    contactIds: string[],
  ): Promise<t.IContactLean[]> {
    try {
      const Contact = mongoose.models.Contact;
      const objectIds = contactIds
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id));

      if (objectIds.length === 0) {
        return [];
      }

      return (await Contact.find({
        _id: { $in: objectIds },
        user: new Types.ObjectId(userId),
        deletedAt: null,
      }).lean()) as t.IContactLean[];
    } catch (error) {
      logger.error('Failed to get contacts by ids:', error);
      throw new Error(
        `Failed to get contacts by ids: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Persist flattened search text and optional embedding vectors.
   */
  async function updateContactEmbeddings(
    updates: Array<{
      contactId: string | Types.ObjectId;
      searchText: string;
      embedding?: number[] | null;
    }>,
  ): Promise<void> {
    if (updates.length === 0) {
      return;
    }

    const Contact = mongoose.models.Contact;
    const bulkOps = updates.map((update) => {
      const setData: Record<string, unknown> = { searchText: update.searchText };
      if (update.embedding && update.embedding.length > 0) {
        setData.embedding = update.embedding;
      }

      return {
        updateOne: {
          filter: { _id: new Types.ObjectId(update.contactId) },
          update: { $set: setData },
        },
      };
    });

    await Contact.bulkWrite(bulkOps, { ordered: false });
  }

  async function bulkCreateContacts(
    userId: string | Types.ObjectId,
    contactsData: any[],
    importBatchId: string,
    tenantId?: string,
  ): Promise<{ inserted: number; failed: number }> {
    try {
      const Contact = mongoose.models.Contact;
      const userObjectId = new Types.ObjectId(userId);
      const docs = contactsData.map((c) => ({
        user: userObjectId,
        name: c.name,
        company: c.company || '',
        role: c.role || '',
        email: c.email || '',
        notes: c.notes || '',
        tags: c.tags || [],
        metadata: c.metadata || {},
        importBatch: importBatchId,
        tenantId,
      }));

      // insertMany with ordered: false to skip duplicate errors if any and proceed
      const result = await Contact.insertMany(docs, { ordered: false });
      return {
        inserted: result.length,
        failed: docs.length - result.length,
      };
    } catch (error: any) {
      // mongoose insertMany throws error if any document fails validation or duplicate key,
      // but if ordered: false, some might have succeeded.
      const insertedCount = error.writeErrors ? (docs.length - error.writeErrors.length) : 0;
      logger.warn('Bulk contact insert had write errors:', error.message);
      return {
        inserted: insertedCount || 0,
        failed: docs.length - insertedCount,
      };
    }
  }

  /**
   * Find relevant contacts for query (used by tools/chat flow)
   */
  async function findRelevantContacts(
    userId: string | Types.ObjectId,
    query: string,
  ): Promise<t.IContactLean[]> {
    return await searchContacts(userId, query, { limit: 15 });
  }

  return {
    createContact,
    getContact,
    updateContact,
    deleteContact,
    getContactsByCursor,
    searchContacts,
    bulkCreateContacts,
    findRelevantContacts,
    fetchEmbeddableContacts,
    getContactsByIds,
    updateContactEmbeddings,
  };
}
