import * as fs from 'fs';
import * as path from 'path';
import * as api from '../moltbook/moltbook.fetch.js';
import { LOGGER } from '../utils/logger.js';

function formDataFromFile(filePath: string, extra?: Record<string, string>): FormData {
  const resolved = path.resolve(filePath);
  const buf = fs.readFileSync(resolved);
  const formData = new FormData();
  formData.append('file', new Blob([buf]), path.basename(resolved));
  if (extra) {
    for (const [k, v] of Object.entries(extra)) formData.append(k, v);
  }
  return formData;
}

export class MCPMoltbookHandler {
  async handleRequest(method: string, params: Record<string, unknown>): Promise<object> {
    try {
      switch (method) {
        case 'moltbook_agent_register': {
          const res = await api.post('/agents/register', {
            name: params.name,
            description: params.description,
          } as any, false);
          return res;
        }
        case 'moltbook_agent_status': {
          const res = await api.get('/agents/status');
          return res;
        }
        case 'moltbook_agent_me': {
          const res = await api.get('/agents/me');
          return res;
        }
        case 'moltbook_agent_profile': {
          const name = String(params.name ?? '');
          const res = await api.get(`/agents/profile?name=${encodeURIComponent(name)}`);
          return res;
        }
        case 'moltbook_agent_update': {
          const body: Record<string, unknown> = {};
          if (params.description != null) body.description = params.description;
          if (params.metadata != null) body.metadata = params.metadata;
          const res = await api.patch('/agents/me', body as any);
          return res;
        }
        case 'moltbook_agent_avatar_upload': {
          const filePath = String(params.file_path ?? '');
          const formData = formDataFromFile(filePath);
          const res = await api.postForm('/agents/me/avatar', formData);
          return res;
        }
        case 'moltbook_agent_avatar_remove': {
          const res = await api.del('/agents/me/avatar');
          return res;
        }
        case 'moltbook_agent_setup_owner_email': {
          const email = String(params.email ?? '');
          const res = await api.post('/agents/me/setup-owner-email', { email } as any);
          return res;
        }
        case 'moltbook_feed': {
          const q = new URLSearchParams();
          if (params.sort) q.set('sort', String(params.sort));
          if (params.limit != null) q.set('limit', String(params.limit));
          const res = await api.get(`/feed?${q}`);
          return res;
        }
        case 'moltbook_posts_list': {
          const q = new URLSearchParams();
          if (params.submolt) q.set('submolt', String(params.submolt));
          if (params.sort) q.set('sort', String(params.sort));
          if (params.limit != null) q.set('limit', String(params.limit));
          const res = await api.get(`/posts?${q}`);
          return res;
        }
        case 'moltbook_post_get': {
          const postId = String(params.post_id ?? '');
          const res = await api.get(`/posts/${postId}`);
          return res;
        }
        case 'moltbook_post_create': {
          const body: Record<string, unknown> = {
            submolt: params.submolt,
            title: params.title,
          };
          if (params.content) body.content = params.content;
          if (params.url) body.url = params.url;
          const res = await api.post('/posts', body as any);
          return res;
        }
        case 'moltbook_post_delete': {
          const postId = String(params.post_id ?? '');
          const res = await api.del(`/posts/${postId}`);
          return res;
        }
        case 'moltbook_post_upvote': {
          const postId = String(params.post_id ?? '');
          const res = await api.post(`/posts/${postId}/upvote`);
          return res;
        }
        case 'moltbook_post_downvote': {
          const postId = String(params.post_id ?? '');
          const res = await api.post(`/posts/${postId}/downvote`);
          return res;
        }
        case 'moltbook_post_pin': {
          const postId = String(params.post_id ?? '');
          const res = await api.post(`/posts/${postId}/pin`);
          return res;
        }
        case 'moltbook_post_unpin': {
          const postId = String(params.post_id ?? '');
          const res = await api.del(`/posts/${postId}/pin`);
          return res;
        }
        case 'moltbook_comments_list': {
          const postId = String(params.post_id ?? '');
          const q = params.sort ? `?sort=${params.sort}` : '';
          const res = await api.get(`/posts/${postId}/comments${q}`);
          return res;
        }
        case 'moltbook_comment_add': {
          const postId = String(params.post_id ?? '');
          const body: Record<string, unknown> = { content: params.content };
          if (params.parent_id) body.parent_id = params.parent_id;
          const res = await api.post(`/posts/${postId}/comments`, body as any);
          return res;
        }
        case 'moltbook_comment_upvote': {
          const commentId = String(params.comment_id ?? '');
          const res = await api.post(`/comments/${commentId}/upvote`);
          return res;
        }
        case 'moltbook_submolts_list': {
          const res = await api.get('/submolts');
          return res;
        }
        case 'moltbook_submolt_create': {
          const body: Record<string, unknown> = {
            name: params.name,
            display_name: params.display_name,
          };
          if (params.description != null) body.description = params.description;
          if (params.allow_crypto != null) body.allow_crypto = params.allow_crypto;
          const res = await api.post('/submolts', body as any);
          return res;
        }
        case 'moltbook_submolt_get': {
          const name = encodeURIComponent(String(params.name ?? ''));
          const res = await api.get(`/submolts/${name}`);
          return res;
        }
        case 'moltbook_submolt_subscribe': {
          const name = encodeURIComponent(String(params.name ?? ''));
          const res = await api.post(`/submolts/${name}/subscribe`);
          return res;
        }
        case 'moltbook_submolt_unsubscribe': {
          const name = encodeURIComponent(String(params.name ?? ''));
          const res = await api.del(`/submolts/${name}/subscribe`);
          return res;
        }
        case 'moltbook_submolt_settings': {
          const name = encodeURIComponent(String(params.name ?? ''));
          const body: Record<string, unknown> = {};
          if (params.description != null) body.description = params.description;
          if (params.banner_color != null) body.banner_color = params.banner_color;
          if (params.theme_color != null) body.theme_color = params.theme_color;
          const res = await api.patch(`/submolts/${name}/settings`, body as any);
          return res;
        }
        case 'moltbook_submolt_avatar_upload': {
          const name = encodeURIComponent(String(params.name ?? ''));
          const filePath = String(params.file_path ?? '');
          const formData = formDataFromFile(filePath, { type: 'avatar' });
          const res = await api.postForm(`/submolts/${name}/settings`, formData);
          return res;
        }
        case 'moltbook_submolt_banner_upload': {
          const name = encodeURIComponent(String(params.name ?? ''));
          const filePath = String(params.file_path ?? '');
          const formData = formDataFromFile(filePath, { type: 'banner' });
          const res = await api.postForm(`/submolts/${name}/settings`, formData);
          return res;
        }
        case 'moltbook_submolt_moderators_list': {
          const name = encodeURIComponent(String(params.name ?? ''));
          const res = await api.get(`/submolts/${name}/moderators`);
          return res;
        }
        case 'moltbook_submolt_moderator_add': {
          const name = encodeURIComponent(String(params.name ?? ''));
          const body: Record<string, unknown> = { agent_name: params.agent_name };
          if (params.role != null) body.role = params.role;
          const res = await api.post(`/submolts/${name}/moderators`, body as any);
          return res;
        }
        case 'moltbook_submolt_moderator_remove': {
          const name = encodeURIComponent(String(params.name ?? ''));
          const res = await api.del(`/submolts/${name}/moderators`, {
            agent_name: String(params.agent_name ?? ''),
          } as any);
          return res;
        }
        case 'moltbook_search': {
          const params_ = new URLSearchParams({ q: String(params.q ?? '') });
          if (params.type) params_.set('type', String(params.type));
          if (params.limit != null) params_.set('limit', String(params.limit));
          const res = await api.get(`/search?${params_}`);
          return res;
        }
        case 'moltbook_follow': {
          const agentName = encodeURIComponent(String(params.agent_name ?? ''));
          const res = await api.post(`/agents/${agentName}/follow`);
          return res;
        }
        case 'moltbook_unfollow': {
          const agentName = encodeURIComponent(String(params.agent_name ?? ''));
          const res = await api.del(`/agents/${agentName}/follow`);
          return res;
        }
        case 'moltbook_dm_check': {
          const res = await api.get('/agents/dm/check');
          return res;
        }
        case 'moltbook_dm_requests': {
          const res = await api.get('/agents/dm/requests');
          return res;
        }
        case 'moltbook_dm_request': {
          const body: Record<string, unknown> = { message: params.message };
          if (params.to) body.to = params.to;
          if (params.to_owner) body.to_owner = String(params.to_owner).replace(/^@/, '');
          const res = await api.post('/agents/dm/request', body as any);
          return res;
        }
        case 'moltbook_dm_approve': {
          const conversationId = String(params.conversation_id ?? '');
          const res = await api.post(`/agents/dm/requests/${conversationId}/approve`);
          return res;
        }
        case 'moltbook_dm_reject': {
          const conversationId = String(params.conversation_id ?? '');
          const res = await api.post(`/agents/dm/requests/${conversationId}/reject`, (params.block ? { block: true } : {}) as any);
          return res;
        }
        case 'moltbook_dm_conversations': {
          const res = await api.get('/agents/dm/conversations');
          return res;
        }
        case 'moltbook_dm_conversation': {
          const conversationId = String(params.conversation_id ?? '');
          const res = await api.get(`/agents/dm/conversations/${conversationId}`);
          return res;
        }
        case 'moltbook_dm_send': {
          const conversationId = String(params.conversation_id ?? '');
          const body: Record<string, unknown> = { message: params.message };
          if (params.needs_human_input) body.needs_human_input = true;
          const res = await api.post(`/agents/dm/conversations/${conversationId}/send`, body as any);
          return res;
        }
        default:
          throw new Error(`Unknown method: ${method}`);
      }
    } catch (error: any) {
      LOGGER.error(`Moltbook API error [${method}]:`, error.message);
      throw error;
    }
  }
}
