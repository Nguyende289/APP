
import {
  AppData,
  TrafficAccident,
  VehicleRegistration,
  Event,
  EventTarget,
  EventTargetResult,
  DailyTask,
  VerificationRequest,
  DocumentTemplate, // Import DocumentTemplate
  AdvisoryDocument, // Import AdvisoryDocument
} from '../types';
import { initialData } from '../constants'; // Import initialData to use default template if not found

const STORAGE_KEY = 'policeManagementAppData_Production';

export const saveData = (data: AppData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data to localStorage:', error);
  }
};

export const loadData = (): AppData | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const parsedData = data ? JSON.parse(data) : null;
    // Ensure new data types are initialized as empty arrays if not present in old storage
    if (parsedData) {
      // Initialize verificationRequests and ensure resultContent is present for existing items
      const verificationRequests = (parsedData.verificationRequests || []).map((req: VerificationRequest) => ({
        ...req,
        resultContent: req.resultContent || '', // Ensure resultContent is initialized
      }));

      let responseDocumentTemplates: DocumentTemplate[] = initialData.responseDocumentTemplates;
      let selectedDocumentTemplateId: string = initialData.selectedDocumentTemplateId;

      // Backward compatibility for old single template string
      if (typeof parsedData.responseDocumentTemplate === 'string') {
        responseDocumentTemplates = [{
          id: 'template1',
          name: 'Mẫu Công văn 1',
          content: parsedData.responseDocumentTemplate,
        }];
        selectedDocumentTemplateId = 'template1';
      } else if (parsedData.responseDocumentTemplates) {
        responseDocumentTemplates = parsedData.responseDocumentTemplates;
        selectedDocumentTemplateId = parsedData.selectedDocumentTemplateId || initialData.selectedDocumentTemplateId;
      }

      // Initialize advisoryDocuments
      const advisoryDocuments = parsedData.advisoryDocuments || [];

      return {
        ...parsedData,
        trafficAccidents: parsedData.trafficAccidents || [],
        vehicleRegistrations: parsedData.vehicleRegistrations || [],
        events: parsedData.events || [],
        dailyTasks: parsedData.dailyTasks || [],
        verificationRequests,
        responseDocumentTemplates,
        selectedDocumentTemplateId,
        advisoryDocuments, // Include Module 7 data
      };
    }
    return null;
  } catch (error) {
    console.error('Error loading data from localStorage:', error);
    return null;
  }
};

const generateUniqueId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

// Traffic Accident Management
export const createTrafficAccident = (
  currentAccidents: TrafficAccident[],
  newAccident: TrafficAccident,
): TrafficAccident[] => {
  return [...currentAccidents, { ...newAccident, id: generateUniqueId() }];
};

export const updateTrafficAccident = (
  currentAccidents: TrafficAccident[],
  updatedAccident: TrafficAccident,
): TrafficAccident[] => {
  return currentAccidents.map((accident) =>
    String(accident.id) === String(updatedAccident.id) ? updatedAccident : accident,
  );
};

export const deleteTrafficAccident = (
  currentAccidents: TrafficAccident[],
  id: string,
): TrafficAccident[] => {
  return currentAccidents.filter((accident) => String(accident.id) !== String(id));
};

// Vehicle Registration Tracking
export const createVehicleRegistration = (
  currentRegistrations: VehicleRegistration[],
  newRegistration: VehicleRegistration,
): VehicleRegistration[] => {
  return [...currentRegistrations, { ...newRegistration, id: generateUniqueId() }];
};

export const updateVehicleRegistration = (
  currentRegistrations: VehicleRegistration[],
  updatedRegistration: VehicleRegistration,
): VehicleRegistration[] => {
  return currentRegistrations.map((reg) =>
    String(reg.id) === String(updatedRegistration.id) ? updatedRegistration : reg,
  );
};

export const deleteVehicleRegistration = (
  currentRegistrations: VehicleRegistration[],
  id: string,
): VehicleRegistration[] => {
  return currentRegistrations.filter((reg) => String(reg.id) !== String(id));
};


// Event Management
export const createEvent = (currentEvents: Event[], newEvent: Event): Event[] => {
  return [...currentEvents, { ...newEvent, id: generateUniqueId(), targets: [] }];
};

export const updateEvent = (currentEvents: Event[], updatedEvent: Event): Event[] => {
  return currentEvents.map((event) =>
    String(event.id) === String(updatedEvent.id) ? updatedEvent : event,
  );
};

export const deleteEvent = (currentEvents: Event[], id: string): Event[] => {
  return currentEvents.filter((event) => String(event.id) !== String(id));
};

export const addEventTarget = (
  currentEvents: Event[],
  eventId: string,
  newTarget: EventTarget,
): Event[] => {
  return currentEvents.map((event) => {
    if (String(event.id) === String(eventId)) {
      return {
        ...event,
        targets: [...event.targets, { ...newTarget, id: generateUniqueId(), results: [] }],
      };
    }
    return event;
  });
};

export const updateEventTargetResult = (
  currentEvents: Event[],
  eventId: string,
  targetId: string,
  resultDate: string,
  result: number,
): Event[] => {
  return currentEvents.map((event) => {
    if (String(event.id) === String(eventId)) {
      const updatedTargets = event.targets.map((target) => {
        if (String(target.id) === String(targetId)) {
          const existingResultIndex = target.results.findIndex(
            (r) => r.date === resultDate,
          );
          if (existingResultIndex !== -1) {
            const updatedResults = [...target.results];
            updatedResults[existingResultIndex] = { date: resultDate, result: result };
            return { ...target, results: updatedResults };
          } else {
            return {
              ...target,
              results: [...target.results, { date: resultDate, result: result }],
            };
          }
        }
        return target;
      });
      return { ...event, targets: updatedTargets };
    }
    return event;
  });
};

// Daily Task Tracking
export const createDailyTask = (
  currentTasks: DailyTask[],
  newTask: DailyTask,
): DailyTask[] => {
  return [...currentTasks, { ...newTask, id: generateUniqueId() }];
};

// Verification Management
export const createVerificationRequest = (
  currentRequests: VerificationRequest[],
  newRequest: VerificationRequest,
): VerificationRequest[] => {
  return [...currentRequests, { ...newRequest, id: generateUniqueId() }];
};

export const updateVerificationRequest = (
  currentRequests: VerificationRequest[],
  updatedRequest: VerificationRequest,
): VerificationRequest[] => {
  return currentRequests.map((request) =>
    String(request.id) === String(updatedRequest.id) ? updatedRequest : request,
  );
};

export const deleteVerificationRequest = (
  currentRequests: VerificationRequest[],
  id: string,
): VerificationRequest[] => {
  return currentRequests.filter((request) => String(request.id) !== String(id));
};

// Advisory Document Management (Module 7)
export const createAdvisoryDocument = (
  currentDocuments: AdvisoryDocument[],
  newDocument: AdvisoryDocument,
): AdvisoryDocument[] => {
  return [...currentDocuments, { ...newDocument, id: generateUniqueId() }];
};

export const updateAdvisoryDocument = (
  currentDocuments: AdvisoryDocument[],
  updatedDocument: AdvisoryDocument,
): AdvisoryDocument[] => {
  return currentDocuments.map((doc) =>
    String(doc.id) === String(updatedDocument.id) ? updatedDocument : doc,
  );
};

export const deleteAdvisoryDocument = (
  currentDocuments: AdvisoryDocument[],
  id: string,
): AdvisoryDocument[] => {
  return currentDocuments.filter((doc) => String(doc.id) !== String(id));
};
