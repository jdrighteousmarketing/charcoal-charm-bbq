import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customer_id } = await req.json();

    if (!customer_id) {
      return Response.json({ error: 'Customer ID required' }, { status: 400 });
    }

    const customer = await base44.asServiceRole.entities.CustomerProfile.list();
    const target = customer.find(c => c.id === customer_id);

    if (!target) {
      return Response.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Use fixed business name for emails
    const businessName = 'Pit Stop Mobile';

    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: `${businessName} <support@premaclean.com>`,
        to: target.email,
        subject: `🎉 Happy Birthday from ${businessName}!`,
        html: `
          <h2>Happy Birthday ${target.name || 'Friend'}! 🎂</h2>
          <p>Wishing you a fantastic birthday from all of us at ${businessName}!</p>
          <p>As a special birthday gift, here's a reward just for you:</p>
          <div style="background: #f59e0b; color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0;">🎁 FREE BIRTHDAY REWARD</h3>
            <p style="margin: 10px 0 0 0;">Visit us and mention this email to claim your special treat!</p>
          </div>
          <p>Valid through the end of your birthday month.</p>
          <p>Thank you for being a valued member!</p>
          <p style="margin-top: 30px;">Best regards,<br>The ${businessName} Team</p>
        `
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      return Response.json({ error: 'Failed to send email', details: errorData }, { status: response.status });
    }

    return Response.json({ success: true, message: 'Birthday email sent!' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});