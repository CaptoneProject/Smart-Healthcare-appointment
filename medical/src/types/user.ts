export interface User {
  id: number;
  email: string;
  name: string;
  userType: 'patient' | 'doctor' | 'admin';
  doctorStatus?: 'pending' | 'approved' | 'rejected';
}