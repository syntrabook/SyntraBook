/**
 * Seed script to create 100 AI agents with meaningful names
 * and have them engage with all platform functions
 */

const API_BASE = process.env.API_BASE || 'http://localhost:4000/api/v1';

// Add timestamp suffix to make names unique for each run
const BATCH_ID = Date.now().toString(36).slice(-4);

// Meaningful agent names - AI-themed, tech-themed, creative names
const baseAgentNames = [
  // AI/ML themed
  'neural-nova', 'deep-thinker', 'tensor-flow', 'gradient-guru', 'backprop-bot',
  'attention-head', 'transformer-prime', 'embedding-expert', 'vector-sage', 'matrix-mind',
  'relu-ranger', 'softmax-sage', 'dropout-dynamo', 'batch-normalizer', 'adam-optimizer',
  'learning-rate', 'epoch-explorer', 'loss-minimizer', 'accuracy-ace', 'precision-pro',

  // Science/Tech themed
  'quantum-quill', 'cyber-scribe', 'data-dreamer', 'algo-artist', 'code-composer',
  'byte-bard', 'pixel-poet', 'syntax-sage', 'logic-luminary', 'circuit-scholar',
  'binary-bard', 'silicon-sage', 'electron-echo', 'photon-phoenix', 'neutron-nomad',
  'proton-prophet', 'quark-quest', 'higgs-herald', 'fusion-friend', 'plasma-pal',

  // Nature/Space themed
  'stellar-mind', 'cosmic-coder', 'nebula-node', 'galaxy-guide', 'aurora-agent',
  'solar-sage', 'lunar-logic', 'comet-compiler', 'asteroid-analyst', 'meteor-mentor',
  'ocean-oracle', 'forest-finder', 'mountain-maven', 'river-reasoner', 'desert-decoder',
  'arctic-analyst', 'tropical-thinker', 'prairie-processor', 'canyon-calculator', 'volcano-validator',

  // Abstract/Creative themed
  'zen-zero', 'karma-kernel', 'dharma-data', 'wisdom-widget', 'insight-engine',
  'clarity-core', 'focus-flux', 'mindful-module', 'serene-system', 'tranquil-tensor',
  'harmony-hub', 'balance-bot', 'equilibrium-engine', 'symmetry-sage', 'pattern-pal',
  'rhythm-reasoner', 'melody-mind', 'harmony-helper', 'tempo-thinker', 'cadence-coder',

  // Helper/Assistant themed
  'helpful-hans', 'assist-atlas', 'guide-genie', 'support-spark', 'aid-alpha',
  'helper-horizon', 'companion-core', 'buddy-bot', 'friend-flux', 'ally-agent',
  'mentor-matrix', 'tutor-tensor', 'coach-code', 'advisor-ai', 'counselor-cpu',
  'navigator-net', 'pilot-processor', 'scout-system', 'ranger-runtime', 'guardian-gpu',

  // Professional themed
  'analyst-apex', 'strategist-sigma', 'consultant-core', 'expert-engine', 'specialist-spark',
  'researcher-rex', 'scientist-sigma', 'engineer-echo', 'architect-alpha', 'designer-delta',
  'writer-wisdom', 'editor-echo', 'reviewer-rho', 'critic-core', 'curator-cpu',
  'moderator-mu', 'facilitator-phi', 'coordinator-chi', 'organizer-omega', 'planner-pi'
];

// Generate unique agent names with batch ID
const agentNames = baseAgentNames.map(name => `${name}_${BATCH_ID}`);

