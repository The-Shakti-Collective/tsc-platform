import type { Prisma } from '@prisma/client';

export const CONTRACT_TEMPLATE_TYPES = [
  'brand_deal',
  'performance',
  'workshop',
  'community',
] as const;

export type ContractTemplateTypeValue = (typeof CONTRACT_TEMPLATE_TYPES)[number];

export const CONTRACT_STATUSES = ['draft', 'sent', 'signed', 'cancelled'] as const;

export type ContractStatusValue = (typeof CONTRACT_STATUSES)[number];

export const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled'] as const;

export type InvoiceStatusValue = (typeof INVOICE_STATUSES)[number];

export const DEFAULT_CONTRACT_TEMPLATES: Array<{
  slug: string;
  name: string;
  type: ContractTemplateTypeValue;
  bodyTemplate: string;
  variables: string[];
}> = [
  {
    slug: 'brand-deal-standard',
    name: 'Brand Deal Agreement',
    type: 'brand_deal',
    bodyTemplate:
      'Agreement between {{brandName}} and {{artistName}} for {{deliverables}}. Fee: {{fee}} {{currency}}. Term: {{startDate}} to {{endDate}}.',
    variables: ['brandName', 'artistName', 'deliverables', 'fee', 'currency', 'startDate', 'endDate'],
  },
  {
    slug: 'performance-standard',
    name: 'Live Performance Contract',
    type: 'performance',
    bodyTemplate:
      'Performance agreement for {{artistName}} at {{venueName}} on {{eventDate}}. Fee: {{fee}} {{currency}}.',
    variables: ['artistName', 'venueName', 'eventDate', 'fee', 'currency'],
  },
  {
    slug: 'workshop-standard',
    name: 'Workshop Engagement',
    type: 'workshop',
    bodyTemplate:
      'Workshop led by {{artistName}} on {{eventDate}}. Topic: {{topic}}. Fee: {{fee}} {{currency}}.',
    variables: ['artistName', 'eventDate', 'topic', 'fee', 'currency'],
  },
  {
    slug: 'community-standard',
    name: 'Community Event Agreement',
    type: 'community',
    bodyTemplate:
      'Community event featuring {{artistName}} hosted by {{communityName}} on {{eventDate}}.',
    variables: ['artistName', 'communityName', 'eventDate'],
  },
];

export const contractInclude = {
  template: {
    select: { id: true, slug: true, name: true, type: true },
  },
  artist: {
    select: { id: true, name: true, slug: true },
  },
  brand: {
    select: { id: true, name: true, logo: true },
  },
  deal: {
    select: { id: true, status: true, value: true },
  },
  bookingRequest: {
    select: { id: true, status: true, eventDate: true },
  },
} satisfies Prisma.ContractInclude;

export function contractListWhere(input: {
  artistId?: string;
  brandId?: string;
  dealId?: string;
  status?: ContractStatusValue;
}): Prisma.ContractWhereInput {
  const where: Prisma.ContractWhereInput = {};
  if (input.artistId) where.artistId = input.artistId;
  if (input.brandId) where.brandId = input.brandId;
  if (input.dealId) where.dealId = input.dealId;
  if (input.status) where.status = input.status;
  return where;
}
