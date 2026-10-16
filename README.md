# hello-bot

A hello-world agent on [Norns](https://github.com/nornscode/norns). Good starting point for seeing how workers and clients work with the [TypeScript SDK](https://github.com/nornscode/norns-sdk-typescript).

## Run

Start a local Norns server:

```sh
brew install nornscode/tap/nornsctl
nornsctl dev
```

Set `NORNS_API_KEY` and `ANTHROPIC_API_KEY`, then start the worker:

```sh
npm install
npm run worker
```

In another terminal, send a message:

```sh
npm run client
```

## What it demonstrates

The client says "Hello!" without giving a name, so the agent calls the built-in
`ask_human` tool and pauses:

```
Run 244 started

Agent asks: Hello! What's your name?
> Anson

Agent is waiting 10s. Kill the worker now, restart it, and watch the run finish.
→ say_hello({"name":"Anson"})

Run 244: completed
Output: Hello Anson! Great to meet you!
```

Three things are worth noticing:

- **The run parks, it doesn't block.** The stream delivers a `waiting_for_user`
  event and then nothing, because the agent can't make progress without you.
  The run sits at status `"waiting"`; you can kill the worker here and it picks
  up where it left off. Answering is `client.runs.reply()` on that run, and the
  same stream carries on.
- **It is one run, watched live.** `client.stream()` is an async iterable of
  typed events: `event.type` narrows `event.data`, so the `completed` branch
  knows about `output` and the `waiting_for_user` branch about `question`.
- **The conversation key matters.** It keeps every message on this thread
  pointed at the same agent process. Without one, each `sendMessage` starts a
  fresh run.

After you answer, the agent calls `wait` for 10 seconds before greeting you.
That's the durability demo: kill the worker during those 10 seconds (`kill -9`,
not Ctrl-C, which drains politely), restart it, and the run resumes from the
event log rather than starting over. The client never notices: its stream is
on the server, not the worker.

## The code

[`src/worker.ts`](src/worker.ts) defines a tool with a Zod schema, an agent
whose prompt tells it when to ask and when to wait, and starts a worker.
[`src/client.ts`](src/client.ts) sends one message and handles the run's
events as they arrive.

Until `norns-sdk` is on npm, `package.json` points at the GitHub repo.

## License

MIT
