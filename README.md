# Full-Stack Todo Application

A production-ready task management SaaS built with Next.js 15, Tailwind CSS, Recharts, and AWS Amplify (Manual Configuration).

## 🚀 Features
- **Next.js App Router**: Utilizing the latest React Server Components and Edge Middleware.
- **Tailwind CSS & Dark Mode**: Beautiful, responsive design with automatic and manual Light/Dark theme toggling via `next-themes`.
- **Custom Authentication UI**: Highly secure, client-validated Login, Registration, and Password Reset forms using `react-hook-form` and `zod`.
- **Advanced Dashboard**: Visual metrics using `Recharts`.
- **Task Management**: Filter, search, create, edit, and delete tasks.
- **Amazon S3 Integration**: Upload and attach files securely to tasks with private, pre-signed URLs.

## 🛠️ Tech Stack
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, Lucide React, React Hot Toast
- **Backend (Manual)**: AWS Cognito, AWS AppSync (GraphQL), Amazon DynamoDB, Amazon S3
- **Amplify Client**: `@aws-amplify/adapter-nextjs`, `aws-amplify`

## 📦 Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure AWS Backend**
   Because this project uses the **Manual AWS Console Architecture**, you must provision the backend resources yourself in your AWS account.
   
   👉 **Please read the [AWS_SETUP_GUIDE.md](./AWS_SETUP_GUIDE.md) for step-by-step instructions.**

3. **Start the Development Server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

## 📁 Project Structure
- `/src/app` - Next.js App Router pages and API routes.
- `/src/components` - Reusable UI components (Layout, ThemeToggle, ConfigureAmplifyClientSide).
- `/src/features` - Feature-specific logic (e.g., Task CRUD operations).
- `/src/graphql` - Raw GraphQL queries, mutations, and subscriptions.
- `/src/providers` - React Context providers (AuthProvider).
- `/src/services` - External API services (e.g., S3 Storage upload/delete).
- `/src/types` - Global TypeScript interfaces.
- `/amplifyconfiguration.json` - Your manual AWS mapping configuration.
