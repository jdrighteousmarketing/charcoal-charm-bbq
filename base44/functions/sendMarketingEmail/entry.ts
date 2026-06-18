import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { campaign_type } = await req.json();

    if (!campaign_type || !['birthday_rewards', 'promotions'].includes(campaign_type)) {
      return Response.json({ error: 'Invalid campaign type' }, { status: 400 });
    }

    // Get all customers
    const customers = await base44.entities.CustomerProfile.list();
    // Use fixed business name for emails
    const businessName = 'Pit Stop Mobile';

    let emailSent = 0;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Debug logging removed for production

    if (!resendApiKey) {
      return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    let birthdayCustomersCount = 0;

    if (campaign_type === 'birthday_rewards') {
      // Find customers with birthdays within the next 30 days
      const birthdayCustomers = customers.filter(c => {
        if (!c.birthday) return false;
        const [year, month, day] = c.birthday.split('-').map(Number);
        // Create birthday date for this year
        let birthdayThisYear = new Date(now.getFullYear(), month - 1, day);
        // If birthday already passed this year, check next year
        if (birthdayThisYear < now) {
          birthdayThisYear = new Date(now.getFullYear() + 1, month - 1, day);
        }
        // Check if birthday is within 30 days
        return birthdayThisYear <= thirtyDaysFromNow;
      });

      birthdayCustomersCount = birthdayCustomers.length;
      
      for (const customer of birthdayCustomers) {
        try {
          
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${resendApiKey}`
            },
            body: JSON.stringify({
              from: `${businessName} <support@premaclean.com>`,
              to: customer.email,
              subject: `🎉 Happy Birthday from ${businessName}!`,
              html: `
                <h2>Happy Birthday ${customer.name || 'Friend'}! 🎂</h2>
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

          const responseText = await response.text();

          if (response.ok) {
            emailSent++;
          }
        } catch (error) {
          console.error(`Failed to send email to ${customer.email}:`, error.message, error.stack);
        }
      }
    } else if (campaign_type === 'promotions') {
      // Get active promotions
      const promotions = await base44.entities.Promotion.filter({ is_active: true });
      
      if (promotions.length === 0) {
        return Response.json({ 
          message: 'No active promotions to send',
          recipient_count: 0 
        });
      }

      for (const customer of customers) {
        try {
          let promotionsHtml = promotions.map(p => {
            let discountText = '';
            if (p.discount_type === 'percentage') {
              discountText = `${p.discount_value}% OFF`;
            } else if (p.discount_type === 'fixed') {
              discountText = `$${p.discount_value} OFF`;
            } else if (p.discount_type === 'bogo') {
              discountText = 'BUY ONE GET ONE FREE';
            } else if (p.discount_type === 'free_item') {
              discountText = 'FREE ITEM';
            }

            return `
              <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 10px 0;">
                <h4 style="margin: 0 0 10px 0; color: #f59e0b;">${discountText}</h4>
                <p style="margin: 0;">${p.description || p.title}</p>
                ${p.promo_code ? `<p style="margin: 10px 0 0 0; font-weight: bold;">Code: ${p.promo_code}</p>` : ''}
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #6b7280;">
                  Valid until ${new Date(p.end_date).toLocaleDateString()}
                </p>
              </div>
            `;
          }).join('');

          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${resendApiKey}`
            },
            body: JSON.stringify({
              from: `${businessName} <support@premaclean.com>`,
              to: customer.email,
              subject: `🔥 Current Promotions at ${businessName}`,
              html: `
                <h2>Check Out Our Latest Deals! 🎉</h2>
                <p>Hi ${customer.name || 'Friend'},</p>
                <p>We have some amazing promotions running right now just for you:</p>
                ${promotionsHtml}
                <p style="margin-top: 20px;">Visit us soon to take advantage of these offers!</p>
                <p style="margin-top: 30px;">Best regards,<br>The ${businessName} Team</p>
              `
            })
          });

          if (response.ok) {
            emailSent++;
          }
        } catch (error) {
          console.error(`Failed to send email to ${customer.email}:`, error);
        }
      }
    }

    // Log the campaign
    await base44.entities.EmailCampaign.create({
      email_type: campaign_type,
      recipient_count: emailSent,
      sent_date: new Date().toISOString().split('T')[0]
    });

    // If there were Resend errors, include helpful message
    if (emailSent === 0 && campaign_type === 'birthday_rewards' && birthdayCustomersCount > 0) {
      return Response.json({ 
        message: 'Email sending failed. To send marketing emails, you need to verify a domain in Resend.',
        recipient_count: 0,
        error: 'Domain verification required',
        details: 'Please visit resend.com/domains to verify your domain, then update the from address in BusinessSettings.'
      });
    }

    return Response.json({ 
      message: `Successfully sent ${emailSent} emails`,
      recipient_count: emailSent 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});