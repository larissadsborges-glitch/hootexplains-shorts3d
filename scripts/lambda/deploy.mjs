// Deploy (or reuse) the Remotion Lambda function and upload the latest project as a site.
// Needs REMOTION_AWS_ACCESS_KEY_ID and REMOTION_AWS_SECRET_ACCESS_KEY in the environment.
// Prints function_name=… and serve_url=… (also appended to $GITHUB_OUTPUT when running in GitHub Actions).
import { appendFileSync } from 'node:fs';
import path from 'node:path';
import { deployFunction, deploySite, getOrCreateBucket } from '@remotion/lambda';

const region = process.env.REMOTION_AWS_REGION || 'eu-west-1';

const { functionName, alreadyExisted } = await deployFunction({
  region,
  timeoutInSeconds: 900, // max; a chunk on a low-quota account can take several minutes
  memorySizeInMb: 2048,
  createCloudWatchLogGroup: true,
  cloudWatchLogRetentionPeriodInDays: 7,
});
console.log(`Function ${functionName} (${alreadyExisted ? 'reused' : 'new'})`);

const { bucketName } = await getOrCreateBucket({ region });
const { serveUrl } = await deploySite({
  entryPoint: path.resolve('src/index.ts'),
  bucketName,
  region,
  siteName: 'hootexplains',
  options: { publicDir: path.resolve('public') },
});
console.log(`Site ${serveUrl}`);

const out = `function_name=${functionName}\nserve_url=${serveUrl}\n`;
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, out);
process.stdout.write(out);
