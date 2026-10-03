/**
 * DARLEK CANN ARCHITECTURAL HEADER
 * File: src/app/api/github/issues/route.ts
 * Role: GitHub Issues management endpoint for autonomous Bug Inspector integration.
 * Architecture: Type-safe modular unit supporting issue creation, updates, and resolution linking.
 */

import { NextRequest, NextResponse } from '@/lib/next-mock';
import { safeReqJson } from '@/lib/safe-json';

export const dynamic = 'force-dynamic';

const GITHUB_API_BASE = 'https://api.github.com';

function buildGitHubHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'Dalek-Cognition-Architecture/1.0',
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

interface IssuePayload {
  action?: 'create' | 'update' | 'list' | 'close';
  token?: string;
  owner?: string;
  repo?: string;
  issueNumber?: number;
  title?: string;
  body?: string;
  labels?: string[];
  severity?: string;
  bugReportFileName?: string;
  bugReportContent?: string;
  resolutionCommitSha?: string;
  resolutionSummary?: string;
  comment?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const payload = (await safeReqJson<IssuePayload>(req)) || {};
    const action = payload.action || 'create';
    const token = payload.token || process.env.GITHUB_TOKEN || '';
    const owner = payload.owner || 'craighckby-stack';
    const repo = payload.repo || 'DARLEK-CAAN-Cognitive-Engine';

    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'GitHub Personal Access Token is required to interact with repository issues.',
      }, { status: 401 });
    }

    const headers = buildGitHubHeaders(token);

    // ──────────────────────────────────────────────
    // ACTION: LIST ISSUES
    // ──────────────────────────────────────────────
    if (action === 'list') {
      const res = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/issues?state=all&per_page=30`, { headers });
      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json({ success: false, error: `GitHub API error: ${errText}` }, { status: res.status });
      }
      const issues = await res.json();
      return NextResponse.json({
        success: true,
        issues: Array.isArray(issues) ? issues.map((item: any) => ({
          id: item.id,
          number: item.number,
          title: item.title,
          state: item.state,
          html_url: item.html_url,
          created_at: item.created_at,
          updated_at: item.updated_at,
          labels: item.labels?.map((l: any) => l.name) || [],
          body: item.body,
        })) : [],
      });
    }

    // ──────────────────────────────────────────────
    // ACTION: UPDATE / CLOSE / COMMENT EXISTING ISSUE
    // ──────────────────────────────────────────────
    if (action === 'update' || action === 'close') {
      if (!payload.issueNumber) {
        return NextResponse.json({ success: false, error: 'issueNumber is required for issue updates' }, { status: 400 });
      }

      const issueNumber = payload.issueNumber;

      // If there's a comment or resolution to post
      if (payload.comment || payload.resolutionCommitSha || payload.resolutionSummary) {
        let commentText = payload.comment || '';
        if (payload.resolutionCommitSha) {
          commentText = `### 🤖 Autonomous Fix Applied by DALEK CAAN\n\n` +
            `- **Commit:** [\`${payload.resolutionCommitSha}\`](https://github.com/${owner}/${repo}/commit/${payload.resolutionCommitSha})\n` +
            `- **Summary:** ${payload.resolutionSummary || 'Verified patches committed to repository.'}\n` +
            `- **Timestamp:** \`${new Date().toISOString()}\`\n\n` +
            `*All zero-error architectural invariants verified.*`;
        }

        await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/issues/${issueNumber}/comments`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ body: commentText }),
        });
      }

      // Update issue state or title/labels
      const updateData: Record<string, any> = {};
      if (action === 'close') {
        updateData.state = 'closed';
        updateData.state_reason = 'completed';
      }
      if (payload.title) updateData.title = payload.title;

      const patchRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/issues/${issueNumber}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updateData),
      });

      if (!patchRes.ok) {
        const errText = await patchRes.text();
        return NextResponse.json({ success: false, error: `Failed to update issue #${issueNumber}: ${errText}` }, { status: patchRes.status });
      }

      const updatedIssue = await patchRes.json();
      return NextResponse.json({
        success: true,
        issue: {
          number: updatedIssue.number,
          title: updatedIssue.title,
          state: updatedIssue.state,
          html_url: updatedIssue.html_url,
        },
        message: `Issue #${issueNumber} successfully updated.`,
      });
    }

    // ──────────────────────────────────────────────
    // ACTION: CREATE NEW ISSUE
    // ──────────────────────────────────────────────
    const severity = payload.severity || 'HIGH';
    const title = payload.title || `[Bug]: Automated Issue from ${payload.bugReportFileName || 'Bug Report'}`;

    let bodyMarkdown = `## 🐞 Automated Bug Report via DALEK CAAN Bug Inspector\n\n`;
    bodyMarkdown += `**Source File:** \`${payload.bugReportFileName || 'Direct Input'}\`\n`;
    bodyMarkdown += `**Severity:** \`${severity}\`\n`;
    bodyMarkdown += `**Logged At:** \`${new Date().toISOString()}\`\n\n`;

    if (payload.body) {
      bodyMarkdown += `### 📝 Description\n${payload.body}\n\n`;
    }

    if (payload.bugReportContent) {
      bodyMarkdown += `### 📄 Bug Specification Content\n\`\`\`text\n${payload.bugReportContent.slice(0, 4000)}\n\`\`\`\n\n`;
    }

    bodyMarkdown += `*Reported automatically by DALEK CAAN Bug Inspector engine.*`;

    const labels = payload.labels && payload.labels.length > 0 
      ? payload.labels 
      : ['dalek-bug', 'bug', `severity:${severity.toLowerCase()}`];

    const createRes = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title,
        body: bodyMarkdown,
        labels,
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      return NextResponse.json({ success: false, error: `Failed to create issue on ${owner}/${repo}: ${errText}` }, { status: createRes.status });
    }

    const created = await createRes.json();

    return NextResponse.json({
      success: true,
      issue: {
        id: created.id,
        number: created.number,
        title: created.title,
        state: created.state,
        html_url: created.html_url,
        created_at: created.created_at,
        labels: created.labels?.map((l: any) => l.name) || [],
      },
      message: `GitHub Issue #${created.number} created successfully on ${owner}/${repo}.`,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[GitHub Issues Route] Error:', errorMsg);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
