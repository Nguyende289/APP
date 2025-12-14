import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import {
  TrafficAccident,
  VehicleRegistration,
  Event,
  EventTarget,
  DailyTask,
  VerificationRequest,
  DocumentTemplate,
  AdvisoryDocument,
  AppData,
  FirebaseConfig
} from './types';
import { initialData, GOOGLE_SCRIPT_URL, STORAGE_KEY_GOOGLE_CONFIG, STORAGE_KEY_FIREBASE_CONFIG, DEFAULT_FIREBASE_CONFIG } from './constants';
import {
  saveData,
  loadData,
  createTrafficAccident,
  updateTrafficAccident,
  deleteTrafficAccident,
  createVehicleRegistration,
  updateVehicleRegistration,
  deleteVehicleRegistration,
  createEvent,
  updateEvent,
  deleteEvent,
  addEventTarget,
  updateEventTargetResult,
  createDailyTask,
  createVerificationRequest,
  updateVerificationRequest,
  deleteVerificationRequest,
  createAdvisoryDocument,
  updateAdvisoryDocument,
  deleteAdvisoryDocument,
} from './services/dataService';
import { 
  appendRowToSheet, 
  updateSheetData, 
  importDataFromGoogleSheets 
} from './services/googleSheetsService';
import { 
    initFirebase, 
    isFirebaseInitialized, 
    subscribeToCollection, 
    addItemToFirebase, 
    updateItemInFirebase, 
    deleteItemFromFirebase 
} from './services/firebaseService';

import Dashboard from './pages/Dashboard';
import TrafficAccidentManagement from './pages/TrafficAccidentManagement';
import VehicleRegistrationTracking from './pages/VehicleRegistrationTracking';
import EventManagement from './pages/EventManagement';
import DailyTaskTracking from './pages/DailyTaskTracking';
import AutomaticReportGeneration from './pages/AutomaticReportGeneration';
import VerificationManagement from './pages/VerificationManagement';
import AdvisoryManagement from './pages/AdvisoryManagement';

import Sidebar from './components/Sidebar';
import GoogleSheetsSettings from './components/GoogleSheetsSettings';
import Modal from './components/Modal'; // Import Modal
import Button from './components/Button'; // Import Button

