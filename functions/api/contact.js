export async function onRequestPost({ request, env }) {
  // Only accept POST requests
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const data = await request.json();
    const { services, total, message } = data;

    // Validate: must have services OR a message
    if (!services && !message) {
      return new Response(JSON.stringify({
        error: 'Please select a service or add a message.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build the email content
    let emailText = 'New Consultation Request\n\n';
    if (services) {
      emailText += 'Services Selected:\n' + services + '\n\n';
    }
    if (total) {
      emailText += 'Total Estimate: ' + total + '\n\n';
    }
    if (message) {
      emailText += 'Message from client:\n' + message + '\n\n';
    }
    emailText += '---\nThis consultation request was sent from victoriawinter00.com';

    // Send the email using the SEB binding
    await env.SEB.send({
      personalizations: [{
        to: [{ email: 'victoria00business00@gmail.com' }]
      }],
      from: {
        email: 'noreply@victoriawinter00.com',
        name: 'Victoria Winter Consulting'
      },
      subject: 'New Consultation Request',
      content: [{
        type: 'text/plain',
        value: emailText
      }]
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Your consultation request has been sent.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Failed to send email. Please try again.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}