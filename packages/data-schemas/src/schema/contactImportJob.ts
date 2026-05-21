import { Schema } from 'mongoose';
import type { IContactImportJob } from '~/types/contact';

const ContactImportJobSchema = new Schema<IContactImportJob>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    totalRows: {
      type: Number,
      default: 0,
    },
    processedRows: {
      type: Number,
      default: 0,
    },
    failedRows: {
      type: Number,
      default: 0,
    },
    errors: [
      {
        row: { type: Number, required: true },
        message: { type: String, required: true },
      },
    ],
    tenantId: {
      type: String,
      index: true,
    },
  },
  { timestamps: true },
);

export default ContactImportJobSchema;
