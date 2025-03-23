# Smart Healthcare Appointment System - Project Structure Guide

This document provides an overview of the project structure and describes the purpose of key files to help team members understand where to make changes when working on specific features.

## Table of Contents
- [Frontend (Medical Folder)](#frontend-medical-folder)
  - [Configuration Files](#configuration-files)
  - [Core Components](#core-components)
  - [Pages](#pages)
  - [Contexts](#contexts)
  - [Services](#services)
  - [Types](#types)
  - [Layouts](#layouts)
  - [UI Components](#ui-components)
- [Backend](#backend)
  - [Core Files](#core-files)
  - [Routes](#routes)
  - [Utils](#utils)
  - [Configuration](#configuration)

## Frontend (Medical Folder)

### Configuration Files

| File | Description |
|------|-------------|
| `/medical/vite.config.ts` | Vite configuration file that sets up React and Tailwind CSS plugins |
| `/medical/tsconfig.json` | Primary TypeScript configuration file that references app and node configs |
| `/medical/tsconfig.app.json` | TypeScript config for the application code, includes React settings |
| `/medical/tsconfig.node.json` | TypeScript config for Node.js environment (used for build scripts) |
| `/medical/index.html` | Entry HTML file that loads the React application |
| `/medical/.gitignore` | Specifies files that Git should ignore |
| `/medical/Jenkinsfile` | Jenkins CI/CD pipeline configuration |

### Core Components

| File | Description |
|------|-------------|
| `/medical/src/App.tsx` | Main application component with route definitions and authentication logic |
| `/medical/src/main.tsx` | Entry point for the React application, renders the App component |
| `/medical/src/vite-env.d.ts` | Type declarations for Vite environment |
| `/medical/src/index.css` | Global CSS styles using Tailwind |
| `/medical/src/LandingPage.tsx` | Homepage component displayed to unauthenticated users |
| `/medical/src/AuthModal.tsx` | Authentication modal for login/registration |
| `/medical/src/components/ErrorBoundary.tsx` | Error boundary for catching and displaying errors gracefully |

### Pages

#### Patient Pages

| File | Description |
|------|-------------|
| `/medical/src/pages/patient/Dashboard.tsx` | Patient dashboard showing overview and stats |
| `/medical/src/pages/patient/Appointments.tsx` | Patient appointment management page |
| `/medical/src/pages/patient/Records.tsx` | Medical records viewer for patients |
| `/medical/src/pages/patient/Prescriptions.tsx` | Displays and manages patient prescriptions |
| `/medical/src/pages/patient/Payments.tsx` | Payment history and management for patients |

#### Doctor Pages

| File | Description |
|------|-------------|
| `/medical/src/pages/doctor/Dashboard.tsx` | Doctor dashboard with overview and performance metrics |
| `/medical/src/pages/doctor/Appointments.tsx` | Appointment management for doctors |
| `/medical/src/pages/doctor/Schedule.tsx` | Availability schedule management for doctors |
| `/medical/src/pages/doctor/CredentialsForm.tsx` | Form for doctors to submit their credentials for verification |
| `/medical/src/pages/doctor/PendingApproval.tsx` | Page shown when doctor credentials are pending approval |
| `/medical/src/pages/doctor/AccountRejected.tsx` | Page shown when doctor credentials are rejected |

#### Admin Pages

| File | Description |
|------|-------------|
| `/medical/src/pages/admin/Dashboard.tsx` | Admin dashboard with system-wide metrics |
| `/medical/src/pages/admin/DoctorApprovals.tsx` | Interface for admins to review and approve/reject doctor credentials |

### Contexts

| File | Description |
|------|-------------|
| `/medical/src/context/AuthContext.tsx` | Authentication context provider for user management throughout the app |

### Services

| File | Description |
|------|-------------|
| `/medical/src/services/api.ts` | Central API service with axios instance and API endpoints for authentication, appointments, doctor services, notifications, and admin functions |

### Types

| File | Description |
|------|-------------|
| `/medical/src/types/user.ts` | TypeScript interfaces for user data structures |

### Layouts

| File | Description |
|------|-------------|
| `/medical/src/layouts/PatientLayout.tsx` | Layout wrapper for patient pages with navigation |
| `/medical/src/layouts/DoctorLayout.tsx` | Layout wrapper for doctor pages with navigation |
| `/medical/src/layouts/AdminLayout.tsx` | Layout wrapper for admin pages with navigation |

### UI Components

| File | Description |
|------|-------------|
| `/medical/src/components/ui/Button.tsx` | Reusable button component with variants |
| `/medical/src/components/ui/Card.tsx` | Card container component |
| `/medical/src/components/ui/Modal.tsx` | Modal dialog component |
| `/medical/src/components/ui/FilterBar.tsx` | Filter and search component |
| `/medical/src/components/ui/PageHeader.tsx` | Standardized page header component |
| `/medical/src/components/ui/StatCard.tsx` | Statistics card component |
| `/medical/src/components/ui/StatusBadge.tsx` | Status indicator component |
| `/medical/src/components/Calendar.tsx` | Calendar component for date selection |
| `/medical/src/components/forms/AppointmentForm.tsx` | Form for creating/editing appointments |

## Backend

### Core Files

| File | Description |
|------|-------------|
| `/backend/server.js` | Main server entry point that sets up Express and connects routes |
| `/backend/database.js` | Database connection and utility functions |
| `/backend/auth.js` | Authentication routes and middleware (login, register, token refresh) |

### Routes

| File | Description |
|------|-------------|
| `/backend/appointments.js` | API routes for appointment CRUD operations, scheduling, and availability checking |
| `/backend/adminRoutes.js` | Admin-specific routes for system management, doctor credential approval process |
| `/backend/doctorScheduling.js` | Routes for managing doctor availability and schedules |

### Utils

| File | Description |
|------|-------------|
| `/backend/notifications.js` | Notification system for appointments and system events |

### Configuration

| File | Description |
|------|-------------|
| `/backend/.env` | Environment variables for database credentials and JWT secrets |
| `/backend/.gitignore` | Specifies files that Git should ignore (includes .env) |
| `/backend/package.json` | NPM dependencies and scripts for the backend |

## Common Modification Scenarios

### Adding a New Feature for Patients
Look at the patient pages in `/medical/src/pages/patient/` and related API endpoints in the backend.

### Modifying Doctor Verification Process
Update the `/medical/src/pages/doctor/CredentialsForm.tsx` on the frontend and `/backend/adminRoutes.js` on the backend.

### Changing Authentication Logic
Modify the AuthContext in `/medical/src/context/AuthContext.tsx` and the auth.js in the backend.

### Adding New API Endpoints
Add to the appropriate route file in the backend and update the corresponding service in `/medical/src/services/api.ts`.

### Modifying the Appointment System
Update the appointment-related pages in the frontend and the `/backend/appointments.js` file.
