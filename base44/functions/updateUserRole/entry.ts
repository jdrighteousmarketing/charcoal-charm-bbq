import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can update user roles
    if (user.role !== 'owner_admin' && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { user_id, role } = await req.json();

    if (!user_id || !role) {
      return Response.json({ error: 'user_id and role are required' }, { status: 400 });
    }

    // Validate role
    if (!['user', 'owner_admin', 'employee'].includes(role)) {
      return Response.json({ error: 'Invalid role. Must be one of: user, owner_admin, employee' }, { status: 400 });
    }

    // Update user role using service role
    await base44.asServiceRole.entities.User.update(user_id, { role });

    return Response.json({ 
      success: true, 
      message: `User role updated to ${role}`
    });
  } catch (error) {
    console.error('Update user role error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});