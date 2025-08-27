// File: src/lib/recommendation.ts
import { supabase } from './supabase'; // This imports the connection from your other file

// Smart sprint matching function
export async function findRecommendedSprint(weakestCategory: string) {
  // First try exact match
  const { data: exactMatch, error: exactError } = await supabase
    .from('sprints')
    .select('*')
    .ilike('name', `%${weakestCategory}%`)
    .single();

  if (!exactError && exactMatch) return exactMatch;

  // If no exact match, try our mapping
  const categoryToSprintMap: Record<string, string> = {
    'lead_generation': 'sell',
    'delegation': 'improve',
    'pricing': 'zone',
    'clarity': 'zone',
    'sales_process': 'sell',
    'client_onboarding': 'path',
    'service_delivery': 'delivery',
    'revenue': 'zone',
    'fulfillment': 'zone'
  };

  const keyword = categoryToSprintMap[weakestCategory] || 'zone';
  
  const { data: keywordMatch, error: keywordError } = await supabase
    .from('sprints')
    .select('*')
    .ilike('name', `%${keyword}%`)
    .single();

  if (!keywordError && keywordMatch) return keywordMatch;

  // Fallback to first sprint
  const { data: fallback } = await supabase
    .from('sprints')
    .select('*')
    .order('week_number')
    .limit(1)
    .single();

  return fallback;
}