HireSense.AI
An AI-powered smart SaaS platform for résumé analysis and adaptive
mock interview simulations.

HireSense.AI helps job seekers prepare for interviews with résumé-aware
question generation, voice-based interview practice, AI-generated
feedback, and downloadable performance reports.
Overview
Traditional interview preparation often relies on static question banks
and generic feedback. HireSense.AI brings résumé analysis, adaptive
interview questions, speech interaction, and rubric-based evaluation
into one platform.

The application uses a MERN-based architecture with external AI
services, Firebase authentication, MongoDB storage, and Razorpay payment
integration.
Key Features
- AI résumé analysis: Upload a PDF résumé and extract structured
  information such as skills, projects, experience, target roles, and
  experience level.
- Adaptive mock interviews: Generate five technical and HR
  questions tailored to the candidate's role, experience level,
  skills, and projects.
- Voice-based interview simulation: Use browser speech
  capabilities to read questions aloud and transcribe spoken answers.
- Timed answers: Each question has a 60-second answer window.
- AI-powered evaluation: Assess answers for relevance, technical
  accuracy, depth, clarity, and communication structure.
- Personalized feedback: Receive strengths, weaknesses,
  recommendations, and scores.
- PDF reports: Generate downloadable interview evaluation reports.
- Google authentication: Use Firebase Authentication with Google
  sign-in.
- Credit-based usage: Manage paid operations through a credit
  system.
- Payment integration: Integrate Razorpay orders, payment
  verification, and webhooks.
- Interview history: Store interview sessions and evaluation
  results in MongoDB.
- Cloud deployment: Designed for deployment using Render.
Technology Stack
  Layer                               Technologies
  Frontend                            React, Vite, Tailwind CSS, Redux
                                      Toolkit, Framer Motion

  Backend                             Node.js, Express.js

  Database                            MongoDB, Mongoose

  Authentication                      Firebase Authentication, Google
                                      OAuth

  AI integration                      Configurable LLM provider such as
                                      OpenAI, OpenRouter, or Gemini

  Speech interaction                  Browser Web Speech API
                                      (SpeechRecognition and
                                      SpeechSynthesis)

  File uploads                        Multer

  Payments                            Razorpay

  Reports                             Server-side PDF generation
  Deployment                          Render
How It Works
1. Sign in: The user authenticates using Google sign-in.
2. Upload résumé: The user submits a PDF résumé for analysis.
3. Review profile: The platform extracts skills, projects,
   experience, and a likely experience level.
4. Set up interview: The system generates five role- and
   experience-aware questions.
5. Practice: The candidate answers questions using voice
   interaction where supported by the browser.
6. Evaluate: The AI evaluates the answers using defined scoring
   dimensions and reference key points.
7. Review results: The application presents scores, strengths,
   weaknesses, and actionable recommendations.
8. Download report: The candidate can download a PDF report and
   revisit interview history.
Project Structure
The repository contains separate frontend and backend applications:
HireSense.AI/
├── client/       # React frontend
├── server/       # Express backend and API
├── README.md
└── .gitignore
The exact internal structure may vary as the project evolves.
Prerequisites
Install the following before running the project locally:
- Node.js (an active LTS release is recommended)
- npm
- Access to a MongoDB database
- Firebase project configured for Google Authentication
- An API key for the configured AI provider
- Razorpay credentials if testing payment features
A microphone and a supported browser are needed for voice-based
interview practice. Speech recognition support varies by browser;
Chromium-based browsers are recommended.
Getting Started
1. Clone the repository
git clone https://github.com/sammy495/HireSense.AI.git
cd HireSense.AI
2. Install frontend dependencies
cd client
npm install
3. Configure frontend environment variables
Create a local .env file in the client directory and add the
environment variables required by the frontend configuration. Use the
variable names expected by the client source code and your Firebase
setup.
4. Run the frontend
Check the scripts section of client/package.json for the available
development command. A typical Vite project uses:
npm run dev
5. Install backend dependencies
Open a second terminal from the repository root:
cd server
npm install
6. Configure backend environment variables
Create a local .env file in the server directory. Configure the
values required by the server code, such as:
- Port number
- MongoDB connection string
- Firebase authentication credentials or configuration
- AI provider API key and provider settings
- Razorpay key ID and secret
- Razorpay webhook secret, if webhook processing is enabled
Use the exact environment variable names expected by the source code.
Do not commit .env files or publish API keys, passwords,
service-account credentials, or payment secrets.
7. Run the backend
Check the scripts section of server/package.json for the configured
command. If the project defines a development script, use that script to
start the API server.
Note: The exact environment variable names and backend start
command should be confirmed from the current client/package.json,
server/package.json, and source code.

Main API Workflows
The documented API workflows include:
  Method                  Route                         Purpose
  POST                  /api/auth/google            Verify Google/Firebase
                                                        identity and resolve
                                                        the user

  POST                  /api/resume/analyze         Analyze an uploaded PDF
                                                        résumé

  POST                  /api/interview/setup        Generate adaptive
                                                        interview questions

  POST                  /api/interview/evaluate     Evaluate interview
                                                        answers and generate
                                                        feedback

  GET                   /api/interview/:id/report   Download an interview
                                                        report

  GET                   /api/interview/history      Retrieve interview
                                                        history

  POST                  /api/payment/order          Create a payment order

  POST                  /api/payment/verify         Verify payment details

  POST                  /api/payment/webhook        Process verified
                                                    payment webhook events
Authenticated routes may require a valid bearer token. The
implementation is the source of truth for route behavior and request
formats.
Security Notes
- Keep API keys, database credentials, Firebase service credentials,
  and Razorpay secrets in environment variables.
- Do not upload .env files to GitHub.
- Configure .gitignore to exclude secrets, dependency folders, build
  output, logs, and local files.
- Validate uploaded files and enforce appropriate file-size limits.
- Verify payment signatures on the server and validate webhook
  signatures.
- Use HTTPS in deployed environments.
- Do not use AI-generated interview scores as the sole basis for
  employment decisions; treat them as practice feedback.
If a secret was accidentally committed, removing the file in a later
commit is not enough. Revoke or rotate the exposed credential and remove
it from Git history as appropriate.
Limitations
- AI output quality, latency, and availability depend on the
  configured provider.
- Browser speech recognition support differs across browsers and
  devices.
- Résumé formatting can affect extraction accuracy, especially with
  complex layouts.
- Speech transcription may misrecognize accents or technical terms.
- Scores are probabilistic practice indicators and should be
  interpreted with human judgment.
- Scanned or image-only résumés may require OCR support.
Future Enhancements
Potential extensions include multilingual interview practice, OCR for
scanned résumés, native mobile applications, real-time analytics, and
longitudinal tracking of interview performance.
Research
The project is described in the accompanying research paper:

"HireSense.AI: An AI-Powered Smart SaaS Platform for Resume Analysis
and Adaptive Mock Interview Simulations."

The paper details the system architecture, résumé-analysis pipeline,
adaptive question generation, voice simulation, evaluation engine, data
models, payment workflow, and deployment approach.
Contributors
- Samiksha S. Kenvadekar
- Vighnesh D. Khot
- Tejas S. Mochemadkar
Department of Computer Engineering
Yashwantrao Bhonsale Institute of Technology (YBIT), Sawantwadi,
Maharashtra, India.
