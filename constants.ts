
import { AppData, TaskCategory, VehicleType, VerificationRequest, FormField, DocumentTemplate, AdvisoryDocument, FirebaseConfig } from './types';

// Cấu hình Google Sheets mặc định
export const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyynB7OHAZbWIE_LHzNooxtXYjqF_DWIMvq_jwnI1LtdEdIwRveEoJ-G3lnIxZ1foqm/exec';
export const STORAGE_KEY_GOOGLE_CONFIG = 'policeApp_GoogleConfig_Script';
export const STORAGE_KEY_FIREBASE_CONFIG = 'policeApp_FirebaseConfig';

export const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyC9eDAZLZAIH7JSDKqT7VWp5Eeek1hZm8A",
  authDomain: "appcstt.firebaseapp.com",
  projectId: "appcstt",
  storageBucket: "appcstt.firebasestorage.app",
  messagingSenderId: "886801579982",
  appId: "1:886801579982:web:e1308a095b7b55f19b759f",
  measurementId: "G-N8JL4QC0Q0",
  enabled: false // Mặc định tắt để người dùng tự kích hoạt
};

export const initialData: AppData = {
  trafficAccidents: [],
  vehicleRegistrations: [],
  events: [],
  dailyTasks: [],
  verificationRequests: [],
  responseDocumentTemplates: [ // Giữ lại mẫu văn bản vì đây là cấu hình cần thiết
    {
      id: 'template1',
      name: 'Mẫu Công văn 1',
      content: `
      <div style="font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.35; padding: 2cm 2cm 2cm 3cm; width: 21cm; margin: 0 auto; box-sizing: border-box;">
        <table class="doc-header-table" style="width: 100%; border-collapse: collapse; margin-bottom: 0.5cm;">
          <tr>
            <td style="width: 50%; text-align: center; border: none !important; padding: 0 !important;">
              <p style="font-size: 13pt; font-weight: bold; margin: 0; white-space: nowrap;">CÔNG AN TP HÀ NỘI</p>
              <p style="font-size: 13pt; font-weight: bold; margin: 0; text-decoration: underline; white-space: nowrap;">CÔNG AN XÃ KIỀU PHÚ</p>
            </td>
            <td style="width: 50%; text-align: center; border: none !important; padding: 0 !important;">
              <p style="font-size: 13pt; font-weight: bold; margin: 0; white-space: nowrap;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
              <p style="font-size: 13pt; font-weight: bold; margin: 0; text-decoration: underline;">Độc lập - Tự do - Hạnh phúc</p>
            </td>
          </tr>
          <tr>
            <td style="width: 50%; text-align: center; border: none !important; padding: 0 !important;">
              <p style="margin-top: 0.2cm; font-size: 12pt; margin-bottom: 0.6em;">Số: <<responseDocNumber>>/CV-CAXKP</p>
            </td>
            <td style="width: 50%; border: none !important; padding: 0 !important; text-align: center;">
              <p style="margin-top: 0.2cm; font-size: 12pt; margin-bottom: 0.6em; text-align: right;">Kiều Phú, ngày <<currentDay>> tháng <<currentMonth>> năm <<currentYear>></p>
            </td>
          </tr>
        </table>

        <h1 style="text-align: center; font-size: 14pt; font-weight: bold; text-transform: uppercase; margin-top: 1cm; margin-bottom: 0.6em;">CÔNG VĂN TRẢ LỜI YÊU CẦU XÁC MINH</h1>
        <h2 style="text-align: center; font-size: 12pt; font-weight: bold; margin-bottom: 1cm;">V/v: Xác minh thông tin đối tượng vi phạm</h2>

        <p style="margin-bottom: 0.6em;"><strong style="font-size: 12pt;">Kính gửi:</strong> <<requestingUnitName>></p>

        <p style="text-align: justify; text-indent: 40px; margin-bottom: 0.6em;">Công an xã Kiều Phú nhận được công văn số <<docNumber>> ngày <<docDate:DD/MM/YYYY>> của <<requestingUnitName>> về việc yêu cầu xác minh thông tin đối tượng:</p>

        <ul style="list-style-type: none; margin-left: 40px; padding-left: 0; margin-bottom: 0.6em;">
          <li style="text-align: justify;"><span style="display: inline-block; width: 100px; font-weight: bold;">Họ và tên:</span> <<offenderName>></li>
          <li style="text-align: justify;"><span style="display: inline-block; width: 100px; font-weight: bold;">CCCD:</span> <<citizenId>></li>
          <li style="text-align: justify;"><span style="display: inline-block; width: 100px; font-weight: bold;">Ngày sinh:</span> <<dateOfBirth:DD/MM/YYYY>></li>
          <li style="text-align: justify;"><span style="display: inline-block; width: 100px; font-weight: bold;">Địa chỉ:</span> <<address>></li>
          <li style="text-align: justify;"><span style="display: inline-block; width: 100px; font-weight: bold;">Hành vi:</span> <<violationBehavior>></li>
        </ul>

        <p style="text-align: justify; text-indent: 40px; margin-bottom: 0.6em;">Sau khi tiến hành xác minh, Công an xã Kiều Phú xin thông báo kết quả như sau:</p>

        <p style="text-align: justify; text-indent: 40px; margin-bottom: 0.6em;"><<resultContent>></p>
        <p style="text-align: justify; text-indent: 40px; margin-bottom: 0.6em;">(Kết quả xác minh: <<verificationResult>>. Ngày hoàn thành: <<endDate:DD/MM/YYYY>>)</p>


        <p style="text-align: justify; text-indent: 40px; margin-bottom: 0.6em;">Công an xã Kiều Phú thông báo để <<requestingUnitName>> được biết và giải quyết theo quy định.</p>

        <table style="width: 100%; border-collapse: collapse; margin-top: 1cm;">
          <tr>
            <td style="width: 50%; border: none !important; padding: 0 !important;">
              <p style="font-size: 12pt; font-weight: bold; margin: 0.6em 0 0.6em 0; text-align: left;">Nơi nhận:</p>
              <ul style="list-style-type: none; margin: 0; padding-left: 20px;">
                <li style="font-size: 12pt; text-align: left; margin-bottom: 0.2em;">- <<requestingUnitName>>;</li>
                <li style="font-size: 12pt; text-align: left; margin-bottom: 0.2em;">- Lưu: VT.</li>
              </ul>
            </td>
            <td style="width: 50%; border: none !important; padding: 0 !important; text-align: center;">
              <p style="font-size: 13pt; font-weight: bold; margin: 0.6em auto 0.6em auto;" class="signature-title">THỦ TRƯỞNG ĐƠN VỊ</p>
              <p style="font-size: 12pt; margin: 0.6em auto 0.6em auto;" class="signature-text">(Ký tên, đóng dấu)</p>
              <p style="font-size: 13pt; font-weight: bold; margin-top: 1.5cm; margin-bottom: 0.6em;" class="signature-name">[HỌ TÊN]</p>
            </td>
          </tr>
        </table>
      </div>
      `,
    },
    {
      id: 'template2',
      name: 'Mẫu Công văn 2 (Biến thể)',
      content: `
      <div style="font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.35; padding: 2cm 2cm 2cm 3cm; width: 21cm; margin: 0 auto; box-sizing: border-box;">
        <table class="doc-header-table" style="width: 100%; border-collapse: collapse; margin-bottom: 0.5cm;">
          <tr>
            <td style="width: 50%; text-align: center; border: none !important; padding: 0 !important;">
              <p style="font-size: 13pt; font-weight: bold; margin: 0; white-space: nowrap;">CÔNG AN TP HÀ NỘI</p>
              <p style="font-size: 13pt; font-weight: bold; margin: 0; text-decoration: underline; white-space: nowrap;">CÔNG AN XÃ KIỀU PHÚ</p>
            </td>
            <td style="width: 50%; text-align: center; border: none !important; padding: 0 !important;">
              <p style="font-size: 13pt; font-weight: bold; margin: 0; white-space: nowrap;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
              <p style="font-size: 13pt; font-weight: bold; margin: 0; text-decoration: underline;">Độc lập - Tự do - Hạnh phúc</p>
            </td>
          </tr>
          <tr>
            <td style="width: 50%; text-align: center; border: none !important; padding: 0 !important;">
              <p style="margin-top: 0.2cm; font-size: 12pt; margin-bottom: 0.6em;">Số: <<responseDocNumber>>/CV-CAXKP</p>
            </td>
            <td style="width: 50%; border: none !important; padding: 0 !important; text-align: center;">
              <p style="margin-top: 0.2cm; font-size: 12pt; margin-bottom: 0.6em; text-align: right;">Kiều Phú, ngày <<currentDay>> tháng <<currentMonth>> năm <<currentYear>></p>
            </td>
          </tr>
        </table>

        <h1 style="text-align: center; font-size: 14pt; font-weight: bold; text-transform: uppercase; margin-top: 1cm; margin-bottom: 0.6em;">VĂN BẢN PHÚC ĐÁP YÊU CẦU XÁC MINH</h1>
        <h2 style="text-align: center; font-size: 12pt; font-weight: bold; margin-bottom: 1cm;">V/v: Thông báo kết quả xác minh đối tượng</h2>

        <p style="margin-bottom: 0.6em;"><strong style="font-size: 12pt;">Kính gửi:</strong> <<requestingUnitName>></p>

        <p style="text-align: justify; text-indent: 40px; margin-bottom: 0.6em;">Công an xã Kiều Phú đã nhận được văn bản số <<docNumber>> ngày <<docDate:DD/MM/YYYY>> của <<requestingUnitName>> đề nghị xác minh đối tượng <<offenderName>> (CCCD: <<citizenId>>, Ngày sinh: <<dateOfBirth:DD/MM/YYYY>>, Địa chỉ: <<address>>) với hành vi vi phạm: <<violationBehavior>>.</p>

        <p style="text-align: justify; text-indent: 40px; margin-bottom: 0.6em;">Căn cứ kết quả điều tra, xác minh, Công an xã Kiều Phú xin phúc đáp như sau:</p>

        <p style="text-align: justify; text-indent: 40px; margin-bottom: 0.6em;"><<resultContent>></p>
        <p style="text-align: justify; text-indent: 40px; margin-bottom: 0.6em;">(Tình trạng xác minh: <<verificationResult>>. Ngày hoàn tất: <<endDate:DD/MM/YYYY>>)</p>


        <p style="text-align: justify; text-indent: 40px; margin-bottom: 0.6em;">Công an xã Kiều Phú trân trọng thông báo kết quả xác minh để <<requestingUnitName>> tiện theo dõi và xử lý theo quy định pháp luật.</p>

        <table style="width: 100%; border-collapse: collapse; margin-top: 1cm;">
          <tr>
            <td style="width: 50%; border: none !important; padding: 0 !important;">
              <p style="font-size: 12pt; font-weight: bold; margin: 0.6em 0 0.6em 0; text-align: left;">Nơi nhận:</p>
              <ul style="list-style-type: none; margin: 0; padding-left: 20px;">
                <li style="font-size: 12pt; text-align: left; margin-bottom: 0.2em;">- <<requestingUnitName>>;</li>
                <li style="font-size: 12pt; text-align: left; margin-bottom: 0.2em;">- Lưu: VT.</li>
              </ul>
            </td>
            <td style="width: 50%; border: none !important; padding: 0 !important; text-align: center;">
              <p style="font-size: 13pt; font-weight: bold; margin: 0.6em auto 0.6em auto;" class="signature-title">TM. ỦY BAN NHÂN DÂN<br>TRƯỞNG CÔNG AN XÃ</p>
              <p style="font-size: 12pt; margin: 0.6em auto 0.6em auto;" class="signature-text">(Ký tên, đóng dấu)</p>
              <p style="font-size: 13pt; font-weight: bold; margin-top: 1.5cm; margin-bottom: 0.6em;" class="signature-name">[HỌ TÊN]</p>
            </td>
          </tr>
        </table>
      </div>
      `,
    },
  ],
  selectedDocumentTemplateId: 'template1', // Default selected template
  advisoryDocuments: [],
};

