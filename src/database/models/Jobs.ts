import { AutoIncrementID } from "@typegoose/auto-increment";
import { DocumentType, getModelForClass, index, modelOptions, plugin, prop } from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { _id: false, versionKey: false } })
class DriverSchema {
  @prop({ type: Number }) id!: number | null;
  @prop({ type: String }) steam_id!: string | null;
  @prop({ type: String }) username!: string;
}

@modelOptions({ schemaOptions: { _id: false, versionKey: false } })
class SourceSchema {
  @prop({ type: Number }) id!: number | null;
  @prop({ type: String, enum: ["navio", "tracksim"] }) name!: string | null;
}

@modelOptions({ schemaOptions: { _id: false, versionKey: false } })
class CargoSchema {
  @prop({ type: String }) name!: string;
  @prop({ type: Number }) mass!: number;
  @prop({ type: Number }) damage!: number;
}

@plugin(AutoIncrementID, {})
@modelOptions({ schemaOptions: { collection: "jobs", versionKey: false } })
@index({ "driver.steam_id": 1 })
@index({ start_timestamp: 1 })
@index({ stop_timestamp: 1 })
@index({ driven_distance: 1 })
@index({ fuel_used: 1 })
class JobSchema {
  @prop() _id!: number;
  @prop({ type: () => SourceSchema, default: {} }) source!: SourceSchema;
  @prop({ type: () => DriverSchema, default: {} }) driver!: DriverSchema;
  @prop({ type: Number }) start_timestamp!: number;
  @prop({ type: Number }) stop_timestamp!: number;
  @prop({ type: Number }) driven_distance!: number;
  @prop({ type: Number }) fuel_used!: number;
  @prop({ type: () => CargoSchema, default: {} }) cargo!: CargoSchema;
  @prop({ type: String }) source_city!: string;
  @prop({ type: String }) source_company!: string;
  @prop({ type: String }) destination_city!: string;
  @prop({ type: String }) destination_company!: string;
  @prop({ type: String }) truck!: string;
  @prop({ type: Number }) averate_speed!: number;
  @prop({ type: Number }) top_speed!: number;
}

export type JobDocument = DocumentType<JobSchema>;

export const Jobs = getModelForClass(JobSchema);
