import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.role !== 'owner_admin')) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all completed carts (orders)
    const carts = await base44.asServiceRole.entities.Cart.filter({ status: 'completed' });
    
    if (!carts || carts.length === 0) {
      return new Response('No completed orders found', {
        status: 200,
        headers: { 'Content-Type': 'text/csv' }
      });
    }

    // Build CSV content
    const csvRows = [];
    csvRows.push(['Order Date', 'Customer Name', 'Customer Email', 'Item Name', 'Quantity', 'Price', 'Subtotal', 'Points Earned']);

    for (const cart of carts) {
      // Get customer profile
      const customer = await base44.asServiceRole.entities.CustomerProfile.get(cart.customer_profile_id);
      const customerName = customer?.name || 'Unknown';
      const customerEmail = customer?.email || 'Unknown';
      
      // Get cart items
      const items = cart.items || [];
      const orderDate = new Date(cart.updated_date || cart.created_date).toLocaleDateString('en-US');
      
      for (const item of items) {
        const itemSubtotal = (item.price * item.quantity).toFixed(2);
        csvRows.push([
          orderDate,
          customerName,
          customerEmail,
          item.name,
          item.quantity,
          item.price.toFixed(2),
          itemSubtotal,
          cart.points_to_earn || 0
        ]);
      }
    }

    // Convert to CSV string
    const csvContent = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="customer_purchases.csv"'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});