# 🎵 Vibey — The Future of AI-Generated Music

Vibey is an AI-powered music streaming platform built for the next generation of music creators and listeners. With Vibey, artists can upload, showcase, and license their AI-generated tracks, while listeners can explore a new wave of music created with cutting-edge technology.

## 🚀 Features

### 🧑‍🎤 For Creators
- **✨ AI Music Studio:** Generate full, royalty-free tracks interactively via chat using the **Wubble AI API**.
- **Chat History Management:** Seamlessly continue, evolve, and iterate on past song generations natively in your workspace.
- Upload **AI-generated** or **AI-assisted** singles and albums seamlessly from the studio or local files.
- View **AI-generated** or **AI-assisted** singles and albums.
- Delete **AI-generated** or **AI-assisted** singles and albums.
- Create a professional **profile page** with bio, verification status, track stats, and more.


### 🎧 For Listeners
- Seamless music streaming experience.
- Explore AI-generated music by genre, mood, or popularity.



### 💾 Tech Stack

| Layer          | Tech                             |
|----------------|----------------------------------|
| Frontend       | React (with Vite), CSS Modules   |
| Backend        | Node.js, Express                 |
| Database       | MongoDB Atlas                    |
| AI Engine      | Wubble AI API                    |
| Storage        | Backblaze B2 / GCP Storage       |
| UI Components  | Lucide Icons                     |
| Hosting        | Render / Vercel                  |

---

## 🧠 Architecture

Vibey is structured around a **B2C**:

- **B2C**: Users (listeners) can stream tracks and interact with creators.

The platform consists of:

- 🔹 **Shared backend** powering both creators and listeners.
- 🔹 **Separate UIs** for creators and listeners for a tailored experience.
- 🔹 **RESTful APIs** with authentication and role-based access control.

---

## 📂 Project Structure

```bash
vibey/
├── client/               # React frontend (Vite)
│   ├── creator/          # Creator dashboard and UI
│   ├── listener/         # Listener-facing UI
│   ├── components/       # Shared React components
│            
├── server/               # Node.js + Express backend
│   ├── controllers/      # Logic for auth, upload, licensing
│   ├── models/           # MongoDB models
│   ├── routes/           # Auth, music, user routes
│   └── middleware/       # Auth, error handling, etc.
├── .env.example
├── README.md
└── package.json
