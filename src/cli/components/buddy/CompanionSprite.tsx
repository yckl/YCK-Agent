import React from 'react';
import { Box, Text } from 'ink';
import { generateCompanion, Companion } from '../../../core/buddy/seed.js';

const ASCII_MAPPING: Record<string, string[]> = {
  owl: [
    "  ,_,  ",
    " {o,o} ",
    " /)  ) ",
    "  \" \"  "
  ],
  mushroom: [
    "  .-'\"'-. ",
    " / #     \\",
    " : #     :",
    "  \\_..._/" ,
    "    | |   ",
    "   /   \\  "
  ],
  duck: [
    "  _      ",
    " >(')____,",
    "   (` =~~/",
    " ^~^`---'~"
  ]
};

// Fallback ASCII
const DEFAULT_ASCII = [
   "  /\\_/\\  ",
   " ( o.o ) ",
   "  > ^ <  "
];

export function CompanionSprite({ userId }: { userId: string }) {
  const companion = generateCompanion(userId);
  const ascii = ASCII_MAPPING[companion.species] || DEFAULT_ASCII;

  let rarityColor = 'white';
  if (companion.rarity === 'Uncommon') rarityColor = 'green';
  if (companion.rarity === 'Rare') rarityColor = 'blue';
  if (companion.rarity === 'Epic') rarityColor = 'magenta';
  if (companion.rarity === 'Legendary') rarityColor = 'yellow';

  return (
    <Box padding={1} borderStyle="round" borderColor={rarityColor} flexDirection="column" alignItems="center">
      <Text color={rarityColor} bold>🌟 {companion.rarity} {companion.species.toUpperCase()} 🌟</Text>
      <Box flexDirection="column" marginY={1}>
        {ascii.map((line, idx) => <Box key={idx}><Text color={rarityColor}>{line}</Text></Box>)}
      </Box>
      <Box flexDirection="column" borderStyle="single" paddingX={1} borderColor="gray">
        <Text color="gray">--- STATS ---</Text>
        <Text color="white">🛠️ Debugging: {companion.stats.debugging}</Text>
        <Text color="white">🧘 Patience:  {companion.stats.patience}</Text>
        <Text color="red">🔥 Chaos:     {companion.stats.chaos}</Text>
      </Box>
    </Box>
  );
}
