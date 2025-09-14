// Freedom Diagnostic Scoring System - Definitive Spec Implementation

interface DiagnosticAnswers {
  M1_Q1: number; M1_Q2: number;  // Position for Profit
  M2_Q1: number; M2_Q2: number;  // Engineer the Buyer Journey
  M3_Q1: number; M3_Q2: number;  // Set Up Systems That Support You
  M4_Q1: number; M4_Q2: number;  // Build a Sales System That Converts Without You
  M5_Q1: number; M5_Q2: number;  // Deliver Without Doing It All
  M6_Q1: number; M6_Q2: number;  // Refine, Release, Repeat
}

interface SprintRecommendation {
  sprintKey: string;
  title: string;
  why: string;
  priority: number;
}

interface FreedomScoreResult {
  totalScore: number;      // out of 60
  percent: number;         // 0-100%
  moduleAverages: {
    M1: number; M2: number; M3: number;
    M4: number; M5: number; M6: number;
  };
  sprintScores: {
    S1: number; S2: number; S3: number;
    S4: number; S5: number;
  };
  recommendedOrder: SprintRecommendation[];
}

export function scoreAndRecommend(input: DiagnosticAnswers): FreedomScoreResult {
  // Helper function to calculate averages (rounded to 1 decimal place)
  const avg = (a: number, b: number): number => {
    return Math.round(((a + b) / 2) * 10) / 10;
  };

  // Calculate module averages
  const M1 = avg(input.M1_Q1, input.M1_Q2);
  const M2 = avg(input.M2_Q1, input.M2_Q2);
  const M3 = avg(input.M3_Q1, input.M3_Q2);
  const M4 = avg(input.M4_Q1, input.M4_Q2);
  const M5 = avg(input.M5_Q1, input.M5_Q2);
  const M6 = avg(input.M6_Q1, input.M6_Q2);

  const moduleAverages = { M1, M2, M3, M4, M5, M6 };

  // Calculate delivery composite score (min of M3 and M5)
  const Delivery = Math.min(M3, M5);

  // Define sprints with their scores and tie-breaking ranks
  const sprints = [
    { key: 'S1', title: 'Lock In Your Most Profitable Service Zone', score: M1, tieRank: 1 },
    { key: 'S2', title: 'Create a Smooth Path from First Contact to Commitment', score: M2, tieRank: 2 },
    { key: 'S3', title: 'Sell Without Being a Bottleneck', score: M4, tieRank: 3 },
    { key: 'S4', title: 'Streamline Client Delivery without Losing Your Personal Touch', score: Delivery, tieRank: 4 },
    { key: 'S5', title: 'Continuously Improve without Burning It Down', score: M6, tieRank: 5 }
  ];

  // Calculate total score (sum of module averages, out of 60)
  const totalScore = M1 + M2 + M3 + M4 + M5 + M6;
  const percent = Math.round((totalScore / 60) * 100);

  // Sort sprints by score (ascending) with sophisticated tie-breaking rules
  sprints.sort((a, b) => {
    const diff = a.score - b.score;
    
    // If difference is significant (> 0.2), sort by score
    if (Math.abs(diff) > 0.2) return diff;

    // Tie-breaking rules from the spec:
    
    // 1. If S1 (Profit) is tied with anyone → S1 goes earlier
    if (a.key === 'S1' || b.key === 'S1') {
      return a.key === 'S1' ? -1 : 1;
    }
    
    // 2. If S3 (Sales) ties with S2 (Path) → S2 first (improves conversion inputs), then S3
    if ((a.key === 'S2' && b.key === 'S3') || (a.key === 'S3' && b.key === 'S2')) {
      return a.key === 'S2' ? -1 : 1;
    }
    
    // 3. If S4 (Delivery) ties with others and M5_avg < M3_avg → bias S4 earlier (client-facing risk)
    if ((a.key === 'S4' || b.key === 'S4') && M5 < M3) {
      return a.key === 'S4' ? -1 : 1;
    }

    // Default: use tieRank for stable sorting
    return a.tieRank - b.tieRank;
  });

  // Determine how many sprints to recommend
  const worstScore = sprints[0].score;
  const take = worstScore <= 6.0 ? 3 : 2;

  // Generate sprint recommendations with explanations
  const recommendedOrder: SprintRecommendation[] = sprints
    .slice(0, take)
    .map((sprint, index) => ({
      sprintKey: sprint.key,
      title: sprint.title,
      priority: index + 1,
      why: getSprintExplanation(sprint.key, sprint.score, index === 0)
    }));

  return {
    totalScore,
    percent,
    moduleAverages,
    sprintScores: {
      S1: M1, S2: M2, S3: M4, S4: Delivery, S5: M6
    },
    recommendedOrder
  };
}

function getSprintExplanation(sprintKey: string, score: number, isFirst: boolean): string {
  const explanations = {
    'S1': isFirst ? 'Positioning/pricing is limiting margins and demand.' : 'Strengthen your market position and pricing strategy.',
    'S2': isFirst ? 'Buyer path is unclear/too manual; streamlining lifts conversions.' : 'Smooth out your client acquisition journey.',
    'S3': isFirst ? 'Sales relies on you; we\'ll reduce your involvement without pushiness.' : 'Build systems that sell without you being the bottleneck.',
    'S4': isFirst ? 'Delivery depends on you; we\'ll streamline and delegate cleanly.' : 'Create delivery systems that work without your constant involvement.',
    'S5': isFirst ? 'Systems review cadence is weak; this prevents backsliding.' : 'Establish processes for continuous improvement and optimization.'
  };

  let explanation = explanations[sprintKey as keyof typeof explanations];
  
  // Add urgency context for very low scores
  if (score <= 4.0 && isFirst) {
    explanation = `Critical bottleneck: ${explanation.toLowerCase()}`;
  } else if (score <= 6.0 && isFirst) {
    explanation = `Major gap: ${explanation.toLowerCase()}`;
  }
  
  return explanation;
}

// Export types for use in other components
export type { DiagnosticAnswers, FreedomScoreResult, SprintRecommendation };