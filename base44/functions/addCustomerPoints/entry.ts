import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only employees and admins can add points
    if (user.role !== 'employee' && user.role !== 'owner_admin' && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { customer_id, points, description } = await req.json();

    if (!customer_id || !points) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get customer profile
    const customerProfile = await base44.entities.CustomerProfile.get(customer_id);
    if (!customerProfile) {
      return Response.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Update points balance
    const newBalance = (customerProfile.points_balance || 0) + points;
    const newTotal = (customerProfile.total_points_earned || 0) + points;

    await base44.entities.CustomerProfile.update(customer_id, {
      points_balance: newBalance,
      total_points_earned: newTotal,
    });

    // Create transaction record
    await base44.entities.PointTransaction.create({
      customer_profile_id: customer_id,
      points: points,
      type: 'earned',
      description: description || 'Points added by staff',
    });

    return Response.json({ 
      success: true, 
      new_balance: newBalance,
      message: `Added ${points} points to ${customerProfile.name || customerProfile.email}`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});