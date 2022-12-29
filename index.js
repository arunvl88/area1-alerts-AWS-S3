async function postToS3(output, alertId) {
  // Set AWS credentials and region
  const ACCESS_KEY_ID = 'AKIA2SO5OU4DX7NOG2XX';
  const SECRET_ACCESS_KEY = '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';
  const REGION = 'us-east-1';

  // Import the aws-sdk library
  const response = await fetch('https://cdn.jsdelivr.net/npm/aws-sdk@2.778.0/dist/aws-sdk.min.js');
  const importedCode = await response.text();
  eval(importedCode);

  // Create S3 client
  const s3 = new AWS.S3({
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
    region: REGION
  });

  // Upload data to S3 bucket
  const params = {
    Bucket: 'area1alertsbucket',
    Key: `alert-${alertId}.txt`,
    Body: output
  };
  await s3.upload(params).promise();
}

async function parseAlerts(request) {
 // Parse the request body and extract event data
  const event = (await request.json());
  const finalDisposition = event.final_disposition;
  const serverName = event.smtp_helo_server_name;
  const envelopeToArray = event.envelope_to;
  const toArray = event.to;

  // Create an array of recipients in the format "display name" <email>
  const recipientsArray = toArray.map((to, i) => `"${to}" <${envelopeToArray[i]}>`);
  const alertReasons = event.alert_reasons.join('\n');
  const envelopeFrom = event.envelope_from;
  const from = event.from;
  const fromName = event.from_name;

  // Set sender based on whether a display name is provided
  const sender = fromName ? `"${fromName}" <${from}>` : `<${from}>`;
  const subject = event.subject;
  const messageId = event.message_id;
  const ts = event.ts;
  const alertId = event.alert_id;

  // Format event data for output
  const output = `
*Disposition:* ${finalDisposition}

*Date:* ${ts.replace('T', ' ')}
*From:* ${sender}
*To:* ${recipientsArray.join(', ')}
*Subject:* ${subject}
*Message-ID:* ${messageId}

*Alert Reasons:*
${alertReasons}

*Alert ID:* ${alertId}
`;

  // Upload data to S3
  await postToS3(output, alertId);

  return new Response('');
}

//The code is written in JavaScript and uses the fetch function, which is a standard part of the Web API available to Cloudflare Workers. 
//In addition, the code has an addEventListener function with the first argument set to 'fetch', which is a common pattern for handling HTTP requests in Cloudflare Workers.
//This is the Event Listener waiting for alerts to arrive from Area 1 

addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method === 'POST') {
    return event.respondWith(parseAlerts(request));
  } else if (request.method === 'GET') {
    // Return a blank page if you try to load the workers page directly and do nothing
    return event.respondWith(new Response(''));
  }
});
