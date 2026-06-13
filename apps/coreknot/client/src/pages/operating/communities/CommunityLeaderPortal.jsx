import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, Settings2, UserPlus, Briefcase } from 'lucide-react';
import { Spinner } from '../../../components/ui/Spinner';
import { PageContainer } from '../../../components/ui/primitives';
import { TSC_UNDERGROUND_ID } from '../../../lib/communityApi';
import {
  useAddCommunityMember,
  useCommunityDashboard,
  useCommunityEvents,
  useCommunityMembers,
  useCreateCommunityOpportunity,
  useUpdateCommunitySettings,
} from '../../../hooks/queries/community';
import CommunityAgentPanel from '../../../components/community/CommunityAgentPanel';

function ActionCard({ title, icon: Icon, children }) {
  return (
    <section className="rounded-xl border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-5 space-y-4">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={16} className="text-[var(--color-brand-primary)]" />}
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  'w-full rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-base)] px-3 py-2 text-sm text-[var(--color-text-primary)]';

export default function CommunityLeaderPortal({ communityId: communityIdProp = undefined } = {}) {
  const { communityId: routeCommunityId } = useParams();
  const communityId = routeCommunityId ?? communityIdProp ?? TSC_UNDERGROUND_ID;
  const dashboardQuery = useCommunityDashboard(communityId);
  const membersQuery = useCommunityMembers(communityId);
  const eventsQuery = useCommunityEvents(communityId);
  const addMember = useAddCommunityMember(communityId);
  const createOpportunity = useCreateCommunityOpportunity(communityId);
  const updateSettings = useUpdateCommunitySettings(communityId);

  const [memberPersonId, setMemberPersonId] = useState('');
  const [memberRole, setMemberRole] = useState('Member');
  const [oppTitle, setOppTitle] = useState('');
  const [oppCategory, setOppCategory] = useState('open_call');
  const [settings, setSettings] = useState({
    inviteOnly: false,
    memberPosting: true,
    eventCreation: true,
    opportunityPosting: true,
  });

  const isLoading = dashboardQuery.isLoading || membersQuery.isLoading || eventsQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size={32} />
      </div>
    );
  }

  const dashboard = dashboardQuery.data;
  const members = membersQuery.data;
  const events = eventsQuery.data;
  const isMock =
    dashboard?._source === 'mock' ||
    members?._source === 'mock' ||
    events?._source === 'mock';

  return (
    <PageContainer className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <Link
          to={`/operating/communities/${communityId}`}
          className="text-xs text-[var(--color-text-muted)] hover:underline"
        >
          ← {dashboard?.name ?? 'Community'} dashboard
        </Link>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Leader portal</h1>
        <p className="text-sm text-[var(--color-text-muted)] max-w-2xl">
          Manage members, events visibility, community-scoped opportunities, and permission stubs.
        </p>
        {isMock && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Stub mode — mutations return mock payloads until @tsc/api is live.
          </p>
        )}
      </div>

      <CommunityAgentPanel communityId={communityId} />

      <div className="grid gap-4 lg:grid-cols-2">
        <ActionCard title="Add member" icon={UserPlus}>
          <div className="space-y-3">
            <Field label="Person ID">
              <input
                className={inputClass}
                value={memberPersonId}
                onChange={(e) => setMemberPersonId(e.target.value)}
                placeholder="person-id"
              />
            </Field>
            <Field label="Role">
              <select
                className={inputClass}
                value={memberRole}
                onChange={(e) => setMemberRole(e.target.value)}
              >
                <option value="Member">Member</option>
                <option value="Moderator">Moderator</option>
                <option value="Founder">Founder</option>
                <option value="Contributor">Contributor</option>
              </select>
            </Field>
            <button
              type="button"
              className="text-sm px-4 py-2 rounded-lg bg-[var(--color-brand-primary)] text-white disabled:opacity-50"
              disabled={!memberPersonId.trim() || addMember.isPending}
              onClick={() => {
                addMember.mutate(
                  { personId: memberPersonId.trim(), role: memberRole },
                  { onSuccess: () => setMemberPersonId('') },
                );
              }}
            >
              {addMember.isPending ? 'Adding…' : 'Create MEMBER_OF'}
            </button>
            {addMember.isSuccess && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                Member linked ({addMember.data?._source}) — relationship {addMember.data?.relationshipId}
              </p>
            )}
          </div>
        </ActionCard>

        <ActionCard title="Community opportunity" icon={Briefcase}>
          <div className="space-y-3">
            <Field label="Title">
              <input
                className={inputClass}
                value={oppTitle}
                onChange={(e) => setOppTitle(e.target.value)}
                placeholder="Underground residency — Q3 open call"
              />
            </Field>
            <Field label="Category">
              <select
                className={inputClass}
                value={oppCategory}
                onChange={(e) => setOppCategory(e.target.value)}
              >
                <option value="open_call">Open call</option>
                <option value="workshop">Workshop</option>
                <option value="collaboration">Collaboration</option>
                <option value="festival_slot">Festival slot</option>
                <option value="funding">Funding</option>
              </select>
            </Field>
            <button
              type="button"
              className="text-sm px-4 py-2 rounded-lg bg-[var(--color-brand-primary)] text-white disabled:opacity-50"
              disabled={!oppTitle.trim() || createOpportunity.isPending}
              onClick={() => {
                createOpportunity.mutate(
                  { title: oppTitle.trim(), category: oppCategory, marketplaceVisible: true },
                  { onSuccess: () => setOppTitle('') },
                );
              }}
            >
              {createOpportunity.isPending ? 'Creating…' : 'Post to marketplace'}
            </button>
            {createOpportunity.isSuccess && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                Opportunity {createOpportunity.data?.id} ({createOpportunity.data?._source})
              </p>
            )}
          </div>
        </ActionCard>
      </div>

      <ActionCard title="Leader settings (permissions stub)" icon={Settings2}>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['inviteOnly', 'Invite only'],
            ['memberPosting', 'Member posting'],
            ['eventCreation', 'Event creation'],
            ['opportunityPosting', 'Opportunity posting'],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
              <input
                type="checkbox"
                checked={settings[key]}
                onChange={(e) => setSettings((prev) => ({ ...prev, [key]: e.target.checked }))}
              />
              {label}
            </label>
          ))}
        </div>
        <button
          type="button"
          className="text-sm px-4 py-2 rounded-lg border border-[var(--color-bg-border)] text-[var(--color-brand-primary)]"
          disabled={updateSettings.isPending}
          onClick={() => updateSettings.mutate(settings)}
        >
          {updateSettings.isPending ? 'Saving…' : 'Save settings'}
        </button>
      </ActionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ActionCard title="Recent members" icon={UserPlus}>
          <ul className="space-y-0">
            {(members?.items ?? []).slice(0, 8).map((member) => (
              <li
                key={member.personId}
                className="flex justify-between gap-3 py-2 border-b border-[var(--color-bg-border)] last:border-0 text-sm"
              >
                <span className="text-[var(--color-text-primary)]">{member.name}</span>
                <span className="text-xs text-[var(--color-text-muted)]">{member.role}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-[var(--color-text-muted)]">
            {members?.total?.toLocaleString?.()} total · page {members?.page}
          </p>
        </ActionCard>

        <ActionCard title="Upcoming events" icon={CalendarDays}>
          <ul className="space-y-0">
            {(events?.items ?? []).map((event) => (
              <li
                key={event.id}
                className="flex justify-between gap-3 py-2 border-b border-[var(--color-bg-border)] last:border-0 text-sm"
              >
                <span className="text-[var(--color-text-primary)] truncate">{event.title}</span>
                <span className="text-xs text-[var(--color-text-muted)] shrink-0">
                  {new Date(event.startsAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </ActionCard>
      </div>
    </PageContainer>
  );
}
