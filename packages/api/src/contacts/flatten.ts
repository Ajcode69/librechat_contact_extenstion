export type ContactLike = {
  name: string;
  company?: string;
  role?: string;
  email?: string;
  notes?: string;
  tags?: string[];
  metadata?: Record<string, unknown> | Map<string, unknown>;
};

function metadataEntries(metadata: ContactLike['metadata']): [string, string][] {
  if (!metadata) {
    return [];
  }
  if (metadata instanceof Map) {
    return Array.from(metadata.entries()).map(([key, value]) => [key, String(value ?? '')]);
  }
  return Object.entries(metadata).map(([key, value]) => [key, String(value ?? '')]);
}

/** Flatten a contact into embeddable / searchable plain text. */
export function flattenContact(contact: ContactLike): string {
  const parts: string[] = [`${contact.name}`];

  if (contact.role && contact.company) {
    parts.push(`${contact.name} is ${contact.role} at ${contact.company}.`);
  } else if (contact.company) {
    parts.push(`Company: ${contact.company}.`);
  } else if (contact.role) {
    parts.push(`Role: ${contact.role}.`);
  }

  if (contact.email) {
    parts.push(`Email: ${contact.email}.`);
  }
  if (contact.notes) {
    parts.push(`Notes: ${contact.notes}.`);
  }
  if (contact.tags && contact.tags.length > 0) {
    parts.push(`Tags: ${contact.tags.join(', ')}.`);
  }

  for (const [key, value] of metadataEntries(contact.metadata)) {
    if (value.trim()) {
      parts.push(`${key}: ${value}.`);
    }
  }

  return parts.join(' ');
}

/** Format contacts for injection into the model context. */
export function formatContactsContext(
  contacts: Array<ContactLike & { _id?: { toString(): string } | string }>,
): string {
  if (contacts.length === 0) {
    return '';
  }

  const blocks = contacts.map((contact) => {
    const id =
      typeof contact._id === 'string' ? contact._id : contact._id?.toString?.() ?? 'unknown';
    const meta = metadataEntries(contact.metadata)
      .map(([key, value]) => `  ${key}: ${value}`)
      .join('\n');

    return [
      `<contact id="${id}">`,
      `  Name: ${contact.name}`,
      contact.company ? `  Company: ${contact.company}` : '',
      contact.role ? `  Role: ${contact.role}` : '',
      contact.email ? `  Email: ${contact.email}` : '',
      contact.notes ? `  Notes: ${contact.notes}` : '',
      contact.tags && contact.tags.length > 0 ? `  Tags: ${contact.tags.join(', ')}` : '',
      meta ? `  Custom attributes:\n${meta}` : '',
      `</contact>`,
    ]
      .filter(Boolean)
      .join('\n');
  });

  return [
    '# Referenced contacts',
    'The user explicitly referenced the following contacts for this message. Use this information when answering.',
    blocks.join('\n\n'),
  ].join('\n\n');
}
