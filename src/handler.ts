import Scraper from "./scraper"; // Scraper

export async function handleRequest(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url);
  if (pathname.startsWith("/scrape")) {
    let tokens = pathname.split('/');
    let thread = tokens[2];
    let tokensToGive = parseInt(tokens[3]);
    console.log("Thread: ", thread);
    console.log("Tokens to give: ", tokensToGive);
    console.log("rpc url: ", ETH_RPC_URL);
    console.log("twitter api token: ", TWITTER_BEARER_TOKEN);
    return await scrapeWorker(thread, tokensToGive);
  }
  return new Response("", {
      headers: {
        "content-type": "text/html;charset=UTF-8"
      },
      status: 404
    })
}

  async function scrapeWorker(conversationId: string, tokensToGive: number): Promise<Response>{
    let rpcProvider = ETH_RPC_URL || "";
    let twitterBearer = TWITTER_BEARER_TOKEN || "";
    // If no conversation id or twitter token provided
    let json;
    if (!conversationId) {
      json = {"status": "error", "output": "no conversation id"};
    }
    else {
      // Scrape tweets for addresses
      const scraper = new Scraper(
        conversationId,
        twitterBearer,
        tokensToGive,
        rpcProvider
      );
      let addresses = await scraper.scrape();
      json = {
        status: "success",
        output: addresses
      }
    }
    json = JSON.stringify(json, null, 2);
    return new Response(json, {
      headers: {
        "content-type": "application/json;charset=UTF-8"
      }
    })
  }
