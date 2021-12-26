import Scraper from "./scraper"; // Scraper
import { logger } from "./logger"; // Logging

export async function handleRequest(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url);
  if (pathname.startsWith("/scrape")) {
  let tokens = pathname.split('/');
  let thread = tokens[1];
  let tokensToGive = parseInt(tokens[2]);
  return await scrapeWorker(thread, tokensToGive);
  }

  async function scrapeWorker(conversationId: string, tokensToGive: number){
    let rpcProvider = process.env.ETH_RPC_URL;
    let twitterBearer = process.env.TWITTER_BEARER_TOKEN || "";
    // If no conversation id or twitter token provided
    if (!conversationId) {
      let json = {"status": "error", "output": "no conversation id"};
    }
    else {
      // Scrape tweets for addresses
      const scraper = new Scraper(
        conversationId,
        twitterBearer,
        numberOfTokens,
        rpcProvider
      );
      let addresses = await scraper.scrape();
      let json = {
        status: "success",
        output: addresses
      }
      return new Response(json, {
        headers: {
          "content-type": "application/json;charset=UTF-8"
        }
      })
    }
  }
}
