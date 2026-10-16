import { NornsWorker, defineAgent, tool } from "norns-sdk";
import { z } from "zod";

// A tool: the schema is what the model sees, and `name` arrives typed.
const sayHello = tool({
  name: "say_hello",
  description: "Greet someone by name.",
  input: z.object({ name: z.string() }),
  execute: ({ name }) => `Hello ${name}`,
});

// A side-effecting tool would look like this. Norns gives every dispatch of
// one call the same idempotency key, and the SDK answers a repeat from the
// result it kept, so the email goes out once.
//
// const sendEmail = tool({
//   name: "send_email",
//   description: "Send an email to a customer.",
//   input: z.object({ to: z.string().email(), subject: z.string(), body: z.string() }),
//   sideEffect: true,
//   execute: async ({ to, subject, body }) => {
//     await smtp.send({ to, subject, body });
//     return `Email sent to ${to}`;
//   },
// });

const helloBot = defineAgent({
  name: "hello-bot",
  model: "claude-sonnet-5",
  systemPrompt: [
    "You are a greeter.",
    "If you don't know the person's name, call the ask_human tool to ask for it",
    "and wait for their answer. Don't guess a name.",
    "Once you know the name, call the wait tool for 10 seconds, then call the",
    "say_hello tool with that name.",
  ].join("\n"),
  tools: [sayHello],
  mode: "conversation",
});

// Connects, registers hello-bot, and serves it. Reads NORNS_API_KEY and
// ANTHROPIC_API_KEY from the environment. Ctrl-C drains and exits.
const worker = new NornsWorker({
  url: process.env.NORNS_URL ?? "http://localhost:4001",
  agents: [helloBot],
});

await worker.start();