export const TRAFFIC_ACCIDENT_FIELDS: FormField[] = [
  { label: 'Ngày', key: 'date', type: 'date' },
  { label: 'Giờ', key: 'time', type: 'time' },
  { label: 'Địa điểm', key: 'location', type: 'text' },
  { label: 'Nội dung', key: 'content', type: 'textarea' },
  { label: 'Hậu quả', key: 'consequences', type: 'textarea' },
  { label: 'Người Chết', key: 'deaths', type: 'number' },
  { label: 'Người Bị thương', key: 'injuries', type: 'number' },
  { label: 'Thiệt hại Ước tính (VNĐ)', key: 'estimatedDamageVND', type: 'number' },
  {
    label: 'Nồng độ cồn',
    key: 'alcoholLevel',
    type: 'select',
    options: ['Yes', 'No', 'Unknown'],
  },
  { label: 'Đơn vị thụ lý', key: 'handlingUnit', type: 'text' },
  { label: 'Kết quả xử lý', key: 'processingResult', type: 'textarea' },
];

export const VEHICLE_REGISTRATION_TYPES: VehicleType[] = ['Ô tô', 'Xe máy'];

export const TASK_CATEGORIES: TaskCategory[] = [
  'Tuần tra xử lý',
  'Tuyên truyền',
  'Tham mưu',
  'Tổng hợp',
  'Bảo vệ kỳ cuộc',
  'Cưỡng chế',
  'Phối hợp',
  'Khác',
];

