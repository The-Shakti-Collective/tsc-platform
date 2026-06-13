import React, { useState } from 'react';
import { FileText, PenLine } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
  fetchContractTemplates,
  fetchContracts,
  signContract,
} from '../../lib/contractApi';
import InvoicePayButton from '../../components/payments/InvoicePayButton';
import { useQuery, useQueryClient } from '@tanstack/react-query';

function ContractRow({ contract, onSign }) {
  return (
    <div className="rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-surface)] p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            {contract.templateName ?? contract.id}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {contract.artistName ?? contract.artistId}
            {contract.brandName ? ` · ${contract.brandName}` : ''}
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
          {CONTRACT_STATUS_LABELS[contract.status] ?? contract.status}
        </span>
      </div>
      {contract.dealId && (
        <p className="text-xs text-[var(--color-text-muted)]">Deal: {contract.dealId}</p>
      )}
      {contract.dealId && contract.status === 'signed' && (
        <InvoicePayButton
          invoiceId={`inv-stub-${contract.id}`}
          amount={
            contract.variables?.fee != null
              ? Number(contract.variables.fee)
              : contract.variables?.value != null
                ? Number(contract.variables.value)
                : null
          }
          currency={contract.variables?.currency ?? 'INR'}
          status="draft"
          dealId={contract.dealId}
          compact
        />
      )}
      {contract.signedAt && (
        <p className="text-xs text-green-600">
          Signed {new Date(contract.signedAt).toLocaleDateString('en-IN')}
        </p>
      )}
      {contract.status !== 'signed' && (
        <button
          type="button"
          onClick={() => onSign(contract.id)}
          className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]"
        >
          <PenLine size={12} />
          Sign (stub)
        </button>
      )}
      {contract.documentUrl && (
        <a
          href={contract.documentUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] text-[var(--color-brand-primary)] underline block"
        >
          View document
        </a>
      )}
    </div>
  );
}

function TemplateCard({ template }) {
  return (
    <div className="rounded-lg border border-[var(--color-bg-border)] bg-[var(--color-bg-elevated)] p-3 space-y-1">
      <p className="text-sm font-medium">{template.name}</p>
      <p className="text-[10px] uppercase text-[var(--color-text-muted)]">
        {CONTRACT_TYPE_LABELS[template.type] ?? template.type}
      </p>
      <p className="text-xs text-[var(--color-text-muted)] line-clamp-2">{template.bodyTemplate}</p>
      <p className="text-[10px] text-[var(--color-text-muted)]">
        Variables: {template.variables.join(', ')}
      </p>
    </div>
  );
}

export default function ContractListPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('contracts');

  const templatesQuery = useQuery({
    queryKey: ['contract-templates'],
    queryFn: fetchContractTemplates,
  });

  const contractsQuery = useQuery({
    queryKey: ['contracts'],
    queryFn: () => fetchContracts(),
  });

  async function handleSign(id) {
    await signContract(id);
    queryClient.invalidateQueries({ queryKey: ['contracts'] });
  }

  const loading = templatesQuery.isLoading || contractsQuery.isLoading;
  const isError = templatesQuery.isError || contractsQuery.isError;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-[var(--color-text-muted)]">Could not load contracts.</p>
      </div>
    );
  }

  const mockSource =
    templatesQuery.data?._source === 'mock' || contractsQuery.data?._source === 'mock';

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <FileText size={20} />
          Contracts
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Templates + signed agreements
          {mockSource && ' · mock data'}
        </p>
      </header>

      <div className="flex gap-2 border-b border-[var(--color-bg-border)]">
        {['contracts', 'templates'].map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`text-sm px-3 py-2 capitalize ${
              tab === key
                ? 'border-b-2 border-[var(--color-brand-primary)] text-[var(--color-brand-primary)]'
                : 'text-[var(--color-text-muted)]'
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      {tab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(templatesQuery.data?.items ?? []).map((tpl) => (
            <TemplateCard key={tpl.id} template={tpl} />
          ))}
        </div>
      )}

      {tab === 'contracts' && (
        <div className="space-y-3">
          {(contractsQuery.data?.items ?? []).length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-8">
              No contracts yet. Advance a deal to agreement to auto-generate.
            </p>
          ) : (
            contractsQuery.data.items.map((contract) => (
              <ContractRow key={contract.id} contract={contract} onSign={handleSign} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
