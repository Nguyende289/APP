
import { GoogleGenAI } from "@google/genai";
import {
  TrafficAccident,
  VehicleRegistration,
  Event,
  DailyTask,
  VerificationRequest,
  AdvisoryDocument,
} from '../types';
import {
  REPORT_BASE_FONT_FAMILY,
  REPORT_BASE_FONT_SIZE,
  REPORT_LINE_HEIGHT,
} from '../constants';

interface GeneratePoliceReportParams {
  dateFrom: Date;
  dateTo: Date;
  // Summary data from AutomaticReportGeneration.tsx
  totalAccidentsSummary: number;
  totalDeathsSummary: number;
  totalInjuriesSummary: number;
  totalAlcoholAccidentsSummary: number;
  totalDamageAccidentsSummary: number;
  registrationStatsSummary: { type: string; first: number; transfer: number; recall: number; renewal: number; total: number; }[];
  // Fix: Add totalVehicleRegistrationsSummary to the interface
  totalVehicleRegistrationsSummary: number;
  totalEventsSummary: number;
  totalEventGoalAchievedPercentage: string;
  totalDailyTasksSummary: number;
  dailyTaskCategorySummary: { category: string; count: number; }[];
  totalVerificationRequestsSummary: number;
  verificationResultSummary: { 'Đã xác minh': number; 'Đang xác minh': number; 'Chưa xác minh': number; 'Không xác định': number; };
  totalAdvisoryDocumentsSummary: number;
  advisoryDocTypeSummary: { type: string; count: number; }[];
}

const formatDateToLocaleString = (date: Date): string => {
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
};

