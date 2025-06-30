# PigeonSub - Subscription Management with Voice Reminders

## Overview

PigeonSub is a modern subscription management application that helps users track their recurring subscriptions with a unique voice reminder feature. The application uses a playful "pigeon" theme with the tagline "Comment être un pigeon... et s'en sortir" (How to be a pigeon... and get out of it), suggesting it helps users avoid overpaying for unused subscriptions.

## System Architecture

The application follows a full-stack TypeScript architecture with clear separation between client and server:

- **Frontend**: React with Vite, TypeScript, and shadcn/ui components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS with custom design system
- **Voice Integration**: ElevenLabs API for text-to-speech generation

## Key Components

### Frontend Architecture
- **React + TypeScript**: Modern React setup with TypeScript for type safety
- **Vite**: Fast development server and build tool
- **shadcn/ui**: Comprehensive UI component library built on Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom color scheme
- **React Query**: Data fetching and caching with optimistic updates
- **Wouter**: Lightweight client-side routing
- **React Hook Form**: Form management with Zod validation

### Backend Architecture
- **Express.js**: RESTful API server with TypeScript
- **Drizzle ORM**: Type-safe database operations with PostgreSQL
- **Zod**: Schema validation for API requests
- **Session Management**: PostgreSQL session store for user sessions

### Database Schema
Two main entities:
- **Subscriptions**: Core subscription data (name, price, frequency, category, usage patterns, renewal dates)
- **Voice Reminders**: Generated audio reminders linked to subscriptions

### Voice Integration
- **ElevenLabs API**: Text-to-speech generation for subscription reminders
- **Audio Storage**: Base64 encoded audio data for voice reminders
- **Reminder Types**: Renewal alerts, usage reviews, and trial ending notifications

## Data Flow

1. **Subscription Management**: Users create/edit subscriptions through forms with comprehensive validation
2. **Voice Generation**: Text prompts are sent to ElevenLabs API to generate audio reminders
3. **Real-time Updates**: React Query handles optimistic updates and cache invalidation
4. **Audio Playback**: Generated audio is played directly in the browser using HTML5 Audio API

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database driver
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitives
- **react-hook-form**: Form handling
- **zod**: Schema validation
- **date-fns**: Date manipulation

### Voice Integration
- **ElevenLabs API**: External text-to-speech service requiring API key
- **Environment Variables**: `ELEVEN_LABS_API_KEY` or `ELEVENLABS_API_KEY`

### Development Tools
- **Vite**: Build tool and development server
- **tsx**: TypeScript execution for development
- **esbuild**: Production bundling

## Deployment Strategy

### Development Mode
- `npm run dev`: Starts development server with hot reload
- Uses tsx for TypeScript execution
- Vite serves frontend with proxy to backend API

### Production Build
- `npm run build`: Creates optimized production build
- Frontend built to `dist/public`
- Backend bundled to `dist/index.js`
- `npm start`: Runs production server

### Database Setup
- `npm run db:push`: Applies schema changes to database
- Requires `DATABASE_URL` environment variable
- Uses Drizzle migrations in `migrations/` directory

### Environment Requirements
- **DATABASE_URL**: PostgreSQL connection string
- **ELEVEN_LABS_API_KEY**: ElevenLabs API key for voice generation
- **NODE_ENV**: Environment flag (development/production)

## Changelog
- June 30, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.