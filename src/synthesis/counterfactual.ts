import { 
  MarketSignalOutput, 
  SentimentOutput, 
  FundamentalRagOutput, 
  UserProfile, 
  RiskProfileLevel
} from '../types/models';
import { synthesize } from './synthesisAgent';

export interface CounterfactualDiff {
  timestamp: string;
  changed_factors: string[];
  profile_a: {
    profile: RiskProfileLevel;
    recommendation: string;
    confidence: number;
    constraints_applied: string[];
  };
  profile_b: {
    profile: RiskProfileLevel;
    recommendation: string;
    confidence: number;
    constraints_applied: string[];
  };
  delta_explanation: string;
}

export async function runCounterfactual(
  marketOutput: MarketSignalOutput | null,
  sentimentOutput: SentimentOutput | null,
  ragOutput: FundamentalRagOutput | null,
  currentProfile: UserProfile,
  targetRiskProfile: RiskProfileLevel
): Promise<CounterfactualDiff> {
  console.log(`\n[Counterfactual] Simulation triggered: ${currentProfile.riskProfile} -> ${targetRiskProfile}`);
  // We reuse the cached evidence, re-running only synthesis with different risk profile
  
  const synthesisA = await synthesize(marketOutput, sentimentOutput, ragOutput, currentProfile);
  
  const targetProfile: UserProfile = {
    ...currentProfile,
    riskProfile: targetRiskProfile
  };
  
  const synthesisB = await synthesize(marketOutput, sentimentOutput, ragOutput, targetProfile);

  let delta_explanation = `Profile changed from ${currentProfile.riskProfile} to ${targetRiskProfile}. `;
  if (synthesisA.recommendation !== synthesisB.recommendation) {
    delta_explanation += `Recommendation changed from ${synthesisA.recommendation.toUpperCase()} to ${synthesisB.recommendation.toUpperCase()}. `;
    
    // Find constraint diffs
    const addedConstraints = synthesisB.constraints_applied.filter(c => !synthesisA.constraints_applied.includes(c));
    const removedConstraints = synthesisA.constraints_applied.filter(c => !synthesisB.constraints_applied.includes(c));
    
    if (addedConstraints.length > 0) delta_explanation += `Constraints activated: ${addedConstraints.join(', ')}. `;
    if (removedConstraints.length > 0) delta_explanation += `Constraints deactivated: ${removedConstraints.join(', ')}.`;
  } else {
    delta_explanation += `No change in recommendation despite profile change (${synthesisA.recommendation.toUpperCase()} in both). `;
    delta_explanation += synthesisB.personalization_effect;
  }

  console.log(`[Counterfactual] Simulation complete. Result returned.`);
  return {
    timestamp: new Date().toISOString(),
    changed_factors: [
      `User Risk Profile: ${currentProfile.riskProfile} -> ${targetRiskProfile}`
    ],
    profile_a: {
      profile: currentProfile.riskProfile,
      recommendation: synthesisA.recommendation,
      confidence: synthesisA.confidence,
      constraints_applied: synthesisA.constraints_applied
    },
    profile_b: {
      profile: targetRiskProfile,
      recommendation: synthesisB.recommendation,
      confidence: synthesisB.confidence,
      constraints_applied: synthesisB.constraints_applied
    },
    delta_explanation: delta_explanation.trim()
  };
}
