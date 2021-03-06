import * as fs from "fs"; // Filesystem
import { providers } from "ethers"; // RPC for ENS names

// Regex matches for addresses and ENS names
const addressRegex: RegExp = /(0x[a-zA-Z0-9])\w+/;
const ENSRegex: RegExp = /([a-zA-Z0-9]\w+.(eth|ETH))/;


export default class Scraper {
  // Optional RPC to resolve ENS names to addresses
  rpc: providers.StaticJsonRpcProvider;
  // Tweet conversation ID
  conversationID: string;
  // Twitter token
  twitterBearer: string;
  // Number of tokens to distribute per address
  numTokens: number;

  // Provider endpoint
  rpcProvider: string;

  // Collected tweets from Twitter API
  tweets: { id: string; text: string }[] = [];
  // Cleaned addresses from tweets
  addresses: string[] = [];

  /**
   * Setup scraper
   * @param {string} conversationID to scrape
   * @param {string} twitterBearer 2.0 token
   * @param {number} numTokens to distribute per address
   * @param {string?} rpcProvider optional rpc endpoint to convert ENS names
   */
  constructor(
    conversationID: string,
    twitterBearer: string,
    numTokens: number,
    rpcProvider: string
  ) {
    this.conversationID = conversationID;
    this.twitterBearer = twitterBearer;
    this.numTokens = numTokens;
    this.rpcProvider = rpcProvider;

    this.rpc = new providers.StaticJsonRpcProvider({
    url: rpcProvider,
    skipFetchSetup: true
    });

    let block = this.rpc.getBlockNumber();
  }

  async setupRpcEndpoint(): Promise<void>{

  }
  /**
   * Generates endpoint to query for tweets from a thread
   * @param {string?} nextToken if paginating tweets
   * @returns {string} endpoint url
   */
  generateEndpoint(nextToken?: string): string {
    const baseEndpoint: string =
      "https://api.twitter.com/2/tweets/search/recent?query=conversation_id:" +
      // Append conversation ID
      this.conversationID +
      // Collect max allowed results
      "&max_results=100";

    // If paginating, append next_token to endpoint
    return nextToken ? `${baseEndpoint}&next_token=${nextToken}` : baseEndpoint;
  }
  /**
   * Recursively collect tweets from a thread (max. 100 per run)
   * @param {string?} nextSearchToken optional pagination token
   */
  async collectTweets(nextSearchToken?: string): Promise<void> {
    // Collect tweets
    const response = await fetch (this.generateEndpoint(nextSearchToken), {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${this.twitterBearer}`
      }
    });
    let responseJson: any = await response.json();
    // Append new tweets
    const tweets: Record<string, string>[] = responseJson.data;
    this.tweets.push(...responseJson.data);
    console.log(`Collected ${tweets.length} tweets`);
    const nextToken: string | undefined = responseJson.meta.next_token;
    // If pagination token exists:
    if (nextToken) {
      // Collect next page of tweets
      await this.collectTweets(nextToken);
    }
  }

  /**
   * Cleans individual tweets, filtering for addresses
   */
  cleanTweetsForAddresses(): void {
    for (const tweet of this.tweets) {
      // Remove line-breaks, etc.
      const cleanedText: string = tweet.text.replace(/(\r\n|\n|\r)/gm, "");

      const foundAddress: RegExpMatchArray | null =
        cleanedText.match(addressRegex);
      const foundENS: RegExpMatchArray | null = cleanedText.match(ENSRegex);

      for (const foundArrs of [foundAddress, foundENS]) {
        // If match in tweet
        if (foundArrs && foundArrs.length > 0) {
          // If type(address)
          const addr: string = foundArrs[0].startsWith("0x")
            ? // Quick cleaning to only grab first 42 characters
              foundArrs[0].substring(0, 42)
            : foundArrs[0];

          // Push address or ENS name
          this.addresses.push(addr);
        }
      }
    }
  }

  /**
   * Convert ENS names to addresses
   */
  async convertENS(): Promise<void> {
    let convertedAddresses: string[] = [];

    for (let i = 0; i < this.addresses.length; i++) {
      // Force lowercase (to avoid .ETH, .eth, .eTh matching)
      const address: string = this.addresses[i].toLowerCase();

      if (address.includes(".eth")) {
        // Resolve name via RPC
        const parsed: string | null = await this.rpc.resolveName(address);
        console.log(`${address} --> ${parsed}`);
        if (parsed) {
          console.log("parsed: ", parsed);
          convertedAddresses.push(parsed);
        }
      } else {
        // Else, push just address
        convertedAddresses.push(address);
      }
    }
    this.addresses = convertedAddresses;
  }

  /**
   * Outputs batched, copyable addresses to /output directory
   * Effects: Modifies filesystem, adds output directory and text files
   */
  async outputAddresses(): Promise<string[]> {
    let formated_string: string[] = [];
    // Create /output folder if it doesnt exist
    for (let i = 0; i < this.addresses.length; i++) {
        if (isNaN(this.numTokens)) {
          formated_string[i] = `${this.addresses[i]}`;
        }
        else {
          formated_string[i] = `${this.addresses[i]}, ${this.numTokens}`;
        }
    }
    return formated_string;
  }

  /**
   * Scrape tweets, find addresses, output batch copyable disperse files
   */
  async scrape():Promise<string[]> {

    await this.setupRpcEndpoint();

    await this.collectTweets();
    console.log(`Collected ${this.tweets.length} total tweets`);

    // Clean tweets, finding addresses and ENS names
    await this.cleanTweetsForAddresses();
    console.log(`Collected ${this.addresses.length} addresses from tweets`);

    // If RPC provided
      // Resolve ENS names to addresses
    await this.convertENS();
    console.log("Converted ENS names to addresses");
    return await this.outputAddresses();
  }
}
