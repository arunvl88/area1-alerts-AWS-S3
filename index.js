/*This code is a Cloudflare Worker that listens for incoming HTTP POST requests. 
When a request is received, it calls the parseAlerts function to parse the request body and extract certain pieces of data. 
It then formats this data into a string and uploads it to an Amazon S3 bucket as a file named alert-${alertId}.txt, where alertId is the alert_id field in the event data.
*/

async function postToS3(init, alertId) {
  // Set AWS credentials and region
  //console.log(init); 
  const ACCESS_KEY_ID = AWS_ACCESS_KEY_ID;
  const SECRET_ACCESS_KEY = AWS_SECRET_ACCESS_KEY;
  const REGION = 'us-east-1';

  await import('https://cdn.jsdelivr.net/npm/aws-sdk@2.778.0/dist/aws-sdk.min.js')

  /*
  // Import the aws-sdk library
  try {
    await import('https://cdn.jsdelivr.net/npm/aws-sdk@2.778.0/dist/aws-sdk.min.js');
    console.log('AWS SDK imported successfully');
  } catch (error) {
    console.error(error);
  }  
  */
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
    Body: init
  };
  await s3.upload(params).promise();
}


async function parseAlerts(request) {
  // Parse the request body and extract event data
  const jsonBodyRequest = JSON.stringify(await request.json());
  const jsonBody = JSON.parse(jsonBodyRequest);

  const event = jsonBody.event;
  //console.log(event);  // log the event object to the console
  const finalDisposition = event.final_disposition;
  const serverName = event.smtp_helo_server_name;
  const envelopeToArray = event.envelope_to;
  const toArray = event.to;

  // Create an array of recipients in the format "display name" <email>
  let recipientsArray = [];
  if (event.envelope_to && event.to && event.envelope_to.length > 0 && event.to.length > 0) {
    for (let i = 0; i < event.to.length; i++) {
      let recipient = event.to[i];
      if (event.envelope_to[i]) {
        recipient = `"${event.to[i]}" <${event.envelope_to[i]}>`;
      }
      recipientsArray.push(recipient);
    }
  }
  const alertReasons = event.alert_reasons ? event.alert_reasons.join('\n') : '';
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
  Disposition:${finalDisposition}
  Date:${ts && ts.replace ? ts.replace('T', ' ') : ''}
  From:${sender}
  To:${recipientsArray.join(', ')}
  Subject:${subject}
  Message-ID:${messageId}
  Alert Reasons:${alertReasons}
  Alert ID:${alertId}
  `;

  // Parse the output string and create a JSON object
  const body = {
    text: output
  };

  const init = {
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json;charset=UTF-8'
    }
  };

  // Upload data to S3
  await postToS3(init, alertId);

  return new Response('');
}

//The code is written in JavaScript and uses the fetch function, which is a standard part of the Web API available to Cloudflare Workers. 
//In addition, the code has an addEventListener function with the first argument set to 'fetch', which is a common pattern for handling HTTP requests in Cloudflare Workers.
//This is the Event Listener waiting for alerts to arrive from Area 1 

addEventListener('fetch', (event) => {
  
  if (event && event.request && event.request.method) {
    const { request } = event;
    if (request.method === 'POST') {
      return event.respondWith(parseAlerts(request));
    } else if (request.method === 'GET') {
      // Return a blank page if you try to load the workers page directly and do nothing
      return event.respondWith(new Response(''));
    }
  }
});