export async function generatePoliceReport({
  dateFrom,
  dateTo,
  totalAccidentsSummary,
  totalDeathsSummary,
  totalInjuriesSummary,
  totalAlcoholAccidentsSummary,
  totalDamageAccidentsSummary,
  registrationStatsSummary,
  totalVehicleRegistrationsSummary,
  totalEventsSummary,
  totalEventGoalAchievedPercentage,
  totalDailyTasksSummary,
  dailyTaskCategorySummary,
  totalVerificationRequestsSummary,
  verificationResultSummary,
  totalAdvisoryDocumentsSummary,
  advisoryDocTypeSummary,
}: GeneratePoliceReportParams): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const formattedDateFrom = formatDateToLocaleString(dateFrom);
  const formattedDateTo = formatDateToLocaleString(dateTo);
  const currentPrintDate = formatDateToLocaleString(new Date());

  // Helper to format table data for AI
  const formatTableForAI = (data: any[], columns: string[]): string => {
    if (!data || data.length === 0) return "Không có dữ liệu.";
    const header = columns.join('\t');
    const rows = data.map(row => columns.map(col => row[col] !== undefined ? row[col].toString() : '').join('\t')).join('\n');
    return header + '\n' + rows;
  };

  const registrationStatsString = formatTableForAI(
    registrationStatsSummary,
    ['type', 'first', 'transfer', 'recall', 'renewal', 'total']
  );
  const dailyTaskCategoryString = formatTableForAI(
    dailyTaskCategorySummary,
    ['category', 'count']
  );
  const advisoryDocTypeString = formatTableForAI(
    advisoryDocTypeSummary,
    ['type', 'count']
  );


  const prompt = `
Bạn là một trợ lý chuyên nghiệp có khả năng tạo báo cáo hành chính theo chuẩn Nghị định số 30/2020/NĐ-CP ngày 05 tháng 3 năm 2020 của Chính phủ.
Hãy tạo một báo cáo tổng hợp công tác cho lực lượng cảnh sát trật tự, sử dụng các DỮ LIỆU TÓM TẮT cung cấp dưới đây trong khoảng thời gian từ ${formattedDateFrom} đến ${formattedDateTo}.
Báo cáo phải được định dạng hoàn chỉnh bằng HTML, tuân thủ nghiêm ngặt các quy định về thể thức văn bản hành chính:

1.  **Cấu trúc chung**:
    *   Sử dụng font 'Times New Roman', cỡ chữ 12pt (riêng tiêu đề chính 14pt, các tiêu đề phụ và quốc hiệu 13pt).
    *   Giãn dòng 1.35.
    *   Lề: Trên 2cm, dưới 2cm, trái 3cm, phải 2cm. (Dù HTML sẽ được nhúng vào div có padding, hãy đảm bảo cấu trúc nội bộ nếu có thể gợi ý lề).
    *   Các đoạn văn bản có text-align: justify; và text-indent: 40px; (trừ tiêu đề và danh sách).
    *   Các tiêu đề chính (h1) in hoa, in đậm, căn giữa.
    *   Các tiêu đề phụ (h2, h3, h4) in đậm, căn giữa hoặc căn trái tùy cấp độ.
    *   Sử dụng thẻ HTML <strong> cho chữ in đậm.

2.  **Quốc hiệu và tiêu ngữ**:
    *   Bên trái trên cùng: CÔNG AN TP HÀ NỘI<br>CÔNG AN XÃ KIỀU PHÚ
    *   Bên phải trên cùng: CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>Độc lập - Tự do - Hạnh phúc
    *   Cỡ chữ 13pt, in đậm, căn giữa. Dòng "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM" không xuống dòng.
    *   Ngày tháng báo cáo ở góc phải, cỡ chữ 12pt: "Kiều Phú, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}"

3.  **Nội dung báo cáo**: Chia thành các mục lớn (I, II, III, IV, V, VI) tương ứng với các module và các tiêu đề nhỏ hơn (h4) nếu có chi tiết bảng biểu.
    *   AI PHẢI VIẾT BÁO CÁO CÓ TÍNH TƯỜNG THUẬT, PHÂN TÍCH, KHÔNG CHỈ KỂ LẠI DỮ LIỆU.

    **TIÊU ĐỀ CHÍNH CỦA BÁO CÁO:** BÁO CÁO TỔNG HỢP CÔNG TÁC<br>Từ ngày ${formattedDateFrom} đến ngày ${formattedDateTo}

    ---

    **DỮ LIỆU TÓM TẮT ĐỂ TẠO BÁO CÁO (AI CHỈ DỰA VÀO ĐÂY ĐỂ VIẾT, KHÔNG TỰ TẠO THÊM SỐ LIỆU):**

    **1. Quản Lý Vụ Việc Tai Nạn Giao Thông (${formattedDateFrom} - ${formattedDateTo}):**
    - Tổng số vụ: ${totalAccidentsSummary}
    - Tổng số người chết: ${totalDeathsSummary}
    - Tổng số người bị thương: ${totalInjuriesSummary}
    - Tổng số vụ có nồng độ cồn: ${totalAlcoholAccidentsSummary}
    - Tổng thiệt hại ước tính: ${formatCurrency(totalDamageAccidentsSummary)}

    **2. Theo Dõi Kết Quả Đăng Ký Xe (${formattedDateFrom} - ${formattedDateTo}):**
    - Tổng số lượt đăng ký: ${totalVehicleRegistrationsSummary}
    - Thống kê chi tiết theo loại xe:
      ${registrationStatsString}

    **3. Tạo và Theo Dõi Sự Kiện (Đợt Công Tác/Cao Điểm) (${formattedDateFrom} - ${formattedDateTo}):**
    - Tổng số sự kiện trong kỳ: ${totalEventsSummary}
    - Tổng tiến độ mục tiêu đạt được: ${totalEventGoalAchievedPercentage}

    **4. Theo Dõi Công Tác Thường Xuyên & Công Tác Theo Giai Đoạn (${formattedDateFrom} - ${formattedDateTo}):**
    - Tổng số công tác đã ghi nhận: ${totalDailyTasksSummary}
    - Phân loại theo danh mục:
      ${dailyTaskCategoryString}

    **5. Quản Lý Phối Hợp Xác Minh (${formattedDateFrom} - ${formattedDateTo}):**
    - Tổng số yêu cầu xác minh: ${totalVerificationRequestsSummary}
    - Số yêu cầu đã xác minh: ${verificationResultSummary['Đã xác minh']}
    - Số yêu cầu đang xác minh: ${verificationResultSummary['Đang xác minh']}
    - Số yêu cầu chưa xác minh: ${verificationResultSummary['Chưa xác minh']}
    - Số yêu cầu không xác định: ${verificationResultSummary['Không xác định']}

    **6. Quản Lý Công Tác Tham Mưu (${formattedDateFrom} - ${formattedDateTo}):**
    - Tổng số công văn/kế hoạch tham mưu: ${totalAdvisoryDocumentsSummary}
    - Phân loại theo loại công văn:
      ${advisoryDocTypeString}

    **Yêu cầu cuối báo cáo:**
    - Ghi ngày tháng hiện tại (ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}) ở góc phải.
    - Chức danh "NGƯỜI LẬP BÁO CÁO" (in đậm, cỡ 13pt).
    - Dòng "(Ký, ghi rõ họ tên)" (cỡ 12pt).
    - Dòng tên người lập báo cáo (cỡ 13pt, in đậm, cách 2cm).

Hãy tạo toàn bộ nội dung HTML cho báo cáo, bao gồm cả thẻ <div> chính với style cho font, cỡ chữ, giãn dòng và padding.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Or 'gemini-2.5-flash' for faster response, 'gemini-3-pro-preview' for better quality
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      config: {
        temperature: 0.7, // Adjust for creativity vs. adherence
        maxOutputTokens: 16384, // Increased tokens for a full report
      },
    });

    const reportText = response.text;
    if (!reportText) {
      throw new Error('AI did not return any text for the report.');
    }
    
    // Sometimes Gemini might wrap HTML in markdown code block, remove it.
    let cleanedHtml = reportText.trim();
    if (cleanedHtml.startsWith('```html') && cleanedHtml.endsWith('```')) {
        cleanedHtml = cleanedHtml.substring(7, cleanedHtml.length - 3).trim();
    } else if (cleanedHtml.startsWith('```') && cleanedHtml.endsWith('```')) {
        cleanedHtml = cleanedHtml.substring(3, cleanedHtml.length - 3).trim();
    }

    return cleanedHtml;

  } catch (error) {
    console.error('Error generating report with AI:', error);
    throw new Error(`Không thể tạo báo cáo bằng AI. Vui lòng thử lại hoặc kiểm tra kết nối. Chi tiết: ${error instanceof Error ? error.message : String(error)}`);
  }
}
