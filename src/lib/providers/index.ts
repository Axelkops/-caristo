import type { ListingAnalysis, OfficialHistory, Recall, Vehicle } from "../engine/types";

export interface IdentifyInput {
  kind: "plate" | "vin";
  value: string; // normalisé
  country: string;
}

export interface VehicleProvider {
  name: string;
  identify(input: IdentifyInput): Promise<Vehicle | null>;
}

export interface HistoryInput {
  vehicle: Vehicle;
  plate?: string;
  holderName?: string;
  formulaNumber?: string;
  firstRegDate?: string;
}

export interface HistoryProvider {
  name: string;
  fetchHistory(input: HistoryInput): Promise<OfficialHistory>;
}

export interface RecallsProvider {
  name: string;
  fetchRecalls(vehicle: Vehicle): Promise<Recall[]>;
}

export interface ListingProvider {
  name: string;
  analyze(url: string, vehicle: Vehicle, mileage?: number): Promise<ListingAnalysis>;
}

export function isDemo(): boolean {
  return (process.env.DEMO_MODE ?? "true").toLowerCase() === "true";
}

export async function getVehicleProvider(): Promise<VehicleProvider> {
  if (isDemo() || (process.env.PLATE_PROVIDER ?? "mock") === "mock") return (await import("./vehicle-mock")).mockVehicleProvider;
  return (await import("./vehicle-apiplaque")).apiPlaqueProvider;
}

export async function getHistoryProvider(): Promise<HistoryProvider> {
  if (isDemo()) return (await import("./history-mock")).mockHistoryProvider;
  return (await import("./history-none")).noneHistoryProvider;
}

export async function getRecallsProvider(): Promise<RecallsProvider> {
  if (isDemo()) return (await import("./recalls-mock")).mockRecallsProvider;
  return (await import("./recalls-rappelconso")).rappelConsoProvider;
}

export async function getListingProvider(): Promise<ListingProvider> {
  if (isDemo()) return (await import("./listing-mock")).mockListingProvider;
  return (await import("./listing-fetch")).fetchListingProvider;
}
