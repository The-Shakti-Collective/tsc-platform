export const CONTRACT_TEMPLATE_TYPES = [
  'brand_deal',
  'performance',
  'workshop',
  'community',
] as const;

export type ContractTemplateType = (typeof CONTRACT_TEMPLATE_TYPES)[number];

export const CONTRACT_STATUSES = ['draft', 'sent', 'signed', 'cancelled'] as const;

export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export interface ContractTemplateSummary {
  id: string;
  slug: string;
  name: string;
  type: ContractTemplateType;
  bodyTemplate: string;
  variables: string[];
  isActive: boolean;
}

export interface ContractTemplateListPayload {
  items: ContractTemplateSummary[];
  updatedAt: string;
}

export interface ContractSummary {
  id: string;
  templateId: string;
  templateName: string | null;
  templateType: ContractTemplateType | null;
  dealId: string | null;
  bookingRequestId: string | null;
  artistId: string;
  artistName: string | null;
  brandId: string | null;
  brandName: string | null;
  status: ContractStatus;
  signedAt: string | null;
  documentUrl: string | null;
  variables: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ContractListPayload {
  items: ContractSummary[];
  filters: {
    artistId: string | null;
    brandId: string | null;
    status: ContractStatus | null;
  };
  updatedAt: string;
}

export interface ContractCreatedPayload {
  id: string;
  templateId: string;
  dealId: string | null;
  bookingRequestId: string | null;
  artistId: string;
  status: ContractStatus;
  documentUrl: string | null;
  createdAt: string;
}

export interface ContractSignPayload {
  id: string;
  status: ContractStatus;
  signedAt: string;
  documentUrl: string;
  updatedAt: string;
}

export interface InvoiceStubSummary {
  id: string;
  contractId: string | null;
  dealId: string | null;
  bookingRequestId: string | null;
  artistId: string;
  brandId: string | null;
  amount: number | null;
  currency: string;
  status: string;
  dueDate: string | null;
  paidAt: string | null;
  paymentProvider: string | null;
  createdAt: string;
}
