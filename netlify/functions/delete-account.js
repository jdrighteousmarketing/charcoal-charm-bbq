const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({
          error: 'Method not allowed. Use POST.',
        }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing request body.',
        }),
      };
    }

    const { userId } = JSON.parse(event.body);

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing userId',
        }),
      };
    }

    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message,
      }),
    };
  }
};