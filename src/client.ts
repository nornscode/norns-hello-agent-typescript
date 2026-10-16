import { createInterface } from "node:readline/promises";
import { NornsClient } from "norns-sdk";

const client = new NornsClient({ url: process.env.NORNS_URL ?? "http://localhost:4001" });

async function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return await rl.question(question);
  } finally {
    rl.close();
  }
}

// One message, one run, and its events as they happen. The conversation key
// keeps later messages on this thread pointed at the same agent process.
const events = client.stream("hello-bot", "Hello!", {
  conversationKey: "hello-demo",
  idleTimeoutMs: 10 * 60_000, // the run sits parked while we type
});

for await (const event of events) {
  switch (event.type) {
    case "agent_started":
      console.log(`Run ${event.data.run_id} started`);
      break;

    case "waiting_for_user": {
      // The agent called ask_human. The run is parked: nothing moves until
      // we answer, and it survives a restart while parked. Answering is a
      // reply to this run, so the same stream carries on.
      const answer = await ask(`\nAgent asks: ${event.data.question}\n> `);
      await client.runs.reply(event.data.run_id, answer);
      break;
    }

    case "waiting_timer":
      console.log(`\nAgent is waiting ${event.data.seconds}s. Kill the worker now, restart it, and watch the run finish.`);
      break;

    case "tool_call":
      console.log(`→ ${event.data.name}(${JSON.stringify(event.data.arguments)})`);
      break;

    case "completed":
      console.log(`\nRun ${event.data.run_id}: completed\nOutput: ${event.data.output}`);
      break;

    case "error":
      console.error(`\nRun ${event.data.run_id} failed: ${event.data.error}`);
      break;
  }
}
