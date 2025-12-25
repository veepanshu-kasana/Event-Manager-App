# VK Events - Event Management Platform

A modern, full-featured event management platform built with Next.js, React, TypeScript, and Supabase. Enables users to discover, register for events, and provides administrators with powerful tools to create and manage events.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [Deployment](#deployment)

## Features

### User Features
- **Event Discovery**: Browse upcoming events with detailed information
- **Event Registration**: One-click registration for events
- **My Events Dashboard**: Track registered and attended events
- **User Authentication**: Secure email-based signup and login with password recovery
- **Theme Support**: Dark/light mode toggle
- **Responsive Design**: Fully responsive UI for all devices

### Admin Features
- **Event Management**: Create, update, and delete events
- **Event Dashboard**: View all events (upcoming and past) with detailed analytics
- **User Management**: Monitor registered users, view user statistics, and manage user roles
- **Event Analytics**: See registration counts and event details
- **User Blocking**: Block/unblock users from the platform
- **AI-Powered Assistant**: Gemini AI chatbot for event management operations
- **Event Registrations View**: See all users registered for specific events
- **Banner Upload**: Upload custom banners for events

### Admin AI Assistant Features
- List all events (upcoming/past/all)
- Create new events with natural language
- Update event details
- Delete events
- Get event details and registrations
- Conversational management interface

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Runtime**: React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3
- **UI Components**: Radix UI + Custom components
- **Icons**: Lucide React
- **Theme**: next-themes (dark/light mode)
- **Markdown**: react-markdown

### Backend
- **Runtime**: Node.js
- **API**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (for event banners)
- **AI**: Google Generative AI (Gemini)
- **Date Parsing**: chrono-node

### Development
- **Linting**: ESLint 9
- **Testing**: Jest 30
- **Build Tool**: Turbopack
- **Package Manager**: npm/yarn

## Project Structure

```
event-app/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with Navbar & ChatBot
│   ├── page.tsx                 # Home page (hero)
│   ├── globals.css              # Global styles
│   ├── auth/                    # Authentication pages
│   │   ├── login/page.tsx       # Login page
│   │   ├── sign-up/page.tsx     # Sign up page
│   │   ├── confirm/route.ts     # Email confirmation handler
│   │   ├── forgot-password/page.tsx
│   │   ├── update-password/page.tsx
│   │   └── error/page.tsx       # Auth error page
│   ├── events/                  # Public events pages
│   │   ├── page.tsx             # All events listing
│   │   └── [id]/                # Event details & registration
│   │       ├── page.tsx
│   │       └── RegisterButton.tsx
│   ├── my-events/               # User's registered events
│   │   └── page.tsx
│   ├── admin/                   # Admin dashboard
│   │   ├── page.tsx             # Admin dashboard
│   │   ├── AdminForm/page.tsx   # Event creation/editing form
│   │   ├── users/               # User management
│   │   │   ├── page.tsx
│   │   │   └── UserRow.tsx
│   │   ├── events/[id]/registrations/page.tsx
│   │   ├── chat/                # Admin chat interface
│   │   └── DeleteEventButton.tsx
│   ├── protected/               # Protected route (redirect)
│   │   └── layout.tsx
│   └── api/                     # API routes
│       ├── auth/logout/route.ts
│       └── chat/                # Gemini AI chat API
│           ├── route.ts         # Main chat endpoint
│           ├── chat.ts          # Chat processing logic
│           └── tools.ts         # AI function tools
├── components/                  # Reusable React components
│   ├── ui/                      # Shadcn UI components
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   └── scroll-area.tsx
│   ├── Navbar.tsx               # Navigation bar
│   ├── ChatBot.tsx              # Admin AI assistant
│   ├── login-form.tsx           # Login form component
│   ├── sign-up-form.tsx         # Sign up form component
│   ├── logout-button.tsx        # Logout button
│   ├── BlockButton.tsx          # User block/unblock button
│   ├── DeleteButton.tsx         # Generic delete button
│   ├── auth-button.tsx
│   ├── theme-switcher.tsx       # Dark/light mode toggle
│   ├── forgot-password-form.tsx
│   ├── update-password-form.tsx
│   ├── ChatBot.tsx              # AI assistant interface
│   └── tutorial/                # Tutorial components
├── lib/                         # Utility functions
│   ├── utils.ts                 # Common utilities
│   └── supabase/                # Supabase integration
│       ├── client.ts            # Browser client
│       ├── server.ts            # Server client
│       └── middleware.ts        # Auth middleware
├── public/                      # Static assets
├── middleware.ts                # Next.js middleware
├── next.config.ts               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS config
├── tsconfig.json                # TypeScript config
├── package.json                 # Dependencies
├── jest.config.js               # Jest configuration
└── eslint.config.mjs            # ESLint configuration
```

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Google Generative AI API key (for chatbot)

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd event-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment variables**
   ```bash
   cp .env.example .env.local
   ```

4. **Configure environment variables** (see [Configuration](#configuration))

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Open browser**
   ```
   http://localhost:3000
   ```

## Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Generative AI (Gemini)
GEMINI_API_KEY=your_gemini_api_key

# Deployment URL (optional)
VERCEL_URL=your_vercel_url
```

### Supabase Setup

1. Create a new Supabase project
2. Execute SQL to create required tables:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user',
  is_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT now()
);

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP NOT NULL,
  banner_url TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now()
);

-- Registrations table
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  registered_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- Create storage bucket for event banners
INSERT INTO storage.buckets (id, name) VALUES ('event-banners', 'event-banners');
```

3. Set Row Level Security (RLS) policies for data protection

## Usage

### User Workflows

1. **Sign Up**
   - Navigate to `/auth/sign-up`
   - Enter email and password
   - Confirm email via link
   - Redirected to events page

2. **Browse Events**
   - View all upcoming events at `/events`
   - Click on event card for details
   - See registration count and event information

3. **Register for Event**
   - Click "Register" button on event details page
   - Confirmation message appears
   - Event added to "My Events"

4. **View My Events**
   - Navigate to `/my-events`
   - View upcoming and past registered events
   - Track event attendance

### Admin Workflows

1. **Access Admin Dashboard**
   - Must have admin role
   - Navigate to `/admin`
   - View all events with stats

2. **Create Event**
   - Click "Create Event" button
   - Fill in title, description, date, banner
   - Event appears in listings

3. **Manage Events**
   - Edit existing events via `/admin/AdminForm?id=event_id`
   - Delete events with confirmation
   - View event registrations

4. **Manage Users**
   - Navigate to `/admin/users`
   - View all registered users
   - Block/unblock users as needed
   - See user statistics

5. **Use AI Assistant**
   - Click chatbot icon (bottom-right, admin only)
   - Use natural language to manage events
   - Commands: list events, create event, delete event, etc.

## API Reference

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/sign-up` | Register new user |
| POST | `/auth/login` | Login user |
| POST | `/auth/logout` | Logout user |
| GET | `/auth/confirm` | Confirm email |
| POST | `/auth/forgot-password` | Reset password request |
| POST | `/auth/update-password` | Update password |

### Chat API (Admin Only)

**POST** `/api/chat`

Request body:
```json
{
  "messages": [
    {
      "role": "user",
      "content": "List all events"
    }
  ]
}
```

Response:
```json
{
  "reply": "Assistant response with formatted data"
}
```

Available chat commands:
- `list_events` - List upcoming/past/all events
- `create_event` - Create new event
- `update_event` - Update event details
- `delete_event` - Delete event
- `get_event_details` - Get event information
- `get_event_registrations` - Get registered users

## Database Schema

### Users Table
```sql
- id (UUID, PK)
- email (TEXT, UNIQUE)
- role (TEXT, default: 'user')
- is_blocked (BOOLEAN, default: false)
- created_at (TIMESTAMP)
```

### Events Table
```sql
- id (UUID, PK)
- title (TEXT)
- description (TEXT)
- date (TIMESTAMP)
- banner_url (TEXT)
- created_by (UUID, FK → users.id)
- created_at (TIMESTAMP)
```

### Registrations Table
```sql
- id (UUID, PK)
- user_id (UUID, FK → users.id)
- event_id (UUID, FK → events.id)
- registered_at (TIMESTAMP)
- UNIQUE(user_id, event_id)
```

## Authentication

The app uses Supabase Auth with the following features:

- **Email/Password**: Primary authentication method
- **Email Confirmation**: New users must confirm email
- **Password Recovery**: Forgot password flow with email verification
- **Session Management**: Automatic session handling with middleware
- **Role-Based Access**: Admin and user roles for authorization
- **User Blocking**: Admins can block/unblock users

### Auth Flow

1. User signs up with email/password
2. Confirmation email sent
3. User clicks confirmation link
4. Session established
5. User profile created in `public.users` table
6. Middleware maintains session across requests

## Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Visit vercel.com
   - Import repository
   - Add environment variables
   - Deploy

3. **Set Production URLs**
   - Update `NEXT_PUBLIC_SUPABASE_URL` if needed
   - Set `VERCEL_URL` for metadata

### Build & Start

```bash
# Build
npm run build

# Start production server
npm start
```

### Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## Performance Features

- **Turbopack**: Fast development builds
- **Image Optimization**: Next.js image optimization
- **Dark Mode**: Lightweight theme switching
- **Responsive Grid**: Mobile-first responsive design
- **Code Splitting**: Automatic route-based splitting
- **Type Safety**: Full TypeScript for reliability

## Security Features

- **Server-Side Rendering**: Sensitive data handled server-side
- **Row Level Security**: Supabase RLS policies
- **Authentication Middleware**: Protected route middleware
- **Admin Role Verification**: Authorization checks on protected endpoints
- **User Blocking**: Block malicious users
- **Secure Password Recovery**: Email-based verification
- **CORS Configured**: Secure cross-origin requests

## Development Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Run tests
npm test

# Watch tests
npm run test:watch

# Coverage report
npm run test:coverage

# CI/CD tests
npm run test:ci
```

## Contributing

1. Create feature branch: `git checkout -b feature/feature-name`
2. Commit changes: `git commit -m 'Add feature'`
3. Push to branch: `git push origin feature/feature-name`
4. Open pull request

## License

MIT License - See LICENSE file for details

## Creator

**Veepanshu Kasana**
- LinkedIn: [veepanshu-kasana](https://www.linkedin.com/in/veepanshu-kasana)
- Platform: VK Events

## Support

For issues, questions, or suggestions, please open an GitHub issue or contact the development team.

---

**VK Events** - Modern Event Management Platform Built with Next.js
