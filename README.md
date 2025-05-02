# Smart Healthcare Appointment System


Smart Healthcare Appointment is a modern web platform for managing healthcare appointments, medical records, prescriptions, payments, and secure communication between patients and healthcare providers. The system prioritizes security, compliance, and user experience for healthcare professionals and patients.



## 🌟 Features

- **Appointment Scheduling:** Book, reschedule, and manage appointments with doctors with real-time availability tracking.
- **Medical Records:** Securely upload, view, and share medical records and test results with HIPAA-compliant storage.
- **Prescription Management:** View prescriptions, request refills, and track medication history with integrated pharmacy connections.
- **Payments & Invoicing:** Integrated payment processing, invoice downloads, and insurance claim management.
- **Doctor Portal:** Tools for doctors to manage patient records, schedules, and secure messaging.
- **Consent & Privacy:** Patients control access to their medical data with robust consent management.
- **Emergency Access:** Special workflows for emergency access to restricted records, with full audit trails.
- **Admin Dashboard:** System-wide analytics, access logs, and record management for administrators.
- **Secure Messaging:** HIPAA-compliant communication between patients and healthcare providers.

## 🛠️ Tech Stack

- **Frontend:** 
  - React 18 with TypeScript
  - Tailwind CSS for responsive design
  - Vite for fast development experience
  - Lucide React for UI icons

- **Backend:** 
  - Node.js with Express
  - PostgreSQL for relational data storage
  - RESTful API architecture

- **Security & Storage:**
  - JWT-based authentication and role-based access control
  - AWS S3 for secure file uploads
  - HIPAA-compliant data handling

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL database (v14+ recommended)
- AWS account for S3 storage (or use localstack for development)
- Git

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/CaptoneProject/Smart-Healthcare-appointment.git
   cd Smart-Healthcare-appointment
   ```

2. **Backend Setup:**
   - Navigate to the backend folder:
     ```bash
     cd backend
     ```
   - Install dependencies:
     ```bash
     npm install
     ```
   - Create environment file:
     ```bash
     cp .env.example .env
     ```
   - Configure the `.env` file with your database and AWS credentials
   - Initialize the database:
     ```bash
     npm run db:init
     ```
   - Start the backend server:
     ```bash
     npm start
     ```
   - For development with hot-reloading:
     ```bash
     npm run dev
     ```

3. **Frontend Setup:**
   - Navigate to the frontend folder:
     ```bash
     cd ../medical
     ```
   - Install dependencies:
     ```bash
     npm install
     ```
   - Start the development server:
     ```bash
     npm run dev
     ```
   - The app will be available at `http://localhost:5173` (or as shown in your terminal).

## 📱 Usage

### Patient Portal
- Register and log in to your secure patient account
- Book and manage appointments with healthcare providers
- Access and share your medical records
- View prescriptions and request refills
- Process payments and view billing history
- Communicate securely with your healthcare team

### Doctor Portal
- Manage your daily appointment schedule
- Access patient records with proper consent
- Upload test results and create prescriptions
- Process prescription refill requests
- Communicate securely with patients
- Set availability for appointment booking

### Admin Dashboard
- Monitor system usage and analytics
- Manage user accounts and access permissions
- Review security logs and access records
- Configure system settings and integrations

## 📂 Folder Structure

```
Smart-Healthcare-appointment/
├── backend/               # Express API, database models, and business logic
│   ├── config/            # Configuration files
│   ├── controllers/       # Request handlers
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   └── utils/             # Helper functions
├── medical/               # React frontend application
│   ├── public/            # Static assets
│   └── src/
│       ├── components/    # Reusable UI components
│       ├── context/       # React context providers
│       ├── layouts/       # Page layouts
│       ├── pages/         # Application pages
│       └── services/      # API integration
└── docs/                  # Documentation and API specs
```

## 🤝 Contributing

We welcome contributions to improve the Smart Healthcare Appointment System! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

For major changes, please open an issue first to discuss what you would like to change.

## 📜 License

This project is for educational and demonstration purposes only. All rights reserved.

## 🙏 Acknowledgements

- React.js and TypeScript communities
- Node.js and Express.js communities
- All contributors and testers

---

