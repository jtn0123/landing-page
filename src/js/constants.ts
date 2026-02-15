// Shared constants extracted from main.ts to break circular dependency
// (stats.ts / timeline.ts dynamically imported by main.ts were deadlocking)

export const API_BASE: string = '/api/github';
export const REPOS: string[] = [
  'MegaBonk',
  'VoltTracker',
  'landing-page',
  'satellite_processor',
  'AudioWhisper',
];
export const CARD_REPOS: string[] = [
  'MegaBonk',
  'VoltTracker',
  'satellite_processor',
  'AudioWhisper',
];
export const OWNER: string = 'jtn0123';
