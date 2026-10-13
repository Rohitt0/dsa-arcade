export const binarySearchStage = {
  id: 'binary-search-find-the-signal',
  title: 'Find the Signal',
  challengeSlug: 'find-the-signal',
  rewardXp: 100,
  leetcode: {
    title: 'Binary Search',
    url: 'https://leetcode.com/problems/binary-search/',
    relationship: 'adapted' as const,
  },
  example: {
    readings: [3, 8, 12, 17, 23, 31, 42, 56, 70],
    target: 31,
    answer: 5,
  },
  visibleExamples: [
    { readings: [3, 8, 12, 17, 23, 31, 42, 56, 70], target: 31, answer: 5 },
    { readings: [2, 6, 11, 19, 28], target: 13, answer: -1 },
    { readings: [7], target: 7, answer: 0 },
  ],
  practice: {
    readings: [4, 9, 15, 22, 30, 41, 57],
    foundTarget: 41,
    foundIndex: 5,
    missingTarget: 16,
  },
  starterCode: `#include <bits/stdc++.h>
using namespace std;

class Solution {
public:
    int findSignal(vector<int>& readings, int target) {
        // Locate the target using binary search.
        return -1;
    }
};`,
} as const;
