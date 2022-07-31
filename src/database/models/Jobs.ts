import { model, Schema } from "mongoose";
import type { JobSchema } from "../../../types";

const JobSchema = new Schema<JobSchema>({}, { strict: false });
export const Jobs = model<JobSchema>("Jobs", JobSchema);