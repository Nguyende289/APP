
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import InputField from './InputField';
import { AppData, GoogleSheetsConfig, FirebaseConfig } from '../types';
import { 
  initGoogleApi, 
  exportDataToGoogleSheets, 
  importDataFromGoogleSheets 
} from '../services/googleSheetsService';
import { GOOGLE_SCRIPT_URL, STORAGE_KEY_GOOGLE_CONFIG, STORAGE_KEY_FIREBASE_CONFIG, DEFAULT_FIREBASE_CONFIG } from '../constants';

interface GoogleSheetsSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentData: AppData;
  onDataLoaded: (data: Partial<AppData>) => void;
}

const GoogleSheetsSettings: React.FC<GoogleSheetsSettingsProps> = ({ 
  isOpen, 
  onClose, 
  currentData, 
  onDataLoaded 
}) => {
  const [activeTab, setActiveTab] = useState<'sheets' | 'firebase'>('sheets');
  
  // Google Sheets Config
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>({
    scriptUrl: GOOGLE_SCRIPT_URL,
    autoSync: true, 
  });

  // Firebase Config - Initialized with Default Config (Enabled by default)
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConfig>(DEFAULT_FIREBASE_CONFIG);
  
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    // Load Sheets Config
    const savedSheets = localStorage.getItem(STORAGE_KEY_GOOGLE_CONFIG);
    if (savedSheets) {
      const parsed = JSON.parse(savedSheets);
      setSheetsConfig({
        scriptUrl: parsed.scriptUrl || GOOGLE_SCRIPT_URL,
        autoSync: parsed.autoSync !== undefined ? parsed.autoSync : true,
      });
    }

    // Load Firebase Config (Overwrite default if exists in storage)
    const savedFirebase = localStorage.getItem(STORAGE_KEY_FIREBASE_CONFIG);
    if (savedFirebase) {
        const parsed = JSON.parse(savedFirebase);
        setFirebaseConfig(parsed);
        if (parsed.enabled) setActiveTab('firebase');
    } else {
        // If no config saved, default is enabled, so switch tab to reflect active state
        setActiveTab('firebase');
    }
  }, [isOpen]); 

  const saveSheetsConfig = () => {
    if (!sheetsConfig.scriptUrl || !sheetsConfig.scriptUrl.includes('/exec')) {
        alert('Lưu thất bại: URL không hợp lệ. URL phải kết thúc bằng "/exec"');
        return;
    }
    localStorage.setItem(STORAGE_KEY_GOOGLE_CONFIG, JSON.stringify(sheetsConfig));
    // Disable Firebase if user explicitly saves Sheets config
    const newFbConfig = { ...firebaseConfig, enabled: false };
    setFirebaseConfig(newFbConfig);
    localStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, JSON.stringify(newFbConfig));
    
    alert("Đã lưu cấu hình Google Sheets! Chế độ Firebase đã tắt.");
    onClose();
    window.location.reload(); // Reload to apply changes
  };

  const saveFirebaseConfig = () => {
      const newConfig = { ...firebaseConfig, enabled: true };
      setFirebaseConfig(newConfig);
      localStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, JSON.stringify(newConfig));
      alert("Đã lưu cấu hình Firebase! Ứng dụng sẽ tải lại để kết nối.");
      onClose();
      window.location.reload();
  };

  const handleSyncToSheets = async () => {
    if (!sheetsConfig.scriptUrl) {
        alert('Lỗi: Chưa nhập đường dẫn Google Script URL.');
        return;
    }
    setIsLoading(true);
    setStatusMessage(`⏳ Đang đẩy dữ liệu lên Google Sheets...`);
    setIsError(false);

    try {
      await exportDataToGoogleSheets(sheetsConfig.scriptUrl, currentData);
      setStatusMessage(`✅ Đồng bộ thành công lúc ${new Date().toLocaleTimeString()}!`);
      alert("Đồng bộ lên Cloud thành công!");
    } catch (error: any) {
      setIsError(true);
      setStatusMessage(`❌ Đồng bộ thất bại: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePullFromSheets = async () => {
      if (!sheetsConfig.scriptUrl) return;
      setIsLoading(true);
      setStatusMessage("⏳ Đang tải dữ liệu về...");
      try {
          const data = await importDataFromGoogleSheets(sheetsConfig.scriptUrl);
          onDataLoaded(data);
          setStatusMessage("✅ Đã tải dữ liệu thành công!");
          alert("Đã khôi phục dữ liệu từ Google Sheets thành công.");
      } catch (e: any) {
          setIsError(true);
          setStatusMessage("❌ Lỗi tải dữ liệu: " + e.message);
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cấu hình Đồng bộ Dữ liệu" maxWidth="max-w-4xl">
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
          <button 
            className={`py-2 px-4 font-medium text-sm focus:outline-none ${activeTab === 'sheets' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('sheets')}
          >
              Google Sheets (Cơ bản)
          </button>
          <button 
            className={`py-2 px-4 font-medium text-sm focus:outline-none ${activeTab === 'firebase' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('firebase')}
          >
              Firebase (Nâng cao - Realtime)
          </button>
      </div>

      {activeTab === 'sheets' && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-sm text-blue-800">
                <p>Google Sheets là giải pháp miễn phí, dễ cài đặt nhưng tốc độ chậm hơn.</p>
            </div>
            <InputField
                label="Google Apps Script Web App URL:"
                id="scriptUrl"
                value={sheetsConfig.scriptUrl}
                onChange={(e) => setSheetsConfig({...sheetsConfig, scriptUrl: e.target.value})}
                placeholder="https://script.google.com/macros/s/.../exec"
            />
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="autoSync"
                        checked={sheetsConfig.autoSync}
                        onChange={(e) => setSheetsConfig({...sheetsConfig, autoSync: e.target.checked})}
                        className="w-5 h-5 text-blue-600 rounded"
                    />
                    <label htmlFor="autoSync" className="text-gray-900 text-sm">Tự động sao lưu</label>
                </div>
                <Button size="sm" onClick={saveSheetsConfig}>Lưu & Sử dụng Sheets</Button>
            </div>
            
            <hr className="border-gray-200" />
            
            <div className="grid grid-cols-2 gap-4">
                 <Button onClick={handleSyncToSheets} disabled={isLoading} variant="outline">
                    Sao lưu lên Sheets (Push)
                 </Button>
                 <Button onClick={handlePullFromSheets} disabled={isLoading} variant="danger">
                    Khôi phục từ Sheets (Pull)
                 </Button>
            </div>
             {statusMessage && (
                <div className={`p-3 rounded border ${isError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                    {statusMessage}
                </div>
            )}
          </div>
      )}

      {activeTab === 'firebase' && (
          <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-sm text-green-800">
                <p>Firebase mang lại tốc độ cực nhanh và đồng bộ tức thời giữa các thiết bị.</p>
                <p className="mt-1 font-bold">Cách lấy cấu hình:</p>
                <ul className="list-disc ml-5">
                    <li>Truy cập <a href="https://console.firebase.google.com/" target="_blank" className="underline">Firebase Console</a>.</li>
                    <li>Tạo Project mới -&gt; Thêm Web App.</li>
                    <li>Copy config (`apiKey`, `projectId`...) vào bên dưới.</li>
                    <li>Vào mục <b>Firestore Database</b> -&gt; Create Database (chọn <b>Test Mode</b> để bắt đầu).</li>
                </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <InputField label="API Key" id="apiKey" value={firebaseConfig.apiKey} onChange={(e) => setFirebaseConfig({...firebaseConfig, apiKey: e.target.value})} />
                <InputField label="Project ID" id="projectId" value={firebaseConfig.projectId} onChange={(e) => setFirebaseConfig({...firebaseConfig, projectId: e.target.value})} />
                <InputField label="Auth Domain" id="authDomain" value={firebaseConfig.authDomain} onChange={(e) => setFirebaseConfig({...firebaseConfig, authDomain: e.target.value})} />
                <InputField label="Storage Bucket" id="storageBucket" value={firebaseConfig.storageBucket} onChange={(e) => setFirebaseConfig({...firebaseConfig, storageBucket: e.target.value})} />
                <InputField label="Messaging Sender ID" id="senderId" value={firebaseConfig.messagingSenderId} onChange={(e) => setFirebaseConfig({...firebaseConfig, messagingSenderId: e.target.value})} />
                <InputField label="App ID" id="appId" value={firebaseConfig.appId} onChange={(e) => setFirebaseConfig({...firebaseConfig, appId: e.target.value})} />
                <InputField label="Measurement ID" id="measurementId" value={firebaseConfig.measurementId || ''} onChange={(e) => setFirebaseConfig({...firebaseConfig, measurementId: e.target.value})} />
            </div>
             <div className="flex justify-end">
                <Button onClick={saveFirebaseConfig} variant="primary">Lưu & Kích hoạt Firebase</Button>
            </div>
          </div>
      )}
    </Modal>
  );
};

export default GoogleSheetsSettings;
