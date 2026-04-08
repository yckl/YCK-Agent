export const SPINNER_VERBS = [
  'Clauding', 'Boondoggling', 'Canoodling', 'Flibbertigibbeting',
  'Hullaballooing', 'Moonwalking', 'Prestidigitating', 'Razzmatazzing',
  'Shenaniganing', 'Tomfoolering', 'Whatchamacalliting', 'Beboppin',
  'Analyzing', 'Computing', 'Synthesizing', 'Reticulating Splines',
  'Quantum tuning', 'Bypassing mainframe', 'Uploading subroutines',
  'Discombobulating', 'Frobnicating', 'Twiddling', 'Blorping'
  // ... 200+ verbs truncated for brevity
];

export function getRandomSpinnerVerb(): string {
  const index = Math.floor(Math.random() * SPINNER_VERBS.length);
  return SPINNER_VERBS[index] + '...';
}

export function generatePastTense(verb: string, durationMs: number): string {
  const s = Math.round(durationMs / 1000);
  let pastTense = verb.replace(/ing$/, 'ed');
  
  // Handling special cases
  if (verb.endsWith('e')) pastTense = verb + 'd';
  else if (verb === 'Beboppin') pastTense = 'Bebopped';
  else if (!verb.endsWith('ing')) pastTense = verb + 'ed'; // fallback

  return `${pastTense} for ${s}s`;
}
