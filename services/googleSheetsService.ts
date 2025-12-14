
import { AppData, GoogleSheetsConfig, TrafficAccident, VehicleRegistration, Event, DailyTask, VerificationRequest, AdvisoryDocument } from '../types';

export const initGoogleApi = (config: GoogleSheetsConfig, callback: (inited: boolean) => void) => {
  if (config.scriptUrl) {
    callback(true);
  } else {
    callback(false);
  }
};

export const handleGoogleLogin = async (): Promise<void> => {
  return Promise.resolve();
};

export const handleGoogleLogout = () => {
  // No-op
};

// --- HELPER FUNCTIONS ---

const generateId = (): string => Math.random().toString(36).substring(2, 9);

// Helper: Tìm key trong object không phân biệt hoa thường
const findKeyCaseInsensitive = (obj: any, key: string): any => {
    if (!obj) return undefined;
    const foundKey = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
    return foundKey ? obj[foundKey] : undefined;
};

// Ép kiểu về số nguyên an toàn (Xử lý tốt các format 1.000.000 hoặc 1,000,000)
// Dùng cho: Số người, Số tiền VNĐ, Số lượng xe (thường là số nguyên)
const safeInt = (val: any): number => {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return Math.floor(val);
    
    let str = String(val).trim();
    // Loại bỏ tất cả ký tự không phải số và dấu trừ (ví dụ: loại bỏ dấu chấm, phẩy, chữ)
    // Giả định: Các trường dùng hàm này đều là số nguyên dương (hoặc âm), không có thập phân.
    // Nếu dữ liệu gốc là 1.5 -> thành 15 (chấp nhận rủi ro này để ưu tiên đọc được các số tiền lớn có dấu chấm)
    const cleanStr = str.replace(/[^0-9-]/g, '');
    const num = parseInt(cleanStr, 10);
    return isNaN(num) ? 0 : num;
};

// Ép kiểu về số thực (giữ thập phân)
const safeNum = (val: any): number => {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return val;
    
    let str = String(val).trim();
    // Thay thế dấu phẩy thành chấm nếu có (định dạng VN 1,5 -> 1.5)
    // Nhưng cẩn thận với 1,000 (US) -> 1.000 (VN)
    // Chiến lược an toàn: Xóa dấu chấm (ngàn), thay phẩy bằng chấm (thập phân) nếu có cả 2
    if (str.includes('.') && str.includes(',')) {
         // Đoán: 1.000,50 (VN) hoặc 1,000.50 (US)
         if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
             // 1.000,50 -> 1000.50
             str = str.replace(/\./g, '').replace(/,/g, '.');
         } else {
             // 1,000.50 -> 1000.50
             str = str.replace(/,/g, '');
         }
    } else if (str.includes(',')) {
        // Chỉ có phẩy: 10,5 -> 10.5
        str = str.replace(/,/g, '.');
    }
    // Nếu chỉ có chấm: 1.000 -> ParseFloat sẽ hiểu là 1. Nếu là tiền thì dùng safeInt, đây là safeNum cho chỉ số.
    
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
};

// Ép kiểu về chuỗi an toàn
const safeStr = (val: any): string => {
    if (val === null || val === undefined) return '';
    const s = String(val).trim();
    if (s.toLowerCase() === 'undefined' || s.toLowerCase() === 'null') return '';
    // Fix ngày tháng dạng ISO từ Google Sheet (nếu có)
    if (s.match(/^\d{4}-\d{2}-\d{2}T/)) {
        return s.substring(0, 10);
    }
    return s;
};

// Hàm kiểm tra Header
const isHeaderRow = (item: any, keyCheck: string): boolean => {
    if (!item || typeof item !== 'object') return false;
    // Tìm value của keyCheck (case insensitive trong object item)
    const val = findKeyCaseInsensitive(item, keyCheck);
    if (typeof val === 'string' && val.trim().toLowerCase() === keyCheck.toLowerCase()) return true;
    return false;
};

// Helper lấy giá trị property không phân biệt hoa thường từ item
const getProp = (item: any, key: string): any => {
    return findKeyCaseInsensitive(item, key);
};

// --- DATA CLEANING & MAPPING FUNCTIONS ---

const mapTrafficAccidents = (list: any[]): TrafficAccident[] => {
    if (!Array.isArray(list)) return [];
    return list
        .filter(item => item && typeof item === 'object' && !isHeaderRow(item, 'id'))
        .map(item => ({
            id: safeStr(getProp(item, 'id')) || generateId(),
            date: safeStr(getProp(item, 'date')),
            time: safeStr(getProp(item, 'time')),
            location: safeStr(getProp(item, 'location')),
            content: safeStr(getProp(item, 'content')),
            consequences: safeStr(getProp(item, 'consequences')),
            deaths: safeInt(getProp(item, 'deaths')), // Dùng safeInt cho người
            injuries: safeInt(getProp(item, 'injuries')), // Dùng safeInt cho người
            estimatedDamageVND: safeInt(getProp(item, 'estimatedDamageVND')), // Dùng safeInt cho tiền
            alcoholLevel: safeStr(getProp(item, 'alcoholLevel')) || 'Unknown',
            handlingUnit: safeStr(getProp(item, 'handlingUnit')),
            processingResult: safeStr(getProp(item, 'processingResult'))
        }));
};

