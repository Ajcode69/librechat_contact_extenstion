const mongoose = require('mongoose');
const { createMethods } = require('@librechat/data-schemas');
const { matchModelName, findMatchingPattern } = require('@librechat/api');
const getLogStores = require('~/cache/getLogStores');

const methods = createMethods(mongoose, {
  matchModelName,
  findMatchingPattern,
  getCache: getLogStores,
});

const seedDatabase = async () => {
  await methods.initializeRoles();
  await methods.seedDefaultRoles();
  await methods.ensureDefaultCategories();
  await methods.seedSystemGrants();
};

const { Types } = mongoose;

async function bulkCreateContacts(userId, contactsData, importBatchId, tenantId, session) {
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

  const result = await Contact.insertMany(docs, { ordered: false, session });
  return {
    inserted: result.length,
    failed: docs.length - result.length,
  };
}

module.exports = {
  ...methods,
  seedDatabase,
  bulkCreateContacts,
};
