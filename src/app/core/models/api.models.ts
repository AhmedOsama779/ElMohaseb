export interface ApiResponse<T> {
  code: number;
  message: string;
  errors: string[] | null;
  status?: number;
  data: T;
}

export interface LookupItem {
  id: number;
  name: string;
}

export interface RegisterRequest {
  fullname: string;
  email: string;
  waPhone: string;
  country: number;
  city: number;
  password: string;
  passwordConfirmation: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ResetPasswordRequest {
  email: string;
  password: string;
}

export interface VerifyRequest {
  email: string;
  otp: string;
}

export interface DocumentItem {
  id: number;
  name: string;
  isMandatory: boolean;
}

export interface ServiceItem {
  id: number;
  name: string;
  url: string;
  description: string;
  price: number;
  deposit: number;
  remind: number;
  documents: DocumentItem[];
}

export interface CategoryItem {
  id: number;
  name: string;
  url: string;
  services: ServiceItem[];
}

export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface DocumentStatus {
  id: number;
  name: string;
  isMandatory: boolean;
  isUploaded: boolean;
}

export interface PaymentInfo {
  ipan: string;
  accountName: string;
  notes: string | null;
}

export interface RequestCreated {
  id: number;
  orderCode: string;
}

export interface RequestOrder {
  customerID: string;
  requestID: number;
  categoryID: number;
  serviceID: number;
  orderCode: string;
  category: string;
  service: string;
  price: number;
  createdAt: string;
  updatedAt: string;
  isPaidComplete: boolean;
}

export interface RequestDetails {
  id: number;
  orderCode: string;
  createdAt: string;
  price: number;
  deposit: number;
  remind: number;
  isPaidComplete: boolean;
}