const App: React.FC = () => {
  const [trafficAccidents, setTrafficAccidents] = useState<TrafficAccident[]>([]);
  const [vehicleRegistrations, setVehicleRegistrations] = useState<VehicleRegistration[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [responseDocumentTemplates, setResponseDocumentTemplates] = useState<DocumentTemplate[]>(initialData.responseDocumentTemplates);
  const [selectedDocumentTemplateId, setSelectedDocumentTemplateId] = useState<string>(initialData.selectedDocumentTemplateId);
  const [advisoryDocuments, setAdvisoryDocuments] = useState<AdvisoryDocument[]>([]);
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // State for sync flow
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const [usingFirebase, setUsingFirebase] = useState(false);

  // Ref for debouncing save (Local Storage)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper to get script URL safely
  const getScriptUrl = () => {
    const savedConfig = localStorage.getItem(STORAGE_KEY_GOOGLE_CONFIG);
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      if (parsed.scriptUrl) return parsed.scriptUrl;
    }
    return GOOGLE_SCRIPT_URL; 
  };

  // Function to load local data immediately
  const loadLocalData = () => {
    // console.log("Loading local data...");
    const loadedData = loadData();
    if (loadedData) {
      setTrafficAccidents(loadedData.trafficAccidents || []);
      setVehicleRegistrations(loadedData.vehicleRegistrations || []);
      setEvents(loadedData.events || []);
      setDailyTasks(loadedData.dailyTasks || []);
      setVerificationRequests(loadedData.verificationRequests || []);
      setResponseDocumentTemplates(loadedData.responseDocumentTemplates || initialData.responseDocumentTemplates);
      setSelectedDocumentTemplateId(loadedData.selectedDocumentTemplateId || initialData.selectedDocumentTemplateId);
      setAdvisoryDocuments(loadedData.advisoryDocuments || []);
    } else {
      setTrafficAccidents(initialData.trafficAccidents);
      setVehicleRegistrations(initialData.vehicleRegistrations);
      setEvents(initialData.events);
      setDailyTasks(initialData.dailyTasks);
      setVerificationRequests(initialData.verificationRequests);
      setResponseDocumentTemplates(initialData.responseDocumentTemplates);
      setSelectedDocumentTemplateId(initialData.selectedDocumentTemplateId);
      setAdvisoryDocuments(initialData.advisoryDocuments);
    }
  };

  useEffect(() => {
    // 1. Always load local data first so app is usable immediately
    loadLocalData();

    // 2. Check configuration to see if we should prompt for sync
    const checkSyncConfig = () => {
        // Check Firebase
        let fbConfigStr = localStorage.getItem(STORAGE_KEY_FIREBASE_CONFIG);
        let fbConfig: FirebaseConfig | null = null;
        try { fbConfig = JSON.parse(fbConfigStr || '{}'); } catch(e) {}

        // Check Sheets
        const scriptUrl = getScriptUrl();

        // If either is potentially valid/enabled, ask user
        if ((fbConfig && fbConfig.enabled && fbConfig.apiKey) || scriptUrl) {
            setShowSyncModal(true);
        }
    };

    checkSyncConfig();
  }, []);

  // Optimized Save: Debounce saving to localStorage
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const currentData = {
        trafficAccidents,
        vehicleRegistrations,
        events,
        dailyTasks,
        verificationRequests,
        responseDocumentTemplates,
        selectedDocumentTemplateId,
        advisoryDocuments,
      };
      saveData(currentData);
      // console.log('Data saved to local storage (backup)');
    }, 1000); 

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [trafficAccidents, vehicleRegistrations, events, dailyTasks, verificationRequests, responseDocumentTemplates, selectedDocumentTemplateId, advisoryDocuments]);

  // --- Background Sync Logic ---

  const performBackgroundSync = async () => {
      setShowSyncModal(false);
      setSyncStatus('syncing');
      setSyncMessage('Đang kết nối và đồng bộ dữ liệu...');

      // 1. Try Firebase first if enabled
      let fbConfigStr = localStorage.getItem(STORAGE_KEY_FIREBASE_CONFIG);
      let fbConfig: FirebaseConfig | null = null;
      try { fbConfig = JSON.parse(fbConfigStr || '{}'); } catch(e) {}

      if (fbConfig && fbConfig.enabled && fbConfig.apiKey) {
          const success = initFirebase(fbConfig);
          if (success) {
              setUsingFirebase(true);
              setSyncMessage('Đang đồng bộ trực tiếp từ Firebase...');
              // Setup Real-time listeners (updates state as data comes in)
              subscribeToCollection<TrafficAccident>('trafficAccidents', setTrafficAccidents);
              subscribeToCollection<VehicleRegistration>('vehicleRegistrations', setVehicleRegistrations);
              subscribeToCollection<Event>('events', setEvents);
              subscribeToCollection<DailyTask>('dailyTasks', setDailyTasks);
              subscribeToCollection<VerificationRequest>('verificationRequests', setVerificationRequests);
              subscribeToCollection<AdvisoryDocument>('advisoryDocuments', setAdvisoryDocuments);
              
              setSyncStatus('success');
              setSyncMessage('Đã kết nối Firebase thành công!');
              setTimeout(() => setSyncStatus('idle'), 3000); // Hide after 3s
              return;
          } else {
              // Fallback if firebase fails but enabled
              setSyncMessage('Kết nối Firebase thất bại. Thử Google Sheets...');
          }
      }

      // 2. Try Google Sheets
      const scriptUrl = getScriptUrl();
      if (scriptUrl) {
          try {
              setSyncMessage('Đang tải dữ liệu từ Google Sheets...');
              const cloudData = await importDataFromGoogleSheets(scriptUrl);
              
              if (cloudData.trafficAccidents) setTrafficAccidents(cloudData.trafficAccidents);
              if (cloudData.vehicleRegistrations) setVehicleRegistrations(cloudData.vehicleRegistrations);
              if (cloudData.events) setEvents(cloudData.events);
              if (cloudData.dailyTasks) setDailyTasks(cloudData.dailyTasks);
              if (cloudData.verificationRequests) setVerificationRequests(cloudData.verificationRequests);
              if (cloudData.advisoryDocuments) setAdvisoryDocuments(cloudData.advisoryDocuments);
              if (cloudData.responseDocumentTemplates) setResponseDocumentTemplates(cloudData.responseDocumentTemplates);
              
              setSyncStatus('success');
              setSyncMessage('Đồng bộ Google Sheets hoàn tất!');
              setTimeout(() => setSyncStatus('idle'), 3000);
          } catch (error: any) {
              console.error(error);
              setSyncStatus('error');
              setSyncMessage(`Lỗi đồng bộ: ${error.message}`);
              // Keep error visible for user to see
          }
      } else {
          setSyncStatus('idle'); // Nothing configured
      }
  };

  const handleSkipSync = () => {
      setShowSyncModal(false);
      setSyncStatus('idle');
  };

  // Handle Cloud Load (Pull from Settings - Manual trigger)
  const handleCloudDataLoaded = (cloudData: Partial<AppData>) => {
    if (cloudData.trafficAccidents) setTrafficAccidents(cloudData.trafficAccidents);
    if (cloudData.vehicleRegistrations) setVehicleRegistrations(cloudData.vehicleRegistrations);
    if (cloudData.events) setEvents(cloudData.events);
    if (cloudData.dailyTasks) setDailyTasks(cloudData.dailyTasks);
    if (cloudData.verificationRequests) setVerificationRequests(cloudData.verificationRequests);
    if (cloudData.advisoryDocuments) setAdvisoryDocuments(cloudData.advisoryDocuments);
    if (cloudData.responseDocumentTemplates) setResponseDocumentTemplates(cloudData.responseDocumentTemplates);
    
    // Force Save immediately to localStorage
    const newDataToSave: AppData = {
        trafficAccidents: cloudData.trafficAccidents || trafficAccidents,
        vehicleRegistrations: cloudData.vehicleRegistrations || vehicleRegistrations,
        events: cloudData.events || events,
        dailyTasks: cloudData.dailyTasks || dailyTasks,
        verificationRequests: cloudData.verificationRequests || verificationRequests,
        responseDocumentTemplates: cloudData.responseDocumentTemplates || responseDocumentTemplates,
        selectedDocumentTemplateId: cloudData.selectedDocumentTemplateId || selectedDocumentTemplateId,
        advisoryDocuments: cloudData.advisoryDocuments || advisoryDocuments,
    };
    saveData(newDataToSave);
  };

  // --- CRUD HANDLERS (Dual Support: Firebase or Sheets) ---

  const handleAddTrafficAccident = async (newAccident: TrafficAccident) => {
    if (usingFirebase) {
        await addItemToFirebase('trafficAccidents', newAccident);
    } else {
        const updated = createTrafficAccident(trafficAccidents, newAccident);
        setTrafficAccidents(updated);
        const url = getScriptUrl();
        if (url) appendRowToSheet(url, 'trafficAccidents', updated[updated.length - 1]);
    }
  };
  const handleUpdateTrafficAccident = async (updatedAccident: TrafficAccident) => {
    if (usingFirebase) {
        await updateItemInFirebase('trafficAccidents', updatedAccident);
    } else {
        const updated = updateTrafficAccident(trafficAccidents, updatedAccident);
        setTrafficAccidents(updated);
        const url = getScriptUrl();
        if (url) updateSheetData(url, 'trafficAccidents', updated);
    }
  };
  const handleDeleteTrafficAccident = async (id: string) => {
    if (usingFirebase) {
        await deleteItemFromFirebase('trafficAccidents', id);
    } else {
        const updated = deleteTrafficAccident(trafficAccidents, id);
        setTrafficAccidents(updated);
        const url = getScriptUrl();
        if (url) updateSheetData(url, 'trafficAccidents', updated);
    }
  };
  
  const handleAddVehicleRegistration = async (newRegistration: VehicleRegistration) => {
    if (usingFirebase) {
        await addItemToFirebase('vehicleRegistrations', newRegistration);
    } else {
        const updated = createVehicleRegistration(vehicleRegistrations, newRegistration);
        setVehicleRegistrations(updated);
        const url = getScriptUrl();
        if (url) appendRowToSheet(url, 'vehicleRegistrations', updated[updated.length - 1]);
    }
  };
  const handleUpdateVehicleRegistration = async (updatedRegistration: VehicleRegistration) => {
    if (usingFirebase) {
        await updateItemInFirebase('vehicleRegistrations', updatedRegistration);
    } else {
        const updated = updateVehicleRegistration(vehicleRegistrations, updatedRegistration);
        setVehicleRegistrations(updated);
        const url = getScriptUrl();
        if (url) updateSheetData(url, 'vehicleRegistrations', updated);
    }
  };
  const handleDeleteVehicleRegistration = async (id: string) => {
    if (usingFirebase) {
        await deleteItemFromFirebase('vehicleRegistrations', id);
    } else {
        const updated = deleteVehicleRegistration(vehicleRegistrations, id);
        setVehicleRegistrations(updated);
        const url = getScriptUrl();
        if (url) updateSheetData(url, 'vehicleRegistrations', updated);
    }
  };

  const handleAddEvent = async (newEvent: Event) => {
    if (usingFirebase) {
        await addItemToFirebase('events', newEvent);
    } else {
        const updated = createEvent(events, newEvent);
        setEvents(updated);
        const url = getScriptUrl();
        if (url) appendRowToSheet(url, 'events', updated[updated.length - 1]);
    }
  };
  const handleUpdateEvent = async (updatedEvent: Event) => {
    if (usingFirebase) {
        await updateItemInFirebase('events', updatedEvent);
    } else {
        const updated = updateEvent(events, updatedEvent);
        setEvents(updated);
        const url = getScriptUrl();
        if (url) updateSheetData(url, 'events', updated);
    }
  };
  const handleDeleteEvent = async (id: string) => {
    if (usingFirebase) {
        await deleteItemFromFirebase('events', id);
    } else {
        const updated = deleteEvent(events, id);
        setEvents(updated);
        const url = getScriptUrl();
        if (url) updateSheetData(url, 'events', updated);
    }
  };
  const handleAddEventTarget = async (eventId: string, newTarget: EventTarget) => {
    if (usingFirebase) {
        const event = events.find(e => e.id === eventId);
        if (event) {
             const updatedEvent = addEventTarget([event], eventId, newTarget)[0];
             await updateItemInFirebase('events', updatedEvent);
        }
    } else {
        const updated = addEventTarget(events, eventId, newTarget);
        setEvents(updated);
        const url = getScriptUrl();
        if (url) updateSheetData(url, 'events', updated);
    }
  };
  const handleUpdateEventTargetResult = async (eventId: string, targetId: string, resultDate: string, result: number) => {
    if (usingFirebase) {
        const event = events.find(e => e.id === eventId);
        if (event) {
             const updatedEvent = updateEventTargetResult([event], eventId, targetId, resultDate, result)[0];
             await updateItemInFirebase('events', updatedEvent);
        }
    } else {
        const updated = updateEventTargetResult(events, eventId, targetId, resultDate, result);
        setEvents(updated);
        const url = getScriptUrl();
        if (url) updateSheetData(url, 'events', updated);
    }
  };

  const handleAddDailyTask = async (newTask: DailyTask) => {
    if (usingFirebase) {
        await addItemToFirebase('dailyTasks', newTask);
    } else {
        const updated = createDailyTask(dailyTasks, newTask);
        setDailyTasks(updated);
        const url = getScriptUrl();
        if (url) appendRowToSheet(url, 'dailyTasks', updated[updated.length - 1]);
    }
  };

  const handleAddVerificationRequest = async (newRequest: VerificationRequest) => {
    if (usingFirebase) {
        await addItemToFirebase('verificationRequests', newRequest);
    } else {
        const updated = createVerificationRequest(verificationRequests, newRequest);
        setVerificationRequests(updated);
        const url = getScriptUrl();
        if (url) appendRowToSheet(url, 'verificationRequests', updated[updated.length - 1]);
    }
  };
  const handleUpdateVerificationRequest = async (updatedRequest: VerificationRequest) => {
    if (usingFirebase) {
        await updateItemInFirebase('verificationRequests', updatedRequest);
    } else {
        const updated = updateVerificationRequest(verificationRequests, updatedRequest);
        setVerificationRequests(updated);
        const url = getScriptUrl();
        if (url) updateSheetData(url, 'verificationRequests', updated);
    }
  };
  const handleDeleteVerificationRequest = async (id: string) => {
    if (usingFirebase) {
        await deleteItemFromFirebase('verificationRequests', id);
    } else {
        const updated = deleteVerificationRequest(verificationRequests, id);
        setVerificationRequests(updated);
        const url = getScriptUrl();
        if (url) updateSheetData(url, 'verificationRequests', updated);
    }
  };

  const handleAddAdvisoryDocument = async (newDoc: AdvisoryDocument) => {
    if (usingFirebase) {
        await addItemToFirebase('advisoryDocuments', newDoc);
    } else {
        const updated = createAdvisoryDocument(advisoryDocuments, newDoc);
        setAdvisoryDocuments(updated);
        const url = getScriptUrl();
        if (url) appendRowToSheet(url, 'advisoryDocuments', updated[updated.length - 1]);
    }
  };
  const handleUpdateAdvisoryDocument = async (updatedDoc: AdvisoryDocument) => {
    if (usingFirebase) {
        await updateItemInFirebase('advisoryDocuments', updatedDoc);
    } else {
        const updated = updateAdvisoryDocument(advisoryDocuments, updatedDoc);
        setAdvisoryDocuments(updated);
        const url = getScriptUrl();
        if (url) updateSheetData(url, 'advisoryDocuments', updated);
    }
  };
  const handleDeleteAdvisoryDocument = async (id: string) => {
    if (usingFirebase) {
        await deleteItemFromFirebase('advisoryDocuments', id);
    } else {
        const updated = deleteAdvisoryDocument(advisoryDocuments, id);
        setAdvisoryDocuments(updated);
        const url = getScriptUrl();
        if (url) updateSheetData(url, 'advisoryDocuments', updated);
    }
  };

  const currentAppData: AppData = {
    trafficAccidents,
    vehicleRegistrations,
    events,
    dailyTasks,
    verificationRequests,
    responseDocumentTemplates,
    selectedDocumentTemplateId,
    advisoryDocuments,
  };

  return (
    <Router>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans overflow-hidden">
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          setIsCollapsed={setIsSidebarCollapsed}
          isMobileOpen={isMobileMenuOpen}
          setIsMobileOpen={setIsMobileMenuOpen}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative transition-all duration-300 ease-in-out">
          
          {/* Status Bar for Background Sync */}
          {syncStatus !== 'idle' && (
             <div className={`w-full text-white text-xs py-1 px-4 text-center font-bold flex justify-center items-center transition-colors duration-500
                ${syncStatus === 'syncing' ? 'bg-blue-600' : ''}
                ${syncStatus === 'success' ? 'bg-green-600' : ''}
                ${syncStatus === 'error' ? 'bg-red-600' : ''}
             `}>
                 {syncStatus === 'syncing' && (
                    <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                 )}
                 {syncStatus === 'success' && (
                    <svg className="w-3 h-3 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                 )}
                 {syncStatus === 'error' && (
                    <svg className="w-3 h-3 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 )}
                 {syncMessage}
             </div>
          )}
          
          <div className="md:hidden bg-white dark:bg-gray-800 shadow-sm p-4 flex justify-between items-center z-20">
             <h1 className="text-lg font-bold text-gray-800 dark:text-white">Police App</h1>
             <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-gray-600 dark:text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
             </button>
          </div>
          <main className={`flex-1 w-full overflow-y-auto p-4 md:p-8 scroll-smooth transition-all duration-300 ease-in-out`}>
            <Routes>
              <Route path="/" element={<Dashboard trafficAccidents={trafficAccidents} vehicleRegistrations={vehicleRegistrations} events={events} dailyTasks={dailyTasks} />} />
              <Route path="/traffic-accidents" element={<TrafficAccidentManagement trafficAccidents={trafficAccidents} onAddAccident={handleAddTrafficAccident} onUpdateAccident={handleUpdateTrafficAccident} onDeleteAccident={handleDeleteTrafficAccident} />} />
              <Route path="/vehicle-registrations" element={
                <VehicleRegistrationTracking 
                  vehicleRegistrations={vehicleRegistrations} 
                  onAddRegistration={handleAddVehicleRegistration}
                  onUpdateRegistration={handleUpdateVehicleRegistration}
                  onDeleteRegistration={handleDeleteVehicleRegistration}
                />
              } />
              <Route path="/events" element={<EventManagement events={events} onAddEvent={handleAddEvent} onUpdateEvent={handleUpdateEvent} onDeleteEvent={handleDeleteEvent} onAddEventTarget={handleAddEventTarget} onUpdateEventTargetResult={handleUpdateEventTargetResult} />} />
              <Route path="/daily-tasks" element={<DailyTaskTracking dailyTasks={dailyTasks} onAddDailyTask={handleAddDailyTask} />} />
              <Route path="/reports" element={
                <AutomaticReportGeneration 
                  trafficAccidents={trafficAccidents} 
                  vehicleRegistrations={vehicleRegistrations} 
                  events={events} 
                  dailyTasks={dailyTasks} 
                  verificationRequests={verificationRequests}
                  advisoryDocuments={advisoryDocuments}
                />
              } />
              <Route path="/verification-management" element={<VerificationManagement verificationRequests={verificationRequests} onAddRequest={handleAddVerificationRequest} onUpdateRequest={handleUpdateVerificationRequest} onDeleteRequest={handleDeleteVerificationRequest} responseDocumentTemplates={responseDocumentTemplates} setResponseDocumentTemplates={setResponseDocumentTemplates} selectedDocumentTemplateId={selectedDocumentTemplateId} setSelectedDocumentTemplateId={setSelectedDocumentTemplateId} />} />
              <Route path="/advisory-management" element={<AdvisoryManagement advisoryDocuments={advisoryDocuments} onAddDocument={handleAddAdvisoryDocument} onUpdateDocument={handleUpdateAdvisoryDocument} onDeleteDocument={handleDeleteAdvisoryDocument} />} />
            </Routes>
          </main>
        </div>
        
        {/* Settings Modal */}
        <GoogleSheetsSettings 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)} 
            currentData={currentAppData}
            onDataLoaded={handleCloudDataLoaded}
        />

        {/* Sync Prompt Modal */}
        <Modal 
            isOpen={showSyncModal} 
            onClose={handleSkipSync} 
            title="Đồng bộ dữ liệu"
            maxWidth="max-w-md"
            footer={
                <div className="flex justify-end space-x-3">
                    <Button variant="secondary" onClick={handleSkipSync}>
                        Không, dùng dữ liệu cũ
                    </Button>
                    <Button variant="primary" onClick={performBackgroundSync}>
                        Có, đồng bộ ngay
                    </Button>
                </div>
            }
        >
            <div className="text-gray-700 dark:text-gray-300">
                <p>Bạn có muốn đồng bộ dữ liệu mới nhất từ Cloud (Google Sheets/Firebase) không?</p>
                <p className="text-sm mt-2 text-gray-500">Quá trình này sẽ chạy ngầm và không làm gián đoạn công việc của bạn.</p>
            </div>
        </Modal>

      </div>
    </Router>
  );
};

export default App;