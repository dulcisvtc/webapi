import { model, Schema } from "mongoose";

const JobSchema = new Schema({}, { strict: false });
export const Jobs = model("Jobs", JobSchema);