const mapVehicleRegistrations = (list: any[]): VehicleRegistration[] => {
    if (!Array.isArray(list)) return [];
    return list
        .filter(item => item && typeof item === 'object' && !isHeaderRow(item, 'vehicleType'))
        .map(item => {
            let vType = safeStr(getProp(item, 'vehicleType'));
            // Chuẩn hóa loại xe
            if (vType.toLowerCase().includes('máy')) vType = 'Xe máy';
            else vType = 'Ô tô';

            return {
                id: safeStr(getProp(item, 'id')) || generateId(),
                date: safeStr(getProp(item, 'date')),
                vehicleType: vType as any,
                firstTimeCount: safeInt(getProp(item, 'firstTimeCount')),
                transferCount: safeInt(getProp(item, 'transferCount')),
                recallCount: safeInt(getProp(item, 'recallCount')),
                renewalCount: safeInt(getProp(item, 'renewalCount'))
            };
        });
};

const mapEvents = (list: any[]): Event[] => {
    if (!Array.isArray(list)) return [];
    return list
        .filter(item => item && typeof item === 'object' && !isHeaderRow(item, 'id'))
        .map(item => {
            let targets = [];
            const rawTargets = getProp(item, 'targets');
            if (Array.isArray(rawTargets)) {
                targets = rawTargets;
            } else if (typeof rawTargets === 'string' && rawTargets.startsWith('[')) {
                try { targets = JSON.parse(rawTargets); } catch (e) { targets = []; }
            }
            
            return {
                id: safeStr(getProp(item, 'id')) || generateId(),
                name: safeStr(getProp(item, 'name')),
                fromDate: safeStr(getProp(item, 'fromDate')),
                toDate: safeStr(getProp(item, 'toDate')),
                content: safeStr(getProp(item, 'content')),
                targets: targets
            };
        });
};

const mapDailyTasks = (list: any[]): DailyTask[] => {
    if (!Array.isArray(list)) return [];
    return list
        .filter(item => item && typeof item === 'object' && !isHeaderRow(item, 'category'))
        .map(item => ({
            id: safeStr(getProp(item, 'id')) || generateId(),
            date: safeStr(getProp(item, 'date')),
            category: safeStr(getProp(item, 'category')) as any,
            description: safeStr(getProp(item, 'description')),
            result: safeStr(getProp(item, 'result'))
        }));
};

const mapVerificationRequests = (list: any[]): VerificationRequest[] => {
    if (!Array.isArray(list)) return [];
    return list
        .filter(item => item && typeof item === 'object' && !isHeaderRow(item, 'docNumber'))
        .map(item => ({
            id: safeStr(getProp(item, 'id')) || generateId(),
            docNumber: safeStr(getProp(item, 'docNumber')),
            docDate: safeStr(getProp(item, 'docDate')),
            offenderName: safeStr(getProp(item, 'offenderName')),
            citizenId: safeStr(getProp(item, 'citizenId')),
            dateOfBirth: safeStr(getProp(item, 'dateOfBirth')),
            address: safeStr(getProp(item, 'address')),
            violationBehavior: safeStr(getProp(item, 'violationBehavior')),
            verificationResult: safeStr(getProp(item, 'verificationResult')) || 'Chưa xác minh',
            endDate: safeStr(getProp(item, 'endDate')),
            resultContent: safeStr(getProp(item, 'resultContent'))
        }));
};

const mapAdvisoryDocuments = (list: any[]): AdvisoryDocument[] => {
    if (!Array.isArray(list)) return [];
    return list
        .filter(item => item && typeof item === 'object' && !isHeaderRow(item, 'docNumber'))
        .map(item => ({
            id: safeStr(getProp(item, 'id')) || generateId(),
            docNumber: safeStr(getProp(item, 'docNumber')),
            docDate: safeStr(getProp(item, 'docDate')),
            docType: safeStr(getProp(item, 'docType')),
            content: safeStr(getProp(item, 'content')),
            recipientUnit: safeStr(getProp(item, 'recipientUnit')),
            releaseDate: safeStr(getProp(item, 'releaseDate'))
        }));
};


