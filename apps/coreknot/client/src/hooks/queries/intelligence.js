import { useMutation } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import {
  fetchArtistHealth,
  fetchCommandCenter,
  fetchEcosystemGraph,
  fetchOpportunityIntelligence,
  postContactAtRiskArtists,
  postReviewRecoveryPlan,
  postApplyRecommended,
  postLaunchCommunityCampaign,
  postExecuteInsightAction,
  postContactCommunity,
  postCreateCampaign,
  postInviteArtists,
  postLaunchBrandCampaign,
  postLaunchOpportunity,
  postReviewPipelineDeals,
} from '../../lib/intelligenceApi';

export function useCommandCenter(period = 'weekly') {
  return useQuery({
    queryKey: ['intelligence', 'command-center', period],
    queryFn: () => fetchCommandCenter(period),
    staleTime: 60_000,
  });
}

export function useArtistHealth(artistId) {
  return useQuery({
    queryKey: ['intelligence', 'artist-health', artistId],
    queryFn: () => fetchArtistHealth(artistId),
    enabled: !!artistId,
    staleTime: 60_000,
  });
}

export function useOpportunityIntelligence() {
  return useQuery({
    queryKey: ['intelligence', 'opportunities'],
    queryFn: fetchOpportunityIntelligence,
    staleTime: 60_000,
  });
}

export function useEcosystemGraph(artistId) {
  return useQuery({
    queryKey: ['intelligence', 'ecosystem-graph', artistId],
    queryFn: () => fetchEcosystemGraph(artistId),
    enabled: !!artistId,
    staleTime: 60_000,
  });
}

export function useCreateCampaignAction() {
  return useMutation({ mutationFn: postCreateCampaign });
}

export function useInviteArtistsAction() {
  return useMutation({ mutationFn: postInviteArtists });
}

export function useLaunchOpportunityAction() {
  return useMutation({ mutationFn: postLaunchOpportunity });
}

export function useContactCommunityAction() {
  return useMutation({ mutationFn: postContactCommunity });
}

export function useReviewPipelineDealsAction() {
  return useMutation({ mutationFn: postReviewPipelineDeals });
}

export function useLaunchBrandCampaignAction() {
  return useMutation({ mutationFn: postLaunchBrandCampaign });
}

export function useContactAtRiskArtistsAction() {
  return useMutation({ mutationFn: postContactAtRiskArtists });
}

export function useReviewRecoveryPlanAction() {
  return useMutation({ mutationFn: postReviewRecoveryPlan });
}

export function useApplyRecommendedAction() {
  return useMutation({ mutationFn: postApplyRecommended });
}

export function useLaunchCommunityCampaignAction() {
  return useMutation({ mutationFn: postLaunchCommunityCampaign });
}

export function useExecuteInsightAction() {
  return useMutation({
    mutationFn: ({ insightId, actionType }) => postExecuteInsightAction(insightId, actionType),
  });
}
