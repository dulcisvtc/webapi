import type { JobSchema } from "../../../types";
import { model, Schema } from "mongoose";

const JobSchema = new Schema<JobSchema>({}, { strict: false });
export const Jobs = model<JobSchema>("Jobs", JobSchema);