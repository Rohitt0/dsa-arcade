export const greenhouseCharacter = { name: 'Rowan' };
// Tutorial data is illustrative and never written into the mission's crystal state.
export const tutorialCrystals = [4, 2, 7, 1, 6, 3, 8, 5] as const;
export const tutorialSteps = {
  arrival: { text: 'This greenhouse used to keep the whole village growing.', action: 'Continue', animated: true },
  introduction: { text: `I’m ${greenhouseCharacter.name}. Let’s see if we can bring it back.`, action: 'Continue', animated: true },
  discover: { text: 'These crystals still hold energy. The numbers show how much.', action: 'Continue' },
  collector: { text: 'The collector connects exactly three neighboring crystals at a time.', action: 'Continue' },
  scan: { text: 'Let’s scan these three neighboring crystals. Activate the collector when you’re ready.', action: 'Scan' },
  scanned: { text: 'This group supplies 13 energy.', calculation: '4 + 2 + 7 = 13', action: 'Slide right', animated: true },
  remove: { text: 'Two crystals stayed inside. Remove the one leaving and add the one entering.', calculation: '13 − 4 = 9', detail: 'Leaving: −4 · Kept: 2 and 7 · Entering: +1 next', action: 'Add entering crystal', animated: true },
  add: { text: 'Add the entering crystal’s 1 energy. The new group supplies 10 energy.', calculation: '13 − 4 + 1 = 10', detail: 'Selected: 2 + 7 + 1', action: 'Continue' },
  stage: { text: 'Which group of three holds the most energy? Write a program to find it.', action: 'Start Stage 1' },
} as const;
export type TutorialStep = keyof typeof tutorialSteps;
export interface TutorialState {
  active: boolean;
  step: TutorialStep;
  busy: boolean;
  replay: boolean;
}
