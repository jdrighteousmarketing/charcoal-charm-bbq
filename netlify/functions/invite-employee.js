const { createClient } = require('@supabase/supabase-js');

const RESTAURANT_ID = process.env.RESTAURANT_ID;
const APP_URL = process.env.APP_URL;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!RESTAURANT_ID) {
  throw new Error('Missing RESTAURANT_ID environment variable.');
}

if (!APP_URL) {
  throw new Error('Missing APP_URL environment variable.');
}

if (!SUPABASE_URL) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable.');
}

if (!SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}

function getBearerToken(event) {
  const authorization =
    event.headers?.authorization ||
    event.headers?.Authorization ||
    '';

  if (!authorization.startsWith('Bearer ')) {
    return '';
  }

  return authorization.slice(7).trim();
}

async function requireRestaurantAdmin(event) {
  const accessToken = getBearerToken(event);

  if (!accessToken) {
    const error = new Error(
      'Your administrator session is missing. Please sign in again.'
    );
    error.statusCode = 401;
    throw error;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);

  if (userError || !user) {
    const error = new Error(
      'Your administrator session is invalid or expired. Please sign in again.'
    );
    error.statusCode = 401;
    throw error;
  }

  const { data: admin, error: adminError } = await supabase
    .from('admins')
    .select('id, auth_user_id, restaurant_id, role, is_active')
    .eq('auth_user_id', user.id)
    .eq('restaurant_id', RESTAURANT_ID)
    .eq('is_active', true)
    .maybeSingle();

  if (adminError) {
    throw new Error(
      `Could not verify administrator access: ${adminError.message}`
    );
  }

  if (!admin) {
    const error = new Error(
      'You do not have administrator access for this restaurant.'
    );
    error.statusCode = 403;
    throw error;
  }

  if (String(admin.role || '').toLowerCase() !== 'admin') {
    const error = new Error(
      'Only an active administrator can invite employees.'
    );
    error.statusCode = 403;
    throw error;
  }

  return user;
}

async function findAuthUserIdByEmail(email) {
  const { data, error } = await supabase.rpc(
    'get_auth_user_id_by_email',
    {
      lookup_email: email,
    }
  );

  if (error) {
    throw new Error(
      `Could not check the existing authentication account: ${error.message}`
    );
  }

  return data || null;
}

async function findEmployeeMembership(authUserId) {
  const { data, error } = await supabase
    .from('employees')
    .select(
      'id, restaurant_id, auth_user_id, full_name, email, role, status, is_active'
    )
    .eq('restaurant_id', RESTAURANT_ID)
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Could not check employee membership: ${error.message}`
    );
  }

  return data || null;
}

async function resolveAuthUser(email, fullName) {
  let authUserId = await findAuthUserIdByEmail(email);

  if (authUserId) {
    return {
      authUserId,
      existingAccount: true,
      invitationSent: false,
    };
  }

  const redirectUrl = `${APP_URL.replace(/\/+$/, '')}/employee-login`;

  const { data: inviteData, error: inviteError } =
    await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectUrl,
      data: {
        full_name: fullName,
        role: 'employee',
        restaurant_id: RESTAURANT_ID,
      },
    });

  if (!inviteError && inviteData?.user?.id) {
    return {
      authUserId: inviteData.user.id,
      existingAccount: false,
      invitationSent: true,
    };
  }

  /*
   * The account may have been created between the first lookup
   * and the invitation request. Check again before returning an error.
   */
  authUserId = await findAuthUserIdByEmail(email);

  if (authUserId) {
    return {
      authUserId,
      existingAccount: true,
      invitationSent: false,
    };
  }

  throw new Error(
    inviteError?.message ||
      'Supabase could not create the employee invitation.'
  );
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, {
      error: 'Method not allowed. Use POST.',
    });
  }

  try {
    await requireRestaurantAdmin(event);

    let requestBody;

    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch {
      return jsonResponse(400, {
        error: 'The employee invitation request is not valid JSON.',
      });
    }

    const normalizedEmail = String(requestBody.email || '')
      .trim()
      .toLowerCase();

    const normalizedName = String(requestBody.fullName || '').trim();

    if (!normalizedEmail) {
      return jsonResponse(400, {
        error: 'Missing employee email.',
      });
    }

    if (!normalizedEmail.includes('@')) {
      return jsonResponse(400, {
        error: 'Please enter a valid employee email address.',
      });
    }

    const {
      authUserId,
      existingAccount,
      invitationSent,
    } = await resolveAuthUser(normalizedEmail, normalizedName);

    const existingMembership =
      await findEmployeeMembership(authUserId);

    if (existingMembership) {
      return jsonResponse(409, {
        error:
          'This person already has employee access for this restaurant.',
      });
    }

    const { error: employeeError } = await supabase
      .from('employees')
      .insert([
        {
          restaurant_id: RESTAURANT_ID,
          auth_user_id: authUserId,
          full_name: normalizedName,
          email: normalizedEmail,
          role: 'employee',
          status: existingAccount ? 'active' : 'invited',
          is_active: true,
        },
      ]);

    if (employeeError) {
      if (employeeError.code === '23505') {
        return jsonResponse(409, {
          error:
            'This person already has employee access for this restaurant.',
        });
      }

      throw new Error(
        `Could not create employee membership: ${employeeError.message}`
      );
    }

    const message = existingAccount
      ? 'Employee access added. This person already has JD Righteous LLC login credentials and should sign in using their existing email and password.'
      : 'Employee invitation sent successfully. They should check their email to finish setting up access.';

    return jsonResponse(200, {
      success: true,
      authUserId,
      existingAccount,
      invitationSent,
      restaurantId: RESTAURANT_ID,
      message,
    });
  } catch (error) {
    console.error('Employee invitation failed:', error);

    return jsonResponse(error?.statusCode || 500, {
      error:
        error?.message || 'Failed to invite employee.',
    });
  }
};