import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow this if the user is currently a plain 'user' (fresh signup)
    // This prevents role escalation to admin/owner via this endpoint
    if (user.role !== 'user') {
      return Response.json({ error: 'Role already set' }, { status: 400 });
    }

    await base44.asServiceRole.entities.User.update(user.id, { role: 'employee' });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});