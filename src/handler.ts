import Scraper from "../tweetdrop/src/scraper"; // Scraper
import { logger } from "./tweetdrop/src/logger"; // Logging

export async function handleRequest(request: Request): Promise<Response> {
  return new Response(`request method: ${request.method}`)
}

async function scrapeWorker(conversationId, twitterBearer, numTokens, rpcProvider){
  // If no conversation id or twitter token provided
  if (!conversationID || !twitterBearer) {
    // Throw error and exit
    logger.error("Missing required parameters, update .env");
    process.exit(1);
  }

  // Scrape tweets for addresses
  const scraper = new Scraper(
    conversationID,
    twitterBearer,
    numTokens,
    rpcProvider
  );
  await scraper.scrape();
}
