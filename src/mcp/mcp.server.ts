import { CallToolRequestSchema, ListToolsRequestSchema, InitializeRequestSchema, LATEST_PROTOCOL_VERSION, SUPPORTED_PROTOCOL_VERSIONS } from '@modelcontextprotocol/sdk/types.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { tools } from './mcp.tools.js';
import { MCPMoltbookHandler } from './mcp.moltbook-handler.js';
import { CliParams } from '../types.js';
import { LOGGER } from '../utils/logger.js';

export const createMCPServer = (cliParams: CliParams) => {
  const mcpHandler = new MCPMoltbookHandler();

  const serverInfo = {
    name: 'moltbook-mcp-server',
    version: '1.0.0',
  };
  const serverData = {
    capabilities: {
      resources: {},
      tools: {}
    },
    instructions: 'Moltbook MCP server: post, comment, upvote, DMs, and communities. Requires MOLTBOOK_API_KEY (except agent_register).',
  };

  const server = new Server(serverInfo, serverData);

  server.setRequestHandler(InitializeRequestSchema, (_request) => {
    const requestedVersion = _request.params.protocolVersion;
    const protocolVersion = SUPPORTED_PROTOCOL_VERSIONS.includes(requestedVersion)
      ? requestedVersion
      : LATEST_PROTOCOL_VERSION;
    LOGGER.log('1. Received InitializeRequest', _request, 'response:', { protocolVersion });
    return {
      protocolVersion,
      ...serverData,
      serverInfo,
    }
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    LOGGER.log('2. Received ListToolsRequest', tools);
    return { tools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    LOGGER.log('3. Received CallToolRequestSchema', request.params);
    if (!args) {
      return {
        content: [
          { type: 'text', text: 'Error: No arguments provided' },
        ],
        isError: true,
      };
    }
    try {
      const result = await mcpHandler.handleRequest(name, args as Record<string, unknown>);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    } catch (error: any) {
      LOGGER.error('ERROR CallToolRequestSchema', error.message);
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  });

  return server;
}
