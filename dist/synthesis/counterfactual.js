import { synthesize } from './synthesisAgent';
export async function runCounterfactual(marketOutput, sentimentOutput, ragOutput, currentProfile, targetRiskProfile) {
    console.log(`\n[Counterfactual] Simulation triggered: ${currentProfile.riskProfile} -> ${targetRiskProfile}`);
    // We reuse the cached evidence, re-running only synthesis with different risk profile
    const synthesisA = await synthesize(marketOutput, sentimentOutput, ragOutput, currentProfile);
    const targetProfile = {
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
        if (addedConstraints.length > 0)
            delta_explanation += `Constraints activated: ${addedConstraints.join(', ')}. `;
        if (removedConstraints.length > 0)
            delta_explanation += `Constraints deactivated: ${removedConstraints.join(', ')}.`;
    }
    else {
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
