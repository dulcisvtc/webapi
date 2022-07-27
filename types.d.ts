export interface Config {
    port: number;
    database_uri: string;
    navio_secrets: string[];
};

export interface JobSchema {
    job_id: number,
    driver: {
        id: number,
        steam_id: string,
        username: string
    },
    start_timestamp: number,
    stop_timestamp: number,
    driven_distance: number,
    fuel_used: number,
    cargo: {
        name: string,
        mass: number,
        damage: number
    },
    source_city: string,
    source_company: string,
    destination_city: string,
    destination_company: string,
    truck: string,
    average_speed: number,
    top_speed: number
};