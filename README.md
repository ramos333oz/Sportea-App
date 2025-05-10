# Sportea

Sportea is a mobile application designed to connect sports enthusiasts, facilitate team organization, and enhance the overall sports community experience.


## 📱 Features

- **User Authentication**: Secure sign-up, login, and email confirmation
- **Profile Management**: Create and customize user profiles
- **Game Organization**: Create, join, and manage sports events
- **Team Building**: Form teams and invite other users
- **Location Services**: Find nearby sports facilities and events
- **Real-time Updates**: Get notifications for game changes and team activities

## 🛠️ Technologies Used

- **Frontend**: React Native, Expo
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **State Management**: React Context API
- **Styling**: React Native Paper, StyleSheet
- **Navigation**: React Navigation
- **Data Storage**: AsyncStorage for local data

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or newer)
- npm or yarn
- Expo CLI
- Android Studio (for Android development) or Xcode (for iOS development)
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ramos333oz/Sportea-App.git
cd Sportea-App
```

2. Install dependencies:
```bash
npm install
```

3. Install required Babel plugin (critical for module resolution):
```bash
npm install --save-dev babel-plugin-module-resolver
```

4. Make sure you have the correct versions of these critical packages:
```bash
npm install @react-native-async-storage/async-storage@1.21.0 @react-native-community/datetimepicker@7.7.0 react-native@0.73.6
```

5. Create a `.env` file in the root directory with your Supabase credentials:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

6. Ensure a valid logo exists for the app by creating a PNG file at `assets/images/logo-placeholder.png`

7. Start the development server:
```bash
npx expo start --clear
```

8. Run on Android or iOS:
```bash
# For Android
npx expo start --android --clear

# For iOS
npx expo start --ios --clear
```

## 📊 Detailed Database Setup

### Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and create a new project
2. Note your project URL and anon key (public API key) for your `.env` file

### Authentication Setup

1. In the Supabase dashboard, go to **Authentication** → **Providers**
2. Ensure "Email" is enabled and "Confirm Email" is checked
3. Configure Site URL and Redirect URLs (critical for email confirmation):
   - **Site URL**: `http://localhost:8083` (for development)
   - **Redirect URLs**: Add both `http://localhost:8083` and `sportea://`

### Database Schema

Create the following tables with these fields:

#### profiles

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  sports TEXT[],
  skill_level INTEGER DEFAULT 1
);
```

#### games

```sql
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sport_type TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  max_participants INTEGER DEFAULT 0,
  skill_level INTEGER DEFAULT 1,
  is_private BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active'
);
```

### Row Level Security (RLS) Policies

Set up proper RLS policies to ensure data security. Here are the essential policies:

#### profiles table

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read any profile
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

#### games table

```sql
-- Enable RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Anyone can view active games
CREATE POLICY "Anyone can view active games"
  ON games FOR SELECT
  USING (status = 'active');

-- Only creator can insert a game
CREATE POLICY "Authenticated users can create games"
  ON games FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

-- Only creator can update a game
CREATE POLICY "Creators can update their games"
  ON games FOR UPDATE
  USING (auth.uid() = creator_id);
