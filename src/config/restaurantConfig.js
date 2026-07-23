// @ts-nocheck
export const restaurantConfig = {
  // =========================================================================
  // Restaurant Identity
  // =========================================================================
  // Never change this after the restaurant is created.
  // It uniquely identifies the restaurant throughout the database.
  id: 'charcoal_charm_bbq',
  customerCodePrefix: 'CCB',
  // =========================================================================
  // Branding
  // =========================================================================
  appName:
    import.meta.env.VITE_APP_NAME || 'Charcoal Charm BBQ',

  restaurantName:
    import.meta.env.VITE_RESTAURANT_NAME || 'Charcoal Charm BBQ',

  logo:
    import.meta.env.VITE_RESTAURANT_LOGO ||
    '/branding/logo.png',

  signupHeroImage:
    import.meta.env.VITE_SIGNUP_HERO_IMAGE ||
    '/branding/signup-hero.png',

    registerFooterImage: '/branding/register-footer.png',

  primaryColor:
    import.meta.env.VITE_PRIMARY_COLOR || '#FF5A00',

    authHeroImage: '/branding/auth-hero.png',

    emailHeaderUrl:
  'https://charcoal-charm-bbq.netlify.app/branding/email-header.png',

  // =========================================================================
  // Default Contact Information
  // =========================================================================
  defaultSupportEmail:
    import.meta.env.VITE_SUPPORT_EMAIL ||
    'charcoalcharmbbq@outlook.com',

  defaultPhone:
    import.meta.env.VITE_RESTAURANT_PHONE ||
    '270-634-4250',

  defaultAddress:
    import.meta.env.VITE_RESTAURANT_ADDRESS || '',

  defaultWebsite:
    import.meta.env.VITE_RESTAURANT_WEBSITE || '',

  // =========================================================================
  // Default Business Settings
  // =========================================================================
  defaultTagline:
    import.meta.env.VITE_DEFAULT_TAGLINE ||
    'Grilled to perfection, flavored with affection',

  defaultTaxRate: 0.06,

  defaultPointsPerDollar: 1,
};