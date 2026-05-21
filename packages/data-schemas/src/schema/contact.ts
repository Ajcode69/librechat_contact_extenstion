import { Schema } from 'mongoose';
import type { IContact } from '~/types/contact';

const ContactSchema = new Schema<IContact>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    company: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: () => new Map(),
    },
    searchText: {
      type: String,
      default: '',
    },
    embedding: {
      type: [Number],
      default: undefined,
    },
    importBatch: {
      type: String,
      default: '',
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    tenantId: {
      type: String,
      index: true,
    },
  },
  { timestamps: true },
);

// Indexes for query performance
ContactSchema.index({ user: 1, name: 1 });
ContactSchema.index({ user: 1, company: 1 });
ContactSchema.index({ user: 1, email: 1 });
ContactSchema.index({ user: 1, tags: 1 });
ContactSchema.index({ user: 1, deletedAt: 1 });

// Text index for full-text search across multiple fields
ContactSchema.index(
  {
    name: 'text',
    company: 'text',
    role: 'text',
    notes: 'text',
  },
  {
    name: 'contact_text_index',
    weights: {
      name: 10,
      company: 5,
      role: 3,
      notes: 1,
    },
  },
);

export default ContactSchema;
