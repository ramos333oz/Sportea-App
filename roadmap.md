# Sportea App Development Roadmap

## Project Overview
Sportea is a mobile application for sports matchmaking at the university level. It allows students to find and join games hosted by other users and host their own games. This is a simple mobile application that is intended to be used for students to discover new teammmates as well as upcoming games that they could join themselves into. With the existances of this mobile application, students are able to seamlessly connect themselves with others, without needing to reach-out separately. The core of this mobile app us to allow students to host a match or join a match.

## Technology Stack
- **Frontend**: React Native with Expo
- **Backend**: Supabase (Authentication, Database, Storage)
- **Authentication**: Email-based (restricted to university emails)

## Phase 1: Project Setup and Foundation (Weeks 1-2)

### Week 1: Project Initialization
- [x] Create GitHub repository
- [x] Initialize React Native Expo project with TypeScript
- [x] Set up project structure following React Native best practices
- [x] Install essential dependencies (React Navigation, UI libraries)
- [x] Set up Supabase project and configure connection

### Week 2: Authentication System
- [x] Implement user registration with university email validation
- [x] Implement login functionality
- [x] Create protected routes/screens
- [x] Implement persistent authentication
- [x] Design and implement onboarding flow

## Phase 2: User Profile and Core Screens (Weeks 3-4)

### Week 3: User Profile Implementation
- [x] Design and implement user profile creation flow
- [x] Implement sports preferences selection
- [x] Implement skill level specification
- [x] Implement availability schedule setting
- [x] Create profile viewing and editing screens

### Week 4: Dashboard and Navigation
- [x] Design and implement main dashboard
- [x] Set up bottom tab navigation
- [x] Implement notification center UI
- [x] Create settings screen
- [x] Implement theme support (light/dark mode)

## Phase 3: Game Management Features (Weeks 5-7)

### Week 5: Browse Games Feature
- [x] Design and implement game browsing UI
- [x] Implement filtering system (by sport, time, skill level, etc.)
- [x] Create game details view
- [x] Set up game data models in Supabase
- [x] Implement API service for game retrieval

### Week 6: Game Creation Feature
- [x] Design and implement game creation flow
- [x] Create location selection interface
- [x] Implement date/time picker
- [x] Design player requirements specification UI
- [x] Implement game publishing to Supabase

### Week 7: Game Participation & Management
- [x] Implement join request system
- [x] Create host management dashboard
- [x] Implement request approval/rejection functionality
- [x] Design and implement player list management
- [x] Create game editing and cancellation features

## Phase 4: Matchmaking System (Weeks 8-9)

### Week 8: Basic Matchmaking Algorithm
- [x] Design database queries for matchmaking
- [x] Implement suggested games based on user preferences
- [x] Create UI for matchmaking suggestions
- [x] Create invitation system

### Week 9: Advanced Matchmaking Features
- [x] Implement skill-based matchmaking
- [x] Create availability-based suggestions
- [x] Implement location proximity filtering
- [x] Add historical preference tracking
- [x] Create recommendation improvement system

### Week 9.5: Match Management Enhancements
- [x] Implement match deletion functionality
- [x] Add confirmation dialogs for match actions
- [x] Ensure proper cleanup of related data
- [x] Implement proper error handling for match operations

## Phase 5: Notifications and Realtime Features (Weeks 10-11)

### Week 10: Notification System
- [x] Set up Supabase realtime subscriptions
- [x] Implement in-app notification UI
- [x] Create notification management system
- [x] Implement push notification setup (Expo)
- [x] Design different notification types UI

### Week 11: Realtime Updates
- [x] Implement realtime game status updates
- [x] Create realtime player list updates
- [x] Enhance realtime game hosting display
- [x] Implement detailed event handling for realtime updates
- [x] Add proper error handling for realtime subscriptions

## Phase 6: Court Booking System (Weeks 12-13)

### Week 12: Court Management
- [x] Design court database schema
- [x] Implement court browsing UI
- [x] Create court availability visualization
- [x] Implement court filtering system
- [x] Design booking flow mockup (for future integration)

### Week 13: Booking System UI
- [x] Implement booking UI components
- [x] Create booking confirmation flow
- [x] Implement booking management screens
- [x] Design system for future API integration
- [x] Implement booking cancellation UI

## Phase 7: Testing, Optimization and Deployment (Weeks 14-16)

### Week 14: Testing
- [x] Implement unit tests for critical components
- [x] Conduct user testing with university students
- [x] Fix identified bugs and issues
  - [x] Fix match deletion functionality
  - [x] Enhance realtime subscription for game hosting
- [x] Optimize app performance
- [x] Conduct cross-device testing

### Week 15: Final Refinements
- [x] Polish UI/UX
- [x] Implement feedback from user testing
- [x] Create app screenshots for store listings
- [x] Write app description and marketing materials
- [x] Prepare privacy policy and terms of service

### Week 16: Deployment
- [x] Generate production build
- [x] Deploy Supabase backend to production
- [x] Configure production environment variables
- [x] Prepare for app store submission
- [x] Create demo video and presentation for final year project

## Database Structure

### Tables

1. **users**
   - id (primary key)
   - email (university email)
   - full_name
   - avatar_url
   - created_at
   - last_login

2. **profiles**
   - id (primary key, references users.id)
   - bio
   - university_id
   - year_of_study
   - faculty
   - availability_schedule (JSON)
   - created_at
   - updated_at

3. **sports_preferences**
   - id (primary key)
   - user_id (references users.id)
   - sport_id (references sports.id)
   - skill_level (beginner, intermediate, advanced, pro)
   - is_favorite
   - created_at

4. **sports**
   - id (primary key)
   - name
   - icon_url
   - min_players
   - max_players
   - created_at

5. **games**
   - id (primary key)
   - host_id (references users.id)
   - sport_id (references sports.id)
   - title
   - description
   - location_id (references locations.id)
   - court_id (references courts.id)
   - start_time
   - end_time
   - required_players
   - skill_level_required
   - status (open, full, canceled, completed)
   - created_at
   - updated_at

6. **game_participants**
   - id (primary key)
   - game_id (references games.id)
   - user_id (references users.id)
   - status (pending, approved, rejected, left)
   - joined_at
   - updated_at

7. **locations**
   - id (primary key)
   - name
   - address
   - latitude
   - longitude
   - created_at

8. **courts**
   - id (primary key)
   - location_id (references locations.id)
   - name
   - sport_id (references sports.id)
   - capacity
   - is_indoor
   - image_url
   - created_at

9. **bookings**
   - id (primary key)
   - court_id (references courts.id)
   - user_id (references users.id)
   - game_id (references games.id)
   - start_time
   - end_time
   - status (pending, confirmed, canceled)
   - external_booking_id (for future integration)
   - created_at
   - updated_at

10. **notifications**
    - id (primary key)
    - user_id (references users.id)
    - type (game_invite, join_request, game_update, etc.)
    - content
    - reference_id (can reference different tables based on type)
    - is_read
    - created_at

## Future Enhancements (Post-MVP)

1. **Integration with University Booking System**
   - Develop API integration with bsu.uitm.edu.my
   - Implement two-way synchronization of bookings
   - Add SSO with university credentials

2. **Social Features**
   - Friend/teammate system
   - Team creation and management
   - Performance statistics and history

3. **Competitive Features**
   - Tournaments organization
   - Leaderboards
   - Achievement system

4. **Additional Features**
   - Equipment sharing/rental
   - Coach/training session booking
   - Sports events calendar