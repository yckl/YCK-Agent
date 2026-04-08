import React from 'react';
import { render } from 'ink';
import { CompanionSprite } from '../src/cli/components/buddy/CompanionSprite.js';

// If a name is passed via command line args, use it. Otherwise use a default user id.
const username = process.argv[2] || "User_YCK_Node1";

render(<CompanionSprite userId={username} />);
