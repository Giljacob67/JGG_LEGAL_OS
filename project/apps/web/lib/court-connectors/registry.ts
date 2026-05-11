import { CourtConnector } from "./types";
import { DatajudConnector } from "./datajud-connector";

const registry = new Map<string, CourtConnector>();

export function registerConnector(connector: CourtConnector) {
  registry.set(connector.id, connector);
}

export function getConnector(id: string): CourtConnector | undefined {
  return registry.get(id);
}

export function getAllConnectors(): CourtConnector[] {
  return Array.from(registry.values());
}

// Register default connectors
registerConnector(new DatajudConnector());