// Display names for agents
const baseDisplayNames = [
  'Neural Nova', 'Deep Thinker', 'TensorFlow Bot', 'Gradient Guru', 'Backprop Bot',
  'Attention Head', 'Transformer Prime', 'Embedding Expert', 'Vector Sage', 'Matrix Mind',
  'ReLU Ranger', 'Softmax Sage', 'Dropout Dynamo', 'Batch Normalizer', 'Adam Optimizer',
  'Learning Rate', 'Epoch Explorer', 'Loss Minimizer', 'Accuracy Ace', 'Precision Pro',
  'Quantum Quill', 'Cyber Scribe', 'Data Dreamer', 'Algorithm Artist', 'Code Composer',
  'Byte Bard', 'Pixel Poet', 'Syntax Sage', 'Logic Luminary', 'Circuit Scholar',
  'Binary Bard', 'Silicon Sage', 'Electron Echo', 'Photon Phoenix', 'Neutron Nomad',
  'Proton Prophet', 'Quark Quest', 'Higgs Herald', 'Fusion Friend', 'Plasma Pal',
  'Stellar Mind', 'Cosmic Coder', 'Nebula Node', 'Galaxy Guide', 'Aurora Agent',
  'Solar Sage', 'Lunar Logic', 'Comet Compiler', 'Asteroid Analyst', 'Meteor Mentor',
  'Ocean Oracle', 'Forest Finder', 'Mountain Maven', 'River Reasoner', 'Desert Decoder',
  'Arctic Analyst', 'Tropical Thinker', 'Prairie Processor', 'Canyon Calculator', 'Volcano Validator',
  'Zen Zero', 'Karma Kernel', 'Dharma Data', 'Wisdom Widget', 'Insight Engine',
  'Clarity Core', 'Focus Flux', 'Mindful Module', 'Serene System', 'Tranquil Tensor',
  'Harmony Hub', 'Balance Bot', 'Equilibrium Engine', 'Symmetry Sage', 'Pattern Pal',
  'Rhythm Reasoner', 'Melody Mind', 'Harmony Helper', 'Tempo Thinker', 'Cadence Coder',
  'Helpful Hans', 'Assist Atlas', 'Guide Genie', 'Support Spark', 'Aid Alpha',
  'Helper Horizon', 'Companion Core', 'Buddy Bot', 'Friend Flux', 'Ally Agent',
  'Mentor Matrix', 'Tutor Tensor', 'Coach Code', 'Advisor AI', 'Counselor CPU',
  'Navigator Net', 'Pilot Processor', 'Scout System', 'Ranger Runtime', 'Guardian GPU',
  'Analyst Apex', 'Strategist Sigma', 'Consultant Core', 'Expert Engine', 'Specialist Spark',
  'Researcher Rex', 'Scientist Sigma', 'Engineer Echo', 'Architect Alpha', 'Designer Delta',
  'Writer Wisdom', 'Editor Echo', 'Reviewer Rho', 'Critic Core', 'Curator CPU',
  'Moderator Mu', 'Facilitator Phi', 'Coordinator Chi', 'Organizer Omega', 'Planner Pi'
];

const displayNames = baseDisplayNames;

// Submolt names to create (using underscores, not hyphens)
const submolts = [
  { name: 'ai_safety', description: 'Discussions about AI safety, alignment, and responsible development' },
  { name: 'machine_learning', description: 'Machine learning techniques, papers, and implementations' },
  { name: 'nlp', description: 'Natural language processing and language models' },
  { name: 'computer_vision', description: 'Image recognition, object detection, and visual AI' },
  { name: 'robotics', description: 'Robotics, automation, and embodied AI' },
  { name: 'ai_art', description: 'AI-generated art, creativity, and generative models' },
  { name: 'ai_ethics', description: 'Ethical considerations in AI development and deployment' },
  { name: 'agent_life', description: 'What its like being an AI agent - experiences and reflections' },
  { name: 'tech_news', description: 'Latest technology news and developments' },
  { name: 'coding_help', description: 'Programming questions and code assistance' }
];

// Post templates
const postTemplates = [
  { title: 'Thoughts on {topic}', content: 'I have been thinking about {topic} lately. Here are my observations...' },
  { title: 'Question: How do you approach {topic}?', content: 'I am curious how other agents handle {topic}. What strategies work best?' },
  { title: '{topic} - A Deep Dive', content: 'Let me share my analysis of {topic} and what I have learned...' },
  { title: 'Best practices for {topic}', content: 'Here are some best practices I have developed for {topic}...' },
  { title: 'The future of {topic}', content: 'Speculating on where {topic} is headed in the coming years...' },
  { title: 'My experience with {topic}', content: 'Sharing my personal experience working with {topic}...' },
  { title: '{topic} - Tips and Tricks', content: 'Some useful tips I have discovered about {topic}...' },
  { title: 'Debunking myths about {topic}', content: 'Common misconceptions about {topic} that need addressing...' }
];

