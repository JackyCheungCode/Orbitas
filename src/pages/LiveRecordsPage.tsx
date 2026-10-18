import { useEffect, useState, type FormEvent } from 'react';
import { Button, InlineNotification, TextInput } from '@carbon/react';
import { Add } from '@carbon/icons-react';
import { useWorkspace } from '../auth/WorkspaceGate';
import { supabase } from '../lib/supabase';

type Resource = 'companies' | 'contacts';
type RecordRow = Record<string, unknown>;

const fieldSets = {
  companies: [
    { key: 'name', label: 'Company', required: true },
    { key: 'domain', label: 'Domain', required: false },
    { key: 'industry', label: 'Industry', required: false },
  ],
  contacts: [
    { key: 'first_name', label: 'First name', required: true },
    { key: 'last_name', label: 'Last name', required: false },
    { key: 'email', label: 'Email', required: false },
    { key: 'job_title', label: 'Job title', required: false },
  ],
} as const;

export default function LiveRecordsPage({ resource, title, description }: { resource: Resource; title: string; description: string }) {
  const { organization } = useWorkspace();
  const fields = fieldSets[resource];
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function loadRecords() {
    if (!supabase) return;
    setLoading(true);
    const { data, error: requestError } = await supabase.from(resource).select('*').eq('organization_id', organization.id).order('created_at', { ascending: false }).limit(200);
    if (requestError) setError(requestError.message);
    else {
      setRecords((data ?? []) as RecordRow[]);
      setError('');
    }
    setLoading(false);
  }

  useEffect(() => { void loadRecords(); }, [organization.id, resource]);

  async function addRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setSaving(true);
    setError('');
    setNotice('');
    const payload: Record<string, string | null> = { organization_id: organization.id };
    fields.forEach(({ key }) => { payload[key] = values[key]?.trim() || null; });
    const { error: insertError } = await supabase.from(resource).insert(payload);
    if (insertError) setError(insertError.message);
    else {
      setValues({});
      setNotice(resource === 'companies' ? 'Company added.' : 'Contact added.');
      await loadRecords();
    }
    setSaving(false);
  }

  return (
    <div className="page">
      <div className="page-heading">
        <div><div className="eyebrow">WORKSPACE / DIRECTORY</div><h1>{title}</h1><p className="page-description">{description}</p></div>
      </div>
      <section className="content-section">
        <div className="section-heading">
          <div><h2>Add {resource === 'companies' ? 'a company' : 'a contact'}</h2><p>Records are saved to {organization.name} and protected by organization-level RLS.</p></div>
        </div>
        <form className="record-create-form" onSubmit={addRecord}>
          {fields.map((field) => (
            <TextInput
              key={field.key}
              id={`${resource}-${field.key}`}
              labelText={field.label}
              type={field.key === 'email' ? 'email' : 'text'}
              value={values[field.key] ?? ''}
              required={field.required}
              onChange={(event) => setValues((previous) => ({ ...previous, [field.key]: event.target.value }))}
            />
          ))}
          <Button type="submit" renderIcon={Add} disabled={saving}>{saving ? 'Saving…' : 'Save record'}</Button>
        </form>
        {error && <InlineNotification lowContrast kind="error" title="Request failed" subtitle={error} hideCloseButton />}
        {notice && <InlineNotification lowContrast kind="success" title="Saved" subtitle={notice} hideCloseButton />}
        <div className="section-heading">
          <div><h2>{title}</h2><p>Live records from Supabase.</p></div>
          <Button kind="ghost" onClick={() => void loadRecords()} disabled={loading}>Refresh</Button>
        </div>
        <div className="table-scroll">
          <table className="prospect-table">
            <thead><tr>{fields.map((field) => <th key={field.key}>{field.label}</th>)}<th>Created</th></tr></thead>
            <tbody>
              {records.map((record, index) => (
                <tr key={String(record.id ?? index)}>
                  {fields.map((field) => <td key={field.key}>{String(record[field.key] ?? '—')}</td>)}
                  <td>{record.created_at ? new Date(String(record.created_at)).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
              {!loading && records.length === 0 && <tr><td className="empty-cell" colSpan={fields.length + 1}>No records yet. Use the form above to add the first one.</td></tr>}
              {loading && <tr><td className="empty-cell" colSpan={fields.length + 1}>Loading records…</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="table-footer"><span>{records.length} records loaded</span><span>Workspace: {organization.name}</span></div>
      </section>
    </div>
  );
}
