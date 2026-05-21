import contactSchema from '~/schema/contact';
import contactImportJobSchema from '~/schema/contactImportJob';
import { applyTenantIsolation } from '~/models/plugins/tenantIsolation';
import type * as t from '~/types/contact';

export function createContactModel(mongoose: typeof import('mongoose')) {
  applyTenantIsolation(contactSchema);
  return mongoose.models.Contact || mongoose.model<t.IContact>('Contact', contactSchema);
}

export function createContactImportJobModel(mongoose: typeof import('mongoose')) {
  applyTenantIsolation(contactImportJobSchema);
  return mongoose.models.ContactImportJob || mongoose.model<t.IContactImportJob>('ContactImportJob', contactImportJobSchema);
}
