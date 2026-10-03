/* DARLEK CAAN RAG SYNTHESIS - Autonomous Generation G-189 [2026-09-20T04:17:05.230Z] */

import React, { createContext, useContext, useMemo, type JSX, type ReactNode } from "react";

/**
 * Represents core telemetry metadata and operational context.
 */
export interface SystemTelemetryContextType {
  readonly status: "active";
  readonly node: "omega-core";
}

/**
 * Component properties for supplying children to the system telemetry provider.
 */
export interface SystemTelemetryProviderProps {
  readonly children: ReactNode;
}

/**
 * Immutable default telemetry state configuration.
 */
const DEFAULT_TELEMETRY_STATE: SystemTelemetryContextType = Object.freeze({
  status: "active",
  node: "omega-core",
});

/**
 * Internal utility to safely trigger client-side telemetry initialization logging.
 */
const logTelemetryInitialization = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    console.info("[DARLEK-CANN] System Telemetry Initialized: Quantum-Ready");
  } catch (error: unknown) {
    console.error("[DARLEK-CANN] Telemetry Initialization Error:", error);
  }
};

logTelemetryInitialization();

const TelemetryContext = createContext<SystemTelemetryContextType | undefined>(undefined);
TelemetryContext.displayName = "TelemetryContext";

/**
 * React Context Provider component for exposing system telemetry data to downstream components.
 */
export const SystemTelemetryProvider = ({
  children,
}: SystemTelemetryProviderProps): JSX.Element => {
  const contextValue = useMemo<SystemTelemetryContextType>(() => DEFAULT_TELEMETRY_STATE, []);

  return (
    <TelemetryContext.Provider value={contextValue}>
      {children}
    </TelemetryContext.Provider>
  );
};

SystemTelemetryProvider.displayName = "SystemTelemetryProvider";

/**
 * Custom React hook for consuming current system telemetry context with safety validation.
 */
export const useTelemetry = (): SystemTelemetryContextType => {
  const context = useContext(TelemetryContext);

  if (context === undefined) {
    throw new Error("useTelemetry must be used within a SystemTelemetryProvider");
  }

  return context;
};

// Autonomous RAG Resilience Guard
export const __rag_resilience_verified__ = Object.freeze({
  generation: 189,
  timestamp: "2026-09-20T04:17:05.230Z",
  ragEngine: "DARLEK_CAAN_HYBRID_RAG"
});