export const VERIFICATION_RESULTS_OPTIONS: string[] = [
  'Chưa xác minh',
  'Đang xác minh',
  'Đã xác minh',
  'Không xác định',
];

export const VERIFICATION_REQUEST_FIELDS: FormField[] = [
  { label: 'Số CV', key: 'docNumber', type: 'text' },
  { label: 'Ngày CV', key: 'docDate', type: 'date' },
  { label: 'Họ tên VP', key: 'offenderName', type: 'text' },
  { label: 'CCCD', key: 'citizenId', type: 'text' },
  { label: 'Ngày sinh', key: 'dateOfBirth', type: 'date' },
  { label: 'Địa chỉ', key: 'address', type: 'textarea' },
  { label: 'Hành vi vi phạm', key: 'violationBehavior', type: 'textarea' },
  // verificationResult and endDate are handled in the result update modal, not main form
];

// Constants for Advisory Documents (Module 7)
export const ADVISORY_DOCUMENT_TYPES = [
  'Công văn',
  'Kiến nghị',
  'Chương trình',
  'Kế hoạch',
  'Phương án',
  'Báo cáo',
  'Khác',
];

export const ADVISORY_DOCUMENT_FIELDS: FormField[] = [
  { label: 'Số công văn/kế hoạch', key: 'docNumber', type: 'text' },
  { label: 'Ngày ban hành', key: 'docDate', type: 'date' },
  { label: 'Loại công văn', key: 'docType', type: 'select', options: ADVISORY_DOCUMENT_TYPES },
  { label: 'Nội dung', key: 'content', type: 'textarea' },
  { label: 'Đơn vị nhận', key: 'recipientUnit', type: 'text' },
  { label: 'Ngày phát hành', key: 'releaseDate', type: 'date' },
];


