import { createContext, useCallback, useContext, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { Button, InlineNotification, Loading, PasswordInput, TextInput, Tile } from '@carbon/react';
import { supabase, supabaseConfigured } from '../lib/supabase';

type Organization = { id: string; name: string; slug: string };
type WorkspaceContextValue = {
  user: User;
  organization: Organization;
  refreshOrganizations: () => Promise<void>;
};
const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error('useWorkspace must be used inside WorkspaceGate');
  return value;
}

export default function WorkspaceGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'success' | 'info'; text: string } | null>(null);

  const refreshOrganizations = useCallback(async () => {
    if (!supabase || !session?.user) return;
    const { data, error } = await supabase
      .from('organizations')
      .select('id,name,slug')
      .order('created_at', { ascending: true });
    if (error) {
      setMessage({ kind: 'error', text: `Could not load workspaces: ${error.message}` });
      return;
    }
    setOrganizations((data ?? []) as Organization[]);
  }, [session?.user]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setMessage({ kind: 'error', text: error.message });
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) void refreshOrganizations();
    else setOrganizations([]);
  }, [session?.user, refreshOrganizations]);

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMessage(null);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim() } },
        });
        if (error) throw error;
        if (!data.session) {
          setMessage({ kind: 'success', text: 'Account created. Check your email to confirm the address, then sign in.' });
        } else {
          setMessage({ kind: 'success', text: 'Account created. Continue by creating your workspace.' });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Authentication failed.' });
    } finally {
      setBusy(false);
    }
  }

  async function createWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !session?.user) return;
    const name = organizationName.trim();
    if (!name) return;
    const slugBase = name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
    const slug = `${slugBase || 'workspace'}-${crypto.randomUUID().slice(0, 8)}`;
    setBusy(true);
    setMessage(null);
    try {
      const { data: organization, error: organizationError } = await supabase
        .from('organizations')
        .insert({ name, slug, created_by: session.user.id })
        .select('id,name,slug')
        .single();
      if (organizationError) throw organizationError;
      const { error: membershipError } = await supabase.from('organization_members').insert({
        organization_id: organization.id,
        user_id: session.user.id,
        role: 'owner',
      });
      if (membershipError) {
        setMessage({ kind: 'error', text: `Workspace created but owner membership failed: ${membershipError.message}. Retry after refreshing.` });
        await refreshOrganizations();
        return;
      }
      await refreshOrganizations();
      setMessage({ kind: 'success', text: 'Workspace created.' });
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Could not create workspace.' });
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="auth-loading"><Loading description="Loading Orbitas" withOverlay={false} /></div>;

  if (!supabaseConfigured || !supabase) {
    return (
      <div className="auth-screen">
        <Tile className="auth-card">
          <div className="auth-brand">ORBITAS</div>
          <h1>Connect your workspace</h1>
          <p>Supabase environment variables are missing. Configure the project URL and publishable key in your deployment settings.</p>
          <code>VITE_SUPABASE_URL</code>
          <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>
        </Tile>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="auth-screen">
        <Tile className="auth-card">
          <div className="auth-brand">ORBITAS</div>
          <h1>{mode === 'signin' ? 'Sign in to Orbitas' : 'Create your account'}</h1>
          <p className="auth-description">B2B prospect intelligence for your team.</p>
          {message && <InlineNotification lowContrast kind={message.kind} title={message.kind === 'error' ? 'Could not continue' : 'Notice'} subtitle={message.text} hideCloseButton />}
          <form className="auth-form" onSubmit={submitAuth}>
            {mode === 'signup' && <TextInput id="full-name" labelText="Full name" value={fullName} onChange={(event) => setFullName(event.target.value)} required />}
            <TextInput id="auth-email" type="email" labelText="Work email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
            <PasswordInput id="auth-password" labelText="Password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} minLength={8} required />
            <Button type="submit" disabled={busy} className="auth-submit">{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}</Button>
          </form>
          <button className="auth-mode-toggle" type="button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage(null); }}>
            {mode === 'signin' ? 'New to Orbitas? Create an account' : 'Already have an account? Sign in'}
          </button>
        </Tile>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="auth-screen">
        <Tile className="auth-card">
          <div className="auth-brand">ORBITAS</div>
          <h1>Create your workspace</h1>
          <p className="auth-description">A workspace keeps your companies, contacts, and sales activity isolated from other teams.</p>
          {message && <InlineNotification lowContrast kind={message.kind} title={message.kind === 'error' ? 'Could not create workspace' : 'Notice'} subtitle={message.text} hideCloseButton />}
          <form className="auth-form" onSubmit={createWorkspace}>
            <TextInput id="organization-name" labelText="Workspace name" placeholder="Acme Sales" value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} required />
            <Button type="submit" disabled={busy} className="auth-submit">{busy ? 'Creating…' : 'Create workspace'}</Button>
          </form>
          <Button kind="ghost" onClick={() => { if (supabase) void supabase.auth.signOut(); }}>Sign out</Button>
        </Tile>
      </div>
    );
  }

  const activeOrganization = organizations[0];
  return (
    <WorkspaceContext.Provider value={{ user: session.user, organization: activeOrganization, refreshOrganizations }}>
      {children}
    </WorkspaceContext.Provider>
  );
}
