import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'owner_admin' && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { email, name, role = 'employee' } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    const validRoles = ['employee', 'owner_admin', 'admin'];
    if (!validRoles.includes(role)) {
      return Response.json({ error: 'Invalid role' }, { status: 400 });
    }

    const businessName = 'Pit Stop Mobile';
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const origin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/$/, '') || '';
    const appUrl = origin.startsWith('http') ? new URL(origin).origin : `https://app.base44.app`;
    const isAdminInvite = role === 'owner_admin' || role === 'admin';
    const loginUrl = isAdminInvite ? `${appUrl}/admin-login` : `${appUrl}/employee-login`;
    const signupUrl = isAdminInvite ? `${appUrl}/admin-login` : `${appUrl}/employee-signup?role=employee&email=${encodeURIComponent(email)}`;

    // Check if user already exists
    const existingUsers = await base44.asServiceRole.entities.User.list('-created_date', 500);
    let targetUser = existingUsers.find(u => u.email === email);

    // If user already exists, update their role
    if (targetUser && targetUser.role !== role) {
      await base44.asServiceRole.entities.User.update(targetUser.id, { role });
      console.log(`Updated existing user ${email} role to ${role}`);
    }
    // New employees will create their own account via /employee-signup
    // Their role will be set by the inviteEmployee function once they register

    // Send custom invite email with direct login instructions
    if (!RESEND_API_KEY) {
      return Response.json({ success: true, user_created: true, email_sent: false, email_error: 'Resend API key not configured' });
    }

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${businessName} <support@premaclean.com>`,
        to: [email],
        subject: `You've been invited to ${businessName} as ${isAdminInvite ? 'Admin' : 'Employee'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1008; color: #f5f0e8; padding: 32px; border-radius: 12px;">
            <h2 style="color: #f59e0b; margin-bottom: 8px;">Welcome to ${businessName}! 🏁</h2>
            <p>Hi ${name || 'there'},</p>
            <p>You've been invited to join our team as ${isAdminInvite ? 'an Administrator/Owner' : 'an Employee'}.</p>
            <p><strong>Your login email:</strong> ${email}</p>
            <p style="margin-top: 24px;">To get started, click the button below to create your account:</p>
            <p style="margin: 24px 0;">
              <a href="${signupUrl}" 
                 style="display: inline-block; background-color: #f59e0b; color: #000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Create Your ${isAdminInvite ? 'Admin' : 'Employee'} Account →
              </a>
            </p>
            <div style="background: #2a1a08; border: 1px solid #f59e0b33; border-radius: 8px; padding: 12px 16px; margin: 20px 0; font-size: 13px; color: #f59e0b;">
              ⚠️ <strong>Important:</strong> After setting up your account, always sign in at the <strong>${isAdminInvite ? 'Admin' : 'Employee'} Login</strong> page — <strong>not</strong> the regular customer login.
            </div>
            <p style="color: #999; font-size: 13px;">Already have a password? <a href="${loginUrl}" style="color: #f59e0b;">${isAdminInvite ? 'Admin' : 'Employee'} Login →</a></p>
            <p style="color: #888; font-size: 13px; margin-top: 24px;">
              ${isAdminInvite ? 'As an Admin/Owner you\'ll have full access to all management features.' : 'As an Employee you\'ll have access to the QR scanner and customer directory.'}
            </p>
            <p style="color: #666; font-size: 12px; margin-top: 32px; border-top: 1px solid #333; padding-top: 16px;">
              This invitation was sent by ${businessName}.
            </p>
          </div>
        `,
      }),
    });

    const emailData = await emailRes.json();

    if (!emailRes.ok) {
      console.error('Resend API error:', emailData);
      return Response.json({ success: true, user_created: true, email_sent: false, email_error: emailData.message });
    }

    return Response.json({ success: true, user_created: !existingUsers.find(u => u.email === email), email_sent: true });

  } catch (error) {
    console.error('Invite employee error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});