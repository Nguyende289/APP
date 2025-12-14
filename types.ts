
export interface TrafficAccident {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  content: string;
  consequences: string;
  deaths: number;
  injuries: number;
  estimatedDamageVND: number;
  alcoholLevel: string; // e.g., "Yes", "No", "Unknown"
  handlingUnit: string;
  processingResult: string;
}

export type VehicleType = 'Ô tô' | 'Xe máy';

export interface VehicleRegistration {
  id: string;
  date: string; // YYYY-MM-DD
  vehicleType: VehicleType;
  firstTimeCount: number;
  transferCount: number;
  recallCount: number;
  renewalCount: number;
}

export type UnitType = 'VNĐ' | 'Trường hợp' | 'Số lượng' | 'Giờ' | 'Lượt';

export interface EventTargetResult {
  date: string; // YYYY-MM-DD
  result: number;
}

export interface EventTarget {
  id: string;
  name: string;
  goal: number;
  unit: UnitType;
  results: EventTargetResult[]; // Daily results for the target
}

export interface Event {
  id: string;
  name: string;
  fromDate: string; // YYYY-MM-DD
  toDate: string; // YYYY-MM-DD
  content: string;
  targets: EventTarget[];
}

export type TaskCategory =
  | 'Tuần tra xử lý'
  | 'Tuyên truyền'
  | 'Tham mưu'
  | 'Tổng hợp'
  | 'Bảo vệ kỳ cuộc'
  | 'Cưỡng chế'
  | 'Phối hợp'
  | 'Khác';

export interface DailyTask {
  id: string;
  date: string; // YYYY-MM-DD
  category: TaskCategory;
  description: string;
  result: string;
}

export interface VerificationRequest {
  id: string;
  docNumber: string; // Số công văn
  docDate: string; // Ngày công văn (YYYY-MM-DD)
  offenderName: string; // Họ tên người vi phạm
  citizenId: string; // CCCD
  dateOfBirth: string; // Ngày sinh (YYYY-MM-DD)
  address: string; // Địa chỉ
  violationBehavior: string; // Hành vi vi phạm
  verificationResult: string; // Kết quả xác minh (e.g., "Đã xác minh", "Chưa xác minh", "Đang xác minh", "Không xác định")
  endDate: string; // Ngày kết thúc xác minh (YYYY-MM-DD), optional
  resultContent?: string; // New field for detailed verification result
}

// New interface for document templates
export interface DocumentTemplate {
  id: string;
  name: string;
  content: string;
}

// New interface for Advisory Documents (Module 7)
export interface AdvisoryDocument {
  id: string;
  docNumber: string; // Số công văn/kế hoạch
  docDate: string; // Ngày ban hành (YYYY-MM-DD)
  docType: string; // Loại công văn (Công văn/Kiến nghị/Chương trình/Kế hoạch/Phương án/Báo cáo/Khác)
  content: string; // Nội dung công văn/kế hoạch
  recipientUnit: string; // Đơn vị nhận
  releaseDate: string; // Ngày phát hành (YYYY-MM-DD)
}

export interface AppData {
  trafficAccidents: TrafficAccident[];
  vehicleRegistrations: VehicleRegistration[];
  events: Event[];
  dailyTasks: DailyTask[];
  verificationRequests: VerificationRequest[]; // New module data
  responseDocumentTemplates: DocumentTemplate[]; // Use array of templates
  selectedDocumentTemplateId: string; // Track selected template
  advisoryDocuments: AdvisoryDocument[]; // New module 7 data
}

// Config for Google Sheets Integration via Apps Script
export interface GoogleSheetsConfig {
  scriptUrl: string; // URL of the deployed Google Apps Script Web App
  autoSync?: boolean; // Tự động đồng bộ khi dữ liệu thay đổi
}

// Config for Firebase Integration
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  enabled: boolean; // Toggle to switch between Google Sheets and Firebase
}

// Interfaces for form field definitions
export interface BaseFormField {
  label: string;
  key: string;
  type: string;
}

export interface TextFieldDefinition extends BaseFormField {
  type: 'text' | 'textarea' | 'number' | 'date' | 'time';
}

export interface SelectFieldDefinition extends BaseFormField {
  type: 'select';
  options: { value: string; label: string }[] | string[];
}

export type FormField = TextFieldDefinition | SelectFieldDefinition;
