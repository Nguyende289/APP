
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import DatePicker from '../components/DatePicker';
import SelectField from '../components/SelectField';
import Card from '../components/Card'; // Import Card component
import Table, { Column } from '../components/Table'; // Import Table component
import Modal from '../components/Modal'; // Import Modal
import {
  TrafficAccident,
  VehicleRegistration,
  Event,
  DailyTask,
  VerificationRequest,
  AdvisoryDocument,
} from '../types';
import {
  REPORT_PERIODS,
  VIETNAMESE_MONTHS,
  REPORT_BASE_FONT_FAMILY,
  REPORT_BASE_FONT_SIZE,
  REPORT_LINE_HEIGHT,
  formatDateForDisplay,
} from '../constants';
import { generatePoliceReport } from '../services/geminiReportService'; // Import the AI service

interface AutomaticReportGenerationProps {
  trafficAccidents: TrafficAccident[];
  vehicleRegistrations: VehicleRegistration[];
  events: Event[];
  dailyTasks: DailyTask[];
  verificationRequests: VerificationRequest[]; // Add VerificationRequests
  advisoryDocuments: AdvisoryDocument[]; // Add AdvisoryDocuments
}

const AutomaticReportGeneration: React.FC<AutomaticReportGenerationProps> = ({
  trafficAccidents,
  vehicleRegistrations,
  events,
  dailyTasks,
  verificationRequests,
  advisoryDocuments,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('monthly'); // Default to monthly
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10)); // Used for periodic reports
  const reportRef = useRef<HTMLDivElement>(null);
  const [reportContent, setReportContent] = useState<string>(''); // Original AI-generated content
  const [editableReportContent, setEditableReportContent] = useState<string>(''); // User-editable content
  const [isGeneratingReport, setIsGeneratingReport] = useState(false); // New loading state
  const [generationError, setGenerationError] = useState<string | null>(null); // New error state
  const [reportKey, setReportKey] = useState(0); // Key to force re-render/reset contentEditable focus

  // State for Detail Modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailModalTitle, setDetailModalTitle] = useState('');
  const [detailModalData, setDetailModalData] = useState<any[]>([]);
  const [detailModalColumns, setDetailModalColumns] = useState<Column<any>[]>([]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getPeriodDates = useCallback((period: string, baseDate: string) => {
    const today = baseDate ? new Date(baseDate) : new Date();
    // Reset time to start of day to ensure consistent date ranges
    today.setHours(0, 0, 0, 0);

    let start = new Date(today);
    let end = new Date(today);

    switch (period) {
      case 'weekly':
        // Tuần: Từ Thứ 4 tuần trước đến Thứ 3 tuần này.
        const currentDay = today.getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
        let daysUntilTuesday = 2 - currentDay; // 2 is Tuesday

        if (daysUntilTuesday < 0) {
            // If today is Wednesday (3) to Saturday (6), the reporting Tuesday is next week
            daysUntilTuesday += 7;
        }
        
        // Set To Date (Tuesday)
        end.setDate(today.getDate() + daysUntilTuesday);
        
        // Set From Date (Wednesday of previous week = To Date - 6 days)
        start = new Date(end);
        start.setDate(end.getDate() - 6);
        break;
      case 'monthly':
        // Tháng: Từ 16 tháng trước đến 15 tháng này (nếu đang ở nửa đầu tháng)
        const currentDayOfMonth = today.getDate();
        
        if (currentDayOfMonth <= 15) {
          // Example: Today is 10th May. Range: 16th April -> 15th May.
          end.setDate(15); // 15th of this month
          start.setMonth(start.getMonth() - 1); // Previous month
          start.setDate(16); // 16th
        } else {
          // Example: Today is 20th May. Range: 16th May -> 15th June.
          start.setDate(16); // 16th of this month
          end.setMonth(end.getMonth() + 1); // Next month
          end.setDate(15); // 15th
        }
        break;
      case 'quarterly':
        const currentMonth = today.getMonth();
        const startMonth = Math.floor(currentMonth / 3) * 3;
        start.setMonth(startMonth, 1);
        end.setMonth(startMonth + 3, 0); // Last day of end quarter month
        break;
      case 'halfYearly':
        const currentHalf = today.getMonth() < 6 ? 0 : 6;
        start.setMonth(currentHalf, 1);
        end.setMonth(currentHalf + 6, 0);
        break;
      case 'yearly':
        start.setMonth(0, 1); // January 1st
        end.setMonth(11, 31); // December 31st
        break;
      case 'custom':
        return {
          from: customDateFrom ? new Date(customDateFrom) : null,
          to: customDateTo ? new Date(customDateTo) : null,
        };
      default:
        // For 'all' or default cases, set a very wide range or specific period if needed
        start = new Date('2020-01-01'); // Arbitrary far past date
        end = new Date('2030-12-31');  // Arbitrary far future date
        break;
    }
    // Ensure end date is inclusive for filtering
    end.setHours(23, 59, 59, 999);
    return { from: start, to: end };
  }, [customDateFrom, customDateTo]);

  // Effect to update customDateFrom/To when filterType or reportDate changes
  useEffect(() => {
    if (selectedPeriod !== 'custom') {
      const { from, to } = getPeriodDates(selectedPeriod, reportDate);
      setCustomDateFrom(from?.toISOString().slice(0, 10) || '');
      setCustomDateTo(to?.toISOString().slice(0, 10) || '');
    }
  }, [selectedPeriod, reportDate, getPeriodDates]);


  // Memoized filtered data for the summary section and AI report
  const { from: periodFrom, to: periodTo } = useMemo(() => getPeriodDates(selectedPeriod, reportDate), [selectedPeriod, reportDate, getPeriodDates]);

  const filteredTrafficAccidents = useMemo(() => {
    if (!periodFrom || !periodTo) return trafficAccidents;
    return trafficAccidents.filter((a) => {
      const accDate = new Date(a.date);
      return accDate >= periodFrom && accDate <= periodTo;
    });
  }, [trafficAccidents, periodFrom, periodTo]);

  const filteredVehicleRegistrations = useMemo(() => {
    if (!periodFrom || !periodTo) return vehicleRegistrations;
    return vehicleRegistrations.filter((vr) => {
      const regDate = new Date(vr.date);
      return regDate >= periodFrom && regDate <= periodTo;
    });
  }, [vehicleRegistrations, periodFrom, periodTo]);

  const filteredEvents = useMemo(() => {
    if (!periodFrom || !periodTo) return events;
    return events.filter((e) => {
      const eventStart = new Date(e.fromDate);
      const eventEnd = new Date(e.toDate);
      return (
        (eventStart >= periodFrom && eventStart <= periodTo) ||
        (eventEnd >= periodFrom && eventEnd <= periodTo) ||
        (eventStart <= periodFrom && eventEnd >= periodTo)
      );
    });
  }, [events, periodFrom, periodTo]);

  const filteredDailyTasks = useMemo(() => {
    if (!periodFrom || !periodTo) return dailyTasks;
    return dailyTasks.filter((dt) => {
      const taskDate = new Date(dt.date);
      return taskDate >= periodFrom && taskDate <= periodTo;
    });
  }, [dailyTasks, periodFrom, periodTo]);

  const filteredVerificationRequests = useMemo(() => {
    if (!periodFrom || !periodTo) return verificationRequests;
    return verificationRequests.filter((vr) => {
      const reqDate = new Date(vr.docDate);
      return reqDate >= periodFrom && reqDate <= periodTo;
    });
  }, [verificationRequests, periodFrom, periodTo]);

  const filteredAdvisoryDocuments = useMemo(() => {
    if (!periodFrom || !periodTo) return advisoryDocuments;
    return advisoryDocuments.filter((ad) => {
      const docDate = new Date(ad.docDate);
      return docDate >= periodFrom && docDate <= periodTo;
    });
  }, [advisoryDocuments, periodFrom, periodTo]);

  // --- Summary Calculations ---
  // TNGT
  const totalAccidentsSummary = filteredTrafficAccidents.length;
  const totalDeathsSummary = filteredTrafficAccidents.reduce((sum, acc) => sum + acc.deaths, 0);
  const totalInjuriesSummary = filteredTrafficAccidents.reduce((sum, acc) => sum + acc.injuries, 0);
  const totalAlcoholAccidentsSummary = filteredTrafficAccidents.filter(acc => acc.alcoholLevel === 'Yes').length;
  const totalDamageAccidentsSummary = filteredTrafficAccidents.reduce((sum, acc) => sum + acc.estimatedDamageVND, 0);

  // Đăng ký xe
  const registrationStatsSummary = useMemo(() => {
    const stats = {
      'Ô tô': { first: 0, transfer: 0, recall: 0, renewal: 0, total: 0 },
      'Xe máy': { first: 0, transfer: 0, recall: 0, renewal: 0, total: 0 },
      'Tổng cộng': { first: 0, transfer: 0, recall: 0, renewal: 0, total: 0 }
    };

    filteredVehicleRegistrations.forEach(reg => {
      const type = reg.vehicleType;
      if (stats[type]) {
        stats[type].first += reg.firstTimeCount;
        stats[type].transfer += reg.transferCount;
        stats[type].recall += reg.recallCount;
        stats[type].renewal += reg.renewalCount;
        stats[type].total += (reg.firstTimeCount + reg.transferCount + reg.recallCount + reg.renewalCount);
      }
      
      stats['Tổng cộng'].first += reg.firstTimeCount;
      stats['Tổng cộng'].transfer += reg.transferCount;
      stats['Tổng cộng'].recall += reg.recallCount;
      stats['Tổng cộng'].renewal += reg.renewalCount;
      stats['Tổng cộng'].total += (reg.firstTimeCount + reg.transferCount + reg.recallCount + reg.renewalCount);
    });

    const columns: Column<{ type: string; first: number; transfer: number; recall: number; renewal: number; total: number; }>[] = [
      { header: 'Loại phương tiện', accessor: 'type', className: 'font-bold' },
      { header: 'Lần đầu', accessor: 'first' },
      { header: 'Sang tên', accessor: 'transfer' },
      { header: 'Thu hồi', accessor: 'recall' },
      { header: 'Cấp đổi', accessor: 'renewal' },
      { header: 'Tổng cộng', accessor: 'total', className: 'font-bold text-blue-600' },
    ];

    return {
      data: [
        { type: 'Ô tô', ...stats['Ô tô'] },
        { type: 'Xe máy', ...stats['Xe máy'] },
        { type: 'Tổng cộng', ...stats['Tổng cộng'] }
      ],
      columns
    };
  }, [filteredVehicleRegistrations]);
  const totalVehicleRegistrationsSummary = registrationStatsSummary.data.find(s => s.type === 'Tổng cộng')?.total || 0;


  // Sự kiện
  const totalEventsSummary = filteredEvents.length;
  const totalEventGoalAchievedPercentage = useMemo(() => {
    let totalOverallGoal = 0;
    let totalOverallAchieved = 0;
  
    filteredEvents.forEach(event => {
      event.targets.forEach(target => {
        totalOverallGoal += target.goal;
        totalOverallAchieved += target.results
          .filter(r => new Date(r.date) >= (periodFrom || new Date(0)) && new Date(r.date) <= (periodTo || new Date()))
          .reduce((sum, r) => sum + r.result, 0);
      });
    });
  
    if (totalOverallGoal === 0) return '0%';
    return `${(totalOverallAchieved / totalOverallGoal * 100).toFixed(1)}%`;
  }, [filteredEvents, periodFrom, periodTo]);

  // Công tác hàng ngày
  const totalDailyTasksSummary = filteredDailyTasks.length;
  const dailyTaskCategorySummary = useMemo(() => {
    const categories: Record<string, number> = {};
    filteredDailyTasks.forEach(task => {
      categories[task.category] = (categories[task.category] || 0) + 1;
    });
    const data = Object.keys(categories).map(key => ({ category: key, count: categories[key] }));
    const columns: Column<{ category: string; count: number; }>[] = [
      { header: 'Loại công tác', accessor: 'category' },
      { header: 'Số lượng', accessor: 'count' },
    ];
    return { data, columns };
  }, [filteredDailyTasks]);

  // Xác minh
  const totalVerificationRequestsSummary = filteredVerificationRequests.length;
  const verificationResultSummary = useMemo(() => {
    const results: Record<string, number> = {};
    filteredVerificationRequests.forEach(req => {
      results[req.verificationResult] = (results[req.verificationResult] || 0) + 1;
    });
    return {
      'Đã xác minh': results['Đã xác minh'] || 0,
      'Đang xác minh': results['Đang xác minh'] || 0,
      'Chưa xác minh': results['Chưa xác minh'] || 0,
      'Không xác định': results['Không xác định'] || 0,
    };
  }, [filteredVerificationRequests]);

  // Tham mưu
  const totalAdvisoryDocumentsSummary = filteredAdvisoryDocuments.length;
  const advisoryDocTypeSummary = useMemo(() => {
    const types: Record<string, number> = {};
    filteredAdvisoryDocuments.forEach(doc => {
      types[doc.docType] = (types[doc.docType] || 0) + 1;
    });
    const data = Object.keys(types).map(key => ({ type: key, count: types[key] }));
    const columns: Column<{ type: string; count: number; }>[] = [
      { header: 'Loại công văn', accessor: 'type' },
      { header: 'Số lượng', accessor: 'count' },
    ];
    return { data, columns };
  }, [filteredAdvisoryDocuments]);

  // Handle setting editable content once AI report is generated
  useEffect(() => {
    if (reportContent && reportRef.current) {
      reportRef.current.innerHTML = reportContent;
      setEditableReportContent(reportContent);
    }
  }, [reportContent, reportRef]);

  const handleEditableContentChange = () => {
    if (reportRef.current) {
      setEditableReportContent(reportRef.current.innerHTML);
    }
  };

  const handleGenerateReport = async () => {
    setGenerationError(null);
    setIsGeneratingReport(true);
    setReportContent(''); 
    setEditableReportContent(''); 
    setReportKey(prev => prev + 1); 

    if (!periodFrom || !periodTo) {
      setGenerationError('Vui lòng chọn khoảng thời gian hoặc nhập đầy đủ ngày tùy chọn.');
      setIsGeneratingReport(false);
      return;
    }
    
    try {
      const aiReportHtml = await generatePoliceReport({
        dateFrom: periodFrom,
        dateTo: periodTo,
        totalAccidentsSummary,
        totalDeathsSummary,
        totalInjuriesSummary,
        totalAlcoholAccidentsSummary,
        totalDamageAccidentsSummary,
        registrationStatsSummary: registrationStatsSummary.data,
        totalVehicleRegistrationsSummary,
        totalEventsSummary,
        totalEventGoalAchievedPercentage,
        totalDailyTasksSummary,
        dailyTaskCategorySummary: dailyTaskCategorySummary.data,
        totalVerificationRequestsSummary,
        verificationResultSummary,
        totalAdvisoryDocumentsSummary,
        advisoryDocTypeSummary: advisoryDocTypeSummary.data,
      });
      setReportContent(aiReportHtml); 
    } catch (error: any) {
      setGenerationError(error.message || 'Đã xảy ra lỗi khi tạo báo cáo bằng AI.');
      setReportContent('<p class="text-red-500">Không thể tạo báo cáo. Vui lòng thử lại.</p>');
      setEditableReportContent('<p class="text-red-500">Không thể tạo báo cáo. Vui lòng thử lại.</p>');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Báo cáo</title>
          <style>
            @page {
              size: A4;
              margin: 2cm 2cm 2cm 3cm;
            }
            body {
              font-family: ${REPORT_BASE_FONT_FAMILY};
              font-size: ${REPORT_BASE_FONT_SIZE};
              line-height: ${REPORT_LINE_HEIGHT};
              color: #333;
              margin: 0;
              padding: 0;
            }
            /* ... rest of styles ... */
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
          </style>
        </head>
        <body>
          ${editableReportContent}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownload = (type: 'txt' | 'html') => {
    const { from, to } = getPeriodDates(selectedPeriod, reportDate);
    const filename = `BaoCao_${selectedPeriod}_${formatDate(from?.toISOString().slice(0,10) || '')}-${formatDate(to?.toISOString().slice(0,10) || '')}.${type}`;
    let contentToDownload = editableReportContent;

    if (type === 'txt') {
      contentToDownload = contentToDownload.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s{2,}/g, ' ').trim();
    }

    const blob = new Blob([contentToDownload], {
      type: type === 'txt' ? 'text/plain;charset=utf-8' : 'text/html;charset=utf-8',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- DETAIL MODAL HANDLERS ---

  // Helper to open modal with specific configuration
  const openDetailModal = (title: string, data: any[], columns: Column<any>[]) => {
    setDetailModalTitle(title);
    setDetailModalData(data);
    setDetailModalColumns(columns);
    setIsDetailModalOpen(true);
  };

  // 1. Traffic Accidents Details
  const showAccidentDetails = (filter: 'total' | 'alcohol' | 'deaths' | 'injuries' | 'damage') => {
    let data = [...filteredTrafficAccidents];
    let title = "Danh sách Vụ việc TNGT";

    if (filter === 'alcohol') {
      data = data.filter(acc => acc.alcoholLevel === 'Yes');
      title += " (Có nồng độ cồn)";
    } else if (filter === 'deaths') {
      data = data.filter(acc => acc.deaths > 0);
      title += " (Có người chết)";
    } else if (filter === 'injuries') {
      data = data.filter(acc => acc.injuries > 0);
      title += " (Có người bị thương)";
    } else if (filter === 'damage') {
      // Show all, damage column is key
      title += " (Thiệt hại tài sản)";
    }

    const columns: Column<TrafficAccident>[] = [
      { header: 'Ngày', accessor: (row) => formatDateForDisplay(row.date) },
      { header: 'Địa điểm', accessor: 'location' },
      { header: 'Nội dung', accessor: 'content' },
      { header: 'Chết', accessor: 'deaths', className: 'w-16' },
      { header: 'Bị thương', accessor: 'injuries', className: 'w-20' },
      { header: 'Cồn', accessor: 'alcoholLevel' },
      { header: 'Thiệt hại', accessor: (row) => row.estimatedDamageVND.toLocaleString('vi-VN') },
    ];

    openDetailModal(title, data, columns);
  };

  // 2. Event Details
  const showEventDetails = () => {
    const columns: Column<Event>[] = [
      { header: 'Tên Sự Kiện', accessor: 'name' },
      { header: 'Từ ngày', accessor: (row) => formatDateForDisplay(row.fromDate) },
      { header: 'Đến ngày', accessor: (row) => formatDateForDisplay(row.toDate) },
      { header: 'Nội dung', accessor: 'content' },
      { header: 'Số chỉ tiêu', accessor: (row) => row.targets.length },
    ];
    openDetailModal("Danh sách Sự kiện (Đợt cao điểm)", filteredEvents, columns);
  };

  // 3. Daily Task Details
  const showTaskDetails = () => {
    const columns: Column<DailyTask>[] = [
      { header: 'Ngày', accessor: (row) => formatDateForDisplay(row.date) },
      { header: 'Loại công tác', accessor: 'category' },
      { header: 'Mô tả', accessor: 'description' },
      { header: 'Kết quả', accessor: 'result' },
    ];
    openDetailModal("Danh sách Công tác Hàng ngày", filteredDailyTasks, columns);
  };

  // 4. Verification Details
  const showVerificationDetails = (status?: string) => {
    let data = [...filteredVerificationRequests];
    let title = "Danh sách Yêu cầu Xác minh";
    if (status) {
      data = data.filter(req => req.verificationResult === status);
      title += ` (${status})`;
    }

    const columns: Column<VerificationRequest>[] = [
      { header: 'Ngày CV', accessor: (row) => formatDateForDisplay(row.docDate) },
      { header: 'Số CV', accessor: 'docNumber' },
      { header: 'Đối tượng', accessor: 'offenderName' },
      { header: 'Nội dung', accessor: 'violationBehavior', className: 'truncate max-w-xs' },
      { header: 'Kết quả', accessor: 'verificationResult' },
    ];
    openDetailModal(title, data, columns);
  };

  // 5. Advisory Details
  const showAdvisoryDetails = () => {
    const columns: Column<AdvisoryDocument>[] = [
      { header: 'Ngày ban hành', accessor: (row) => formatDateForDisplay(row.docDate) },
      { header: 'Số CV/KH', accessor: 'docNumber' },
      { header: 'Loại', accessor: 'docType' },
      { header: 'Nội dung', accessor: 'content', className: 'truncate max-w-xs' },
      { header: 'Đơn vị nhận', accessor: 'recipientUnit' },
    ];
    openDetailModal("Danh sách Văn bản Tham mưu", filteredAdvisoryDocuments, columns);
  };

  return (
    <Layout title="Tạo Báo Cáo Tự Động">
      <div className="mb-6 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg no-print">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
          Cấu hình Báo cáo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SelectField
            label="Chọn Kỳ Báo Cáo"
            id="reportPeriod"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            options={REPORT_PERIODS}
          />
          {selectedPeriod === 'custom' ? (
            <>
              <DatePicker
                label="Từ Ngày"
                id="customFrom"
                value={customDateFrom}
                onChange={(e) => setCustomDateFrom(e.target.value)}
              />
              <DatePicker
                label="Đến Ngày"
                id="customTo"
                value={customDateTo}
                onChange={(e) => setCustomDateTo(e.target.value)}
              />
            </>
          ) : (
            <div className="md:col-span-2">
              <DatePicker
                label="Ngày Báo Cáo (để xác định kỳ)"
                id="reportDate"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
              />
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <Button onClick={handleGenerateReport} disabled={isGeneratingReport}>
            {isGeneratingReport ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang tạo báo cáo...
              </span>
            ) : (
              'Tạo Báo Cáo'
            )}
          </Button>
          <Button variant="secondary" onClick={handlePrint} disabled={!reportContent}>
            In Báo Cáo
          </Button>
          <Button variant="secondary" onClick={() => handleDownload('html')} disabled={!reportContent}>
            Tải HTML
          </Button>
          <Button variant="secondary" onClick={() => handleDownload('txt')} disabled={!reportContent}>
            Tải TXT
          </Button>
        </div>
        {generationError && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md">
            <p className="font-semibold">Lỗi tạo báo cáo:</p>
            <p>{generationError}</p>
          </div>
        )}
      </div>

      {/* Section: Tổng hợp dữ liệu trong kỳ */}
      <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg no-print">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
          Tổng hợp dữ liệu trong kỳ ({periodFrom && periodTo ? `${formatDate(periodFrom.toISOString().slice(0, 10))} - ${formatDate(periodTo.toISOString().slice(0, 10))}` : 'Vui lòng chọn kỳ'})
        </h3>
        
        {/* Row 1: TNGT & Đăng ký xe */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* TNGT Summary */}
          <div>
            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Vụ việc Tai nạn Giao thông</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card title="Tổng số vụ" value={totalAccidentsSummary} onClick={() => showAccidentDetails('total')} className="bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-100" />
              <Card title="Vụ có Nồng độ cồn" value={totalAlcoholAccidentsSummary} onClick={() => showAccidentDetails('alcohol')} className="bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-100" />
              <Card title="Người chết" value={totalDeathsSummary} onClick={() => showAccidentDetails('deaths')} className="bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-100" />
              <Card title="Người bị thương" value={totalInjuriesSummary} onClick={() => showAccidentDetails('injuries')} className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-100" />
              <Card title="Thiệt hại Ước tính" value={`${totalDamageAccidentsSummary.toLocaleString('vi-VN')} VNĐ`} onClick={() => showAccidentDetails('damage')} className="col-span-full bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-100" />
            </div>
          </div>

          {/* Đăng ký xe Summary Table */}
          <div>
            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Kết quả Đăng ký xe</h4>
            <Table data={registrationStatsSummary.data} columns={registrationStatsSummary.columns} keyAccessor="type" />
          </div>
        </div>

        {/* Row 2: Sự kiện & Công tác hàng ngày */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Sự kiện Summary */}
          <div>
            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Sự kiện (Đợt Công tác/Cao điểm)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card title="Tổng số sự kiện" value={totalEventsSummary} onClick={showEventDetails} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-100" />
              <Card title="Tiến độ đạt được" value={totalEventGoalAchievedPercentage} className="bg-teal-50 dark:bg-teal-900/30 text-teal-800 dark:text-teal-100" />
            </div>
          </div>

          {/* Công tác hàng ngày Summary Table */}
          <div>
            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Công tác Thường xuyên & Giai đoạn</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card title="Tổng số công tác" value={totalDailyTasksSummary} onClick={showTaskDetails} className="bg-purple-50 dark:bg-purple-900/30 text-purple-800 dark:text-purple-100" />
            </div>
            <div className="mt-4">
              <Table data={dailyTaskCategorySummary.data} columns={dailyTaskCategorySummary.columns} keyAccessor="category" />
            </div>
          </div>
        </div>

        {/* Row 3: Xác minh & Tham mưu */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Xác minh Summary */}
          <div>
            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Phối hợp Xác minh</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card title="Tổng số yêu cầu" value={totalVerificationRequestsSummary} onClick={() => showVerificationDetails()} className="bg-pink-50 dark:bg-pink-900/30 text-pink-800 dark:text-pink-100" />
              <Card title="Đã xác minh" value={verificationResultSummary['Đã xác minh']} onClick={() => showVerificationDetails('Đã xác minh')} className="bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-100" />
              <Card title="Đang xác minh" value={verificationResultSummary['Đang xác minh']} onClick={() => showVerificationDetails('Đang xác minh')} className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-100" />
              <Card title="Chưa xác minh" value={verificationResultSummary['Chưa xác minh']} onClick={() => showVerificationDetails('Chưa xác minh')} className="bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-100" />
            </div>
          </div>

          {/* Tham mưu Summary Table */}
          <div>
            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Công tác Tham mưu</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card title="Tổng số công văn/KH" value={totalAdvisoryDocumentsSummary} onClick={showAdvisoryDetails} className="bg-orange-50 dark:bg-orange-900/30 text-orange-800 dark:text-orange-100" />
            </div>
            <div className="mt-4">
              <Table data={advisoryDocTypeSummary.data} columns={advisoryDocTypeSummary.columns} keyAccessor="type" />
            </div>
          </div>
        </div>
      </div>


      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg mt-8 report-container">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
          Xem trước & Chỉnh sửa Báo cáo
        </h3>
        <div
          key={reportKey} // Use key to force re-render and reset contentEditable focus
          ref={reportRef}
          className="report-preview-content report-editable-content border border-gray-200 dark:border-gray-700 p-4 rounded-md min-h-[500px] overflow-auto"
          // Removed dangerouslySetInnerHTML to let contentEditable manage its own DOM after initial set
          contentEditable="true"
          onInput={handleEditableContentChange}
        />
      </div>

      {/* DETAIL MODAL */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={detailModalTitle}
        maxWidth="max-w-6xl"
      >
        <div className="overflow-y-auto max-h-[60vh]">
          <Table data={detailModalData} columns={detailModalColumns} keyAccessor="id" />
        </div>
      </Modal>
    </Layout>
  );
};

export default AutomaticReportGeneration;
