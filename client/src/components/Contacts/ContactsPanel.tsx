import { useState, useCallback, useEffect, useRef, memo } from 'react';
import {
  Search,
  Plus,
  Upload,
  Trash2,
  Edit3,
  X,
  ChevronLeft,
  User,
  Building2,
  Briefcase,
  Mail,
  StickyNote,
  Tag,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { dataService, type TContact } from 'librechat-data-provider';
import { useLocalize } from '~/hooks';

type TContactListResponse = {
  contacts: TContact[];
  nextCursor: string | null;
  hasNextPage?: boolean;
};

type ViewMode = 'list' | 'detail' | 'form';

type ContactFormData = {
  name: string;
  company: string;
  role: string;
  email: string;
  notes: string;
  tags: string;
};

const emptyForm: ContactFormData = {
  name: '',
  company: '',
  role: '',
  email: '',
  notes: '',
  tags: '',
};

/* ------------------------------------------------------------------ */
/*  ContactsPanel                                                      */
/* ------------------------------------------------------------------ */

const ContactsPanel = memo(function ContactsPanel() {
  const localize = useLocalize();
  /* state */
  const [contacts, setContacts] = useState<TContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<ViewMode>('list');
  const [selected, setSelected] = useState<TContact | null>(null);
  const [formData, setFormData] = useState<ContactFormData>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---- helpers ---- */

  const showToast = useCallback((msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  /* ---- fetch contacts ---- */

  const fetchContacts = useCallback(
    async (cursor?: string, search?: string) => {
      setLoading(true);
      try {
        const res: TContactListResponse = await dataService.getContacts({
          cursor: cursor ?? undefined,
          limit: 30,
          search: search || undefined,
        });
        if (cursor) {
          setContacts((prev) => [...prev, ...res.contacts]);
        } else {
          setContacts(res.contacts);
        }
        setNextCursor(res.nextCursor);
      } catch {
        showToast(localize('com_ui_contacts_failed_load'), 'err');
      } finally {
        setLoading(false);
      }
    },
    [showToast, localize],
  );

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  /* ---- search debounce ---- */

  const handleSearchChange = useCallback(
    (val: string) => {
      setSearchQuery(val);
      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
      }
      searchTimer.current = setTimeout(() => {
        fetchContacts(undefined, val);
      }, 400);
    },
    [fetchContacts],
  );

  /* ---- CRUD ---- */

  const handleSave = useCallback(async () => {
    if (!formData.name.trim()) {
      showToast(localize('com_ui_contacts_name_required'), 'err');
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<TContact> = {
        name: formData.name.trim(),
        company: formData.company.trim() || undefined,
        role: formData.role.trim() || undefined,
        email: formData.email.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        tags: formData.tags
          ? formData.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      };
      if (editId) {
        await dataService.updateContact(editId, payload);
      } else {
        await dataService.createContact(payload);
      }
      showToast(localize('com_ui_contacts_saved'));
      setView('list');
      setEditId(null);
      setFormData(emptyForm);
      fetchContacts(undefined, searchQuery);
    } catch {
      showToast(localize('com_ui_contacts_failed_save'), 'err');
    } finally {
      setSaving(false);
    }
  }, [formData, editId, fetchContacts, searchQuery, showToast, localize]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!window.confirm(localize('com_ui_contacts_delete_confirm'))) {
        return;
      }
      setDeleting(true);
      try {
        await dataService.deleteContact(id);
        showToast(localize('com_ui_contacts_deleted'));
        setView('list');
        setSelected(null);
        fetchContacts(undefined, searchQuery);
      } catch {
        showToast(localize('com_ui_contacts_failed_delete'), 'err');
      } finally {
        setDeleting(false);
      }
    },
    [fetchContacts, searchQuery, showToast, localize],
  );

  /* ---- CSV import ---- */

  const handleImport = useCallback(async () => {
    try {
      const diskRes = await dataService.checkContactDiskSpace();
      if (!diskRes.canAcceptUpload) {
        showToast(localize('com_ui_contacts_no_disk_space'), 'err');
        return;
      }
      fileInputRef.current?.click();
    } catch {
      showToast('Disk check failed', 'err');
    }
  }, [showToast]);

  const handleFileSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        return;
      }
      setImportStatus('Uploading CSV: 0%');
      try {
        const res = await dataService.importContacts(file, null, (chunkText) => {
          if (chunkText.startsWith('uploading_chunk:')) {
            const parts = chunkText.split(':');
            const match = parts[1].match(/(\d+)_of_(\d+)/);
            if (match) {
              const current = parseInt(match[1], 10);
              const total = parseInt(match[2], 10);
              const pct = Math.round((current / total) * 100);
              setImportStatus(`Uploading CSV: ${pct}% (${current} of ${total} chunks)`);
            }
          }
        });
        setImportStatus('processing');
        showToast(localize('com_ui_contacts_import_started'));

        /* Poll job status */
        const jobId = res.jobId;
        const poll = setInterval(async () => {
          try {
            const status = await dataService.getImportStatus(jobId);
            if (status.status === 'completed') {
              clearInterval(poll);
              setImportStatus(null);
              showToast(
                localize('com_ui_contacts_import_success', { count: String(status.processedRows) }),
              );
              fetchContacts(undefined, searchQuery);
            } else if (status.status === 'failed') {
              clearInterval(poll);
              setImportStatus(null);
              showToast(
                `${localize('com_ui_contacts_import_failed')}: ${status.errors?.[0]?.message || 'Unknown error'}`,
                'err',
              );
            }
          } catch {
            clearInterval(poll);
            setImportStatus(null);
          }
        }, 3000);
      } catch {
        setImportStatus(null);
        showToast('Import failed', 'err');
      }
      /* Reset file input */
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [fetchContacts, searchQuery, showToast, localize],
  );

  /* ---- navigate to form ---- */

  const openCreate = useCallback(() => {
    setFormData(emptyForm);
    setEditId(null);
    setView('form');
  }, []);

  const openEdit = useCallback((c: TContact) => {
    setFormData({
      name: c.name ?? '',
      company: c.company ?? '',
      role: c.role ?? '',
      email: c.email ?? '',
      notes: c.notes ?? '',
      tags: c.tags?.join(', ') ?? '',
    });
    setEditId(c._id);
    setView('form');
  }, []);

  const openDetail = useCallback((c: TContact) => {
    setSelected(c);
    setView('detail');
  }, []);

  const goBack = useCallback(() => {
    setView('list');
    setSelected(null);
    setEditId(null);
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Renders                                                          */
  /* ---------------------------------------------------------------- */

  /* -- Toast -- */
  const toastEl = toast ? (
    <div
      className={`fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg px-4 py-2 text-sm shadow-lg ${
        toast.type === 'ok' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
      }`}
    >
      {toast.type === 'ok' ? (
        <CheckCircle className="h-4 w-4" />
      ) : (
        <AlertCircle className="h-4 w-4" />
      )}
      {toast.msg}
    </div>
  ) : null;

  /* -- Detail view -- */
  if (view === 'detail' && selected) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        {toastEl}
        <div className="flex items-center gap-2 border-b border-border-light px-4 py-3">
          <button onClick={goBack} className="rounded p-1 hover:bg-surface-hover">
            <ChevronLeft className="h-5 w-5 text-text-secondary" />
          </button>
          <h2 className="flex-1 truncate text-base font-semibold text-text-primary">
            {selected.name}
          </h2>
          <button
            onClick={() => openEdit(selected)}
            className="rounded p-1.5 hover:bg-surface-hover"
          >
            <Edit3 className="h-4 w-4 text-text-secondary" />
          </button>
          <button
            disabled={deleting}
            onClick={() => handleDelete(selected._id)}
            className="rounded p-1.5 text-red-500 hover:bg-red-500/10 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {[
            { icon: Building2, label: localize('com_ui_contacts_company'), value: selected.company },
            { icon: Briefcase, label: localize('com_ui_contacts_role'), value: selected.role },
            { icon: Mail, label: localize('com_ui_contacts_email'), value: selected.email },
            { icon: StickyNote, label: localize('com_ui_contacts_notes'), value: selected.notes },
          ].map(
            (item) =>
              item.value && (
                <div key={item.label} className="flex items-start gap-3">
                  <item.icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-text-tertiary" />
                  <div>
                    <div className="text-xs text-text-tertiary">{item.label}</div>
                    <div className="text-sm text-text-primary">{item.value}</div>
                  </div>
                </div>
              ),
          )}
          {selected.tags && selected.tags.length > 0 && (
            <div className="flex items-start gap-3">
              <Tag className="mt-0.5 h-4 w-4 flex-shrink-0 text-text-tertiary" />
              <div>
                <div className="text-xs text-text-tertiary">{localize('com_ui_contacts_tags')}</div>
                <div className="flex flex-wrap gap-1">
                  {selected.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-surface-hover px-2 py-0.5 text-xs text-text-secondary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          {selected.metadata && Object.keys(selected.metadata).length > 0 && (
            <div className="flex items-start gap-3">
              <Tag className="mt-0.5 h-4 w-4 flex-shrink-0 text-text-tertiary" />
              <div className="min-w-0 flex-1">
                <div className="text-xs text-text-tertiary">{localize('com_ui_contacts_metadata')}</div>
                <div className="mt-1 space-y-1">
                  {Object.entries(selected.metadata).map(([key, value]) => (
                    <div key={key} className="text-sm text-text-primary">
                      <span className="text-text-tertiary">{key}: </span>
                      {String(value)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* -- Form view -- */
  if (view === 'form') {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        {toastEl}
        <div className="flex items-center gap-2 border-b border-border-light px-4 py-3">
          <button onClick={goBack} className="rounded p-1 hover:bg-surface-hover">
            <ChevronLeft className="h-5 w-5 text-text-secondary" />
          </button>
          <h2 className="text-base font-semibold text-text-primary">
            {editId ? localize('com_ui_contacts_update') : localize('com_ui_contacts_add')}
          </h2>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {(
            [
              { key: 'name', label: localize('com_ui_contacts_name'), icon: User, required: true },
              { key: 'company', label: localize('com_ui_contacts_company'), icon: Building2 },
              { key: 'role', label: localize('com_ui_contacts_role'), icon: Briefcase },
              { key: 'email', label: localize('com_ui_contacts_email'), icon: Mail },
              { key: 'tags', label: `${localize('com_ui_contacts_tags')} (comma-separated)`, icon: Tag },
            ] as const
          ).map((field) => (
            <div key={field.key} className="flex items-center gap-2">
              <field.icon className="h-4 w-4 flex-shrink-0 text-text-tertiary" />
              <input
                type={field.key === 'email' ? 'email' : 'text'}
                placeholder={field.label}
                value={formData[field.key]}
                onChange={(e) => setFormData((f) => ({ ...f, [field.key]: e.target.value }))}
                className="w-full rounded-md border border-border-medium bg-surface-primary px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:border-green-500 focus:outline-none"
              />
            </div>
          ))}
          <div className="flex items-start gap-2">
            <StickyNote className="mt-2 h-4 w-4 flex-shrink-0 text-text-tertiary" />
            <textarea
              placeholder={localize('com_ui_contacts_notes')}
              value={formData.notes}
              rows={3}
              onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
              className="w-full resize-none rounded-md border border-border-medium bg-surface-primary px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:border-green-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="border-t border-border-light px-4 py-3">
          <button
            disabled={saving}
            onClick={handleSave}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editId ? localize('com_ui_contacts_update') : localize('com_ui_contacts_save')}
          </button>
        </div>
      </div>
    );
  }

  /* -- List view (default) -- */
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {toastEl}
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-light px-4 py-3">
        <h2 className="text-base font-semibold text-text-primary">{localize('com_ui_contacts')}</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={openCreate}
            title={localize('com_ui_contacts_add')}
            className="rounded-lg p-1.5 hover:bg-surface-hover"
          >
            <Plus className="h-5 w-5 text-text-secondary" />
          </button>
          <button
            onClick={handleImport}
            disabled={!!importStatus}
            title={localize('com_ui_contacts_import')}
            className="rounded-lg p-1.5 hover:bg-surface-hover disabled:opacity-50"
          >
            {importStatus ? (
              <Loader2 className="h-5 w-5 animate-spin text-text-secondary" />
            ) : (
              <Upload className="h-5 w-5 text-text-secondary" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileSelected}
          />
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 rounded-lg border border-border-medium bg-surface-primary px-3 py-1.5">
          <Search className="h-4 w-4 text-text-tertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={localize('com_ui_contacts_search')}
            className="w-full bg-transparent text-sm text-text-primary placeholder-text-tertiary focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                fetchContacts();
              }}
            >
              <X className="h-4 w-4 text-text-tertiary hover:text-text-primary" />
            </button>
          )}
        </div>
      </div>

      {/* Import progress indicator */}
      {importStatus && (
        <div className="mx-3 flex items-center gap-2 rounded-md bg-blue-500/10 px-3 py-2 text-xs text-blue-400">
          <Loader2 className="h-3 w-3 animate-spin" />
          {importStatus === 'processing'
            ? localize('com_ui_contacts_processing_import')
            : importStatus}
        </div>
      )}

      {/* Contact list */}
      <div className="flex-1 overflow-y-auto">
        {loading && contacts.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-text-tertiary">
            {localize('com_ui_contacts_empty')}
          </div>
        ) : (
          <>
            {contacts.map((c) => (
              <button
                key={c._id}
                onClick={() => openDetail(c)}
                className="flex w-full items-center gap-3 border-b border-border-light px-4 py-3 text-left transition-colors hover:bg-surface-hover"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-green-600/20 text-green-500">
                  <User className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-text-primary">{c.name}</div>
                  <div className="truncate text-xs text-text-tertiary">
                    {[c.role, c.company].filter(Boolean).join(' · ') || c.email || '—'}
                  </div>
                </div>
              </button>
            ))}
            {nextCursor && (
              <button
                onClick={() => fetchContacts(nextCursor, searchQuery)}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 py-3 text-xs text-text-secondary hover:text-text-primary"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : localize('com_ui_contacts_load_more')}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
});

ContactsPanel.displayName = 'ContactsPanel';

export default ContactsPanel;