```

## 🔗 Deep Linking Configuration

### App Configuration

1. Ensure your `app.json` has the proper configuration:

```json
{
  "expo": {
    "name": "Sportea",
    "slug": "sportea",
    "scheme": "sportea",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "updates": {
      "fallbackToCacheTimeout": 0
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

### Setting Up Email Confirmation Screen

The app needs a screen to handle email confirmation links. Ensure you have:

1. An `EmailConfirmationScreen.tsx` in the `src/screens` directory
2. The screen properly handles the email confirmation token from the URL
3. The screen is registered in the navigation stack in `AuthNavigator.tsx`

## 🛠️ Babel Configuration

Make sure your `babel.config.js` is set up correctly:

```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          alias: {
            '@components': './src/components',
            '@screens': './src/screens',
            '@navigation': './src/navigation',
            '@hooks': './src/hooks',
            '@utils': './src/utils',
            '@services': './src/services',
            '@constants': './src/constants',
            '@types': './src/types',
            '@assets': './assets',
          },
        },
      ],
    ],
  };
};
```

## 🐞 Troubleshooting Common Issues

### Email Confirmation Issues

- Make sure Supabase redirect URLs include both `http://localhost:8083` and `sportea://`
- Ensure the email confirmation URL properly launches your app with deep linking
- Test deep links on the device/emulator where the app is installed, not on a computer browser

### Module Resolution Errors

If you encounter errors related to module resolution:

```
Error: Cannot find module 'babel-plugin-module-resolver'
```

Run:
```bash
npm install --save-dev babel-plugin-module-resolver
```

### BOM Character Issues in Files

If you see errors like `Unexpected character ''`:

1. Delete the corrupted file:
```bash
rm src/screens/EmailConfirmationScreen.tsx
```

2. Create a new file with proper encoding:
```bash
# On Windows PowerShell:
New-Item -Path src/screens/EmailConfirmationScreen.tsx -ItemType File -Force
```

3. Edit the file to add the correct content.

### Empty File Errors

If you see errors like `Error: assets\images\logo-placeholder.png: Empty file`:

1. Make sure the file exists and has content:
```bash
# Create the directory if it doesn't exist
mkdir -p assets/images

# Create a placeholder logo (on Windows PowerShell)
Copy-Item path/to/existing/image.png assets/images/logo-placeholder.png
```

### Metro Bundler Cache Issues

If you experience strange bundling errors:

```bash
# Clear the cache and restart
npx expo start --clear
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a pull request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- [Your Name] - Initial work - [ramos333oz](https://github.com/ramos333oz)

## 🙏 Acknowledgments

- Hat tip to the React Native and Expo communities
- Supabase for providing an excellent backend solution 

## Testing with Expo Go

To test the app on your mobile device using Expo Go:

1. Make sure your computer and phone are on the same WiFi network
2. Run the app with the special port configuration:
   ```
   npm run start-expo-go
   ```
3. Scan the QR code with your iPhone camera app or directly from the Expo Go app on Android
4. The app will open in Expo Go

### Authentication with Supabase

For authentication to work properly in Expo Go:

1. Make sure your Supabase project has the correct Site URL configured:
   - Go to Authentication → URL Configuration
   - Add `exp://10.0.2.2:8083` to your Site URLs
   - Add `exp://10.0.2.2:8083` to your Redirect URLs

2. If testing on a real device, you might need to use your computer's local IP instead:
   - Find your computer's IP address on your network
   - Use `exp://YOUR_IP_ADDRESS:8083` in Supabase configuration
   - Also update this in the `getRedirectUrl()` function in App.js

3. Troubleshooting authentication issues:
   - Check network errors in the Expo developer tools
   - Ensure your device can reach the Supabase server
   - The app forces login screen display for testing (modify App.js to change this behavior) 

## Testing with Emulators

For testing the app in emulators (recommended for development):

1. First, set up the correct URLs in Supabase using our helper script:
   ```
   npm run setup-urls
   ```
   This will output all the URLs you need to add to your Supabase configuration.

2. Configure Supabase:
   - Go to Authentication → URL Configuration
   - Set Site URL to:
   
   - Add ALL of these to Redirect URLs:
   

3. Run the app in your emulator:
   ```
   # For Android emulator
   npm run emulator-android

   # For iOS simulator
   npm run emulator-ios
   ```

### Troubleshooting Emulator Issues

- **Android Emulator Network Issues**: If the Android emulator cannot connect, make sure it has internet access
- **iOS Simulator Authentication Problems**: Check that you're using `exp://localhost:8083` in Supabase configuration
- **Login Screen Not Showing**: The app is configured to always show the login screen for testing (see App.js) 
=======
## 🔄 Recent Development Updates (Latest)

### Supabase Integration & Authentication
- ✅ Successfully integrated Supabase backend (Region: ap-southeast-1)
- ✅ Implemented secure authentication system with auto-login
- ✅ Added logout functionality with confirmation dialog
- ✅ Set up proper error handling and user feedback

### Database Structure
- ✅ Created and configured essential tables:
  - profiles (with RLS policies)
  - games (with location tracking)
  - participants
  - game_chats
  - user_preferences
- ✅ Implemented Row Level Security (RLS)
- ✅ Added automatic profile creation triggers

### UI/UX Improvements
- ✅ Enhanced ProfileScreen with user management
- ✅ Improved FindGamesScreen functionality
- ✅ Added Settings modal with logout
- ✅ Implemented loading states and error feedback

### Technical Enhancements
- ✅ Fixed TypeScript type definitions
- ✅ Implemented proper database constants
- ✅ Added error handling with mock data fallback
- ✅ Resolved table reference issues

[Previous content remains unchanged...]

