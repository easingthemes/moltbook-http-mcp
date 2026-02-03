export type CliParams = {
  mcpPort?: number;
  /** When true, MCP POST /mcp requires JWT auth (requireAuth middleware). */
  auth?: boolean;
  /** Path to TLS private key PEM (enables HTTPS when used with certPath). */
  keyPath?: string;
  /** Path to TLS certificate PEM (enables HTTPS when used with keyPath). */
  certPath?: string;
};
