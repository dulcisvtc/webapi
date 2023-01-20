import { Global, GlobalDocument } from "./models/Global";

export async function getGlobalDocument(): Promise<GlobalDocument> {
    return await Global.findOne() ?? new Global();
};