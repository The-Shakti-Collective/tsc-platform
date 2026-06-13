import { apiGet, apiPost, apiPatch, apiDelete, resolveApiPath } from './apiClient';

function skillsPath(segment = '') {
  return resolveApiPath('/api/skills', segment);
}

function creativeIdentityPath(segment = '') {
  return resolveApiPath('/api/creative-identity', segment);
}

export async function fetchSkills(category) {
  return apiGet(skillsPath(''), { params: category ? { category } : {} });
}

export async function fetchSkillsCatalog(params = {}) {
  return fetchSkills(params.category);
}

export async function fetchSkillBySlug(slug) {
  return apiGet(skillsPath(`/${slug}`));
}

export async function fetchSkillCreators(slug, params = {}) {
  return apiGet(skillsPath(`/${slug}/creators`), { params });
}

export async function fetchCreativeIdentitySkills(slug) {
  return apiGet(creativeIdentityPath(`/${slug}/skills`));
}

export async function fetchMyCreativeIdentitySkills() {
  const identity = await apiGet(creativeIdentityPath('/me'));
  return { skills: identity?.skills ?? [] };
}

export async function fetchMySkills() {
  return fetchMyCreativeIdentitySkills();
}

export async function addSkillToMyProfile(payload) {
  return apiPost(creativeIdentityPath('/me/skills'), payload);
}

export async function addMySkill(payload) {
  return addSkillToMyProfile(payload);
}

export async function patchMySkill(skillId, payload) {
  return apiPatch(creativeIdentityPath(`/me/skills/${skillId}`), payload);
}

export async function removeSkillFromMyProfile(skillId) {
  return apiDelete(creativeIdentityPath(`/me/skills/${skillId}`));
}

export async function removeMySkill(skillId) {
  return removeSkillFromMyProfile(skillId);
}

export async function endorseSkill(slug, payload = {}) {
  return apiPost(skillsPath(`/${slug}/endorse`), payload);
}

export function deriveProficiencyFromYears(years) {
  if (years == null || Number.isNaN(Number(years))) return 'learning';
  const value = Number(years);
  if (value >= 8) return 'expert';
  if (value >= 3) return 'intermediate';
  return 'learning';
}

export const SKILL_PROFICIENCY_LABELS = {
  learning: 'Learning',
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
};

export const SKILL_CATEGORY_LABELS = {
  production: 'Production',
  performance: 'Performance',
  visual: 'Visual',
  business: 'Business',
  technical: 'Technical',
};

export const SKILL_CATEGORY_OPTIONS = Object.entries(SKILL_CATEGORY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const SKILL_PROFICIENCY_OPTIONS = Object.entries(SKILL_PROFICIENCY_LABELS)
  .filter(([value]) => ['learning', 'intermediate', 'expert'].includes(value))
  .map(([value, label]) => ({ value, label }));
