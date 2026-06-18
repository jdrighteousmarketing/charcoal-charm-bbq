import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // Allow admin, owner_admin, or platform collaborators
    const isAdmin = user?.role === 'owner_admin' || user?.role === 'admin' || ['editor', 'admin', 'owner'].includes(user?.collaborator_role);
    if (!user || !isAdmin) {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { user_id, new_role } = await req.json();

    if (!user_id || !new_role) {
      return Response.json({ error: 'user_id and new_role are required' }, { status: 400 });
    }

    // Use service role to update user
    await base44.asServiceRole.entities.User.update(user_id, { role: new_role });

    return Response.json({ success: true, message: `User role updated to ${new_role}` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});