import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { BookUser } from 'lucide-react';
import { AutoSizer, List } from 'react-virtualized';
import { Spinner, useCombobox } from '@librechat/client';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { dataService, type TContact } from 'librechat-data-provider';
import useInitPopoverInput from '~/hooks/Input/useInitPopoverInput';
import { useLocalize } from '~/hooks';
import { removeCharIfLast } from '~/utils';
import MentionItem from './MentionItem';
import store from '~/store';

const commandChar = '#';
const ROW_HEIGHT = 44;
const CONTACTS_LIMIT = 100;
const contactIcon = <BookUser className="icon-md text-green-500" />;

type ContactOption = {
  value: string;
  label: string;
  description?: string;
};

function ContactsCommandContent({
  index,
  textAreaRef,
  conversationId,
}: {
  index: number;
  textAreaRef: React.MutableRefObject<HTMLTextAreaElement | null>;
  conversationId: string;
}) {
  const localize = useLocalize();
  const setShowContactsPopover = useSetRecoilState(store.showContactsPopoverFamily(index));
  const setPendingContacts = useSetRecoilState(
    store.pendingContactMentionsByConvoId(conversationId),
  );

  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ContactOption[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { open, setOpen, searchValue, setSearchValue, matches } = useCombobox({
    value: '',
    options,
  });

  const initInputRef = useInitPopoverInput({
    inputRef,
    textAreaRef,
    commandChar,
    setSearchValue,
    setOpen,
  });

  const fetchContacts = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const response = query.trim()
        ? await dataService.searchContacts(query.trim(), CONTACTS_LIMIT, 'mention')
        : await dataService.getContacts({ limit: CONTACTS_LIMIT });
      const contacts = response.contacts ?? [];
      setOptions(
        contacts.map((contact: TContact) => ({
          value: contact._id,
          label: contact.name,
          description: [contact.role, contact.company].filter(Boolean).join(' · ') || contact.email,
        })),
      );
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      fetchContacts(searchValue);
    }, 300);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [open, searchValue, fetchContacts]);

  const handleSelect = useCallback(
    (contact?: ContactOption) => {
      if (!contact) {
        return;
      }

      setPendingContacts((prev) => {
        if (prev.some((entry) => entry.id === contact.value)) {
          return prev;
        }
        return [...prev, { id: contact.value, name: contact.label }];
      });

      setSearchValue('');
      setOpen(false);
      setShowContactsPopover(false);

      if (textAreaRef.current) {
        removeCharIfLast(textAreaRef.current, commandChar);
      }
    },
    [setPendingContacts, setSearchValue, setOpen, setShowContactsPopover, textAreaRef],
  );

  const rowRenderer = ({
    index: rowIndex,
    key,
    style,
  }: {
    index: number;
    key: string;
    style: React.CSSProperties;
  }) => {
    const contact = matches[rowIndex] as ContactOption;
    return (
      <div key={key} style={style}>
        <MentionItem
          index={rowIndex}
          isActive={rowIndex === activeIndex}
          onClick={() => handleSelect(contact)}
          onMouseEnter={() => setActiveIndex(rowIndex)}
          name={contact.label ?? ''}
          icon={contactIcon}
          description={contact.description}
          type="mention"
        />
      </div>
    );
  };

  useEffect(() => {
    if (!open) {
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex((prev) => Math.min(prev, Math.max(matches.length - 1, 0)));
  }, [matches.length]);

  return (
    <div className="absolute bottom-28 z-10 w-full space-y-2">
      <div className="popover border-border-medium rounded-2xl border bg-surface-primary p-2 shadow-lg max-w-md">
        <div className="border-b border-border-light px-3 py-2">
          <input
            ref={initInputRef}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={localize('com_ui_contacts_mention_search')}
            className="w-full bg-transparent text-sm text-text-primary placeholder-text-tertiary focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((prev) => Math.min(prev + 1, matches.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((prev) => Math.max(prev - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                handleSelect(matches[activeIndex] as ContactOption);
              } else if (e.key === 'Escape') {
                setShowContactsPopover(false);
              }
            }}
          />
        </div>
        {open && (
          <div className="max-h-60">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Spinner className="size-4" />
              </div>
            ) : matches.length === 0 ? (
              <div className="px-3 py-4 text-sm text-text-tertiary">
                {localize('com_ui_contacts_empty')}
              </div>
            ) : (
              <AutoSizer disableHeight>
                {({ width }) => (
                  <List
                    width={width}
                    height={Math.min(matches.length * ROW_HEIGHT, 240)}
                    rowCount={matches.length}
                    rowHeight={ROW_HEIGHT}
                    rowRenderer={rowRenderer}
                    scrollToIndex={activeIndex}
                  />
                )}
              </AutoSizer>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ContactsCommand({
  index,
  textAreaRef,
  conversationId,
}: {
  index: number;
  textAreaRef: React.MutableRefObject<HTMLTextAreaElement | null>;
  conversationId: string;
}) {
  const showPopover = useRecoilValue(store.showContactsPopoverFamily(index));
  if (!showPopover) {
    return null;
  }

  return (
    <ContactsCommandContent index={index} textAreaRef={textAreaRef} conversationId={conversationId} />
  );
}

export default memo(ContactsCommand);
