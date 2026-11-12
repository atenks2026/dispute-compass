/** Generate per-scene narration WAVs for the Dispute Compass demo video. */
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

const OUT = '/tmp/video/narr';
fs.mkdirSync(OUT, { recursive: true });

const SCENES = {
  s0: "A PayPal dispute just landed. The buyer wants two hundred forty-eight dollars, and the inquiry auto-closes in four days. If it closes, that's it. Closed disputes can never be reopened. Most people don't lose because they're wrong; they lose because they missed a window or sent the wrong evidence.",
  s1: "This is Dispute Compass, an AI case coach for PayPal disputes, built on the PayPal Disputes API. The portfolio, powered by AG Grid, sorts every case by the deadline closest to firing. Up top: active cases, deadlines inside two days, open appeal windows, and the money in play.",
  s2: "The Deadline Engine is pure rules, never AI guesses. It knows inquiries auto-close twenty days after opening, sellers get ten days to respond to a claim, and appeals live in a ten-day window after a decision. Every window shows why it exists, what happens if you miss it, and what to do now.",
  s3: "The Strength Meter scores evidence the way a reviewer reads it: tracking, proof of delivery, address match. Watch the score climb as items are verified. The Settlement Advisor turns that score into money: accept, offer around sixty percent, or fight with a twenty-four percent win chance. No bravado, just math.",
  s4: "On the language side, the AI Case Coach reads the whole case file and briefs you: what's strong, what a reviewer will question, the best opening move, and next actions in order. It's grounded in case facts and a curated policy library. It cites policy IDs, never invents them.",
  s5: "The Letter Studio drafts the appeal. It must argue new evidence. Here, the carrier confirmed the parcel was lost after the decision. Before anything is sent, the Integrity Guard flags absolute claims, and three attestations are mandatory. AI maximizes complete truth, not engineered victories.",
  s6: "Out of the box it runs in Demo Mode, no credentials needed. Plug in PayPal Sandbox keys and it reads your real cases. Add an LLM key and the coach goes fully generative. Dispute Compass: know where you stand, settle smart, escalate right.",
};

const zai = await ZAI.create();
for (const [id, text] of Object.entries(SCENES)) {
  const file = `${OUT}/${id}.wav`;
  if (fs.existsSync(file) && fs.statSync(file).size > 100000) {
    console.log(`${id}: exists, skip`);
    continue;
  }
  let ok = false;
  for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
    try {
      const res = await zai.audio.tts.create({
        input: text,
        voice: 'jam',
        speed: 1.18,
        response_format: 'wav',
        stream: false,
      });
      const buf = Buffer.from(new Uint8Array(await res.arrayBuffer()));
      if (buf.length < 50000) throw new Error(`suspiciously small (${buf.length} bytes)`);
      fs.writeFileSync(file, buf);
      console.log(`${id}: ${buf.length} bytes`);
      ok = true;
    } catch (e) {
      console.log(`${id}: attempt ${attempt} failed: ${e.message}`);
      if (attempt === 3) throw e;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
}
console.log('ALL_NARRATION_DONE');
