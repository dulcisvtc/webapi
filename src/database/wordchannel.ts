import { Wordchannel, WordchannelDocument } from "./models/Wordchannel";

let cachedWordchannelDocument: WordchannelDocument | null = null;
export async function getWordchannelDocument(fromCache = true): Promise<WordchannelDocument> {
  if (fromCache && cachedWordchannelDocument) return Promise.resolve(cachedWordchannelDocument);

  return (cachedWordchannelDocument = (await Wordchannel.findOne()) ?? new Wordchannel());
}
