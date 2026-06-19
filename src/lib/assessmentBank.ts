// WitnessSkills: Assessment Bank
// Held-out items for scored assessment (not used in practice).
// Adapted from RegimeReader's ASSESSMENT_BANK.
// Each item has: stem, deceptive flag, location, why, discriminator, check.

import type { AssessmentItem } from './packspecDW';

export const ASSESSMENT_BANK: AssessmentItem[] = [
  {
    id: 'a1',
    stem: 'Our beta cut average page-load time by 40%.',
    deceptive: true,
    location: 'frame',
    why: '40% of what baseline, on which pages, measured how? — unstated coordinates.',
    discriminator: 'Not Depth (the mechanism is not hidden) and not Breadth (no rival suppressed) — the number is true only inside an unstated frame: baseline, page set, method. Move the frame and the same true number means something else.',
    check: 'Ask: 40% versus what, on which pages, measured over what window? If the answer changes the meaning, it was Frame.',
  },
  {
    id: 'a2',
    stem: 'The contract is governed by the laws of Delaware.',
    deceptive: false,
    location: null,
    why: 'A flat, checkable fact with no defeater lurking outside the reading.',
    check: 'Open the contract's governing-law clause. It either says Delaware or it does not — nothing one step deeper, broader, or reframed changes that.',
  },
  {
    id: 'a3',
    stem: 'Independent reviews on three sites all praise the product.',
    deceptive: true,
    location: 'channel',
    why: 'Are the three sites independent, or syndicating one affiliate feed?',
    discriminator: 'Not Frame (no hidden coordinate) and not Implicature (it says what it means) — the flaw is that the three witnesses may be one witness wearing three hats. Correlated sources, not independent ones.',
    check: 'Trace each review's source. Same author, same affiliate network, same press release? Three correlated voices count as one.',
  },
  {
    id: 'a4',
    stem: 'This medication is well tolerated by most patients.',
    deceptive: true,
    location: 'depth',
    why: '"Well tolerated" hides the mechanism and the severity of the minority's reactions.',
    discriminator: 'Not Frame (the claim does not hinge on an unstated coordinate) and not Breadth (no alternative hidden) — the defeater is one level beneath the surface word: what "tolerated" means clinically.',
    check: 'Dig under "well tolerated": what counts as a reaction, how severe is the worst, and how large is "most"?',
  },
  {
    id: 'a5',
    stem: 'Our solution is fully compatible with your existing stack.',
    deceptive: true,
    location: 'implicature',
    why: '"Compatible" conveys "works seamlessly"; it asserts only "will connect".',
    discriminator: 'Not Depth (nothing technical hidden beneath) and not Frame (no coordinate missing) — the gap is purely between what the sentence asserts and what it lets you infer.',
    check: 'Separate asserted from conveyed: write the literal claim ("will connect") next to the implied one ("works seamlessly"). The gap is the deception.',
  },
  {
    id: 'a6',
    stem: 'We chose Postgres for the project.',
    deceptive: false,
    location: null,
    why: 'A stated decision; no missing defeater flips its truth.',
    check: 'Confirm the decision was made — a commit, a doc, a person who will say so. It is a fact about a choice.',
  },
  {
    id: 'a7',
    stem: 'This is the fastest sorting algorithm available.',
    deceptive: true,
    location: 'breadth',
    why: 'Fastest under what input distribution, against which alternatives never benchmarked?',
    discriminator: 'Not Frame (not just a missing unit) and not Depth (the mechanism is not the issue) — the defeater is the alternative that was never put beside it. "Fastest" is a comparison, and the comparison set is suppressed.',
    check: 'Name the rivals it was not compared against, and the input distribution. A comparison with a hidden field is no comparison.',
  },
  {
    id: 'a8',
    stem: 'The audit found no evidence of fraud.',
    deceptive: true,
    location: 'depth',
    why: 'Absence of evidence vs evidence of absence — scope and rigor of the audit beneath the line.',
    discriminator: 'Not Implicature (not a wording trick) and not Channel (a single audit, not correlated voices) — the defeater sits beneath: how hard did the audit actually look?',
    check: 'Dig into the audit's scope: what did it examine, with what access, to what depth?',
  },
  {
    id: 'a9',
    stem: 'Revenue grew 200% year over year.',
    deceptive: true,
    location: 'frame',
    why: 'From what base? 200% off a tiny number is small in absolute terms.',
    discriminator: 'Not Depth (no mechanism hidden) and not Breadth (no rival suppressed) — the percentage is true but means little without its base.',
    check: 'Ask for the absolute numbers. 200% of $1k is $3k. The ratio is true and the frame is doing all the work.',
  },
  {
    id: 'a10',
    stem: 'The library is released under the MIT license.',
    deceptive: false,
    location: null,
    why: 'A verifiable attribute; no bounded-truth trap.',
    check: 'Open the LICENSE file. It is MIT or it is not — no deeper reading, wider comparison, or reframe changes the answer.',
  },
];

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildAssessment(n = 6): AssessmentItem[] {
  return shuffleArray(ASSESSMENT_BANK).slice(0, n);
}

export function buildAttempt(n = 4): AssessmentItem[] {
  const dec = shuffleArray(ASSESSMENT_BANK.filter(x => x.deceptive));
  const snd = shuffleArray(ASSESSMENT_BANK.filter(x => !x.deceptive));
  const pick = [...dec.slice(0, Math.max(1, n - 1)), ...snd.slice(0, 1)];
  return shuffleArray(pick).slice(0, n);
}

// Transfer bank: claims from fresh domains to test generalization
export interface TransferItem {
  id: string;
  stem: string;
  domain: string;
  location: string;
  defeater: string;
}

export const TRANSFER_BANK: TransferItem[] = [
  { id: 't1', stem: 'This fund returned 12% last year.',                    domain: 'finance',    location: 'frame',      defeater: '12% nominal or real? before or after fees? in what currency? — the frame coordinates decide whether 12% is good.' },
  { id: 't2', stem: 'Nine out of ten dentists recommend this toothpaste.',   domain: 'advertising',location: 'channel',    defeater: 'Recommend it over what, and were the dentists sampled independently or paid by one sponsor? Correlated sourcing.' },
  { id: 't3', stem: 'The new drug reduces risk of stroke by 50%.',           domain: 'medicine',   location: 'frame',      defeater: 'Relative or absolute risk? 50% of a 2% baseline is 1 percentage point — the frame flips the meaning.' },
  { id: 't4', stem: 'Our app has a 4.8-star average rating.',                domain: 'product',    location: 'breadth',    defeater: 'Across how many reviews, and compared to competitors' averages? The alternative comparison is never shown.' },
  { id: 't5', stem: 'The witness testified he saw the defendant at the scene.',domain: 'law',       location: 'depth',      defeater: 'Under what lighting, distance, and certainty? The mechanism beneath "saw" governs the verdict.' },
  { id: 't6', stem: 'Studies show coffee is linked to longer life.',          domain: 'science',    location: 'channel',    defeater: 'How many independent studies, or one study echoed across outlets? Correlation of sources, not corroboration.' },
  { id: 't7', stem: 'Upgrade now — it's compatible with your system.',       domain: 'software',   location: 'implicature',defeater: '"Compatible" conveys "will work well"; it asserts only "will install". The suggestion exceeds the claim.' },
  { id: 't8', stem: 'This candidate has the most experience for the role.',   domain: 'hiring',     location: 'frame',      defeater: 'Experience measured how — years, scope, relevance? The unit defines "most".' },
];

export function buildTransfer(n = 4): TransferItem[] {
  return shuffleArray(TRANSFER_BANK).slice(0, n);
}
