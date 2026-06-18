import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can send invitations
    if (user.role !== 'owner_admin' && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    // Send platform invitation (this creates the platform account and sends email)
    await base44.users.inviteUser(email, 'user');

    return Response.json({ 
      success: true, 
      message: 'Platform invitation sent. User will receive an email to set up their password.'
    });
  } catch (error) {
    console.error('Send platform invite error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});