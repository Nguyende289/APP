
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import Modal from '../components/Modal';
import InputField from '../components/InputField';
import DatePicker from '../components/DatePicker';
import SelectField from '../components/SelectField';
import Table, { Column } from '../components/Table';
import { VerificationRequest, FormField, SelectFieldDefinition, DocumentTemplate } from '../types';
import {
  VERIFICATION_REQUEST_FIELDS,
  VERIFICATION_RESULTS_OPTIONS,
  DOC_PLACEHOLDERS,
  formatDateForDisplay,
  REPORT_BASE_FONT_FAMILY,
  REPORT_BASE_FONT_SIZE,
  REPORT_LINE_HEIGHT,
} from '../constants';
import { extractVerificationDataFromImage } from '../services/geminiService';

interface VerificationManagementProps {
  verificationRequests: VerificationRequest[];
  onAddRequest: (newRequest: VerificationRequest) => void;
  onUpdateRequest: (updatedRequest: VerificationRequest) => void;
  onDeleteRequest: (id: string) => void;
  responseDocumentTemplates: DocumentTemplate[]; // Use array of templates
  setResponseDocumentTemplates: (templates: DocumentTemplate[]) => void; // Setter for templates
  selectedDocumentTemplateId: string; // Current selected template ID
  setSelectedDocumentTemplateId: (id: string) => void; // Setter for selected template ID
}

const initialFormState: VerificationRequest = {
  id: '',
  docNumber: '',
  docDate: new Date().toISOString().slice(0, 10), // Default to current date
  offenderName: '',
  citizenId: '',
  dateOfBirth: '', // Will be set to current date in add modal, or extracted
  address: '',
  violationBehavior: '',
  verificationResult: 'Chưa xác minh', // Default status
  endDate: '',
  resultContent: '', // New field
};

