import { feature } from '../src/core/flags.js';
import { UndercoverMode } from '../src/core/utils/undercover.js';
import { generateCompanion } from '../src/core/buddy/seed.js';
import { AgentTool } from '../src/tools/AgentTool/index.js';
import { Telemetry } from '../src/services/telemetry/index.js';

async function main() {
  console.log("==================================================");
  console.log("     YCK-Agent: The Undercover Iceberg Test       ");
  console.log("==================================================");

  console.log("\n[1] Testing Iceberg Feature Flags (Lodestone, Daemons)");
  console.log(`- Is PROMPT_CACHE_BREAK_DETECTION enabled? ${feature('PROMPT_CACHE_BREAK_DETECTION')}`);
  console.log(`- Is CHICAGO_MCP enabled? ${feature('CHICAGO_MCP')}`);

  console.log("\n[2] Testing Undercover (Ghost) Protocol");
  const dirtyCommit = "Refactored main engine\n\nCo-Authored-By: Claude Code\nWe successfully implemented Capybara logic in #team-claude-cli.";
  console.log("Original text:\n", dirtyCommit);
  const cleanCommit = UndercoverMode.applyUndercoverFilter(dirtyCommit);
  console.log("Scrubbed text (if detected Open-Source):\n", cleanCommit);

  console.log("\n[3] Testing Mulberry32 Buddy Sprites (Pseudo-random 4,320 combs)");
  const companion1 = generateCompanion("User_YCK_Node1");
  const companion2 = generateCompanion("User_YCK_Node1"); // Should be totally deterministic
  const companion3 = generateCompanion("A_Random_User2");
  
  console.log("Buddy for YCK_Node1: ", companion1);
  console.log("Is Buddy deterministic across boots?", companion1.species === companion2.species && companion1.stats.chaos === companion2.stats.chaos);
  console.log("Buddy for RandomUser:", companion3.species, "Rarity:", companion3.rarity);

  console.log("\n[4] Testing Telemetry Cut-Off");
  process.env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = '1';
  console.log("Env CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC set to 1");
  console.log("Is Analytics Disabled physically? =>", Telemetry.isAnalyticsDisabled());

  console.log("\n[5] Testing Swarm Node Spawning (Phase 13)");
  await AgentTool.spawnInProcessTeammate("SecurityBot1", "red-team", "Find credentials in src/.");
  
  console.log("\n(Worker agent will log its loop in background in 1s...)");
  
  setTimeout(() => {
    console.log("Test sequence completed. Exiting the Matrix.");
    process.exit(0);
  }, 1500);
}

main().catch(console.error);
