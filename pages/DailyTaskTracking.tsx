
import React, { useState, useMemo } from 'react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import Modal from '../components/Modal';
import InputField from '../components/InputField';
import DatePicker from '../components/DatePicker';
import SelectField from '../components/SelectField';
import Table, { Column } from '../components/Table';
import { DailyTask } from '../types';
import { TASK_CATEGORIES } from '../constants';

interface DailyTaskTrackingProps {
  dailyTasks: DailyTask[];
  onAddDailyTask: (newTask: DailyTask) => void;
}

const initialFormState: DailyTask = {
  id: '',
  date: new Date().toISOString().slice(0, 10),
  category: 'Tuần tra xử lý',
  description: '',
  result: '',
};

const DailyTaskTracking: React.FC<DailyTaskTrackingProps> = ({
  dailyTasks,
  onAddDailyTask,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<DailyTask>(initialFormState);

  const openAddModal = () => {
    setCurrentTask({ ...initialFormState, date: new Date().toISOString().slice(0, 10) });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { id, value } = e.target;
    setCurrentTask((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddDailyTask(currentTask);
    closeModal();
  };

  const sortedTasks = useMemo(() => {
    return [...dailyTasks].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [dailyTasks]);

  const columns = useMemo<Column<DailyTask>[]>(
    () => [
      { header: 'Ngày', accessor: 'date' },
      { header: 'Loại công tác', accessor: 'category' },
      { header: 'Mô tả', accessor: 'description', className: 'truncate max-w-sm' },
      { header: 'Kết quả', accessor: 'result', className: 'truncate max-w-xs' },
    ],
    [],
  );

  return (
    <Layout title="Theo Dõi Công Tác Thường Xuyên & Công Tác Theo Giai Đoạn">
      <div className="mb-6">
        <Button onClick={openAddModal}>Ghi Nhận Công Tác Mới</Button>
      </div>

      <Table data={sortedTasks} columns={columns} keyAccessor="id" />

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Ghi Nhận Công Tác Hàng Ngày">
        <form onSubmit={handleSubmit}>
          <DatePicker
            label="Ngày"
            id="date"
            value={currentTask.date}
            onChange={handleChange}
            required
          />
          <SelectField
            label="Loại công tác"
            id="category"
            value={currentTask.category}
            onChange={handleChange}
            options={TASK_CATEGORIES}
            required
          />
          <div className="mb-4">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Mô tả công tác
            </label>
            <textarea
              id="description"
              value={currentTask.description}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            ></textarea>
          </div>
          <div className="mb-4">
            <label
              htmlFor="result"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Kết quả
            </label>
            <textarea
              id="result"
              value={currentTask.result}
              onChange={handleChange}
              rows={2}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              required
            ></textarea>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Hủy
            </Button>
            <Button type="submit">Lưu Công Tác</Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default DailyTaskTracking;