const cleanGoogleSheetData = (data: Partial<AppData>): Partial<AppData> => {
    const cleaned: Partial<AppData> = {};
    
    // Tìm key array trong data response (case insensitive)
    const trafficList = findKeyCaseInsensitive(data, 'trafficAccidents');
    const vehicleList = findKeyCaseInsensitive(data, 'vehicleRegistrations');
    const eventList = findKeyCaseInsensitive(data, 'events');
    const taskList = findKeyCaseInsensitive(data, 'dailyTasks');
    const verifyList = findKeyCaseInsensitive(data, 'verificationRequests');
    const advisoryList = findKeyCaseInsensitive(data, 'advisoryDocuments');
    
    // Map dữ liệu
    if (trafficList) cleaned.trafficAccidents = mapTrafficAccidents(trafficList);
    if (vehicleList) cleaned.vehicleRegistrations = mapVehicleRegistrations(vehicleList);
    if (eventList) cleaned.events = mapEvents(eventList);
    if (taskList) cleaned.dailyTasks = mapDailyTasks(taskList);
    if (verifyList) cleaned.verificationRequests = mapVerificationRequests(verifyList);
    if (advisoryList) cleaned.advisoryDocuments = mapAdvisoryDocuments(advisoryList);
    
    // Giữ lại các cài đặt khác
    const tmpl = findKeyCaseInsensitive(data, 'responseDocumentTemplates');
    if (tmpl) cleaned.responseDocumentTemplates = tmpl;
    
    const selTmpl = findKeyCaseInsensitive(data, 'selectedDocumentTemplateId');
    if (selTmpl) cleaned.selectedDocumentTemplateId = selTmpl;

    console.log("Cleaned Data Result:", cleaned);
    return cleaned;
};

// --- CORE SEND FUNCTION ---
const sendPayloadToScript = async (scriptUrl: string, payload: any) => {
    try {
        if (!scriptUrl) return;

        const response = await fetch(scriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (result.status === 'error') {
            console.error("Script Error:", result.message);
            throw new Error(result.message);
        }
        return result;
    } catch (error: any) {
        console.error("Sync Error:", error);
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
             console.warn("CORS Warning: Data might have been sent but browser blocked response.");
        }
    }
}

export const appendRowToSheet = async (scriptUrl: string, sheetKey: keyof AppData, newItem: any) => {
    const payload = { action: 'append', sheetName: sheetKey, data: newItem };
    return sendPayloadToScript(scriptUrl, payload);
};

export const updateSheetData = async (scriptUrl: string, sheetKey: keyof AppData, listData: any[]) => {
    const payload = { action: 'update_sheet', sheetName: sheetKey, data: listData };
    return sendPayloadToScript(scriptUrl, payload);
};

export const exportDataToGoogleSheets = async (scriptUrl: string, data: AppData) => {
    const payload = { action: 'full_sync', data: data };
    const legacyPayload = { ...data, ...payload }; 
    return sendPayloadToScript(scriptUrl, legacyPayload);
};


// --- IMPORT ---
export const importDataFromGoogleSheets = async (scriptUrl: string): Promise<Partial<AppData>> => {
  if (!scriptUrl) throw new Error("Chưa cấu hình URL (Link) của Google Script.");
  if (!scriptUrl.startsWith('http')) throw new Error("URL Google Script không hợp lệ.");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const url = new URL(scriptUrl);
    url.searchParams.append('t', Date.now().toString()); 
    url.searchParams.append('action', 'read'); 

    const response = await fetch(url.toString(), {
        method: 'GET',
        redirect: 'follow',
        credentials: 'omit',
        signal: controller.signal 
    });

    clearTimeout(timeoutId); 

    if (!response.ok) {
        throw new Error(`Lỗi Server Google (${response.status} - ${response.statusText}).`);
    }

    const text = await response.text();
    if (text.trim().startsWith('<')) {
        throw new Error("AUTH_ERROR: Link đúng nhưng chưa cấp quyền 'Anyone' hoặc URL sai.");
    }

    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        console.error("Raw response:", text);
        throw new Error("JSON_ERROR: Dữ liệu trả về không đúng định dạng JSON.");
    }

    if (data.status === 'error') throw new Error(data.message || 'Script trả về lỗi.');

    const rawData = (data.data || data);
    console.log("Raw Cloud Data:", rawData); // Debug log

    if (!rawData || typeof rawData !== 'object') {
        throw new Error("EMPTY_ERROR: Server trả về dữ liệu rỗng.");
    }

    return cleanGoogleSheetData(rawData);

  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("Import Error Full:", error);

    if (error.name === 'AbortError') {
        throw new Error("TIMEOUT_ERROR: Quá thời gian chờ (15s). Kiểm tra mạng.");
    }
    if (error.name === 'TypeError') {
        throw new Error("CORS_ERROR: Trình duyệt chặn hoặc Mất mạng. Kiểm tra Internet và quyền Script.");
    }
    throw error;
  }
};
