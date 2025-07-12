# Calendar & Task Manager

A modern, full-featured Calendar + Task Manager web application built with HTML, JavaScript (ES6 modules), Tailwind CSS, and Firebase.

## Features

### 🔐 Authentication
- Firebase Authentication with Google and Email login
- Secure login and registration screens with smooth transitions
- User session management

### 📅 Calendar View
- FullCalendar.js integration with month/week/day views
- Drag-and-drop tasks between dates
- Visual indicators for today, weekends, and selected dates
- Interactive calendar with task integration

### ✅ Task Management
- Create, update, and delete tasks
- Task fields: title, description, due date, tag, priority, completion status
- Repeating tasks support
- Real-time sync with Firebase Firestore
- Task filtering by status, priority, and tags

### 🎨 Modern UI
- Responsive design for mobile, tablet, and desktop
- Dark/light mode toggle with system preference detection
- Smooth animations and transitions using Tailwind CSS
- Heroicons for consistent iconography
- Modal forms with intuitive design

### 🚀 Advanced Features
- Progressive Web App (PWA) support
- Offline functionality with service worker
- Keyboard shortcuts for productivity
- Real-time data synchronization
- Responsive sidebar with filters

## Setup Instructions

### 1. Firebase Configuration

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication and Firestore Database
3. Configure authentication providers (Email/Password and Google)
4. Copy your Firebase configuration and update `js/firebase-config.js`:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 2. Firestore Security Rules

Set up the following security rules in your Firestore database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /tasks/{taskId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

### 3. Local Development

1. Clone or download the project files
2. Open `index.html` in a web browser, or serve using a local server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (http-server)
npx http-server

# Using Live Server extension in VS Code
```

3. Navigate to `http://localhost:8000` (or your server port)

### 4. Firebase Hosting (Optional)

To deploy to Firebase Hosting:

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Initialize Firebase in your project:
```bash
firebase login
firebase init hosting
```

3. Deploy:
```bash
firebase deploy
```

## Project Structure

```
calendar-task-manager/
├── index.html              # Login/Register page
├── dashboard.html          # Main application dashboard
├── css/
│   └── styles.css         # Custom Tailwind CSS styles
├── js/
│   ├── firebase-config.js # Firebase configuration
│   ├── auth.js           # Authentication logic
│   ├── calendar.js       # Calendar functionality
│   ├── tasks.js          # Task management
│   └── dashboard.js      # Dashboard coordination
├── manifest.json         # PWA manifest
├── sw.js                # Service worker
├── firebase.json        # Firebase hosting config
└── README.md           # This file
```

## Usage

### Authentication
- Use the login form or Google Sign-In button
- Create a new account using the registration form
- Toggle between login and registration modes

### Task Management
- Click "Add Task" to create a new task
- Fill in task details: title, description, due date, priority, tags
- Use the task list to view, edit, or delete tasks
- Check off tasks to mark them as completed

### Calendar Features
- View tasks on the calendar in month, week, or day view
- Click on dates to create tasks for that day
- Click on task events to edit them
- Drag tasks between dates to reschedule

### Filters and Organization
- Use sidebar filters to show/hide tasks by status, priority, or tags
- Tags are automatically generated from task input
- Search and filter functionality for easy task management

### Dark Mode
- Toggle between light and dark themes
- Theme preference is saved to localStorage
- Responsive to system theme changes

## Keyboard Shortcuts

- `Alt + N`: Add new task
- `Alt + D`: Toggle dark mode
- `Escape`: Close modals

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **Calendar**: FullCalendar.js
- **Backend**: Firebase (Firestore + Authentication)
- **PWA**: Service Worker, Web App Manifest

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues or questions, please create an issue in the project repository.

---

**Note**: Remember to update the Firebase configuration with your actual project credentials before deploying or using the application.
