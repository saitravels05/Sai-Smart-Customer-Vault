import { UserRole } from './enums.js';

export interface BranchDto {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  isHeadOffice: boolean;
  isActive: boolean;
  customerCount: number;
  staffCount: number;
  createdAt: string;
}

export interface CreateBranchDto {
  code: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  phone: string;
  email: string;
  isHeadOffice?: boolean;
}

export interface StaffMemberDto {
  id: string;
  userId: string;
  branchId: string;
  branchName: string;
  staffCode: string;
  fullName: string;
  email: string;
  role: UserRole;
  designation: string;
  contactNumber: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface CreateStaffDto {
  branchId: string;
  staffCode: string;
  fullName: string;
  email: string;
  password?: string;
  role: UserRole;
  designation: string;
  contactNumber: string;
}
