# 🌿 Emolit - Emotional Literacy Platform

Welcome to **Emolit**, a premium, beautifully designed platform dedicated to emotional self-reflection, journaling, and tracking. 

Whether you are a user trying to understand how the app works, a non-technical stakeholder, or a computer science student looking under the hood to see how the code is structured, this guide is built for you. We explain the complete experience from the surface level to the deep backend architecture.

---

## 📖 Table of Contents
1. [The Emolit Experience (How It Works for Everyone)](#-the-emolit-experience-how-it-works-for-everyone)
2. [Technical Deep Dive (Feature-by-Feature Pipeline)](#-technical-deep-dive-feature-by-feature-pipeline)
   - [1. The Journal Page Pipeline (RAG + Claude)](#1-the-journal-page-pipeline-rag--claude)
   - [2. The Emotion Wheel Pipeline (Explore Page)](#2-the-emotion-wheel-pipeline-explore-page)
   - [3. The Dashboard & Daily Word Engine](#3-the-dashboard--daily-word-engine)
   - [4. Calendar & History Synchronization](#4-calendar--history-synchronization)
   - [5. Dual-Channel Reminders & Notifications](#5-dual-channel-reminders--notifications)
3. [System Architecture & Tech Stack](#-system-architecture--tech-stack)
4. [Developer Setup Guide](#-developer-setup-guide)
5. [API & Endpoints](#-api--endpoints)

---

## 🌟 The Emolit Experience (How It Works for Everyone)

Emolit is designed to be a safe, beautiful, and calming space. Here is a breakdown of every feature, what you see on the screen, and how the app gracefully responds to your actions.

### 1. The Dashboard (Home Page)
**What you see:** A gorgeous, magazine-style layout featuring elegant typography (Playfair Display) and our custom leaf logo. You are greeted with a motivational daily word and a quick "Check-in" button to log how you feel right now.
**How it responds:**
- When you click "Check-in", a smooth, full-screen animation gracefully transitions you to the emotion logging process. 
- The page dynamically updates with new motivational content every day to keep the experience fresh and inspiring.

### 2. The Journal Page
**What you see:** A distraction-free, elegant writing area where you can pour out your thoughts. It uses a premium "Glassmorphism" design (a frosted glass effect) to make the space feel calming.
**How it responds:**
- As you type, the interface remains smooth and focused.
- When you hit **"Save"**, the app securely packages your entry and sends it to our digital vault. 
- Behind the scenes, we use an advanced Artificial Intelligence system (powered by Claude) to act as a gentle "mirror" to your thoughts. It uses proven psychological frameworks to analyze what you wrote, helping you uncover underlying emotional patterns and providing actionable, deeply empathetic feedback.

### 3. The Calendar & History
**What you see:** A beautiful visual calendar that maps out your emotional journey across the month, using specific colors and emojis for different moods.
**How it responds:**
- Clicking on any specific day instantly reveals the exact journal entries and emotions you felt on that day.
- It seamlessly synchronizes your past archives from our secure servers, ensuring you never lose track of your emotional growth.

### 4. Emotion Wheel (Explore Page)
**What you see:** An interactive, colorful wheel containing various emotions (like Joy, Sadness, Anger, Surprise).
**How it responds:**
- You can click on different layers of the wheel to pinpoint exactly how you are feeling. It allows you to move from broad emotions to very specific ones (e.g., Happy ➡️ Proud ➡️ Successful).

### 5. Reminders & Notifications
**What you see:** Helpful, branded "nudges" that remind you to check in or take a moment for yourself.
**How it responds:**
- If you are actively using the app, you'll see sleek, floating toasts gently slide onto your screen to remind you of your tasks.
- If you step away from the app, the system triggers beautiful, magazine-quality email reminders sent straight to your inbox to gently bring you back to your journaling habit.

---

## 🛠️ Technical Deep Dive (Feature-by-Feature Pipeline)

For developers and technical students, here is the exact data flow for every single core feature in Emolit. We will map the journey from the user's click on the React frontend all the way to the MongoDB database and AI servers.

### 1. The Journal Page Pipeline (RAG + Claude)
This is our most advanced pipeline, utilizing a Retrieval-Augmented Generation (RAG) system to ground our AI responses in established psychology.
1. **User Action:** The user types their journal entry on the Frontend (React) and clicks the "Save" button.
2. **API Request:** The Frontend uses the **Axios** library to format a secure HTTP `POST` request. This envelope contains the journal text and the user's secure **JWT authentication token**.
3. **Retrieval-Augmented Generation (RAG):**
   - The **FastAPI** backend receives the text and passes it to our custom RAG pipeline (`rag_system`).
   - It vectorizes the input and searches our local **ChromaDB** vector database to retrieve similar, highly relevant external data—such as specific emotional vocabulary or therapeutic task guidelines—that match the user's entry.
4. **Prompt Tuning & Psychological Frameworks:**
   - The backend constructs a highly tuned prompt combining the user's raw text with the retrieved RAG data.
   - It uses the **"RULER" psychological framework** (Recognize, Understand, Label, Express, Regulate) to precisely format the prompt and guide the AI's perspective.
5. **Claude API Generation:**
   - This beautifully structured prompt is sent to the **Claude API** (Anthropic). Claude processes the context and generates a deeply empathetic "Mirror" response containing poetic recognition, thoughtful understanding, and actionable steps.
6. **Database Storage & UI Update:** 
   - The Backend permanently saves both the journal entry and Claude's psychological analysis into our **MongoDB** database.
   - Finally, it sends an HTTP `200 OK` success message back to the React Frontend, which updates the screen to display the personalized AI response to the user.

### 2. The Emotion Wheel Pipeline (Explore Page)
1. **User Action:** The user interacts with the dynamic SVG emotion wheel and clicks a specific emotional layer (e.g., "Overwhelmed").
2. **State Mapping:** React component state intercepts the click, mapping the specific SVG coordinates and data-labels to our predefined emotion hierarchy schema.
3. **API Request:** An Axios `POST` request is dispatched to the backend's `/api/emotions/track` endpoint with the emotion label and intensity score.
4. **Backend Processing:** The FastAPI `emotion_service.py` validates the emotion against our `emotion_wheel.json` database to ensure data integrity.
5. **Database Storage:** PyMongo inserts a new check-in document into the `emotions` MongoDB collection with a timestamp and the linked User ID.
6. **Context Sync:** The frontend receives a success status and triggers a refresh of the global React Context, immediately updating the user's dashboard and calendar to reflect the new check-in.

### 3. The Dashboard & Daily Word Engine
1. **Initialization:** When the user logs in, the `HomePage.tsx` component mounts and triggers a `useEffect` hook.
2. **Data Fetching:** Axios sends an asynchronous `GET` request to `/api/words/daily`.
3. **Backend Logic:** The FastAPI backend queries the `daily_words` MongoDB collection looking for a record matching the current calendar date. 
4. **Fallback Generation:** If a word for today does not exist, the backend parses our static `emotion_database.json` file, selects a new word, meaning, and affirmation, and dynamically inserts it into the database for all users to share for the day.
5. **Rendering:** The backend returns the JSON object to the frontend, where Tailwind CSS classes and Playfair Display typography strictly format the text to maintain our premium magazine aesthetic.

### 4. Calendar & History Synchronization
1. **User Action:** The user navigates to the Calendar page.
2. **Aggregated Query:** The React frontend makes a `GET` request to `/api/calendar`.
3. **MongoDB Aggregation Pipeline:** The FastAPI backend utilizes a powerful PyMongo aggregation pipeline to concurrently fetch data from both the `journal_entries` collection and the `emotions` collection for the authenticated User ID.
4. **Data Normalization:** The backend formats these disparate records into a unified chronological timeline (a dictionary grouped by dates).
5. **UI Population:** The frontend receives this timeline payload and injects it into the visual Calendar component, mapping specific emotion labels to their respective hex colors and emoji icons for immediate visual recognition.

### 5. Dual-Channel Reminders & Notifications
Our notification system ensures users stay engaged without feeling spammed.
**In-App Nudges (Frontend Flow):**
1. React state and custom hooks monitor the user's active session time and navigation patterns.
2. Based on specific triggers (e.g., spending 5 minutes on the dashboard without journaling), a local state is toggled.
3. A Tailwind-styled "Glassmorphism" toast component gently slides into the viewport.

**Email Reminders (Backend Flow):**
1. **User Trigger:** The user clicks a `ReminderButton` on the Word Detail page, or the system detects inactivity.
2. **API Request:** An Axios `POST` request is sent to `/api/notifications/schedule`.
3. **Service Logic:** The `email_service.py` is invoked. It securely accesses our SMTP configuration (Gmail) using environment variables.
4. **Template Generation:** The service parses a high-quality HTML template, injecting the user's name and dynamic branding elements (like our logo and premium typography).
5. **Asynchronous Dispatch:** To prevent the UI from freezing, FastAPI's `BackgroundTasks` executes the email delivery asynchronously while immediately returning a success status to the user.

---

## 🏗️ System Architecture & Tech Stack

### Core Technologies
- **Frontend Framework:** React 18, TypeScript
- **Frontend Styling:** Tailwind CSS (for modern, responsive layouts)
- **Frontend Routing & Network:** React Router v6, Axios
- **Backend Framework:** FastAPI (Python) running on Uvicorn
- **Database:** MongoDB (A flexible NoSQL database, accessed via PyMongo)
- **AI Integration:** Claude API (Anthropic) for deep, empathetic natural language processing
- **RAG System:** ChromaDB paired with Sentence Transformers for retrieving external psychological data
- **Authentication:** JWT (JSON Web Tokens) with bcrypt password hashing
- **Deployment:** Docker & Docker Compose

### Database Schema Map
- `users`: Stores hashed credentials, emails, and notification preferences.
- `journal_entries`: Stores journal text, timestamps, User ID, and Claude AI psychological analysis.
- `emotions`: Stores the quick emotional check-ins from the Emotion Wheel and their intensities.
- `daily_words`: Stores the database of daily affirmations and motivational quotes.

---

## 💻 Developer Setup Guide

Want to run the project locally on your machine? Follow these steps.

### Prerequisites
- Node.js (v14 or higher)
- Python (v3.8 or higher)
- MongoDB (Running locally, or a MongoDB Atlas connection string)
- Git

### Installation

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd emolit
   ```

2. **Backend Setup (Python)**
   ```bash
   # Create and activate a virtual environment
   python -m venv venv
   
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   
   # Install all required Python packages
   pip install -r requirements.txt
   ```

3. **Frontend Setup (React/Node)**
   ```bash
   cd frontend
   npm install
   ```

### Environment Variables
You will need to create a `.env` file in the root directory. Use `.env.example` as a template:
```env
MONGODB_URI=mongodb://localhost:27017  # Or your MongoDB Atlas URI
MONGODB_DB=emolit
JWT_SECRET_KEY=your-super-secret-key
OPENAI_API_KEY=your-openai-api-key # Used for fallback models if needed
GROQ_API_KEY=your-groq-api-key
GEMINI_API_KEY=your-gemini-api-key
```

### Running the Application

**Method 1: Windows Automated Scripts (Easiest)**
We have created automated batch scripts to instantly launch the project.
- Double-click `start_backend.bat`
- Double-click `start_frontend.bat`

**Method 2: Manual Terminal Commands**
- **Terminal 1 (Backend):** 
  ```bash
  python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
  ```
- **Terminal 2 (Frontend):** 
  ```bash
  cd frontend
  npm start
  ```

**Method 3: Docker (For Production/Testing)**
```bash
docker-compose up --build
# Or run docker_build_and_run.bat on Windows
```

---

## 📡 API & Endpoints

Our FastAPI backend automatically generates fully interactive, live API documentation. Once the backend server is running, you can test every single endpoint right in your browser!

👉 **Interactive API Docs:** `http://localhost:8000/docs` (Powered by Swagger UI)

**Key API Routes Include:**
- `POST /api/auth/login`: Authenticate and receive a JWT token.
- `POST /api/journal`: Save a new journal entry.
- `GET /api/journal`: Retrieve past journal entries for the logged-in user.
- `GET /api/calendar`: Fetch emotional data mapped to calendar dates.

---

*Built with ❤️ for emotional well-being and technical excellence.*
