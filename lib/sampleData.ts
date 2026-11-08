import { parseCSV } from "@/lib/csv";
import { loadLibrary } from "@/lib/library";
import type { LibraryItem } from "@/lib/types";

export interface DemoScript {
  id: string;
  name: string;
  raw: string;
}

export const DEMO_SCRIPTS: readonly DemoScript[] = [
  {
    id: "winner-01-laundry",
    name: "Winner 01 — Laundry (pain)",
    raw: `HOOK: Your washing machine has been eating your socks for years.
FIRST LINES: Two go in, one comes out. Somewhere in there is a sock graveyard, and it keeps growing.
ON-SCREEN: The washer eats socks. Not these.
BODY: SockLock socks have a tiny magnet in each cuff. Before the wash, you click the pair together. They tumble through the washer and the dryer as one, and they come out as one. No more drawer full of singles. No more buying a new pack because one sock vanished. They look and feel like your favorite everyday socks, they just refuse to break up.
CTA: Start with 5 pairs for $29. A new drop shows up every quarter.`,
  },
  {
    id: "winner-02-morning",
    name: "Winner 02 — Morning (humor)",
    raw: `HOOK: It's 7:42 a.m. and I'm interrogating my sock drawer again.
FIRST LINES: Where's the other one? Nobody knows. Not the drawer, not the dryer, definitely not me.
ON-SCREEN: Me vs. the sock drawer, every morning
BODY: Then I switched to SockLock. Each pair has a tiny magnet on the cuffs, so they go into the wash together and come out together. Now my mornings go like this: open drawer, grab pair, leave. That's it. No search party, no mismatched socks peeking out of my jeans, no being late because a sock ran away from home.
CTA: Get 5 pairs for $29, then a fresh drop every quarter. Your mornings will thank you.`,
  },
  {
    id: "winner-03-gift",
    name: "Winner 03 — Gift",
    raw: `HOOK: Most socks you gift end up in a drawer. These end up on feet.
FIRST LINES: Socks are the gift everyone jokes about. Until the pair never gets split up and they actually wear them.
ON-SCREEN: The sock gift they actually wear
BODY: SockLock socks click together with a tiny magnet on the cuffs. They survive the washer and the dryer as a pair, so your gift doesn't fall apart after the first laundry day. And it's a subscription, so a new drop lands every quarter. It's the gift that keeps showing up, and you don't have to remember a thing.
CTA: Gift 5 pairs for $29. New drop every quarter.`,
  },
];

export const SAMPLE_BRAND_GUIDE = `# SockLock brand guide

## Product
- Magnetic socks: a tiny magnet in each cuff keeps the pair together.
- Click the pair together before the wash, and it comes out of the washer and the dryer as a pair.
- Look and feel like regular everyday socks.

## Offer
- Subscription: 5 pairs for $29.
- Then a new drop every quarter.
- No other discounts, bundles or prices exist. Do not invent them.

## Tone
- Friendly, a little ironic, never pompous.
- We tease the washing machine, the dryer and the sock drawer. Never the viewer.
- Concrete and visual: the click, the pair tumbling together, the drawer with no singles.
- Short sentences. Everyday words. One idea per line.

## Don'ts
- No health, comfort or medical claims (no "cures cold feet", no "orthopedic", no "better circulation").
- No guarantees ("guaranteed", "100%", "forever").
- No invented numbers, reviews, ratings or customer counts.
- No fake scarcity or countdowns ("only 3 left", "last 24 hours").
- No personal attributes: don't call the viewer messy, lazy, disorganized or old.
- No before/after framing.

## We sound like
1. "Two socks go in. Two socks come out. Revolutionary, we know."
2. "Your dryer has been stealing socks. We're ending its career."
3. "Click. Wash. Still a pair."
4. "Socks with commitment issues? Not these."
5. "Open drawer, grab pair, leave."

## We don't sound like
1. "Experience the ultimate revolution in premium hosiery technology."
2. "Are you tired of being so disorganized?"
3. "Guaranteed to never lose a sock again, 100%!"
4. "Only 3 pairs left — order in the next hour!"
5. "Doctors recommend SockLock for healthier feet."
`;

export const SAMPLE_TESTED_HOOKS_CSV = `hook,angle,result
Your washing machine is eating your socks.,pain,ROMI 138%
Your dryer is a sock thief.,pain,winner
Where do all the missing socks go?,curiosity,winner
I stopped buying new socks.,contrarian,ROMI 121%
Every morning I play hide and seek with my socks.,humor,ROMI 156%
The gift they'll actually wear.,identity,winner
Two socks go in. One comes out. Why?,curiosity,ROMI 112%
My sock drawer is a single socks support group.,humor,winner
Socks that refuse to break up.,humor,ROMI 133%
Click. Wash. Still a pair.,demo,winner
Watch these socks come out of the dryer together.,demo,ROMI 149%
I haven't lost a sock in 6 months.,specific_number,ROMI 127%
5 pairs. Zero lost socks.,specific_number,ROMI 118%
Stop buying socks to replace one missing sock.,pain,ROMI 104%
"Laundry day, minus the sock hunt.",pain,loser
People keep asking why my socks match.,social_proof,ROMI 96%
My roommate asked where I got these socks.,social_proof,loser
Matching socks is a waste of your Sunday.,contrarian,ROMI 99%
Don't buy more socks. Buy smarter ones.,contrarian,ROMI 115%
For people who hate folding laundry.,identity,ROMI 91%
The socks for people who are always running late.,identity,loser
What if socks couldn't get lost?,curiosity,ROMI 108%
The 2-second habit that saves every pair.,specific_number,ROMI 124%
Gifting socks sounds boring. Not these.,identity,ROMI 131%
"Tiny magnet, huge relief.",demo,ROMI 102%
Not all socks are lost. Some are magnetic.,contrarian,loser
New drop every quarter. Your drawer will never be boring.,urgency_soft,loser
Get yours before the next drop.,urgency_soft,loser
It's 7 a.m. and the other sock is gone again.,humor,ROMI 144%
The washer always wins. Until now.,pain,ROMI 119%
`;

export const SAMPLE_LIBRARY: readonly LibraryItem[] = loadLibrary(parseCSV(SAMPLE_TESTED_HOOKS_CSV).rows);
