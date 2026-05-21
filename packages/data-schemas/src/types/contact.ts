import type { Types, Document } from 'mongoose';

export interface IContact extends Document {
  user: Types.ObjectId;
  name: string;
  company?: string;
  role?: string;
  email?: string;
  notes?: string;
  tags?: string[];
  metadata?: Map<string, any>;
  searchText?: string;
  embedding?: number[];
  importBatch?: string;
  deletedAt?: Date | null;
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IContactLean {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  name: string;
  company?: string;
  role?: string;
  email?: string;
  notes?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  searchText?: string;
  embedding?: number[];
  importBatch?: string;
  deletedAt?: Date | null;
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;
  __v?: number;
}

export interface CreateContactParams {
  userId: string | Types.ObjectId;
  name: string;
  company?: string;
  role?: string;
  email?: string;
  notes?: string;
  tags?: string[];
  metadata?: Record<string, any> | Map<string, any>;
  importBatch?: string;
}

export interface UpdateContactParams {
  name?: string;
  company?: string;
  role?: string;
  email?: string;
  notes?: string;
  tags?: string[];
  metadata?: Record<string, any> | Map<string, any>;
}

export interface GetContactsOptions {
  cursor?: string;
  limit?: number;
  search?: string;
  tag?: string;
  company?: string;
}

export interface ContactImportJobError {
  row: number;
  message: string;
}

export interface IContactImportJob extends Document {
  user: Types.ObjectId;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileName: string;
  filePath: string;
  totalRows: number;
  processedRows: number;
  failedRows: number;
  errors: ContactImportJobError[];
  tenantId?: string;
  createdAt: Date;
  updatedAt: Date;
}