export const REPORT_PERIODS = [
  { value: 'weekly', label: 'Hàng Tuần' },
  { value: 'monthly', label: 'Hàng Tháng' },
  { value: 'quarterly', label: 'Hàng Quý' },
  { value: 'halfYearly', label: '6 Tháng' },
  { value: 'yearly', label: 'Hàng Năm' },
  { value: 'custom', label: 'Tùy Chọn' },
];

export const VIETNAMESE_MONTHS = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

export const REPORT_BASE_FONT_SIZE = '12pt';
export const REPORT_BASE_FONT_FAMILY = 'Times New Roman, serif';
export const REPORT_LINE_HEIGHT = 1.35; // Standard line height for formal documents

export const DOC_PLACEHOLDERS = [
  { key: 'docNumber', description: 'Số công văn yêu cầu xác minh.' },
  { key: 'docDate', description: 'Ngày công văn yêu cầu (YYYY-MM-DD). Ví dụ: <<docDate:DD/MM/YYYY>>' },
  { key: 'offenderName', description: 'Họ tên người vi phạm.' },
  { key: 'citizenId', description: 'Số căn cước công dân.' },
  { key: 'dateOfBirth', description: 'Ngày sinh của đối tượng (YYYY-MM-DD). Ví dụ: <<dateOfBirth:DD/MM/YYYY>>' },
  { key: 'address', description: 'Nơi cư trú/Địa chỉ hiện tại.' },
  { key: 'violationBehavior', description: 'Mô tả hành vi vi phạm cần xác minh.' },
  { key: 'verificationResult', description: 'Kết quả xác minh (e.g., "Đã xác minh").' },
  { key: 'endDate', description: 'Ngày hoàn thành xác minh (YYYY-MM-DD). Ví dụ: <<endDate:DD/MM/YYYY>>' },
  { key: 'resultContent', description: 'Nội dung chi tiết kết quả xác minh.' },
  { key: 'responseDocNumber', description: 'Số công văn của văn bản trả lời.' },
  { key: 'requestingUnitName', description: 'Tên đơn vị yêu cầu xác minh. Mặc định: Phòng CSGT - Công an TP Hà Nội' },
  { key: 'currentDay', description: 'Ngày hiện tại (2 chữ số). Sử dụng cho ngày tạo công văn.' },
  { key: 'currentMonth', description: 'Tháng hiện tại (2 chữ số). Sử dụng cho ngày tạo công văn.' },
  { key: 'currentYear', description: 'Năm hiện tại (4 chữ số). Sử dụng cho ngày tạo công văn.' },
  { key: 'currentDate', description: 'Ngày đầy đủ hiện tại (YYYY-MM-DD). Ví dụ: <<currentDate:DD/MM/YYYY>>' },
  { key: 'currentTime', description: 'Thời gian hiện tại (HH:MM).' },
];

