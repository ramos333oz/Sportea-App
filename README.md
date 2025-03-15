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

- Node.js (v14 or newer)
- npm or yarn
- Expo CLI
- Android Studio (for Android development) or Xcode (for iOS development)

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

3. Create a `.env` file in the root directory with your Supabase credentials:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npx expo start
```

5. Run on Android or iOS:
```bash
# For Android
npx expo start --android

# For iOS
npx expo start --ios
```

## 📋 Database Setup

Sportea uses Supabase for the backend. You'll need to set up the following:

1. Create a Supabase project
2. Set up authentication with email confirmation
3. Create the necessary tables:
   - profiles
   - games
   - teams
   - participants
   - team_members
4. Set up Row Level Security (RLS) policies to control data access

## 🧪 Development Notes

- Use `--clear` flag when running Expo to clear cache if encountering build issues:
```bash
npx expo start --clear
```

- Make sure to install the correct dependencies for Expo compatibility:
```bash
npm install @react-native-async-storage/async-storage@1.21.0 @react-native-community/datetimepicker@7.7.0 react-native@0.73.6
```

## 📱 Deep Linking Configuration

For email confirmation and other deep linking features, ensure the following:

1. Set up your app scheme in `app.json`:
```json
{
  "expo": {
    "scheme": "sportea"
  }
}
```

2. Configure Supabase site URL and redirect URLs:
   - Site URL: http://localhost:8083 (for development)
   - Redirect URLs: Include both http://localhost:8083 and sportea://

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a pull request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- [Your Name] - Initial work - [ramos333oz](https://github.com/ramos333oz)

## 🙏 Acknowledgments

- Hat tip to the React Native and Expo communities
- Supabase for providing an excellent backend solution 