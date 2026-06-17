/**
 * index.js - AI YouTube Video Generator (Node.js)
 */
const fs = require('fs');
const path = require('path');
const { parseScript } = require('./scriptParser');
const { generateAllVoiceovers, downloadMusic } = require('./audioEngine');
const { fetchAllMedia } = require('./mediaFetcher');
const { computeClipDurations, assembleVideo } = require('./videoAssembler');

/**
 * Ensures a clean slate for a new run
 */
function cleanupTempFiles() {
  const audioDir = path.join(__dirname, 'temp', 'audio');
  if (fs.existsSync(audioDir)) {
    console.log("🧹 Cleaning up old audio segments...");
    const files = fs.readdirSync(audioDir);
    for (const file of files) {
      if (file.endsWith('.mp3')) {
        fs.unlinkSync(path.join(audioDir, file));
      }
    }
  }
}

const SAMPLE_SCRIPT = `
Title: “The Power of Not Giving Up”

Good morning everyone,

Today I want to talk about something simple, but incredibly powerful… the decision to keep going.

Not talent.
Not luck.
Not perfect timing.

Just the decision to keep going when things get hard.

Because the truth is, everyone loves success… but very few people are willing to go through the struggle that comes before it.

Every successful person you admire—every athlete, entrepreneur, artist, or leader—has faced moments when quitting would have been easier.

Moments of doubt.

Moments of failure.

Moments when nothing seemed to work.

But what separated them from everyone else was one simple thing:

They didn’t quit.

Let me tell you something important.

Failure is not the opposite of success.

Failure is part of success.

Think about a child learning to walk.

They fall… again and again and again.

But do they say:

“Maybe walking isn’t for me.”

Of course not.

They stand up again.

And again.

And again.

Until one day… they walk.

Somewhere along the way, we grow up and start believing that failure means we should stop.

But the most successful people in the world failed more times than most people even tried.

Imagine a bamboo tree.

When you plant a bamboo seed, something strange happens.

For the first year… nothing grows.

The second year… nothing.

Third year… still nothing.

Fourth year… still nothing visible.

Most people would give up and say the seed is useless.

But then in the fifth year, something incredible happens.

The bamboo suddenly grows up to 80 feet in just a few weeks.

Now the question is…

Did the bamboo grow in a few weeks?

Or did it grow for five years underground, building strong roots?

The same thing happens in life.

Sometimes you feel like nothing is happening.

You work hard.

You study.

You try.

You fail.

You try again.

And it feels like you're not moving forward.

But what you don't see are the roots you’re building.

Skills.

Strength.

Patience.

Experience.

One day, those roots will support incredible growth.

Let me ask you something.

How many dreams have people given up on… simply because progress was slow?

Someone quits the gym after two weeks.

Someone stops learning a skill after a month.

Someone abandons a business after the first setback.

But success doesn't reward speed.

It rewards consistency.

Small progress.

Every single day.

Even when motivation disappears.

Because motivation is unreliable.

Some days you'll feel unstoppable.

Some days you won't feel like doing anything.

And that’s normal.

The difference between average people and extraordinary people is simple:

Average people act when they feel motivated.

Successful people act even when they don’t feel like it.

They rely on discipline, not emotion.

They understand that success is built in boring moments.

Early mornings.

Late nights.

Practice.

Repetition.

Showing up again and again when nobody is watching.

Another truth most people don’t like hearing is this:

Comfort is the enemy of growth.

Everything you want in life exists outside your comfort zone.

Confidence?

Outside the comfort zone.

Success?

Outside the comfort zone.

Your best version?

Outside the comfort zone.

Growth only happens when things feel difficult.

That discomfort is not a sign you're failing.

It's a sign you're expanding.

Think about a butterfly.

Before it becomes beautiful and free, it struggles inside a cocoon.

If someone tries to help it by breaking the cocoon open, the butterfly actually becomes weaker and may never fly.

Why?

Because the struggle is what strengthens its wings.

Your struggles are doing the same thing.

They are preparing you for something greater.

Now imagine your life five years from today.

Two versions exist.

In the first version…

You gave up on your goals.

You chose comfort.

You avoided risks.

Five years pass quickly.

And you’re in the same place… wondering what could have been.

But there’s another version.

In this version…

You kept going.

You learned.

You failed.

You improved.

You stayed consistent.

And five years later, your life looks completely different.

The difference between those two lives is not luck.

It's daily decisions.

Success is rarely about giant breakthroughs.

It’s about small habits repeated over time.

Reading 10 pages a day.

Practicing a skill for one hour.

Saving a little money.

Learning something new.

These small actions compound like interest.

And one day, the results seem “sudden.”

But they were actually built over years.

So if you’re struggling right now…

If things feel slow…

If you feel like giving up…

Remember this:

You might just be in the root-building phase.

The part where most people quit.

The part where champions are made.

The part where discipline is stronger than motivation.

Your dream doesn’t require perfection.

It requires persistence.

Keep learning.

Keep improving.

Keep showing up.

Because the only guaranteed way to fail…

Is to quit.

One day, people will look at your success and say:

“Wow, you’re so lucky.”

But they won’t see the early mornings.

The doubts.

The failures.

The years when nobody believed in you.

But you’ll know.

You’ll know it wasn’t luck.

It was persistence.

So today I leave you with one simple challenge.

Whatever your goal is…

Don’t quit.

Not today.

Not this week.

Not this year.

Keep moving forward.

Even if the steps are small.

Even if progress feels slow.

Because one day you will look back and realize…

Those small steps built something incredible.

Thank you.

And remember:

Your future is created by what you do today.

Not tomorrow.

Not someday.
`.trim();

async function main() {
  console.log("========================================");
  console.log("  🎬 AI YouTube Video Generator (JS)");
  console.log("========================================\n");

  const t0 = Date.now();
  
  // 0. Pre-run Cleanup
  cleanupTempFiles();

  // 1. Script Parsing
  const scriptPath = path.join(__dirname, 'user_script.txt');
  if (!fs.existsSync(scriptPath)) {
    console.error(`❌ Error: Script file not found at ${scriptPath}`);
    process.exit(1);
  }
  const scriptText = fs.readFileSync(scriptPath, 'utf-8');
  const segments = parseScript(scriptText);
  console.log(`📜 Script parsed: ${segments.length} segments.`);

  // 2. Voiceover Generation
  await generateAllVoiceovers(segments);

  // 3. Media Fetching
  await fetchAllMedia(segments);

  // 4. Duration Calculation
  computeClipDurations(segments);

  // 5. Background Music
  const bgMusic = await downloadMusic();
  if (!bgMusic) {
    console.log("⚠️  Warning: No background music found, proceeding without it.");
  }

  // 6. Video Assembly
  const outputPath = await assembleVideo(segments, bgMusic);

  const elapsed = (Date.now() - t0) / 1000 / 60;
  console.log(`\n🏁 Done in ${elapsed.toFixed(1)} minutes.`);
  console.log(`   Output: ${outputPath}`);
}

if (require.main === module) {
  main().catch(err => {
    console.error("❌ Fatal Error:", err);
    process.exit(1);
  });
}

module.exports = { main };
