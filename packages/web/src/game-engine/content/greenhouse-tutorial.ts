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
  s2intro: { text: 'Last time, you found the strongest group. Now count every group that supplies enough energy.', action: 'Begin' },
  s2scan: { text: 'Scan the first three crystals. Reliable windows starts at 0.', calculation: 'k = 3 · target = 12 · reliable windows = 0', action: 'Scan' },
  s2slide: { text: '8 is below 12, so this group does not increase the count.', calculation: '2 + 5 + 1 = 8', action: 'Slide right' },
  s2finish: { text: 'The count increases only when the window total is at least the target. Check every group of three. How many qualify?', action: 'Start coding' },
  s3intro: { text: 'The collector can now change width. Find the shortest neighboring group with enough energy.', action: 'Begin practice' },
  s3one: { text: 'Expand to include 2.', calculation: 'sum = 2 · length = 1', action: 'Expand' },
  s3two: { text: 'Expand to include 3.', calculation: '2 + 3 = 5 · length = 2', action: 'Expand' },
  s3three: { text: 'We have enough energy. Record this length, then try a smaller group.', calculation: '2 + 3 + 4 = 9 · length = 3', action: 'Shrink' },
  s3four: { text: 'Still enough—and shorter. Update the best length.', calculation: '9 − 2 = 7 · [3, 4] · length = 2', action: 'Shrink again' },
  s3five: { text: 'Now we need more energy, so expand again.', calculation: '7 − 3 = 4 · [4] · length = 1', action: 'Finish' },
  s3finish: { text: 'Expand to reach the target. While you have enough, shrink and record the shortest valid group.', action: 'Start coding' },
  s4intro: { text: 'The vines need steady warmth. Connect the longest stretch of neighboring crystals you can—but keep their total energy within the heating budget.', action: 'Begin practice' },
  s4one: { text: 'Expand to include 2. Start the best length at 1.', calculation: 'sum = 2 · best length = 1', action: 'Expand' },
  s4two: { text: 'Expand to include 1.', calculation: '2 + 1 = 3 · best length = 2', action: 'Expand' },
  s4three: { text: 'Exactly on budget is allowed.', calculation: '2 + 1 + 3 = 6 · best length = 3', action: 'Expand' },
  s4four: { text: 'This window is over budget. Do not update the best length.', calculation: '6 + 4 = 10 · OVER BUDGET', action: 'Shrink' },
  s4five: { text: 'Still over budget. Keep shrinking.', calculation: '10 − 2 = 8 · OVER BUDGET', action: 'Shrink' },
  s4six: { text: 'Still over budget.', calculation: '8 − 1 = 7 · OVER BUDGET', action: 'Shrink' },
  s4seven: { text: 'We fit the budget again. The longest valid group seen so far still has 3 crystals.', calculation: '7 − 3 = 4 · current length = 1 · best = 3', action: 'Finish' },
  s4finish: { text: 'Expand the window. While it is over budget, remove crystals from the left. Then record the longest valid length.', action: 'Start coding' },
} as const;
export type TutorialStep = keyof typeof tutorialSteps;
export const tutorialOrders: Record<string, TutorialStep[]> = {
  'greenhouse-maximum-crystal-energy': ['arrival','introduction','discover','collector','scan','scanned','remove','add','stage'],
  'greenhouse-reliable-power-windows': ['s2intro','s2scan','s2slide','s2finish'],
  'greenhouse-short-crystal-burst': ['s3intro','s3one','s3two','s3three','s3four','s3five','s3finish'],
  'greenhouse-keep-vines-warm': ['s4intro','s4one','s4two','s4three','s4four','s4five','s4six','s4seven','s4finish'],
};
export const tutorialPractice: Record<string, number[]> = {
  'greenhouse-short-crystal-burst': [2,3,4,1],
  'greenhouse-keep-vines-warm': [2,1,3,4],
};
export const tutorialPracticeBudget = 6;
export interface TutorialState {
  active: boolean;
  step: TutorialStep;
  busy: boolean;
  replay: boolean;
}
