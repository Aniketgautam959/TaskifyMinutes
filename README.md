# TaskifyMinutes

An AI-powered meeting productivity web application built with Next.js that transforms meetings into **clear summaries, structured MOMs, and actionable tasks**—so teams focus on execution, not note-taking.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css)

---

## ✨ Features

### 🧠 AI Intelligence

- **AI Meeting Summary**: Automatically generate concise meeting summaries  
- **MOM Generator**: Clear separation of discussions, decisions, and actions  
- **Smart Task Extraction**: Detect actionable items from natural conversations  

### 🎙️ Transcription & Files

- **Transcript Generator**: Convert audio/video into readable transcripts  
- **Speaker-wise Timeline**: Clean transcript flow with speaker labels  
- **Google Cloud Storage**: Secure storage for uploaded audio/video files  

### 📋 Task Management

- **Action Item Detection**: Auto-detect tasks with priority levels  
- **Task Categorization**: Organize tasks by context and urgency  
- **Export Options**: Download summaries and MOMs  

### 🎨 Modern UI/UX

- **Dark Mode Interface**: Clean, distraction-free UI  
- **Fully Responsive**: Optimized for all screen sizes  
- **Minimal Design**: Focused on productivity and clarity  

---

## 🛠️ Tech Stack

### Frontend

- **[Next.js](https://nextjs.org)** – App Router & Server Components  
- **[React](https://react.dev)** – Modern React features  
- **[TypeScript](https://typescriptlang.org)** – Type-safe development  
- **[Tailwind CSS](https://tailwindcss.com)** – Utility-first styling  

### Backend & AI

- **Server Actions** – Backend logic inside Next.js  
- **AI Integration (Gemini)** – Summaries, MOM & task extraction  

### Storage

- **Google Cloud Storage** – Secure file uploads & media storage  

### Authentication

- **Clerk** – Authentication, sessions & protected routes  

### Deployment

- **Vercel** – Production deployment  

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm / yarn / pnpm
- Google Cloud account
- Clerk account

---

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Aniketgautam959/TaskifyMinutes.git
cd TaskifyMinutes
```
2. **Install dependencies**
```bash
npm install

```
3. **Set up environment variables**

Create a .env.local file:
```bash
# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_key

# AI
GEMINI_API_KEY=your_key

# Google Cloud Storage
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_CLOUD_CLIENT_EMAIL=your_client_email
GOOGLE_CLOUD_PRIVATE_KEY=your_private_key
GOOGLE_CLOUD_BUCKET_NAME=your_bucket_name

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4.**Run development server**
```bash
npm run dev


Open 👉 http://localhost:3000
```
---
🎯 **Use Cases**

Team meetings & standups

College project discussions

Client calls & reviews

Event planning sessions

Remote collaboration

🌐 **Live Demo**

🔗 https://taskify-minutes.vercel.app
