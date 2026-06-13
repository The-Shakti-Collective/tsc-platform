import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gift, Loader2, Sparkles, Ticket, Users } from 'lucide-react';
import { ProductPurchaseCard } from '../../components/commerce/ProductPurchaseCard';
import { Spinner } from '../../components/ui/Spinner';
import {
  fetchExperiences,
  fetchMerch,
  fetchTickets,
  purchaseExperience,
  purchaseMerch,
  purchaseTicket,
} from '../../lib/commerceApi';

const TABS = [
  { id: 'tickets', label: 'Tickets', icon: Ticket },
  { id: 'merch', label: 'Merch & packs', icon: Gift },
  { id: 'experiences', label: 'Experiences', icon: Users },
];

export function FanCommerceBrowsePage({
  eventId = 'evt-nh7',
  artistId = 'art-ritviz',
  communityId = 'com-tsc-underground',
}) {
  const [activeTab, setActiveTab] = useState('tickets');
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [merch, setMerch] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [source, setSource] = useState(null);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const [ticketData, merchData, experienceData] = await Promise.all([
        fetchTickets(eventId),
        fetchMerch(artistId, communityId),
        fetchExperiences(artistId),
      ]);
      setTickets(ticketData.items ?? []);
      setMerch(merchData.items ?? []);
      setExperiences(experienceData.items ?? []);
      setSource(
        ticketData._source ?? merchData._source ?? experienceData._source ?? 'api',
      );
    } finally {
      setLoading(false);
    }
  }, [eventId, artistId, communityId]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const activeItems =
    activeTab === 'tickets'
      ? tickets
      : activeTab === 'merch'
        ? merch
        : experiences;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
              Fan Commerce
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              Browse tickets, merch, and experiences — track-only purchases (Phase 10 checkout deferred).
            </p>
          </div>
          <Link
            to="/commerce/purchases"
            className="text-sm text-[var(--color-brand-primary)] hover:underline"
          >
            My purchases
          </Link>
        </div>
        {source === 'mock' && (
          <p className="text-xs text-amber-400/90 flex items-center gap-1">
            <Sparkles size={12} />
            Showing mock catalog — API offline or migration pending
          </p>
        )}
      </header>

      <nav className="flex gap-2 flex-wrap" role="tablist">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border transition-colors ${
                isActive
                  ? 'bg-[var(--color-brand-primary)] text-white border-transparent'
                  : 'bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] border-[var(--color-bg-border)] hover:border-[var(--color-brand-primary)]'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : activeItems.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)] py-8 text-center">
          No items in this catalog yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {activeTab === 'tickets' &&
            tickets.map((item) => (
              <ProductPurchaseCard
                key={item.id}
                product={item}
                productKind="ticket"
                purchaseFn={purchaseTicket}
              />
            ))}
          {activeTab === 'merch' &&
            merch.map((item) => (
              <ProductPurchaseCard
                key={item.id}
                product={item}
                productKind="merch"
                purchaseFn={purchaseMerch}
              />
            ))}
          {activeTab === 'experiences' &&
            experiences.map((item) => (
              <ProductPurchaseCard
                key={item.id}
                product={item}
                productKind="experience"
                purchaseFn={purchaseExperience}
              />
            ))}
        </div>
      )}

      <button
        type="button"
        onClick={loadCatalog}
        disabled={loading}
        className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : null}
        Refresh catalog
      </button>
    </div>
  );
}

export default FanCommerceBrowsePage;
