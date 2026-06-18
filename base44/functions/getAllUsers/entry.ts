import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and employees can access this endpoint
    if (user.role !== 'owner_admin' && user.role !== 'admin' && user.role !== 'employee') {
      return Response.json({ error: 'Forbidden: Staff access required' }, { status: 403 });
    }

    // Use service role to get all users (bypasses RLS restrictions)
    // Fetch up to 500 users to ensure all are included
    const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 500);
    
    // Return all users with their roles
    return Response.json({ 
      users: allUsers.map(u => ({
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        role: u.role,
        created_date: u.created_date
      }))
    });
  } catch (error) {
    console.error('Get all users error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});