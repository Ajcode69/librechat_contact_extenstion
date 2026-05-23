import React, { memo } from 'react';
import { Users } from 'lucide-react';
import { CheckboxButton } from '@librechat/client';
import { defaultAgentCapabilities } from 'librechat-data-provider';
import { useLocalize, useAgentCapabilities } from '~/hooks';
import { useBadgeRowContext } from '~/Providers';

function ContactsTool() {
  const localize = useLocalize();
  const context = useBadgeRowContext();
  const { toggleState: contactsEnabled, debouncedChange, isPinned } = context?.contacts ?? {};

  const { contactsEnabled: contactsCapabilityEnabled } = useAgentCapabilities(
    context?.agentsConfig?.capabilities ?? defaultAgentCapabilities,
  );

  if (!contactsCapabilityEnabled) {
    return null;
  }

  return (
    (contactsEnabled || isPinned) && (
      <CheckboxButton
        className="max-w-fit"
        checked={contactsEnabled}
        setValue={debouncedChange}
        label={localize('com_ui_contacts')}
        isCheckedClassName="border-violet-600/40 bg-violet-500/10 hover:bg-violet-700/10"
        icon={<Users className="icon-md" aria-hidden="true" />}
      />
    )
  );
}

export default memo(ContactsTool);
