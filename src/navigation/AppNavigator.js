// Add this inside your navigation container configuration
const linking = {
  prefixes: ['sportea://'],
  config: {
    screens: {
      // Add your authentication screens here
      Login: 'login',
      SignUp: 'signup',
      ResetPassword: 'reset-password',
      EmailConfirmation: 'email-confirmation', // Add this screen to handle email confirmations
    },
  },
};

// Then make sure your NavigationContainer uses this linking configuration:
// <NavigationContainer linking={linking}> 