export const formatDateForDisplay = (dateString: string, format: string = 'DD/MM/YYYY'): string => {
  if (!dateString) return '';
  const date = new Date(dateString);

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());

  return format
    .replace('DD', day)
    .replace('MM', month)
    .replace('YYYY', year);
};

// Navigation items for the sidebar
export const navItems = [
  { name: 'Tổng Quan', path: '/', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25v9m-4.5 0L6.75 16.5m0 0l-2.25 2.25M6.75 16.5L3 12.75M8.25 12L12 16.5m0 0l1.875 1.875M12 16.5l4.5 4.5m-4.5-4.5L12 16.5" /></svg>' },
  { name: 'QL Vụ Việc TNGT', path: '/traffic-accidents', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.732 0 2.818-1.874 1.945-3.376L12.944 3.376c-.867-1.5-3.032-1.5-3.898 0L2.697 16.376ZM12 15.75h.007v.008H12v-.008Z" /></svg>' },
  { name: 'Theo Dõi Đăng Ký Xe', path: '/vehicle-registrations', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375M12 18.75a1.5 1.5 0 0 1 3 0m-3 0a1.5 1.5 0 0 0 3 0m-3 0h6m-9 0H3.375M12 18.75c-1.011 0-1.944-.391-2.651-1.033M15 18.75c.083.67.1 1.35.047 2.025m-12 .025a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12 11.25v4.5m-3-4.5v4.5m-3-8.25h18.75c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125H3.375c-.621 0-1.125-.504-1.125-1.125V3.375c0-.621.504-1.125 1.125-1.125H12c.305 0 .597.068.865.197" /></svg>' },
  { name: 'Tạo & Theo Dõi Sự Kiện', path: '/events', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25m.75 3.75-.9.9a2.25 2.25 0 0 1-3.182-3.182l.9-.9m3.182 3.182A4.5 4.5 0 0 0 12 14.25m7.5-2.25-.9.9a2.25 2.25 0 0 1-3.182-3.182l.9-.9m3.182 3.182A4.5 4.5 0 0 0 12 9.75M12 9.75a4.5 4.5 0 0 1 1.5 3.75m-1.5-3.75a4.5 4.5 0 0 0-1.5 3.75H12m0 0H9.563M12 12.75h7.5M7.5 7.5h-.75A2.25 2.25 0 0 0 4.5 9.75v.75m7.5-7.5h-.75A2.25 2.25 0 0 0 9 4.5m1.5 0h-.75M6.75 6.75H6m6-3.75h.25M18 6.75h-.25m-3 0h-.25m0 0V4.5m0 3.75v.25M12 12.75h.25V12M7.5 7.5h-.25V7.5m6-3h3.375a2.25 2.25 0 0 1 2.25 2.25v1.5m-4.5-4.5H12M5.625 10.5H5.25m0 0v2.25m0 0h2.25m4.5-4.5h-.086A2.25 2.25 0 0 0 9 7.5h-.584m1.06 4.342L12 16.5m-2.25 2.25L12 16.5m0 0L14.25 18.75" /></svg>' },
  { name: 'Theo Dõi Công Tác', path: '/daily-tasks', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.267-.097 2.51-.298 3.717A1.751 1.751 0 0 1 17.5 19.25a1.75 0 0 1-1.75-1.75c0-1.21.144-2.393.41-3.513C16.5 12.33 18 12 18 12c0-.03.02-1.795-.148-2.585A2 0 0 0 15.5 8.75a2.002 2.002 0 0 0-1.785-1.025c-.267-.056-.534-.085-.8-.085H6.75V6.32a.5.5 0 0 0-.82-.385l-4.5 3.75a.5.5 0 0 0 0 .77L6.75 14.23a.5.5 0 0 0 .82-.385v-.78H12c.706 0 1.353-.083 1.942-.23A2.75 2.75 0 0 0 16 11.25c.086-1.18.25-2.022.25-2.25 0-.083-.004-.13-.012-.178l.004-.002h2.003L18 12Z" /></svg>' },
  { name: 'QL Phối Hợp Xác Minh', path: '/verification-management', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75M12 6.75V4.5M12 6.75A1.5 1.5 0 0 1 13.5 9h.75M12 6.75A1.5 1.5 0 0 0 10.5 9h-.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5H4.5A2.25 2.25 0 0 0 2.25 6.75v10.5A2.25 2.25 0 0 0 4.5 19.5Z" /></svg>' },
  { name: 'Tạo Báo Cáo', path: '/reports', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h-3M3 14.25h3m7.5-10.5h3m-9 18.75h3M5.25 19.5h-.375a2.25 2.25 0 0 1-2.25-2.25V6.75a2.25 2.25 0 0 1 2.25-2.25h10.5a2.25 2.25 0 0 1 2.25 2.25v2.25m-10.5 7.5h9c.621 0 1.125-.504 1.125-1.125v-9c0-.621-.504-1.125-1.125-1.125h-9c-.621 0-1.125.504-1.125 1.125v9c0 .621.504 1.125 1.125 1.125Z" /></svg>' },
  { name: 'QL Công Tác Tham Mưu', path: '/advisory-management', icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75" /></svg>' },
];
