import { AgentCapabilities } from 'librechat-data-provider';
import { useFormContext, Controller } from 'react-hook-form';
import {
  Checkbox,
  HoverCard,
  CircleHelpIcon,
  HoverCardContent,
  HoverCardPortal,
  HoverCardTrigger,
} from '@librechat/client';
import type { AgentForm } from '~/common';
import { useLocalize } from '~/hooks';
import { ESide } from '~/common';

export default function ContactsAction() {
  const localize = useLocalize();
  const methods = useFormContext<AgentForm>();
  const { control, setValue } = methods;

  return (
    <HoverCard openDelay={50}>
      <div className="flex items-center">
        <Controller
          name={AgentCapabilities.contacts}
          control={control}
          render={({ field }) => (
            <Checkbox
              {...field}
              id="contacts-checkbox"
              checked={!!field.value}
              onCheckedChange={(checked) =>
                setValue(AgentCapabilities.contacts, checked === true, { shouldDirty: true })
              }
              className="relative float-left mr-2 inline-flex h-4 w-4 cursor-pointer"
              value={field.value.toString()}
              aria-labelledby="contacts-label"
            />
          )}
        />
        <label
          id="contacts-label"
          htmlFor="contacts-checkbox"
          className="form-check-label text-token-text-primary cursor-pointer text-sm"
        >
          {localize('com_ui_contacts')}
        </label>
        <HoverCardTrigger asChild className="ml-2">
          <button
            type="button"
            className="inline-flex items-center"
            aria-label={localize('com_agents_contacts_info')}
          >
            <CircleHelpIcon className="h-4 w-4 text-text-tertiary" />
          </button>
        </HoverCardTrigger>
        <HoverCardPortal>
          <HoverCardContent side={ESide.Top} className="w-80">
            <div className="space-y-2">
              <p className="text-sm text-text-secondary">{localize('com_agents_contacts_info')}</p>
            </div>
          </HoverCardContent>
        </HoverCardPortal>
      </div>
    </HoverCard>
  );
}
