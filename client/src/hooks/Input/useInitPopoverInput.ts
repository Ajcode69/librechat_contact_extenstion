import { useCallback } from 'react';

function getCommandToken(text: string, cursor: number, commandChar: string) {
  const beforeCursor = text.slice(0, cursor);
  const start = beforeCursor.lastIndexOf(commandChar);
  if (start < 0) {
    return null;
  }
  if (start > 0 && !/\s/.test(beforeCursor[start - 1])) {
    return null;
  }

  const query = beforeCursor.slice(start + 1);
  if (/\s/.test(query)) {
    return null;
  }

  return { start, end: cursor, query };
}

/** Creates a callback ref that focuses the popover input, transfers the command text as a search prefix, and clears the textarea. */
const useInitPopoverInput = ({
  inputRef,
  textAreaRef,
  commandChar,
  setSearchValue,
  setOpen,
}: {
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
  textAreaRef: React.MutableRefObject<HTMLTextAreaElement | null>;
  commandChar: string;
  setSearchValue: (value: string) => void;
  setOpen: (value: boolean) => void;
}) =>
  useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (!node) {
        return;
      }
      node.focus();
      setOpen(true);
      const textarea = textAreaRef.current;
      if (!textarea) {
        return;
      }
      const text = textarea.value;
      const cursor = textarea.selectionStart;
      const token = getCommandToken(text, cursor, commandChar);
      if (token) {
        setSearchValue(token.query);
        textarea.value = `${text.slice(0, token.start)}${text.slice(token.end)}`;
        textarea.setSelectionRange(token.start, token.start);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    },
    [inputRef, textAreaRef, commandChar, setSearchValue, setOpen],
  );

export default useInitPopoverInput;
