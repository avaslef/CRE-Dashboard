"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "24px",
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 12,
            textAlign: "center",
          }}
        >
          <AlertTriangle size={24} color="#fca5a5" style={{ marginBottom: 8 }} />
          <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "#fca5a5", marginBottom: 4 }}>
            {this.props.fallbackTitle ?? "Something went wrong"}
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-dim)", marginBottom: 12 }}>
            {process.env.NODE_ENV === "development"
              ? (this.state.error?.message ?? "An unexpected error occurred.")
              : "An unexpected error occurred while rendering this section."}
          </p>
          <button
            onClick={this.handleRetry}
            className="btn-neon"
            style={{ fontSize: "0.75rem", padding: "6px 14px" }}
          >
            <RefreshCw size={12} />
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
