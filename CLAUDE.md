# ChromeBuilder Pro - AI Development Guide

## Project Overview
ChromeBuilder Pro is a web application enabling non-technical users to create, manage, and deploy Chrome Extensions through a conversational AI interface. The application provides an end-to-end solution from ideation to deployment, leveraging the Anthropic API for Claude 3.7 Sonnet to translate natural language descriptions into functional extension components.

## Technical Architecture

### Frontend
- Next.js 14+ application with app router
- React 18 using functional components and hooks
- TypeScript for comprehensive type safety
- Tailwind CSS with Radix UI components
- Monaco Editor for code editing capabilities
- Zustand for state management
- Light and Dark theme toggle (dark theme default)
- Modern, clean, elegant design

### Backend
- Serverless functions for API processing
- Claude API integration via secure proxy
- Supabase for database and authentication
- File storage system for projects and templates
- Webhook support for deployment events

## Core Components & Features

### 1. Project Management System
- Complete project lifecycle (create, edit, delete)
- Template selection for quick-start projects
- File management for all extension components
- Project versioning and deployment history
- Organization of multiple extension projects

### 2. Extension Component Builder
- Visual manifest.json editor for extension configuration
- Dedicated component creators for:
  - Popup interfaces (HTML/CSS/JS)
  - Background scripts
  - Content scripts
  - Options pages
  - Service workers
- Drag-and-drop functionality for component assembly
- Real-time validation of component configurations

### 3. AI Assistant Integration (Claude 3.7 Sonnet)
- User-supplied Anthropic API key for Claude 3.7 Sonnet
- Secure proxy service for Claude API integration
- System prompting with extension-specific knowledge
- Intelligent code generation from natural language descriptions
- Code explanation and documentation on demand
- Bug fixing and optimization suggestions
- Conversation history management for context preservation
- Token usage optimization for responsive AI interactions

### 4. Chrome API Simulation Environment
- Testing environment that mocks Chrome extension APIs
- Visual preview of extension components
- Interactive debugging interface
- Simulation for core APIs (storage, tabs, messaging)
- Event simulation (tab changes, clicks, etc.)
- Detailed logging of API calls and responses

### 5. Authentication & User Management (Supabase)
- Email and social login authentication
- User profiles and customizable settings
- API key management for Claude integration
- Project access controls and permissions
- Sharing and collaboration features

### 6. Deployment System
- Extension packaging functionality (ZIP generation)
- Version management and tracking
- Deployment history visualization
- Chrome Web Store publishing assistance
- Installation guides and tutorials

## Data Models

### Projects
- Basic metadata (name, description, version)
- Manifest configuration
- Component files (HTML/CSS/JS)
- Deployment history and versions
- Collaboration settings

### Templates
- 5 Predefined project structures
- Sample code and configurations
- Categories and difficulty levels
- Usage statistics

### User Settings
- API keys and preferences
- Project defaults
- UI customization options
- Tutorial progress tracking

## Key User Flows

### Project Creation Flow
1. User greeted by AI-builder agent
2. User prompted for unique project name
3. Project created and saved to database
4. User prompted to select template or start blank
5. System generates basic extension structure
6. User customizes manifest settings (name, description, permissions)
7. AI helps generate initial components based on user description
8. User iteratively improves with AI assistance

### AI-Assisted Development
1. User describes desired functionality in natural language
2. AI generates appropriate code (popup UI, scripts, etc.)
3. User can request explanations or modifications
4. AI suggests optimizations and bug fixes
5. Generated code automatically integrates with extension structure
6. AI assists with Chrome Web Store upload requirements:
   - Store listing details (name, description, category, screenshots)
   - Privacy practices (permissions justification, data handling)

### Testing & Debugging
1. User activates simulation mode with "Test" button
2. System provides mocked Chrome API environment
3. User interacts with extension components in preview
4. System logs API calls and responses for debugging
5. Visual feedback shows functionality in action

### Deployment
1. User finalizes extension components
2. System validates extension and packages into ZIP with proper structure
3. User downloads package for manual upload to Chrome Web Store
4. System stores deployment version history
5. Optional direct publishing assistance workflow

## Integration Requirements

### Claude API Integration
- Proxy service to protect API keys
- System prompting for extension-specific knowledge
- Conversation history management
- Token usage optimization
- Fallback mechanisms for API outages

### Chrome API Simulation
- Core API mocking (storage, tabs, messaging)
- Event simulation system
- Visual rendering of extension components
- API response customization tools
- Chrome manifest V3 specifications support

### Supabase Integration
- User authentication (email, social)
- Project and template storage systems
- File management and versioning
- Access control and permissions
- Real-time collaboration features

## User Experience Goals
- Accessibility: Intuitive interface for non-developers
- Educational: Explain concepts and provide learning resources
- Progressive: Scale functionality from beginners to advanced users
- Feedback-driven: Interactive previews of changes
- AI-assisted: Natural language to generate working extensions

## Deployment Configuration
- Next.js application hosted on Netlify
- Serverless functions for backend operations
- Database and authentication via Supabase
- Environment variables configuration:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - NEXT_PUBLIC_SITE_URL
  - NEXT_PUBLIC_API_URL
  - ANTHROPIC_API_URL
  - ANTHROPIC_API_VERSION
  - ANTHROPIC_API_KEY

## Development Standards
- Consistent TypeScript typing throughout
- Component-based architecture for maintainability
- Comprehensive error handling and user feedback
- Mobile-responsive design for all interfaces
- Accessible UI components (WCAG 2.1 AA compliance)
- Performance optimization for handling large projects
- Comprehensive testing (unit, integration, e2e)

## Implementation Milestones

### Phase 1: Foundation
- Set up Next.js project with TypeScript
- Implement Supabase authentication
- Create basic project management interface
- Develop initial Claude API integration

### Phase 2: Core Functionality
- Build extension component editors
- Implement manifest.json visual editor
- Create Chrome API simulation environment
- Develop AI conversation interface

### Phase 3: Enhanced Features
- Add template system
- Implement deployment packaging
- Create visual preview system
- Develop comprehensive testing tools

### Phase 4: Polish & Launch
- Optimize performance
- Enhance UI/UX
- Build comprehensive documentation
- Implement analytics and feedback systems

## Additional Considerations
- Usage analytics to track popular features
- Comprehensive help system with tutorials
- Community template sharing marketplace
- Extension performance analysis tools
- Collaboration features for team development

## Chrome Extension Development Specifics
- Support for manifest V3 format and requirements
- Implementation of various extension components:
  - Browser action popups
  - Background scripts/service workers
  - Content scripts
  - Options pages
  - Context menus
  - Storage APIs
- Proper permission handling and security practices
- Chrome Web Store compliance requirements

## Build & Run Commands
- `npm run dev` - Start development server
- `npm run build` - Build the application
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run all tests
- `npm test -- -t "test name"` - Run specific test
- `npm run format` - Format code with Prettier
- `npm run db:migration` - Run Supabase migrations
- `npm run db:start` - Start Supabase locally
- `npm run db:stop` - Stop Supabase locally

## Code Style Guidelines
- **Formatting**: Use 2 spaces for indentation
- **Types**: Use strict TypeScript typing, avoid `any` type
- **Imports**: Group imports (external → internal), use path aliases (@/*)
- **Naming**: camelCase for variables/functions, PascalCase for classes/interfaces/components
- **Error Handling**: Use try/catch with specific error types
- **Components**: One component per file, export as default
- **Styling**: Use Tailwind CSS classes with clsx/cva for variants
- **State Management**: Prefer hooks, use Zustand for global state

Always run linting and formatting before submitting changes.