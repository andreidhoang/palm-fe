import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({ 
  id: "perplexity-clone",
  eventKey: process.env.INNGEST_EVENT_KEY,
  // In development without an event key, Inngest will use the dev server automatically
});
