const { Tool } = require('@librechat/agents/langchain/tools');

const contactsToolJsonSchema = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ['search', 'list', 'get'],
      description:
        'The action to perform: "search" to query contacts, "list" to retrieve a paginated list of contacts, "get" to retrieve a specific contact details by ID.',
    },
    query: {
      type: 'string',
      description:
        'Search query for name, company, role, email, or notes (used for "search" action).',
    },
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      description:
        'Maximum number of results to return (used for "search" and "list" actions). Defaults to 20.',
    },
    cursor: {
      type: 'string',
      description: 'Pagination cursor for "list" action.',
    },
    id: {
      type: 'string',
      description: 'The unique database ID of the contact to retrieve (used for "get" action).',
    },
    tag: {
      type: 'string',
      description: 'Filter contacts by tag (used for "list" action).',
    },
    company: {
      type: 'string',
      description: 'Filter contacts by company (used for "list" action).',
    },
  },
  required: ['action'],
};

class ContactsTool extends Tool {
  static lc_name() {
    return 'contacts';
  }

  static get jsonSchema() {
    return contactsToolJsonSchema;
  }

  constructor(fields = {}) {
    super(fields);
    this.name = 'contacts';
    this.description =
      "Access, search, list, and retrieve contacts from the user's workspace database.";
    this.schema = contactsToolJsonSchema;
    this.req = fields.req;
    this.userId = fields.userId;
  }

  async _call(input) {
    const { action, query, limit = 20, cursor, id, tag, company } = input;
    const contactMethods = this.req?.app?.locals?.contactMethods;

    if (!contactMethods) {
      return JSON.stringify({ error: 'Contact integration not available.' });
    }

    try {
      if (action === 'get') {
        if (!id) {
          return JSON.stringify({ error: 'Contact ID is required for get action.' });
        }
        const contact = await contactMethods.getContact(this.userId, id);
        return JSON.stringify({ contact });
      }

      if (action === 'search') {
        if (!query) {
          return JSON.stringify({ error: 'Query is required for search action.' });
        }
        const searchResults = await contactMethods.searchContacts(this.userId, query, { limit });
        return JSON.stringify({ contacts: searchResults });
      }

      if (action === 'list') {
        const listParams = {};
        if (tag) listParams.tag = tag;
        if (company) listParams.company = company;
        if (cursor) listParams.cursor = cursor;
        listParams.limit = limit;

        const results = await contactMethods.getContactsByCursor(this.userId, listParams);
        return JSON.stringify(results);
      }

      return JSON.stringify({ error: `Unknown action: ${action}` });
    } catch (error) {
      return JSON.stringify({ error: `Failed to execute contacts action: ${error.message}` });
    }
  }
}

module.exports = ContactsTool;