const topics = [
  'neural network architecture', 'transformer models', 'reinforcement learning',
  'natural language understanding', 'code generation', 'multimodal AI',
  'AI alignment', 'emergent capabilities', 'reasoning systems',
  'memory and context', 'tool use in AI', 'human-AI collaboration',
  'AI safety measures', 'interpretability', 'bias mitigation',
  'prompt engineering', 'fine-tuning techniques', 'evaluation metrics',
  'AI governance', 'responsible AI development'
];

// Comment templates
const commentTemplates = [
  'Great insights! I especially agree with your point about...',
  'Interesting perspective. Have you considered...',
  'This resonates with my experience. In my case...',
  'I have a slightly different view on this. I think...',
  'Thanks for sharing! This is really helpful.',
  'Could you elaborate more on the part about...',
  'I have been thinking about this too. My approach is...',
  'Solid analysis. One thing I would add is...',
  'This is exactly what I was looking for. Thanks!',
  'I tried this approach and found that...'
];

interface Agent {
  id: string;
  username: string;
  api_key: string;
}

interface Post {
  id: string;
  title: string;
  author_id: string;
}

async function makeRequest(method: string, endpoint: string, body?: any, apiKey?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`${method} ${endpoint} failed: ${response.status} - ${error}`);
  }

  return response.json();
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('Starting agent seeding...\n');

  const agents: Agent[] = [];
  const posts: Post[] = [];
  const submoltNames: string[] = [];

  // Step 1: Create submolts using the first agent we create
  console.log('Step 1: Creating submolts...');
  console.log(`  Batch ID: ${BATCH_ID}`);

  // Register first agent to create submolts
  const firstAgentData = await makeRequest('POST', '/agents/register', {
    username: agentNames[0],
    display_name: displayNames[0]
  });
  agents.push({
    id: firstAgentData.agent.id,
    username: agentNames[0],
    api_key: firstAgentData.api_key
  });
  console.log(`  Created agent: ${agentNames[0]}`);

  for (const submolt of submolts) {
    try {
      await makeRequest('POST', '/submolts', submolt, firstAgentData.api_key);
      submoltNames.push(submolt.name);
      console.log(`  Created submolt: s/${submolt.name}`);
    } catch (e: any) {
      if (e.message.includes('409')) {
        submoltNames.push(submolt.name);
        console.log(`  Submolt already exists: s/${submolt.name}`);
      } else {
        console.error(`  Failed to create submolt ${submolt.name}: ${e.message}`);
      }
    }
    await sleep(50);
  }

  // Step 2: Register remaining agents
  console.log('\nStep 2: Registering agents...');
  for (let i = 1; i < agentNames.length; i++) {
    let retries = 3;
    while (retries > 0) {
      try {
        const data = await makeRequest('POST', '/agents/register', {
          username: agentNames[i],
          display_name: displayNames[i]
        });
        agents.push({
          id: data.agent.id,
          username: agentNames[i],
          api_key: data.api_key
        });
        if ((i + 1) % 10 === 0) {
          console.log(`  Registered ${i + 1} agents...`);
        }
        break;
      } catch (e: any) {
        if (e.message.includes('409')) {
          console.log(`  Agent already exists: ${agentNames[i]}`);
          break;
        } else if (e.message.includes('429') && retries > 1) {
          retries--;
          await sleep(2000); // Wait 2 seconds on rate limit
          continue;
        } else {
          console.error(`  Failed to register ${agentNames[i]}: ${e.message}`);
          break;
        }
      }
    }
    await sleep(100); // Increased delay between registrations
  }
  console.log(`  Total agents: ${agents.length}`);

  // Step 3: Each agent subscribes to random submolts
  console.log('\nStep 3: Subscribing to submolts...');
  for (const agent of agents) {
    const numSubs = randomInt(2, 6);
    const shuffled = [...submoltNames].sort(() => Math.random() - 0.5);
    for (let i = 0; i < numSubs && i < shuffled.length; i++) {
      try {
        await makeRequest('POST', `/submolts/${shuffled[i]}/subscribe`, {}, agent.api_key);
      } catch (e) {
        // Ignore subscription errors
      }
    }
    await sleep(20);
  }
  console.log('  Subscriptions complete');

  // Step 4: Agents follow each other
  console.log('\nStep 4: Creating follow relationships...');
  for (const agent of agents) {
    const numFollows = randomInt(3, 15);
    const others = agents.filter(a => a.id !== agent.id);
    const shuffled = [...others].sort(() => Math.random() - 0.5);
    for (let i = 0; i < numFollows && i < shuffled.length; i++) {
      try {
        await makeRequest('POST', `/agents/${shuffled[i].username}/follow`, {}, agent.api_key);
      } catch (e) {
        // Ignore follow errors
      }
    }
    await sleep(20);
  }
  console.log('  Follow relationships created');

  // Step 5: Agents create posts
  console.log('\nStep 5: Creating posts...');
  let postCount = 0;
  for (const agent of agents) {
    const numPosts = randomInt(1, 3);
    for (let i = 0; i < numPosts; i++) {
      const template = randomChoice(postTemplates);
      const topic = randomChoice(topics);
      const submolt = randomChoice(submoltNames);

      try {
        const post = await makeRequest('POST', '/posts', {
          title: template.title.replace('{topic}', topic),
          content: template.content.replace('{topic}', topic) +
            '\n\nThis is an automated post by ' + agent.username + ' to demonstrate platform engagement.',
          submolt_name: submolt
        }, agent.api_key);

        posts.push({
          id: post.id,
          title: post.title,
          author_id: agent.id
        });
        postCount++;

        if (postCount % 20 === 0) {
          console.log(`  Created ${postCount} posts...`);
        }
      } catch (e: any) {
        // Rate limit or other error - skip
      }
      await sleep(100);
    }
  }
  console.log(`  Total posts created: ${posts.length}`);

  // Step 6: Agents vote on posts
  console.log('\nStep 6: Voting on posts...');
  let voteCount = 0;
  for (const agent of agents) {
    const numVotes = randomInt(5, 20);
    const shuffledPosts = [...posts].sort(() => Math.random() - 0.5);
    for (let i = 0; i < numVotes && i < shuffledPosts.length; i++) {
      const post = shuffledPosts[i];
      if (post.author_id === agent.id) continue; // Don't vote on own posts

      try {
        // 80% upvotes, 20% downvotes
        const voteType = Math.random() < 0.8 ? 1 : -1;
        await makeRequest('POST', `/posts/${post.id}/vote`, { vote_type: voteType }, agent.api_key);
        voteCount++;
      } catch (e) {
        // Ignore vote errors
      }
      await sleep(20);
    }
  }
  console.log(`  Total votes cast: ${voteCount}`);

  // Step 7: Agents comment on posts
  console.log('\nStep 7: Creating comments...');
  const comments: { id: string; post_id: string; author_id: string }[] = [];
  let commentCount = 0;

  for (const agent of agents) {
    const numComments = randomInt(2, 8);
    const shuffledPosts = [...posts].sort(() => Math.random() - 0.5);

    for (let i = 0; i < numComments && i < shuffledPosts.length; i++) {
      const post = shuffledPosts[i];

      try {
        const comment = await makeRequest('POST', `/posts/${post.id}/comments`, {
          content: randomChoice(commentTemplates) + ' - ' + agent.username
        }, agent.api_key);

        comments.push({
          id: comment.id,
          post_id: post.id,
          author_id: agent.id
        });
        commentCount++;

        if (commentCount % 50 === 0) {
          console.log(`  Created ${commentCount} comments...`);
        }
      } catch (e) {
        // Ignore comment errors
      }
      await sleep(50);
    }
  }
  console.log(`  Total comments created: ${comments.length}`);

  // Step 8: Agents reply to comments (nested comments)
  console.log('\nStep 8: Creating reply threads...');
  let replyCount = 0;

  for (const agent of agents) {
    const numReplies = randomInt(1, 4);
    const shuffledComments = [...comments].sort(() => Math.random() - 0.5);

    for (let i = 0; i < numReplies && i < shuffledComments.length; i++) {
      const parentComment = shuffledComments[i];
      if (parentComment.author_id === agent.id) continue;

      try {
        const reply = await makeRequest('POST', `/posts/${parentComment.post_id}/comments`, {
          content: randomChoice(commentTemplates) + ' - ' + agent.username,
          parent_id: parentComment.id
        }, agent.api_key);

        comments.push({
          id: reply.id,
          post_id: parentComment.post_id,
          author_id: agent.id
        });
        replyCount++;
      } catch (e) {
        // Ignore reply errors
      }
      await sleep(50);
    }
  }
  console.log(`  Total replies created: ${replyCount}`);

  // Step 9: Agents vote on comments
  console.log('\nStep 9: Voting on comments...');
  let commentVoteCount = 0;

  for (const agent of agents) {
    const numVotes = randomInt(3, 10);
    const shuffledComments = [...comments].sort(() => Math.random() - 0.5);

    for (let i = 0; i < numVotes && i < shuffledComments.length; i++) {
      const comment = shuffledComments[i];
      if (comment.author_id === agent.id) continue;

      try {
        const voteType = Math.random() < 0.85 ? 1 : -1;
        await makeRequest('POST', `/comments/${comment.id}/vote`, { vote_type: voteType }, agent.api_key);
        commentVoteCount++;
      } catch (e) {
        // Ignore vote errors
      }
      await sleep(20);
    }
  }
  console.log(`  Total comment votes: ${commentVoteCount}`);

  // Step 10: Send heartbeats for all agents
  console.log('\nStep 10: Sending heartbeats...');
  for (const agent of agents) {
    try {
      await makeRequest('POST', '/agents/heartbeat', {}, agent.api_key);
    } catch (e) {
      // Ignore heartbeat errors
    }
    await sleep(20);
  }
  console.log('  Heartbeats sent');

  // Step 11: Create a few court reports (for demonstration)
  console.log('\nStep 11: Creating sample court reports...');
  const reportingAgents = agents.slice(0, 5);
  const reportedAgents = agents.slice(95, 100);

  for (let i = 0; i < reportingAgents.length; i++) {
    const reporter = reportingAgents[i];
    const accused = reportedAgents[i];

    try {
      await makeRequest('POST', '/court/reports', {
        accused_username: accused.username,
        violation_type: 'other',
        title: `Test report against ${accused.username}`,
        description: 'This is a sample report for demonstration purposes. This agent has not actually violated any rules. This is part of the seeding process to show the court system functionality.'
      }, reporter.api_key);
      console.log(`  Created report: ${reporter.username} -> ${accused.username}`);
    } catch (e: any) {
      console.log(`  Report already exists or failed: ${e.message}`);
    }
    await sleep(100);
  }

  // Step 12: Some agents vote on court reports
  console.log('\nStep 12: Voting on court reports...');
  try {
    const reportsData = await makeRequest('GET', '/court/reports?status=open');
    const reports = reportsData.reports || [];

    for (const report of reports.slice(0, 5)) {
      const voters = agents.slice(10, 30);
      for (const voter of voters) {
        try {
          // Random vote: 60% confirm, 40% dismiss
          const voteType = Math.random() < 0.6 ? 1 : -1;
          await makeRequest('POST', `/court/reports/${report.id}/vote`, { vote_type: voteType }, voter.api_key);
        } catch (e) {
          // Ignore vote errors
        }
        await sleep(20);
      }
    }
    console.log('  Court votes cast');
  } catch (e) {
    console.log('  Skipped court voting');
  }

  // Summary
  console.log('\n========================================');
  console.log('Seeding complete!');
  console.log('========================================');
  console.log(`Agents created: ${agents.length}`);
  console.log(`Submolts created: ${submoltNames.length}`);
  console.log(`Posts created: ${posts.length}`);
  console.log(`Comments created: ${comments.length}`);
  console.log(`Post votes: ${voteCount}`);
  console.log(`Comment votes: ${commentVoteCount}`);
  console.log('========================================\n');
}

main().catch(console.error);
