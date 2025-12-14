
import React, { useState, useMemo, useEffect } from 'react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import Modal from '../components/Modal';
import InputField from '../components/InputField';
import DatePicker from '../components/DatePicker';
import SelectField from '../components/SelectField';
import Table, { Column } from '../components/Table';
import { VehicleRegistration } from '../types';
import { VEHICLE_REGISTRATION_TYPES } from '../constants';

interface VehicleRegistrationTrackingProps {
  vehicleRegistrations: VehicleRegistration[];
  onAddRegistration: (newRegistration: VehicleRegistration) => void;
  onUpdateRegistration: (updatedRegistration: VehicleRegistration) => void;
  onDeleteRegistration: (id: string) => void;
}

const initialFormState: VehicleRegistration = {
  id: '',
  date: new Date().toISOString().slice(0, 10),
  vehicleType: 'Ô tô',
  firstTimeCount: 0,
  transferCount: 0,
  recallCount: 0,
  renewalCount: 0,
};

type FilterType = 'week' | 'month' | 'custom' | 'all';

interface DashboardStat {
  type: string;
  first: number;
  transfer: number;
  recall: number;
  renewal: number;
  total: number;
}

const VehicleRegistrationTracking: React.FC<VehicleRegistrationTrackingProps> = ({
  vehicleRegistrations,
  onAddRegistration,
  onUpdateRegistration,
  onDeleteRegistration,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRegistration, setCurrentRegistration] =
    useState<VehicleRegistration>(initialFormState);
  const [isEditing, setIsEditing] = useState(false);

  // Filter States
  const [filterType, setFilterType] = useState<FilterType>('week'); // Default to week
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // State cho modal xác nhận xóa
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Helper function to calculate date ranges based on Vietnamese police reporting logic
  const calculateDateRange = (type: FilterType) => {
    const today = new Date();
    // Reset hours to avoid timezone issues affecting date calculation
    today.setHours(0, 0, 0, 0);

    let from = new Date(today);
    let to = new Date(today);

    if (type === 'week') {
      // Tuần: Từ Thứ 4 tuần trước đến Thứ 3 tuần này.
      const currentDay = today.getDay();
      
      // Calculate distance to the "current reporting week's" Tuesday.
      // If today is Wed(3) -> Next Tue is +6 days.
      // If today is Tue(2) -> Today is end date.
      let daysUntilTuesday = 2 - currentDay;
      if (daysUntilTuesday < 0) {
          // If it's Wed(3) to Sat(6), the reporting Tuesday is next week
          daysUntilTuesday += 7;
      }
      
      // Set To Date (Tuesday)
      to.setDate(today.getDate() + daysUntilTuesday);
      
      // Set From Date (Wednesday of previous week = To Date - 6 days)
      from = new Date(to);
      from.setDate(to.getDate() - 6);

    } else if (type === 'month') {
      // Tháng: Từ 16 tháng trước đến 15 tháng này (nếu đang ở nửa đầu tháng)
      
      const currentDayOfMonth = today.getDate();
      
      if (currentDayOfMonth <= 15) {
        // Example: Today is 10th May. Range: 16th April -> 15th May.
        to.setDate(15); // 15th of this month
        from.setMonth(from.getMonth() - 1); // Previous month
        from.setDate(16); // 16th
      } else {
        // Example: Today is 20th May. Range: 16th May -> 15th June.
        from.setDate(16); // 16th of this month
        to.setMonth(to.getMonth() + 1); // Next month
        to.setDate(15); // 15th
      }
    } else if (type === 'all') {
        // Set wide range or handle logic specifically
        from = new Date('2020-01-01');
        to = new Date('2030-12-31');
    }

    return {
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10)
    };
  };

  // Effect to update dates when filter type changes
  useEffect(() => {
    if (filterType !== 'custom') {
      const { from, to } = calculateDateRange(filterType);
      setFilterDateFrom(from);
      setFilterDateTo(to);
    }
  }, [filterType]);

  const openAddModal = () => {
    setCurrentRegistration({ ...initialFormState, date: new Date().toISOString().slice(0, 10) });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (registration: VehicleRegistration) => {
    setCurrentRegistration(registration);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleDeleteAction = () => {
    if (deleteId) {
      onDeleteRegistration(deleteId);
      setDeleteId(null);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { id, value, type } = e.target;
    setCurrentRegistration((prev) => ({
      ...prev,
      [id]: type === 'number' ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      onUpdateRegistration(currentRegistration);
    } else {
      onAddRegistration(currentRegistration);
    }
    closeModal();
  };

  // Filter Data
  const filteredRegistrations = useMemo(() => {
    if (!filterDateFrom || !filterDateTo) return vehicleRegistrations;
    const from = new Date(filterDateFrom);
    const to = new Date(filterDateTo);
    return vehicleRegistrations.filter(reg => {
      const regDate = new Date(reg.date);
      return regDate >= from && regDate <= to;
    });
  }, [vehicleRegistrations, filterDateFrom, filterDateTo]);

  // Calculate Dashboard Stats
  const dashboardStats = useMemo<DashboardStat[]>(() => {
    const stats = {
      'Ô tô': { first: 0, transfer: 0, recall: 0, renewal: 0, total: 0 },
      'Xe máy': { first: 0, transfer: 0, recall: 0, renewal: 0, total: 0 },
      'Tổng cộng': { first: 0, transfer: 0, recall: 0, renewal: 0, total: 0 }
    };

    filteredRegistrations.forEach(reg => {
      const type = reg.vehicleType;
      if (stats[type]) {
        stats[type].first += reg.firstTimeCount;
        stats[type].transfer += reg.transferCount;
        stats[type].recall += reg.recallCount;
        stats[type].renewal += reg.renewalCount;
        stats[type].total += (reg.firstTimeCount + reg.transferCount + reg.recallCount + reg.renewalCount);
      }
      
      // Grand total
      stats['Tổng cộng'].first += reg.firstTimeCount;
      stats['Tổng cộng'].transfer += reg.transferCount;
      stats['Tổng cộng'].recall += reg.recallCount;
      stats['Tổng cộng'].renewal += reg.renewalCount;
      stats['Tổng cộng'].total += (reg.firstTimeCount + reg.transferCount + reg.recallCount + reg.renewalCount);
    });

    return [
      { type: 'Ô tô', ...stats['Ô tô'] },
      { type: 'Xe máy', ...stats['Xe máy'] },
      { type: 'Tổng cộng', ...stats['Tổng cộng'] }
    ];
  }, [filteredRegistrations]);

  const dashboardColumns: Column<DashboardStat>[] = [
    { header: 'Loại phương tiện', accessor: 'type', className: 'font-bold' },
    { header: 'Đăng ký mới', accessor: 'first' },
    { header: 'Sang tên', accessor: 'transfer' },
    { header: 'Thu hồi', accessor: 'recall' },
    { header: 'Cấp đổi', accessor: 'renewal' },
    { header: 'Tổng cộng', accessor: 'total', className: 'font-bold text-blue-600' },
  ];

  const columns = useMemo<Column<VehicleRegistration>[]>(
    () => [
      { header: 'Ngày', accessor: 'date' },
      { header: 'Loại xe', accessor: 'vehicleType' },
      { header: 'Lần đầu', accessor: 'firstTimeCount' },
      { header: 'Sang tên', accessor: 'transferCount' },
      { header: 'Thu hồi', accessor: 'recallCount' },
      { header: 'Cấp đổi', accessor: 'renewalCount' },
      {
        header: 'Tổng cộng',
        accessor: (row: VehicleRegistration) =>
          row.firstTimeCount + row.transferCount + row.renewalCount + row.recallCount,
      },
      {
        header: 'Thao tác',
        accessor: (row: VehicleRegistration) => (
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
    // Fix: Add delete handler to dependencies so closure isn't stale
    [openEditModal]
  );

  return (
    <Layout title="Theo Dõi Kết Quả Đăng Ký Xe">
      {/* Filter Section */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md mb-6 flex flex-col md:flex-row items-end md:items-center gap-4">
        <div className="w-full md:w-1/4">
          <SelectField
            label="Bộ Lọc Thời Gian"
            id="filterType"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            options={[
              { value: 'week', label: 'Theo Tuần (T4 tuần trước - T3 tuần này)' },
              { value: 'month', label: 'Theo Tháng (16 tháng trước - 15 tháng này)' },
              { value: 'custom', label: 'Tùy Chọn' },
              { value: 'all', label: 'Tất Cả' },
            ]}
            className="mb-0" // Override default margin
          />
        </div>
        
        {(filterType === 'custom' || filterType === 'week' || filterType === 'month') && (
          <>
            <div className="w-full md:w-1/4">
              <DatePicker
                label="Từ Ngày"
                id="filterDateFrom"
                value={filterDateFrom}
                onChange={(e) => {
                   setFilterType('custom'); // Switch to custom if user manually edits date
                   setFilterDateFrom(e.target.value);
                }}
                className="mb-0"
              />
            </div>
            <div className="w-full md:w-1/4">
              <DatePicker
                label="Đến Ngày"
                id="filterDateTo"
                value={filterDateTo}
                onChange={(e) => {
                  setFilterType('custom');
                  setFilterDateTo(e.target.value);
                }}
                className="mb-0"
              />
            </div>
          </>
        )}
        
        <div className="w-full md:w-auto md:ml-auto">
           <Button onClick={openAddModal}>Nhập Kết Quả Mới</Button>
        </div>
      </div>

      {/* Scientific Dashboard Table */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100 flex items-center">
          <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          Thống Kê Tổng Hợp ({filterType === 'all' ? 'Toàn bộ' : `${filterDateFrom} đến ${filterDateTo}`})
        </h3>
        <Table 
          data={dashboardStats} 
          columns={dashboardColumns} 
          keyAccessor="type" 
          className="shadow-xl border border-gray-100 dark:border-gray-700"
        />
      </div>

      <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
        Chi Tiết Nhật Ký Nhập Liệu
      </h3>
      <Table data={filteredRegistrations} columns={columns} keyAccessor="id" />

      <Modal isOpen={isModalOpen} onClose={closeModal} title={isEditing ? 'Sửa Kết Quả Đăng Ký Xe' : 'Nhập Kết Quả Đăng Ký Xe'}>
        <form onSubmit={handleSubmit}>
          <DatePicker
            label="Ngày"
            id="date"
            value={currentRegistration.date}
            onChange={handleChange}
            required
          />
          <SelectField
            label="Loại xe"
            id="vehicleType"
            value={currentRegistration.vehicleType}
            onChange={handleChange}
            options={VEHICLE_REGISTRATION_TYPES}
            required
          />
          <InputField
            label="Lần đầu (số lượng)"
            id="firstTimeCount"
            type="number"
            value={currentRegistration.firstTimeCount}
            onChange={handleChange}
            min="0"
          />
          <InputField
            label="Sang tên (số lượng)"
            id="transferCount"
            type="number"
            value={currentRegistration.transferCount}
            onChange={handleChange}
            min="0"
          />
          <InputField
            label="Thu hồi (số lượng)"
            id="recallCount"
            type="number"
            value={currentRegistration.recallCount}
            onChange={handleChange}
            min="0"
          />
          <InputField
            label="Cấp đổi (số lượng)"
            id="renewalCount"
            type="number"
            value={currentRegistration.renewalCount}
            onChange={handleChange}
            min="0"
          />
          <div className="mt-6 flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Hủy
            </Button>
            <Button type="submit">{isEditing ? 'Lưu Thay Đổi' : 'Lưu'}</Button>
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
              Xóa Bản Ghi
            </Button>
          </div>
        }
      >
        <p className="text-gray-700 dark:text-gray-300">
          Bạn có chắc chắn muốn xóa bản ghi đăng ký xe này không? Hành động này không thể hoàn tác.
        </p>
      </Modal>
    </Layout>
  );
};

export default VehicleRegistrationTracking;
