// @napi-rs/canvas doesn't work normally without this
/// <reference lib="dom" />

export interface JobSchema {
  source: {
    id?: number;
    name?: "navio" | "tracksim";
  };
  driver: {
    id?: number;
    steam_id?: string;
    username: string;
  };
  start_timestamp: number;
  stop_timestamp: number;
  driven_distance: number;
  fuel_used: number;
  cargo: {
    name: string;
    mass: number;
    damage: number;
  };
  source_city: string;
  source_company: string;
  destination_city: string;
  destination_company: string;
  truck: string;
  average_speed: number;
  top_speed: number;
}

export interface TrackSimJobWebhookObject {
  object: "event";
  type: "job.delivered" | "job.cancelled";
  data: {
    object: {
      id: number;
      object: "job";
      driver: {
        id: number;
        steam_id: string;
        username: string;
        profile_photo_url: string;
        client: {
          version: {
            name: string;
            branch_name: string;
            platform: string;
          };
        };
        last_active: string;
      };
      start_time: string;
      stop_time: string;
      time_spent: number;
      planned_distance: number;
      driven_distance: number;
      adblue_used: number;
      fuel_used: number;
      is_special: boolean;
      is_late: boolean;
      market: string;
      cargo: {
        unique_id: string;
        name: string;
        mass: number;
        damage: number;
      };
      game: {
        short_name: string;
        language: string;
        had_police_enabled: false;
      };
      multiplayer: {
        mode: string;
        meta: {
          player_id: number;
          server: string;
        };
      };
      source_city: {
        unique_id: string;
        name: string;
      };
      source_company: {
        unique_id: string;
        name: string;
      };
      destination_city: {
        unique_id: string;
        name: string;
      };
      destination_company: {
        unique_id: string;
        name: string;
      };
      truck: {
        unique_id: string;
        name: string;
        brand: {
          unique_id: string;
          name: string;
        };
        odometer: number;
        initial_odometer: number;
        wheel_count: number;
        license_plate: string;
        license_plate_country: {
          unique_id: string;
          name: string;
        };
        current_damage: {
          cabin: number;
          chassis: number;
          engine: number;
          transmission: number;
          wheels: number;
        };
        total_damage: {
          cabin: number;
          chassis: number;
          engine: number;
          transmission: number;
          wheels: number;
        };
        top_speed: number;
        average_speed: number;
      };
      trailers: [];
      events: [];
      route: [];
    };
  };
}

export type Command = {
  data: import("discord.js").RESTPostAPIChatInputApplicationCommandsJSONBody;
  execute: (interaction: import("discord.js").ChatInputCommandInteraction<"cached">) => Promise<any>;
  autocomplete?: (interaction: import("discord.js").AutocompleteInteraction<"cached">) => Promise<any>;
};

declare module "axios" {
  export interface AxiosRequestConfig {
    retry?: number;
    retryDelay?: number;
  }
}
