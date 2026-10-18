import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Button,
  DataTable,
  InlineNotification,
  Search,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  TextInput,
} from '@carbon/react';
import { Add, Renew } from '@carbon/icons-react';
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
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function loadRecords() {
    if (!supabase) {
      setLoading(false);
      setError('Supabase is not configured. Set the VITE_SUPABASE_URL and publishable key environment variables.');
      return;
    }
    setLoading(true);
    const { data, error: requestError } = await supabase
      .from(resource)
      .select('*')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false })
      .limit(200);
    if (requestError) setError(requestError.message);
    else {
      setRecords((data ?? []) as RecordRow[]);
      setError('');
    }
    setLoading(false);
  }

  useEffect(() => {
    void loadRecords();
    // The resource and active workspace define the current query.
  }, [organization.id, resource]);

  async function addRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }
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

  const headers = useMemo(
    () => [
      ...fields.map((field) => ({ key: field.key, header: field.label })),
      { key: 'created_at', header: 'Created' },
    ],
    [fields],
  );

  const rows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return records
      .filter((record) => !query || fields.some(({ key }) => String(record[key] ?? '').toLocaleLowerCase().includes(query)))
      .map((record, index) => ({
        id: String(record.id ?? index),
        ...Object.fromEntries(fields.map(({ key }) => [key, String(record[key] ?? '—')])),
        created_at: record.created_at ? new Date(String(record.created_at)).toLocaleDateString() : '—',
      }));
  }, [fields, records, search]);

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">WORKSPACE / DIRECTORY</div>
          <h1>{title}</h1>
          <p className="page-description">{description}</p>
        </div>
        <Button kind="tertiary" renderIcon={Renew} onClick={() => void loadRecords()} disabled={loading}>
          Refresh
        </Button>
      </div>

      <section className="content-section">
        <div className="section-heading">
          <div>
            <h2>Add {resource === 'companies' ? 'a company' : 'a contact'}</h2>
            <p>Records are saved to {organization.name} and protected by organization-level RLS.</p>
          </div>
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
          <div>
            <h2>{title}</h2>
            <p>{loading ? 'Loading records from Supabase…' : `${rows.length} records shown`}</p>
          </div>
        </div>
        <div className="table-toolbar">
          <Search
            size="lg"
            labelText={`Search ${title.toLocaleLowerCase()}`}
            placeholder={`Search ${title.toLocaleLowerCase()}`}
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
          />
          <span className="result-count">{rows.length} of {records.length} records</span>
        </div>
        <DataTable rows={rows} headers={headers}>
          {({ rows: tableRows, headers: tableHeaders, getHeaderProps, getRowProps, getTableProps }) => (
            <TableContainer>
              <Table {...getTableProps()} aria-label={title}>
                <TableHead>
                  <TableRow>
                    {tableHeaders.map((header) => (
                      <TableHeader {...getHeaderProps({ header })} key={header.key}>
                        {header.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableRows.map((row) => (
                    <TableRow {...getRowProps({ row })} key={row.id}>
                      {row.cells.map((cell) => <TableCell key={cell.id}>{String(cell.value ?? '—')}</TableCell>)}
                    </TableRow>
                  ))}
                  {!loading && tableRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={headers.length} className="empty-cell">
                        {records.length === 0 ? 'No records yet. Use the form above to add the first one.' : 'No records match this search.'}
                      </TableCell>
                    </TableRow>
                  )}
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={headers.length} className="empty-cell">Loading records…</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>
        <div className="table-footer">
          <span>{records.length} records loaded</span>
          <span>Workspace: {organization.name}</span>
        </div>
      </section>
    </div>
  );
}
