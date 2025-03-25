# Smart Healthcare Appointments - Project Documentation

## Project Overview

Smart Healthcare Appointments is a full-stack healthcare management application designed to connect patients with healthcare providers. The system supports three main user roles (patients, doctors, and administrators) with different interfaces and capabilities for each role, focusing on streamlining the appointment booking and management process.

## Project Structure

The project is organized into two main directories:

```
.
├── backend          # Node.js/Express backend services
└── medical          # React frontend application
```

## Backend Structure

The backend is built with Node.js and Express, using PostgreSQL for the database.

```
backend/
├── adminRoutes.js           # Admin-specific API routes
├── appointments.js          # Appointment management routes
├── auth.js                  # Authentication routes
├── database.js              # Database connection configuration
├── doctorScheduling.js      # Doctor availability management
├── notifications.js         # Notification system
├── package-lock.json        # NPM dependency lock file
├── package.json             # NPM package definition
├── passwordVerification.js  # Password verification functionality
└── server.js                # Main server entry point
```

### Key Backend Components

- **server.js**: The main entry point that initializes the Express application, connects to the database, and sets up routes.
- **database.js**: Manages database connection with PostgreSQL, with fallback to local database if cloud connection fails.
- **auth.js**: Handles user authentication, registration, login, and session management.
- **appointments.js**: Manages appointment creation, retrieval, and updates.
- **doctorScheduling.js**: Handles doctor availability, schedules, and time slots.
- **adminRoutes.js**: Provides admin-specific functionality like doctor credential verification.
- **notifications.js**: Manages system notifications and email alerts.
- **passwordVerification.js**: Provides secure password verification functionality.

## Frontend Structure

The frontend is a React application built with TypeScript and Vite.

```
medical/
├── public/                  # Public assets
├── src/                     # Source code
│   ├── App.tsx              # Main application component
│   ├── AuthModal.tsx        # Authentication modal component
│   ├── LandingPage.tsx      # Landing page component
│   ├── assets/              # Static assets
│   ├── components/          # Reusable UI components
│   │   ├── Calendar.tsx     # Calendar component
│   │   ├── ErrorBoundary.tsx # Error handling component
│   │   ├── PasswordVerificationModal.tsx # Password verification UI
│   │   ├── forms/           # Form components
│   │   └── ui/              # UI component library
│   ├── context/             # React contexts for state management
│   ├── index.css            # Global CSS styles
│   ├── layouts/             # Page layout components
│   ├── main.tsx             # Entry point for the React application
│   ├── pages/               # Page components organized by user role
│   │   ├── NotFound.tsx     # 404 page component
│   │   ├── admin/           # Admin-specific pages
│   │   ├── doctor/          # Doctor-specific pages
│   │   └── patient/         # Patient-specific pages
│   ├── services/            # API service clients
│   └── types/               # TypeScript type definitions
├── package.json             # NPM package definition
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite build configuration
```

### Key Frontend Components

#### Core Files
- **App.tsx**: The main application component that defines routing and authentication.
- **main.tsx**: The entry point for the React application.
- **AuthModal.tsx**: A reusable authentication modal for login and registration.
- **LandingPage.tsx**: The public landing page for the application.

#### Contexts
- **AuthContext.tsx**: Manages authentication state and user information.

#### Layouts
- **AdminLayout.tsx**: Layout template for admin pages.
- **DoctorLayout.tsx**: Layout template for doctor pages.
- **PatientLayout.tsx**: Layout template for patient pages.

#### Pages

##### Admin Pages
- **Dashboard.tsx**: Admin dashboard with system statistics.
- **DoctorApprovals.tsx**: Interface for approving doctor credentials.

##### Doctor Pages
- **Dashboard.tsx**: Doctor dashboard with appointments and statistics.
- **Appointments.tsx**: Interface for managing patient appointments.
- **CredentialsForm.tsx**: Form for submitting professional credentials.
- **PendingApproval.tsx**: Status page for doctors with pending approval.
- **AccountRejected.tsx**: Status page for doctors with rejected applications.
- **Schedule.tsx**: Interface for managing availability and scheduling.

##### Patient Pages
- **Dashboard.tsx**: Patient dashboard with health information.
- **Appointments.tsx**: Interface for booking and managing appointments.
- **Records.tsx**: Interface for viewing medical records.
- **Prescriptions.tsx**: Interface for managing prescriptions.
- **Payments.tsx**: Interface for managing payments and billing.

#### Components
- **ui/**: Reusable UI components like buttons, cards, modals, etc.
- **forms/**: Form components for data entry.
- **Calendar.tsx**: A calendar component for date selection and visualization.
- **ErrorBoundary.tsx**: Error handling for components.
- **PasswordVerificationModal.tsx**: Security verification for sensitive data.

#### Services
- **api.ts**: Core API client with authentication and request handling.
- **medicalRecordsService.ts**: Service for medical records access.

#### Types
- **user.ts**: TypeScript definitions for user types and interfaces.

## Key Features

1. **User Authentication**
   - Registration and login for patients, doctors, and admins
   - JWT-based authentication
   - Password security and verification

2. **Patient Features**
   - Appointment booking and management
   - Medical record access
   - Prescription management
   - Payment processing

3. **Doctor Features**
   - Credential submission and verification
   - Availability management
   - Appointment scheduling
   - Patient record access

4. **Admin Features**
   - Doctor credential approval
   - User management
   - System statistics
   - Platform oversight

5. **Security Features**
   - Password verification for sensitive data
   - Role-based access control
   - Secure medical record handling

## Technology Stack

### Backend
- Node.js
- Express.js
- PostgreSQL
- JWT for authentication
- Bcrypt for password hashing
- Nodemailer for email notifications

### Frontend
- React
- TypeScript
- Vite
- React Router for navigation
- Context API for state management
- Tailwind CSS for styling (inferred from the code)
- Axios for API communication
