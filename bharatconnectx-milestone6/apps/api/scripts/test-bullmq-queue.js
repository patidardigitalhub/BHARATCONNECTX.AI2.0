/**
 * Standalone verification that the campaign queue actually works end
 * to end against a real Redis: add a job, confirm a worker picks it up
 * and processes it, and confirm a delayed job doesn't run early.
 *
 * Usage: node scripts/test-bullmq-queue.js  (needs a local redis-server)
 */
const { Queue, Worker } = require('bullmq');

const connection = { host: 'localhost', port: 6379, maxRetriesPerRequest: null };

async function main() {
  const queue = new Queue('test-campaign-send', { connection });
  await queue.obliterate({ force: true }).catch(() => {});

  const processed = [];
  const worker = new Worker(
    'test-campaign-send',
    async (job) => {
      processed.push({ id: job.id, data: job.data, at: Date.now() });
      return 'ok';
    },
    { connection },
  );

  await new Promise((resolve) => worker.on('ready', resolve));

  console.log('--- Test 1: immediate job gets processed ---');
  const start = Date.now();
  const job1 = await queue.add('send', { campaignId: 'immediate-campaign' });
  await job1.waitUntilFinished(new (require('bullmq').QueueEvents)('test-campaign-send', { connection }), 5000);
  const found = processed.find((p) => p.data.campaignId === 'immediate-campaign');
  console.log('Immediate job processed:', !!found, `after ${found ? found.at - start : 'N/A'}ms`);
  if (!found) throw new Error('FAIL: immediate job was not processed');
  console.log('PASS: immediate job processed\n');

  console.log('--- Test 2: delayed job does not run early ---');
  const delayMs = 2000;
  const beforeDelay = Date.now();
  const job2 = await queue.add('send', { campaignId: 'delayed-campaign' }, { delay: delayMs });
  await job2.waitUntilFinished(new (require('bullmq').QueueEvents)('test-campaign-send', { connection }), 8000);
  const foundDelayed = processed.find((p) => p.data.campaignId === 'delayed-campaign');
  const actualDelay = foundDelayed.at - beforeDelay;
  console.log(`Delayed job processed after ${actualDelay}ms (requested delay: ${delayMs}ms)`);
  if (actualDelay < delayMs - 200) throw new Error('FAIL: delayed job ran before its scheduled time');
  console.log('PASS: delayed job respected its scheduled time\n');

  console.log('ALL TESTS PASSED \u2705');
  await worker.close();
  await queue.obliterate({ force: true });
  await queue.close();
  process.exit(0);
}

main().catch((e) => {
  console.error('TEST FAILED:', e.message);
  process.exit(1);
});
