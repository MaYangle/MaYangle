import test from 'node:test';
import assert from 'node:assert/strict';
import { collectActivity } from '../scripts/data.mjs';

const config = { username: 'MaYangle', projects: [{ url: 'https://github.com/MaYangle/Multimodal-Sentiment-Fusion' }] };
const pr = (number, repo = '19376357/model', status = 'merged') => ({
  number,
  title: `Contribution ${number}`,
  html_url: `https://github.com/${repo}/pull/${number}`,
  repository_url: `https://api.github.com/repos/${repo}`,
  updated_at: `2026-10-${String(number).padStart(2, '0')}T12:00:00Z`,
  pull_request: { url: `https://api.github.com/repos/${repo}/pulls/${number}` },
  state: status === 'open' ? 'open' : 'closed'
});
const response = items => ({ total_count: items.length, incomplete_results: false, items });
const repo = full_name => ({ full_name, private: false, fork: false, archived: false, disabled: false, size: 10 });
const commit = { sha: 'a'.repeat(40), commit: { message: 'Add reproducible evaluation\n\nDetails', committer: { date: '2026-10-14T10:00:00Z' } } };

function fixture({ merged = [], open = [], closed = [], projectRepos = [repo('MaYangle/Multimodal-Sentiment-Fusion')], details = {} } = {}) {
  const calls = [];
  const api = async endpoint => {
    calls.push(endpoint);
    if (endpoint.startsWith('search/issues?')) {
      const query = new URL(`https://api.github.com/${endpoint}`).searchParams.get('q');
      if (query.endsWith('is:closed -is:merged')) return response(closed);
      if (query.endsWith('is:open')) return response(open);
      return response(merged);
    }
    if (endpoint.startsWith('users/')) return projectRepos;
    const detail = endpoint.match(/^repos\/(.+)\/pulls\/(\d+)$/);
    if (detail) return details[`${detail[1]}#${detail[2]}`] ?? { state: 'closed', merged: true, merged_at: '2026-10-14T12:00:00Z', closed_at: '2026-10-14T12:00:00Z', updated_at: '2026-10-14T12:00:00Z' };
    if (endpoint === 'repos/MaYangle/Multimodal-Sentiment-Fusion') return { private: false, fork: false, pushed_at: '2026-10-14T10:00:00Z', stargazers_count: 2, forks_count: 1, language: 'Python' };
    if (endpoint === 'repos/MaYangle/Multimodal-Sentiment-Fusion/commits?per_page=1') return [commit];
    throw new Error(`Unexpected API endpoint: ${endpoint}`);
  };
  return { api, calls };
}

test('collects public pull request states and recent project metadata', async () => {
  const { api } = fixture({
    merged: [pr(7)], open: [pr(8, 'another/team', 'open')], closed: [pr(9, 'third/repo', 'closed')],
    details: {
      '19376357/model#7': { state: 'closed', merged: true, merged_at: '2026-10-14T12:00:00Z' },
      'another/team#8': { state: 'open', merged: false, updated_at: '2026-10-14T11:00:00Z' },
      'third/repo#9': { state: 'closed', merged: false, closed_at: '2026-10-13T12:00:00Z' }
    }
  });
  const data = await collectActivity(config, api);
  assert.deepEqual(data.counts, { merged: 1, open: 1, closed: 1, mergedRepositories: 1, publicProjects: 1 });
  assert.deepEqual(data.pullRequests.map(item => item.status), ['open', 'closed', 'merged']);
  assert.equal(data.pullRequests[0].updatedAt, '2026-10-14T11:00:00Z');
  assert.deepEqual(data.repositories.map(item => [item.merged, item.open, item.closed]), [[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
  assert.equal(data.projects[0].latestCommit.message, 'Add reproducible evaluation');
  assert.equal(data.projects[0].latestCommit.url, `https://github.com/MaYangle/Multimodal-Sentiment-Fusion/commit/${commit.sha}`);
});

test('search queries exclude own repositories and request public PRs only', async () => {
  const own = pr(1, 'MaYangle/something', 'merged');
  const { api, calls } = fixture();
  await assert.rejects(collectActivity(config, async endpoint => {
    if (endpoint.startsWith('search/issues?')) {
      const query = new URL(`https://api.github.com/${endpoint}`).searchParams.get('q');
      assert.match(query, /is:public/);
      assert.match(query, /-user:MaYangle/);
      return response([own]);
    }
    return api(endpoint);
  }), /profile owner/);
  assert.equal(calls.filter(endpoint => endpoint.startsWith('search/issues?')).length, 0);
});

test('rejects incomplete search responses', async () => {
  const { api } = fixture();
  await assert.rejects(collectActivity(config, endpoint => endpoint.startsWith('search/issues?')
    ? Promise.resolve({ total_count: 0, incomplete_results: true, items: [] })
    : api(endpoint)), /incomplete or invalid/);
});

test('rejects search results whose current state disagrees with their search bucket', async () => {
  const { api } = fixture({ merged: [pr(7)], details: { '19376357/model#7': { state: 'closed', merged: false, closed_at: '2026-10-14T12:00:00Z' } } });
  await assert.rejects(collectActivity(config, api), /status disagree/);
});

test('rejects duplicated PRs across search buckets', async () => {
  const duplicate = pr(7);
  const { api } = fixture({ merged: [duplicate], closed: [duplicate] });
  await assert.rejects(collectActivity(config, api), /multiple search results/);
});

test('paginates repositories and excludes private, forked, archived, disabled, empty and profile repos', async () => {
  const firstPage = [
    repo('MaYangle/first'),
    { ...repo('MaYangle/private'), private: true },
    { ...repo('MaYangle/fork'), fork: true },
    { ...repo('MaYangle/archived'), archived: true },
    { ...repo('MaYangle/disabled'), disabled: true },
    { ...repo('MaYangle/empty'), size: 0 },
    repo('MaYangle/MaYangle'),
    ...Array.from({ length: 93 }, (_, index) => repo(`MaYangle/filler-${index}`))
  ];
  const { api, calls } = fixture();
  const data = await collectActivity(config, async endpoint => {
    if (endpoint.includes('users/')) {
      if (endpoint.endsWith('page=1')) return firstPage;
      return [repo('MaYangle/kept')];
    }
    return api(endpoint);
  });
  assert.equal(data.counts.publicProjects, 95);
  assert.ok(calls.some(endpoint => endpoint.includes('page=1')));
});

test('rejects inconsistent total counts rather than silently missing merged repository counts', async () => {
  const { api } = fixture({ merged: [pr(7)] });
  await assert.rejects(collectActivity(config, async endpoint => {
    if (endpoint.startsWith('search/issues?')) return { total_count: 2, incomplete_results: false, items: [pr(7)] };
    return api(endpoint);
  }), /missing pages/);
});

test('fails closed when public search returns a private PR detail', async () => {
  const {api} = fixture({merged: [pr(7)], details: {'19376357/model#7': {state: 'closed', merged: true, merged_at: '2026-10-14T12:00:00Z', base: {repo: {private: true}}}}});
  await assert.rejects(collectActivity(config, api), /private contribution/);
});

test('rejects excess search items and result counts beyond the complete pagination limit', async () => {
  const {api} = fixture();
  for (const result of [{total_count: 0, incomplete_results: false, items: [pr(7)]}, {total_count: 1001, incomplete_results: false, items: []}]) {
    await assert.rejects(collectActivity(config, endpoint => endpoint.startsWith('search/issues?') ? Promise.resolve(result) : api(endpoint)), /more records|1000-result/);
  }
});
