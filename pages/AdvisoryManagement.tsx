
import React, { useState, useMemo } from 'react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import Modal from '../components/Modal';
import InputField from '../components/InputField';
import DatePicker from '../components/DatePicker';
import SelectField from '../components/SelectField';
import Table, { Column } from '../components/Table';
import { AdvisoryDocument, FormField, SelectFieldDefinition } from '../types';
import { ADVISORY_DOCUMENT_FIELDS, ADVISORY_DOCUMENT_TYPES } from '../constants';

interface AdvisoryManagementProps {
  advisoryDocuments: AdvisoryDocument[];
  onAddDocument: (newDocument: AdvisoryDocument) => void;
  onUpdateDocument: (updatedDocument: AdvisoryDocument) => void;
  onDeleteDocument: (id: string) => void;
}

const initialFormState: AdvisoryDocument = {
  id: '',
  docNumber: '',
  docDate: new Date().toISOString().slice(0, 10),
  docType: ADVISORY_DOCUMENT_TYPES[0], // Default to first type
  content: '',
  recipientUnit: '',
  releaseDate: new Date().toISOString().slice(0, 10),
};

const AdvisoryManagement: React.FC<AdvisoryManagementProps> = ({
  advisoryDocuments,
  onAddDocument,
  onUpdateDocument,
  onDeleteDocument,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<AdvisoryDocument>(initialFormState);
  const [isEditing, setIsEditing] = useState(false);

  // State cho modal xác nhận xóa
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openAddModal = () => {
    setCurrentDocument({ ...initialFormState, docDate: new Date().toISOString().slice(0, 10), releaseDate: new Date().toISOString().slice(0, 10) });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (document: AdvisoryDocument) => {
    setCurrentDocument(document);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { id, value } = e.target;
    setCurrentDocument((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      onUpdateDocument(currentDocument);
    } else {
      onAddDocument(currentDocument);
    }
    closeModal();
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleDeleteAction = () => {
    if (deleteId) {
      onDeleteDocument(deleteId);
      setDeleteId(null);
    }
  };

  const sortedDocuments = useMemo(() => {
    return [...advisoryDocuments].sort(
      (a, b) => new Date(b.docDate).getTime() - new Date(a.docDate).getTime(),
    );
  }, [advisoryDocuments]);

  const columns = useMemo<Column<AdvisoryDocument>[]>(
    () => [
      { header: 'Số CV/KH', accessor: 'docNumber' },
      { header: 'Ngày BH', accessor: 'docDate' },
      { header: 'Loại CV', accessor: 'docType' },
      { header: 'Nội dung', accessor: 'content', className: 'truncate max-w-sm' },
      { header: 'Đơn vị nhận', accessor: 'recipientUnit' },
      { header: 'Ngày phát hành', accessor: 'releaseDate' },
      {
        header: 'Thao tác',
        accessor: (row: AdvisoryDocument) => (
          <div className="flex space-x-2">
            <Button size="sm" onClick={() => openEditModal(row)}>
              Sửa
            </Button>
            <Button size="sm" variant="danger" onClick={() => confirmDelete(row.id)}>
              Xóa
            </Button>
          </div>
        ),
      },
    ],
    // Fix: Add dependencies
    [openEditModal]
  );

  return (
    <Layout title="Quản Lý Công Tác Tham Mưu">
      <div className="mb-6">
        <Button onClick={openAddModal}>Thêm Công Văn/Kế Hoạch Mới</Button>
      </div>

      <Table data={sortedDocuments} columns={columns} keyAccessor="id" />

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={isEditing ? 'Sửa Công Văn/Kế Hoạch Tham Mưu' : 'Thêm Công Văn/Kế Hoạch Tham Mưu Mới'}
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ADVISORY_DOCUMENT_FIELDS.map((field) => {
              const commonProps = {
                id: field.key,
                label: field.label,
                value: (currentDocument as any)[field.key],
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
                      value={(currentDocument as any)[field.key]}
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
            <Button type="button" variant="secondary" onClick={closeModal}>
              Hủy
            </Button>
            <Button type="submit">{isEditing ? 'Lưu Thay Đổi' : 'Thêm Công Văn'}</Button>
          </div>
        </form>
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
              Xóa Công Văn
            </Button>
          </div>
        }
      >
        <p className="text-gray-700 dark:text-gray-300">
          Bạn có chắc chắn muốn xóa công văn/kế hoạch này không? Hành động này không thể hoàn tác.
        </p>
      </Modal>
    </Layout>
  );
};

export default AdvisoryManagement;
