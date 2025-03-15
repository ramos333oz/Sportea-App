# Sportea App Development Roadmap

## Project Overview
Sportea is a mobile application for sports matchmaking at the university level. It allows students to find and join games hosted by other users, host their own games, and potentially integrate with the university's existing booking system (bsu.uitm.edu.my).

## Technology Stack
- **Frontend**: React Native with Expo
- **Backend**: Supabase (Authentication, Database, Storage)
- **Authentication**: Email-based (restricted to university emails)

## Phase 1: Project Setup and Foundation (Weeks 1-2)

### Week 1: Project Initialization
- [x] Create GitHub repository
- [ ] Initialize React Native Expo project with TypeScript
- [ ] Set up project structure following React Native best practices
- [ ] Install essential dependencies (React Navigation, UI libraries)
- [ ] Set up Supabase project and configure connection

### Week 2: Authentication System
- [ ] Implement user registration with university email validation
- [ ] Implement login functionality
- [ ] Create protected routes/screens
- [ ] Implement persistent authentication
- [ ] Design and implement onboarding flow

## Phase 2: User Profile and Core Screens (Weeks 3-4)

### Week 3: User Profile Implementation
- [ ] Design and implement user profile creation flow
- [ ] Implement sports preferences selection
- [ ] Implement skill level specification
- [ ] Implement availability schedule setting
- [ ] Create profile viewing and editing screens

### Week 4: Dashboard and Navigation
- [ ] Design and implement main dashboard
- [ ] Set up bottom tab navigation
- [ ] Implement notification center UI
- [ ] Create settings screen
- [ ] Implement theme support (light/dark mode)

## Phase 3: Game Management Features (Weeks 5-7)

### Week 5: Browse Games Feature
- [ ] Design and implement game browsing UI
- [ ] Implement filtering system (by sport, time, skill level, etc.)
- [ ] Create game details view
- [ ] Set up game data models in Supabase
- [ ] Implement API service for game retrieval

### Week 6: Game Creation Feature
- [ ] Design and implement game creation flow
- [ ] Create location selection interface
- [ ] Implement date/time picker
- [ ] Design player requirements specification UI
- [ ] Implement game publishing to Supabase

### Week 7: Game Participation & Management
- [ ] Implement join request system
- [ ] Create host management dashboard
- [ ] Implement request approval/rejection functionality
- [ ] Design and implement player list management
- [ ] Create game editing and cancellation features

## Phase 4: Matchmaking System (Weeks 8-9)

### Week 8: Basic Matchmaking Algorithm
- [ ] Design database queries for matchmaking
- [ ] Implement suggested games based on user preferences
- [ ] Create UI for matchmaking suggestions
- [ ] Implement player-to-player suggestions
- [ ] Create invitation system

### Week 9: Advanced Matchmaking Features
- [ ] Implement skill-based matchmaking
- [ ] Create availability-based suggestions
- [ ] Implement location proximity filtering
- [ ] Add historical preference tracking
- [ ] Create recommendation improvement system

## Phase 5: Notifications and Realtime Features (Weeks 10-11)

### Week 10: Notification System
- [ ] Set up Supabase realtime subscriptions
- [ ] Implement in-app notification UI
- [ ] Create notification management system
- [ ] Implement push notification setup (Expo)
- [ ] Design different notification types UI

### Week 11: Realtime Updates
- [ ] Implement realtime game status updates
- [ ] Create realtime player list updates
- [ ] Implement realtime chat (if time permits)
- [ ] Add typing indicators (if implementing chat)
- [ ] Test realtime performance

## Phase 6: Court Booking System (Weeks 12-13)

### Week 12: Court Management
- [ ] Design court database schema
- [ ] Implement court browsing UI
- [ ] Create court availability visualization
- [ ] Implement court filtering system
- [ ] Design booking flow mockup (for future integration)

### Week 13: Booking System UI
- [ ] Implement booking UI components
- [ ] Create booking confirmation flow
- [ ] Implement booking management screens
- [ ] Design system for future API integration
- [ ] Implement booking cancellation UI

## Phase 7: Testing, Optimization and Deployment (Weeks 14-16)

### Week 14: Testing
- [ ] Implement unit tests for critical components
- [ ] Conduct user testing with university students
- [ ] Fix identified bugs and issues
- [ ] Optimize app performance
- [ ] Conduct cross-device testing

### Week 15: Final Refinements
- [ ] Polish UI/UX
- [ ] Implement feedback from user testing
- [ ] Create app screenshots for store listings
- [ ] Write app description and marketing materials
- [ ] Prepare privacy policy and terms of service

### Week 16: Deployment
- [ ] Generate production build
- [ ] Deploy Supabase backend to production
- [ ] Configure production environment variables
- [ ] Prepare for app store submission
- [ ] Create demo video and presentation for final year project

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