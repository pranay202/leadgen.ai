export interface ScoringInput {
  hasWebsite: boolean;
  domainAge: number | null;
  hasEmail: boolean;
  isHttps: boolean;
}

export const calculateLeadScore = (input: ScoringInput): number => {
  if (!input.hasWebsite) return 0;

  let score = 100;

  if (input.domainAge !== null && input.domainAge > 10) {
    score -= 40;
  }

  if (!input.hasEmail) {
    score -= 20;
  }

  if (!input.isHttps) {
    score -= 20;
  }

  return Math.max(0, score);
};