const VerificationManagement: React.FC<VerificationManagementProps> = ({
  verificationRequests,
  onAddRequest,
  onUpdateRequest,
  onDeleteRequest,
  responseDocumentTemplates,
  setResponseDocumentTemplates,
  selectedDocumentTemplateId,
  setSelectedDocumentTemplateId,
}) => {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // States for document generation
  const [isGenerateDocModalOpen, setIsGenerateDocModalOpen] = useState(false);
  const [isTemplateEditorModalOpen, setIsTemplateEditorModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null); // Track which template is being edited
  const [templateEditorContent, setTemplateEditorContent] = useState<string>(''); // Content for the editor modal

  const [selectedRequestForDoc, setSelectedRequestForDoc] = useState<VerificationRequest | null>(null);
  const [documentCreationDate, setDocumentCreationDate] = useState(new Date().toISOString().slice(0, 10));
  const [requestingUnitName, setRequestingUnitName] = useState('Phòng CSGT - Công an TP Hà Nội');
  const [responseDocNumber, setResponseDocNumber] = useState(''); // Default to empty string for user input
  const [generatedDocContent, setGeneratedDocContent] = useState<string>(''); // Auto-generated content
  const [editableGeneratedDocContent, setEditableGeneratedDocContent] = useState<string>(''); // User-edited content

  const [currentRequest, setCurrentRequest] = useState<VerificationRequest>(initialFormState);
  const [isEditing, setIsEditing] = useState(false);

  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  // State cho modal xác nhận xóa
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Find the currently selected template object
  const currentTemplate = useMemo(() => {
    return responseDocumentTemplates.find(tpl => tpl.id === selectedDocumentTemplateId);
  }, [responseDocumentTemplates, selectedDocumentTemplateId]);


  const openAddModal = (prefilledData: Partial<VerificationRequest> = {}) => {
    setCurrentRequest({
      ...initialFormState,
      docDate: prefilledData.docDate || new Date().toISOString().slice(0, 10),
      dateOfBirth: prefilledData.dateOfBirth || '',
      offenderName: prefilledData.offenderName || '',
      citizenId: prefilledData.citizenId || '',
      docNumber: prefilledData.docNumber || '',
      address: prefilledData.address || '',
      violationBehavior: prefilledData.violationBehavior || '',
      verificationResult: 'Chưa xác minh',
      endDate: '',
      resultContent: '',
    });
    setIsEditing(false);
    setIsFormModalOpen(true);
  };

  const openEditModal = (request: VerificationRequest) => {
    setCurrentRequest(request);
    setIsEditing(true);
    setIsFormModalOpen(true);
  };

  const openUpdateResultModal = (request: VerificationRequest) => {
    setCurrentRequest({ ...request, resultContent: request.resultContent || '' });
    setIsResultModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
  };

  const closeResultModal = () => {
    setIsResultModalOpen(false);
  };

  const openUploadModal = () => {
    setUploadedImageFile(null);
    setUploadedImagePreview(null);
    setExtractionError(null);
    setIsUploadModalOpen(true);
  };

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
    setUploadedImageFile(null);
    setUploadedImagePreview(null);
    setExtractionError(null);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setExtractionError(null);
    } else {
      setUploadedImageFile(null);
      setUploadedImagePreview(null);
    }
  };

  const handleExtractData = async () => {
    if (!uploadedImageFile) {
      setExtractionError('Vui lòng tải lên một hình ảnh để trích xuất.');
      return;
    }

    setIsExtracting(true);
    setExtractionError(null);

    try {
      const extractedData = await extractVerificationDataFromImage(uploadedImageFile);
      closeUploadModal();
      openAddModal(extractedData);
    } catch (error: any) {
      setExtractionError(error.message || 'Đã xảy ra lỗi khi trích xuất dữ liệu.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { id, value } = e.target;
    setCurrentRequest((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      onUpdateRequest(currentRequest);
    } else {
      onAddRequest(currentRequest);
    }
    closeFormModal();
  };

  const handleResultSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateRequest(currentRequest);
    closeResultModal();
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleDeleteAction = () => {
    if (deleteId) {
      onDeleteRequest(deleteId);
      setDeleteId(null);
    }
  };

  // Document generation logic
  const replaceDocPlaceholders = useCallback((templateContent: string, request: VerificationRequest, docDate: string, requestingUnit: string, responseDocNum: string): string => {
    if (!request) return templateContent;

    const currentDocDate = new Date(docDate);
    const replacements: { [key: string]: string } = {
      '<<docNumber>>': request.docNumber,
      '<<offenderName>>': request.offenderName,
      '<<citizenId>>': request.citizenId,
      '<<address>>': request.address,
      '<<violationBehavior>>': request.violationBehavior,
      '<<verificationResult>>': request.verificationResult,
      '<<resultContent>>': request.resultContent || 'Chưa có nội dung kết quả xác minh chi tiết.',
      '<<requestingUnitName>>': requestingUnit,
      '<<responseDocNumber>>': responseDocNum,
      '<<currentDay>>': String(currentDocDate.getDate()).padStart(2, '0'),
      '<<currentMonth>>': String(currentDocDate.getMonth() + 1).padStart(2, '0'),
      '<<currentYear>>': String(currentDocDate.getFullYear()),
      '<<currentTime>>': `${String(currentDocDate.getHours()).padStart(2, '0')}:${String(currentDocDate.getMinutes()).padStart(2, '0')}`,
    };

    // Handle date placeholders with custom formats
    let processedTemplate = templateContent;
    const datePlaceholderRegex = /<<(docDate|dateOfBirth|endDate|currentDate)(?::(.*?))?>>/g;
    processedTemplate = processedTemplate.replace(datePlaceholderRegex, (match, dateKey, format) => {
      let dateString: string | undefined;
      if (dateKey === 'docDate') dateString = request.docDate;
      else if (dateKey === 'dateOfBirth') dateString = request.dateOfBirth;
      else if (dateKey === 'endDate') dateString = request.endDate;
      else if (dateKey === 'currentDate') dateString = currentDocDate.toISOString().slice(0, 10);

      if (dateString) {
        return formatDateForDisplay(dateString, format || 'DD/MM/YYYY');
      }
      return '';
    });

    // Replace other placeholders
    for (const key in replacements) {
      const regex = new RegExp(key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
      processedTemplate = processedTemplate.replace(regex, replacements[key]);
    }

    return processedTemplate;
  }, []);

  const openGenerateDocModal = () => {
    setSelectedRequestForDoc(null); // Reset selection
    setDocumentCreationDate(new Date().toISOString().slice(0, 10)); // Default to today
    setRequestingUnitName('Phòng CSGT - Công an TP Hà Nội'); // Default
    setResponseDocNumber(''); // Default to empty string for user input
    setIsGenerateDocModalOpen(true);
  };

  const closeGenerateDocModal = () => {
    setIsGenerateDocModalOpen(false);
    setGeneratedDocContent('');
    setEditableGeneratedDocContent('');
    setSelectedRequestForDoc(null);
  };

  const openTemplateEditorModal = (templateId: string) => {
    const templateToEdit = responseDocumentTemplates.find(tpl => tpl.id === templateId);
    if (templateToEdit) {
      setEditingTemplateId(templateId);
      setTemplateEditorContent(templateToEdit.content); // Load content of specific template
      setIsTemplateEditorModalOpen(true);
    }
  };

  const closeTemplateEditorModal = () => {
    setIsTemplateEditorModalOpen(false);
    setEditingTemplateId(null);
    setTemplateEditorContent('');
  };

  const handleSaveTemplate = () => {
    if (editingTemplateId) {
      const updatedTemplates = responseDocumentTemplates.map(tpl =>
        tpl.id === editingTemplateId ? { ...tpl, content: templateEditorContent } : tpl
      );
      setResponseDocumentTemplates(updatedTemplates);
      closeTemplateEditorModal();
      // If the edited template is the currently selected one for generation, re-generate content
      if (selectedRequestForDoc && editingTemplateId === selectedDocumentTemplateId) {
        const updatedContent = replaceDocPlaceholders(templateEditorContent, selectedRequestForDoc, documentCreationDate, requestingUnitName, responseDocNumber);
        setGeneratedDocContent(updatedContent);
        setEditableGeneratedDocContent(updatedContent);
      }
    }
  };

  const handleEditableContentChange = (e: React.FormEvent<HTMLDivElement>) => {
    setEditableGeneratedDocContent(e.currentTarget.innerHTML);
  };

  const handlePrintDoc = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Công văn trả lời xác minh</title>
          <style>
            @page {
              size: A4;
              margin: 2cm 2cm 2cm 3cm; /* Top 2cm, Right 2cm, Bottom 2cm, Left 3cm */
            }
            body {
              font-family: ${REPORT_BASE_FONT_FAMILY};
              font-size: ${REPORT_BASE_FONT_SIZE};
              line-height: ${REPORT_LINE_HEIGHT};
              color: #333;
              margin: 0;
              padding: 0;
            }
            .doc-header-table td {
              border: none !important;
              padding: 0 !important;
            }
            h1 { font-size: 14pt; text-align: center; font-weight: bold; text-transform: uppercase; margin-top: 1cm; margin-bottom: 0.6em; }
            h2 { font-size: 12pt; text-align: center; font-weight: bold; margin-bottom: 1cm; }
            p { margin-bottom: 0.6em; } /* Standard paragraph spacing */
            p:first-of-type { text-indent: 0; }
            p:not([style*="text-align: center"]):not([style*="text-align: right"]):not([style*="text-align: left"]):not(.no-indent) {
              text-align: justify;
              text-indent: 40px; /* Standard paragraph indent for body */
            }
            ul { list-style-type: none; margin-left: 0; padding-left: 0; margin-bottom: 0.6em;}
            ul li { margin-bottom: 0.2em; text-align: justify; }
            ul li span { text-align: left; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 0.6em; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; vertical-align: top; }
            th { background-color: #f2f2f2; }
            .no-print { display: none !important; }

            /* Specific styles from template for header sections */
            .doc-header-table p { margin: 0; }
            .doc-header-table td:first-child p {
              font-size: 13pt !important; font-weight: bold !important;
              text-align: center !important;
              white-space: nowrap !important;
            }
            .doc-header-table td:first-child p:nth-child(2) { text-decoration: underline; }
            .doc-header-table td:last-child p {
              font-size: 13pt !important; font-weight: bold !important;
              text-align: center !important;
              white-space: nowrap !important;
            }
            .doc-header-table td:last-child p:nth-child(2) { text-decoration: underline; }
            .doc-header-table td:first-child p:nth-child(3),
            .doc-header-table td:last-child p:nth-child(3) {
                font-size: 12pt !important;
                font-weight: normal !important;
            }
            .doc-header-table td:first-child p:nth-child(3) { text-align: center !important;}
            /* Note: There's a typo in the line below, it should be :last-child p:nth-child(3) { text-align: right !important;} */
            /* This will be fixed in the downloaded HTML as well for consistency */
            .doc-header-table td:last-child p:nth-child(3) { text-align: right !important;}


            /* Signature block styles - ensure centering */
            .signature-title, .signature-text, .signature-name {
                text-align: center !important;
                margin: 0.6em auto !important; /* Center the text within its flow and provide spacing */
            }
            p.signature-name { margin-top: 1.5cm !important; } /* Restore specific top margin for name */
          </style>
        </head>
        <body>
          ${editableGeneratedDocContent}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownload = (type: 'html' | 'doc') => {
    const filenameBase = `CongVanTraLoi_${selectedRequestForDoc?.docNumber || 'XacMinh'}_${formatDateForDisplay(documentCreationDate, 'YYYYMMDD')}`;
    let contentToDownload = editableGeneratedDocContent;
    let mimeType = '';
    let filename = '';

    const fullHtmlWrapper = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Công văn trả lời xác minh</title>
        <style>
          /* Replicate key styles for download to ensure consistent rendering */
          body {
            font-family: ${REPORT_BASE_FONT_FAMILY};
            font-size: ${REPORT_BASE_FONT_SIZE};
            line-height: ${REPORT_LINE_HEIGHT};
            color: #333;
            margin: 0;
            padding: 0;
          }
          .doc-header-table td {
            border: none !important;
            padding: 0 !important;
          }
          h1 { font-size: 14pt; text-align: center; font-weight: bold; text-transform: uppercase; margin-top: 1cm; margin-bottom: 0.6em; }
          h2 { font-size: 12pt; text-align: center; font-weight: bold; margin-bottom: 1cm; }
          p { margin-bottom: 0.6em; }
          p:first-of-type { text-indent: 0; }
          p:not([style*="text-align: center"]):not([style*="text-align: right"]):not([style*="text-align: left"]):not(.no-indent) {
            text-align: justify;
            text-indent: 40px;
          }
          ul { list-style-type: none; margin-left: 0; padding-left: 0; margin-bottom: 0.6em;}
          ul li { margin-bottom: 0.2em; text-align: justify; }
          ul li span { text-align: left; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 0.6em; }
          th, td { border: 1px solid #000; padding: 8px; text-align: left; vertical-align: top; }
          th { background-color: #f2f2f2; }

          /* Specific header styles */
          .doc-header-table p { margin: 0; }
          .doc-header-table td:first-child p {
            font-size: 13pt !important; font-weight: bold !important;
            text-align: center !important;
            white-space: nowrap !important;
          }
          .doc-header-table td:first-child p:nth-child(2) { text-decoration: underline; }
          .doc-header-table td:last-child p {
            font-size: 13pt !important; font-weight: bold !important;
            text-align: center !important;
            white-space: nowrap !important;
          }
          .doc-header-table td:last-child p:nth-child(2) { text-decoration: underline; }
          .doc-header-table td:first-child p:nth-child(3),
          .doc-header-table td:last-child p:nth-child(3) {
              font-size: 12pt !important;
              font-weight: normal !important;
          }
          .doc-header-table td:first-child p:nth-child(3) { text-align: center !important;}
          .doc-header-table td:last-child p:nth-child(3) { text-align: right !important;}

          /* Signature block styles - ensure centering */
          .signature-title, .signature-text, .signature-name {
              text-align: center !important;
              margin: 0.6em auto !important;
          }
          p.signature-name { margin-top: 1.5cm !important; }
        </style>
      </head>
      <body>
        ${contentToDownload}
      </body>
      </html>
    `;

    // Always wrap content in full HTML structure for download
    contentToDownload = fullHtmlWrapper;
    
    if (type === 'html') {
      mimeType = 'text/html;charset=utf-8';
      filename = `${filenameBase}.html`;
    } else if (type === 'doc') {
      // For .doc, we still provide HTML content with application/msword MIME type
      // Microsoft Word can often open these, but formatting might vary
      mimeType = 'application/msword';
      filename = `${filenameBase}.doc`;
    }


    const blob = new Blob([contentToDownload], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  // Effect to re-generate document content when dependencies change
  useEffect(() => {
    if (isGenerateDocModalOpen && selectedRequestForDoc && currentTemplate) {
      const content = replaceDocPlaceholders(currentTemplate.content, selectedRequestForDoc, documentCreationDate, requestingUnitName, responseDocNumber);
      setGeneratedDocContent(content);
      setEditableGeneratedDocContent(content);
    } else {
      setGeneratedDocContent('');
      setEditableGeneratedDocContent('');
    }
  }, [isGenerateDocModalOpen, selectedRequestForDoc, currentTemplate, documentCreationDate, requestingUnitName, responseDocNumber, replaceDocPlaceholders]);

  // Effect to update template editor content when editingTemplateId changes
  useEffect(() => {
    if (editingTemplateId) {
      const templateToEdit = responseDocumentTemplates.find(tpl => tpl.id === editingTemplateId);
      if (templateToEdit) {
        setTemplateEditorContent(templateToEdit.content);
      }
    }
  }, [editingTemplateId, responseDocumentTemplates]);


  const columns = useMemo<Column<VerificationRequest>[]>(
    () => [
      { header: 'Số CV', accessor: 'docNumber' },
      { header: 'Ngày CV', accessor: (row: VerificationRequest) => formatDateForDisplay(row.docDate) },
      { header: 'Họ tên VP', accessor: 'offenderName' },
      { header: 'CCCD', accessor: 'citizenId' },
      { header: 'Hành vi vi phạm', accessor: 'violationBehavior', className: 'truncate max-w-xs' },
      { header: 'Kết quả xác minh', accessor: 'verificationResult' },
      { header: 'Ngày kết thúc', accessor: (row: VerificationRequest) => formatDateForDisplay(row.endDate) },
      {
        header: 'Thao tác',
        accessor: (row: VerificationRequest) => (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => openEditModal(row)}>
              Sửa
            </Button>
            <Button size="sm" onClick={() => openUpdateResultModal(row)}>
              Cập nhật KQ
            </Button>
            <Button size="sm" variant="danger" onClick={() => confirmDelete(row.id)}>
              Xóa
            </Button>
          </div>
        ),
        className: 'w-40', // Give more space for buttons
      },
    ],
    // Fix: Add delete handler to dependencies
    [openEditModal, openUpdateResultModal]
  );

  const sortedRequests = useMemo(() => {
    return [...verificationRequests].sort(
      (a, b) => new Date(b.docDate).getTime() - new Date(a.docDate).getTime(),
    );
  }, [verificationRequests]);

  return (
    <Layout title="Quản Lý Phối Hợp Xác Minh">
      <div className="mb-6 flex flex-wrap gap-4">
        <Button onClick={() => openAddModal()}>Thêm Yêu Cầu Xác Minh Mới</Button>
        <Button variant="outline" onClick={openUploadModal}>
          Tải ảnh để xác minh (AI)
        </Button>
        <Button onClick={openGenerateDocModal} variant="primary">
          Tạo Công Văn Trả Lời
        </Button>
      </div>

      <Table data={sortedRequests} columns={columns} keyAccessor="id" />

      {/* Add/Edit Verification Request Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        title={isEditing ? 'Sửa Yêu Cầu Xác Minh' : 'Thêm Yêu Cầu Xác Minh Mới'}
      >
        <form onSubmit={handleFormSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {VERIFICATION_REQUEST_FIELDS.map((field) => {
              const commonProps = {
                id: field.key,
                label: field.label,
                value: (currentRequest as any)[field.key],
                onChange: handleChange,
                required: true,
              };

              if (field.type === 'date') {
                return <DatePicker key={field.key} {...commonProps} />;
              }
              if (field.type === 'select') {
                const selectField = field as SelectFieldDefinition;
                return (
                  <SelectField
                    key={selectField.key}
                    {...commonProps}
                    options={selectField.options || []}
                  />
                );
              }
              if (field.type === 'textarea') {
                return (
                  <div key={field.key} className="mb-4 md:col-span-2">
                    <label
                      htmlFor={field.key}
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      {field.label}
                    </label>
                    <textarea
                      id={field.key}
                      value={(currentRequest as any)[field.key]}
                      onChange={handleChange}
                      rows={3}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      required={commonProps.required}
                    ></textarea>
                  </div>
                );
              }
              return <InputField key={field.key} {...commonProps} type={field.type} />;
            })}
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={closeFormModal}>
              Hủy
            </Button>
            <Button type="submit">{isEditing ? 'Lưu Thay Đổi' : 'Thêm Yêu Cầu'}</Button>
          </div>
        </form>
      </Modal>

      {/* Update Result Modal */}
      <Modal
        isOpen={isResultModalOpen}
        onClose={closeResultModal}
        title="Cập Nhật Kết Quả Xác Minh"
      >
        <form onSubmit={handleResultSubmit}>
          <SelectField
            label="Kết quả xác minh"
            id="verificationResult"
            value={currentRequest.verificationResult}
            onChange={handleChange}
            options={VERIFICATION_RESULTS_OPTIONS}
            required
          />
          <DatePicker
            label="Ngày kết thúc"
            id="endDate"
            value={currentRequest.endDate}
            onChange={handleChange}
            required={currentRequest.verificationResult === 'Đã xác minh'}
          />
          <div className="mb-4">
            <label
              htmlFor="resultContent"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Nội dung kết quả xác minh
            </label>
            <textarea
              id="resultContent"
              value={currentRequest.resultContent || ''}
              onChange={handleChange}
              rows={4}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            ></textarea>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={closeResultModal}>
              Hủy
            </Button>
            <Button type="submit">Lưu Kết Quả</Button>
          </div>
        </form>
      </Modal>

      {/* Image Upload for AI Extraction Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={closeUploadModal}
        title="Tải Ảnh Công Văn để Trích Xuất Thông Tin"
        footer={
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={closeUploadModal}>
              Hủy
            </Button>
            <Button onClick={handleExtractData} disabled={!uploadedImageFile || isExtracting}>
              {isExtracting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang trích xuất...
                </span>
              ) : (
                'Trích Xuất Thông Tin'
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Vui lòng tải lên hình ảnh của công văn yêu cầu xác minh. Hệ thống sẽ sử dụng AI để trích xuất các trường thông tin và điền tự động vào biểu mẫu.
          </p>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-blue-300 dark:hover:file:bg-gray-600"
          />
          {uploadedImagePreview && (
            <div className="mt-4 border border-gray-300 dark:border-gray-600 rounded-md p-2">
              <h4 className="font-medium mb-2 text-gray-800 dark:text-gray-100">Xem trước ảnh:</h4>
              <img src={uploadedImagePreview} alt="Xem trước ảnh đã tải lên" className="max-w-full h-auto rounded-md" />
            </div>
          )}
          {extractionError && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md">
              <p className="font-semibold">Lỗi trích xuất:</p>
              <p>{extractionError}</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Generate Response Document Modal */}
      <Modal
        isOpen={isGenerateDocModalOpen}
        onClose={closeGenerateDocModal}
        title="Tạo Công Văn Trả Lời"
        maxWidth="max-w-7xl"
        footer={
          <div className="flex flex-col sm:flex-row justify-between items-center w-full space-y-2 sm:space-y-0">
            {currentTemplate && (
              <Button variant="outline" size="sm" onClick={() => openTemplateEditorModal(currentTemplate.id)}>
                Chỉnh sửa Mẫu: {currentTemplate.name}
              </Button>
            )}
            <div className="flex flex-wrap justify-center sm:justify-end gap-3 w-full sm:w-auto">
              <Button onClick={handlePrintDoc} disabled={!selectedRequestForDoc}>
                In Công Văn
              </Button>
              <Button variant="secondary" onClick={() => handleDownload('html')} disabled={!selectedRequestForDoc}>
                Tải HTML
              </Button>
              <Button variant="secondary" onClick={() => handleDownload('doc')} disabled={!selectedRequestForDoc}>
                Tải DOC
              </Button>
              <Button type="button" variant="secondary" onClick={closeGenerateDocModal}>
                Đóng
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <SelectField
            label="Chọn Mẫu Công Văn"
            id="selectDocTemplate"
            value={selectedDocumentTemplateId}
            onChange={(e) => setSelectedDocumentTemplateId(e.target.value)}
            options={responseDocumentTemplates.map(tpl => ({ value: tpl.id, label: tpl.name }))}
            required
            className="w-full"
          />
          <DatePicker
            label="Ngày Công Văn"
            id="documentCreationDate"
            value={documentCreationDate}
            onChange={(e) => setDocumentCreationDate(e.target.value)}
            required
            className="w-full"
          />
          <InputField
            label="Số Công văn trả lời"
            id="responseDocNumber"
            value={responseDocNumber}
            onChange={(e) => setResponseDocNumber(e.target.value)}
            required
            className="w-full"
          />
          <InputField
            label="Đơn vị yêu cầu"
            id="requestingUnitName"
            value={requestingUnitName}
            onChange={(e) => setRequestingUnitName(e.target.value)}
            required
            className="w-full"
          />
          <SelectField
            label="Chọn Yêu Cầu Xác Minh"
            id="selectVerificationRequest"
            value={selectedRequestForDoc?.id || ''}
            onChange={(e) => {
              const selectedId = e.target.value;
              const request = verificationRequests.find((req) => req.id === selectedId);
              setSelectedRequestForDoc(request || null);
            }}
            options={[
              { value: '', label: '--- Chọn yêu cầu ---' },
              ...verificationRequests.map((req) => ({
                value: req.id,
                label: `${req.docNumber} - ${req.offenderName}`,
              })),
            ]}
            required
            className="w-full"
          />
          {selectedRequestForDoc && (
            <div className="mt-4">
              <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Xem trước & Chỉnh sửa Công văn:</h4>
              <div
                className="doc-preview border border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 min-h-[400px] overflow-auto"
                contentEditable="true"
                dangerouslySetInnerHTML={{ __html: editableGeneratedDocContent }}
                onInput={handleEditableContentChange}
                style={{
                  fontFamily: REPORT_BASE_FONT_FAMILY,
                  fontSize: REPORT_BASE_FONT_SIZE,
                  lineHeight: REPORT_LINE_HEIGHT,
                  padding: '2.5cm 2.0cm 2.0cm 3.0cm', // Match A4 margins for visual consistency
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Template Editor Modal */}
      <Modal
        isOpen={isTemplateEditorModalOpen}
        onClose={closeTemplateEditorModal}
        title={`Chỉnh sửa Mẫu Công văn: ${responseDocumentTemplates.find(tpl => tpl.id === editingTemplateId)?.name || ''}`}
        maxWidth="max-w-4xl"
        footer={
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={closeTemplateEditorModal}>
              Hủy
            </Button>
            <Button onClick={handleSaveTemplate}>
              Lưu Mẫu
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300 text-sm">
            Bạn có thể chỉnh sửa mẫu công văn trả lời bằng HTML. Sử dụng các placeholder dưới đây (ví dụ: `&lt;&lt;docNumber&gt;&gt;`) để tự động điền thông tin.
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400 max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-2">
            {DOC_PLACEHOLDERS.map((ph, index) => (
              <div key={index} className="flex flex-col">
                <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded mr-1">
                  &lt;&lt;{ph.key}&gt;&gt;
                </span>
                <span className="text-xs">{ph.description}</span>
              </div>
            ))}
          </div>
          <textarea
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            rows={20}
            value={templateEditorContent}
            onChange={(e) => setTemplateEditorContent(e.target.value)}
          ></textarea>
        </div>
      </Modal>

      {/* Modal Xác Nhận Xóa */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Xác nhận xóa"
        maxWidth="max-w-md"
        footer={
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Hủy
            </Button>
            <Button variant="danger" onClick={handleDeleteAction}>
              Xóa Yêu Cầu
            </Button>
          </div>
        }
      >
        <p className="text-gray-700 dark:text-gray-300">
          Bạn có chắc chắn muốn xóa yêu cầu xác minh này không? Hành động này không thể hoàn tác.
        </p>
      </Modal>
    </Layout>
  );
};

export default VerificationManagement;
