
import React, { useState, useMemo } from 'react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import Modal from '../components/Modal';
import InputField from '../components/InputField';
import DatePicker from '../components/DatePicker';
import SelectField from '../components/SelectField';
import Table, { Column } from '../components/Table';
// Import SelectFieldDefinition to use it for type assertion in the form rendering loop
import { TrafficAccident, SelectFieldDefinition } from '../types';
import { TRAFFIC_ACCIDENT_FIELDS } from '../constants';

interface TrafficAccidentManagementProps {
  trafficAccidents: TrafficAccident[];
  onAddAccident: (newAccident: TrafficAccident) => void;
  onUpdateAccident: (updatedAccident: TrafficAccident) => void;
  onDeleteAccident: (id: string) => void;
}

const initialFormState: TrafficAccident = {
  id: '',
  date: '',
  time: '',
  location: '',
  content: '',
  consequences: '',
  deaths: 0,
  injuries: 0,
  estimatedDamageVND: 0,
  alcoholLevel: 'No',
  handlingUnit: '',
  processingResult: '',
};

const TrafficAccidentManagement: React.FC<TrafficAccidentManagementProps> = ({
  trafficAccidents,
  onAddAccident,
  onUpdateAccident,
  onDeleteAccident,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAccident, setCurrentAccident] = useState<TrafficAccident>(initialFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // State cho modal xem chi tiết
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAccident, setSelectedAccident] = useState<TrafficAccident | null>(null);

  // State cho modal xác nhận xóa
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openAddModal = () => {
    setCurrentAccident(initialFormState);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (accident: TrafficAccident) => {
    setCurrentAccident(accident);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const openDetailModal = (accident: TrafficAccident) => {
    setSelectedAccident(accident);
    setIsDetailModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedAccident(null);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { id, value, type } = e.target;
    setCurrentAccident((prev) => ({
      ...prev,
      [id]: type === 'number' ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      onUpdateAccident(currentAccident);
    } else {
      onAddAccident(currentAccident);
    }
    closeModal();
  };

  // Mở modal xác nhận xóa
  const confirmDelete = (id: string) => {
    setDeleteId(id);
  };

  // Thực hiện xóa sau khi xác nhận
  const handleDeleteAction = () => {
    if (deleteId) {
      onDeleteAccident(deleteId);
      setDeleteId(null);
    }
  };

  const filteredAccidents = useMemo(() => {
    return trafficAccidents.filter((accident) => {
      const accidentDate = new Date(accident.date);
      const from = filterDateFrom ? new Date(filterDateFrom) : null;
      const to = filterDateTo ? new Date(filterDateTo) : null;

      if (from && accidentDate < from) return false;
      if (to && accidentDate > to) return false;
      return true;
    });
  }, [trafficAccidents, filterDateFrom, filterDateTo]);

  const totalDeathsFiltered = useMemo(
    () => filteredAccidents.reduce((sum, acc) => sum + acc.deaths, 0),
    [filteredAccidents],
  );
  const totalInjuriesFiltered = useMemo(
    () => filteredAccidents.reduce((sum, acc) => sum + acc.injuries, 0),
    [filteredAccidents],
  );
  const totalDamageFiltered = useMemo(
    () => filteredAccidents.reduce((sum, acc) => sum + acc.estimatedDamageVND, 0),
    [filteredAccidents],
  );
  
  // Thống kê số vụ có nồng độ cồn
  const totalAlcoholAccidents = useMemo(
    () => filteredAccidents.filter((acc) => acc.alcoholLevel === 'Yes').length,
    [filteredAccidents],
  );

  const columns = useMemo<Column<TrafficAccident>[]>(
    () => [
      { header: 'Ngày', accessor: 'date' },
      { header: 'Giờ', accessor: 'time' },
      { header: 'Địa điểm', accessor: 'location' },
      { header: 'Nội dung', accessor: 'content', className: 'truncate max-w-xs' },
      { header: 'Người Chết', accessor: 'deaths' },
      { header: 'Người Bị thương', accessor: 'injuries' },
      {
        header: 'Thiệt hại (VNĐ)',
        accessor: (row: TrafficAccident) =>
          row.estimatedDamageVND.toLocaleString('vi-VN'),
      },
      { header: 'Nồng độ cồn', accessor: 'alcoholLevel' },
      // { header: 'Đơn vị thụ lý', accessor: 'handlingUnit' },
      {
        header: 'Thao tác',
        accessor: (row: TrafficAccident) => (
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={() => openDetailModal(row)}>
              Xem
            </Button>
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
    // IMPORTANT: Add confirmDelete and other actions to dependencies
    [openDetailModal, openEditModal]
  );

  // Helper để hiển thị nhãn cho Detail Modal
  const getLabelForKey = (key: string) => {
    const field = TRAFFIC_ACCIDENT_FIELDS.find(f => f.key === key);
    return field ? field.label : key;
  };

  return (
    <Layout title="Quản Lý Vụ Việc Tai Nạn Giao Thông">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <Button onClick={openAddModal}>Thêm Vụ Việc Mới</Button>
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
          <DatePicker
            label="Từ Ngày"
            id="filterDateFrom"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="w-full md:w-auto"
          />
          <DatePicker
            label="Đến Ngày"
            id="filterDateTo"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="w-full md:w-auto"
          />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-xl shadow-sm text-blue-800 dark:text-blue-200">
          <h4 className="font-semibold text-sm uppercase">Tổng số vụ</h4>
          <p className="text-2xl font-bold mt-1">{filteredAccidents.length}</p>
        </div>
        <div className="bg-purple-100 dark:bg-purple-900 p-4 rounded-xl shadow-sm text-purple-800 dark:text-purple-200">
          <h4 className="font-semibold text-sm uppercase">Vụ có Cồn</h4>
          <p className="text-2xl font-bold mt-1">{totalAlcoholAccidents}</p>
        </div>
        <div className="bg-red-100 dark:bg-red-900 p-4 rounded-xl shadow-sm text-red-800 dark:text-red-200">
          <h4 className="font-semibold text-sm uppercase">Người chết</h4>
          <p className="text-2xl font-bold mt-1">{totalDeathsFiltered}</p>
        </div>
        <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded-xl shadow-sm text-yellow-800 dark:text-yellow-200">
          <h4 className="font-semibold text-sm uppercase">Người bị thương</h4>
          <p className="text-2xl font-bold mt-1">{totalInjuriesFiltered}</p>
        </div>
        <div className="bg-green-100 dark:bg-green-900 p-4 rounded-xl shadow-sm text-green-800 dark:text-green-200">
          <h4 className="font-semibold text-sm uppercase">Thiệt hại (VNĐ)</h4>
          <p className="text-xl font-bold mt-1 truncate" title={totalDamageFiltered.toLocaleString('vi-VN')}>
            {totalDamageFiltered.toLocaleString('vi-VN')}
          </p>
        </div>
      </div>

      <Table data={filteredAccidents} columns={columns} keyAccessor="id" />

      {/* Modal Thêm/Sửa */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={isEditing ? 'Sửa Vụ Việc Tai Nạn' : 'Thêm Vụ Việc Tai Nạn Mới'}
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TRAFFIC_ACCIDENT_FIELDS.map((field) => {
              const commonProps = {
                id: field.key,
                label: field.label,
                value: (currentAccident as any)[field.key],
                onChange: handleChange,
              };

              if (field.type === 'date') {
                return <DatePicker key={field.key} {...commonProps} />;
              }
              if (field.type === 'select') {
                // Cast `field` to `SelectFieldDefinition` to access `options`
                return (
                  <SelectField
                    key={field.key}
                    {...commonProps}
                    options={(field as SelectFieldDefinition).options || []}
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
                      value={(currentAccident as any)[field.key]}
                      onChange={handleChange}
                      rows={3}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
            <Button type="submit">{isEditing ? 'Lưu Thay Đổi' : 'Thêm Vụ Việc'}</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Xem Chi Tiết */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        title="Chi Tiết Vụ Việc Tai Nạn"
        maxWidth="max-w-2xl"
        footer={
           <Button variant="secondary" onClick={closeDetailModal}>
              Đóng
            </Button>
        }
      >
        {selectedAccident && (
          <div className="grid grid-cols-1 gap-4 text-sm">
             <div className="grid grid-cols-2 gap-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                <div>
                  <p className="font-semibold text-gray-500 dark:text-gray-400">Ngày xảy ra</p>
                  <p className="text-gray-900 dark:text-gray-100 text-base">{selectedAccident.date}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-500 dark:text-gray-400">Giờ xảy ra</p>
                  <p className="text-gray-900 dark:text-gray-100 text-base">{selectedAccident.time}</p>
                </div>
             </div>

             <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <p className="font-semibold text-gray-500 dark:text-gray-400">Địa điểm</p>
                <p className="text-gray-900 dark:text-gray-100 text-base">{selectedAccident.location}</p>
             </div>

             <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <p className="font-semibold text-gray-500 dark:text-gray-400">Nội dung vụ việc</p>
                <p className="text-gray-900 dark:text-gray-100 text-base whitespace-pre-wrap">{selectedAccident.content}</p>
             </div>

             <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <p className="font-semibold text-gray-500 dark:text-gray-400">Hậu quả</p>
                <p className="text-gray-900 dark:text-gray-100 text-base whitespace-pre-wrap">{selectedAccident.consequences}</p>
             </div>

             <div className="grid grid-cols-3 gap-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                <div>
                  <p className="font-semibold text-gray-500 dark:text-gray-400">Người chết</p>
                  <p className="text-red-600 font-bold text-base">{selectedAccident.deaths}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-500 dark:text-gray-400">Người bị thương</p>
                  <p className="text-yellow-600 font-bold text-base">{selectedAccident.injuries}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-500 dark:text-gray-400">Nồng độ cồn</p>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${selectedAccident.alcoholLevel === 'Yes' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                    {selectedAccident.alcoholLevel}
                  </span>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                <div>
                   <p className="font-semibold text-gray-500 dark:text-gray-400">Thiệt hại ước tính</p>
                   <p className="text-green-600 font-bold text-base">{selectedAccident.estimatedDamageVND.toLocaleString('vi-VN')} VNĐ</p>
                </div>
                <div>
                   <p className="font-semibold text-gray-500 dark:text-gray-400">Đơn vị thụ lý</p>
                   <p className="text-gray-900 dark:text-gray-100 text-base">{selectedAccident.handlingUnit}</p>
                </div>
             </div>

             <div>
                <p className="font-semibold text-gray-500 dark:text-gray-400">Kết quả xử lý</p>
                <p className="text-gray-900 dark:text-gray-100 text-base whitespace-pre-wrap">{selectedAccident.processingResult}</p>
             </div>
          </div>
        )}
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
              Xóa Vụ Việc
            </Button>
          </div>
        }
      >
        <p className="text-gray-700 dark:text-gray-300">
          Bạn có chắc chắn muốn xóa vụ tai nạn này không? Hành động này không thể hoàn tác.
        </p>
      </Modal>
    </Layout>
  );
};

export default TrafficAccidentManagement;
