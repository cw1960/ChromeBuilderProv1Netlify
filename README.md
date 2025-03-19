# Chrome Builder

Chrome Builder is an AI-powered application that helps non-technical users create and deploy Chrome extensions through friendly conversation. The application uses Claude 3.7 Sonnet to guide users through the entire extension development process from ideation to Chrome Web Store submission.

## Features

- **Conversational UI**: Interact with an AI assistant to build your Chrome extension
- **Code Generation**: Automatically generate all necessary code for your extension
- **Project Management**: Create and manage multiple extension projects
- **Code Preview**: View and edit generated code in real-time
- **Chrome API Simulator**: Test your extension without leaving the application
- **Export Options**: Download your extension as a ZIP file or save it to your account

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm or yarn
- A Claude API key (for AI functionality)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/cw1960/ChromeBuilderProv1Netlify.git
   cd ChromeBuilderProv1Netlify
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXTAUTH_URL=http://localhost:3336
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXT_PUBLIC_SITE_URL=http://localhost:3336
   PORT=3336
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3336](http://localhost:3336) in your browser to see the application.

## Usage

1. Sign in to the application
2. Click "New Extension" to create a new project
3. Describe the extension you want to build to the AI assistant
4. The AI will guide you through the development process
5. View and edit generated code in the right panel
6. Test your extension using the Chrome API Simulator
7. Download your extension as a ZIP file when ready

## Development Milestones

The AI assistant tracks progress through these formal development milestones:

1. **Concept Definition (10%)**: Initial idea clarification
2. **Detailed Requirements (25%)**: Complete feature list established
3. **Design Complete (40%)**: UI/UX details finalized
4. **Initial Development (60%)**: Core functionality coded
5. **Complete Development (75%)**: All features implemented
6. **Testing & Refinement (90%)**: Local testing complete
7. **Submission Ready (100%)**: Package ready for submission

## Technologies Used

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Supabase
- **AI**: Claude 3.7 Sonnet
- **Authentication**: NextAuth.js
- **Database**: Supabase

## Port Configuration

**IMPORTANT**: This application is configured to run on port 3336. Port 3335 is known to cause conflicts and should never be used. If you encounter port conflicts, run:

```bash
npm run fix-ports
```

This will kill any processes using ports 3335 and 3336, allowing the application to start cleanly.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Claude AI](https://www.anthropic.com/claude) for powering the AI assistant
- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/) for reference material
- [Next.js](https://nextjs.org/) for the application framework
- [Supabase](https://supabase.io/) for backend services 