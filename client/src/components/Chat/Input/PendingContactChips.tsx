import { memo } from 'react';
import { BookUser, X } from 'lucide-react';
import { useRecoilState } from 'recoil';
import { useLocalize } from '~/hooks';
import store from '~/store';

function PendingContactChips({ conversationId }: { conversationId: string }) {
  const localize = useLocalize();
  const [contacts, setContacts] = useRecoilState(
    store.pendingContactMentionsByConvoId(conversationId),
  );

  if (contacts.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1 px-3 pt-2">
      {contacts.map((contact) => (
        <span
          key={contact.id}
          className="inline-flex items-center gap-1 rounded-full bg-green-600/15 px-2 py-0.5 text-xs text-green-600 dark:text-green-400"
        >
          <BookUser className="h-3 w-3" />
          {contact.name}
          <button
            type="button"
            aria-label={localize('com_ui_contacts_remove_mention')}
            onClick={() =>
              setContacts((prev) => prev.filter((entry) => entry.id !== contact.id))
            }
            className="rounded-full hover:bg-green-600/20"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
}

export default memo(PendingContactChips);
