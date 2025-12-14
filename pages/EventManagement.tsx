
import React, { useState, useMemo } from 'react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import Modal from '../components/Modal';
import InputField from '../components/InputField';
import DatePicker from '../components/DatePicker';
import SelectField from '../components/SelectField';
import { Event, EventTarget, UnitType } from '../types';

interface EventManagementProps {
  events: Event[];
  onAddEvent: (newEvent: Event) => void;
  onUpdateEvent: (updatedEvent: Event) => void;
  onDeleteEvent: (id: string) => void;
  onAddEventTarget: (eventId: string, newTarget: EventTarget) => void;
  onUpdateEventTargetResult: (
    eventId: string,
    targetId: string,
    resultDate: string,
    result: number,
  ) => void;
}

const initialEventFormState: Event = {
  id: '',
  name: '',
  fromDate: '',
  toDate: '',
  content: '',
  targets: [],
};

const initialTargetFormState: EventTarget = {
  id: '',
  name: '',
  goal: 0,
  unit: 'Trường hợp',
  results: [],
};

const unitOptions: UnitType[] = ['VNĐ', 'Trường hợp', 'Số lượng', 'Giờ', 'Lượt'];

const EventManagement: React.FC<EventManagementProps> = ({
  events,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onAddEventTarget,
  onUpdateEventTargetResult,
}) => {
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Event>(initialEventFormState);
  const [isEditingEvent, setIsEditingEvent] = useState(false);

  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [currentTargetEventId, setCurrentTargetEventId] = useState<string | null>(null);
  const [currentTarget, setCurrentTarget] = useState<EventTarget>(initialTargetFormState);

  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [currentResultEventId, setCurrentResultEventId] = useState<string | null>(null);
  const [currentResultTargetId, setCurrentResultTargetId] = useState<string | null>(null);
  const [currentResultDate, setCurrentResultDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [currentResultValue, setCurrentResultValue] = useState(0);

  // State cho modal xác nhận xóa
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null);

  const openAddEventModal = () => {
    setCurrentEvent({ ...initialEventFormState, fromDate: new Date().toISOString().slice(0, 10), toDate: new Date().toISOString().slice(0, 10) });
    setIsEditingEvent(false);
    setIsEventModalOpen(true);
  };

  const openEditEventModal = (event: Event) => {
    setCurrentEvent(event);
    setIsEditingEvent(true);
    setIsEventModalOpen(true);
  };

  const closeEventModal = () => {
    setIsEventModalOpen(false);
  };

  const handleEventChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { id, value } = e.target;
    setCurrentEvent((prev) => ({ ...prev, [id]: value }));
  };

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditingEvent) {
      onUpdateEvent(currentEvent);
    } else {
      onAddEvent(currentEvent);
    }
    closeEventModal();
  };

  const confirmDeleteEvent = (id: string) => {
    setDeleteEventId(id);
  };

  const handleDeleteEventAction = () => {
    if (deleteEventId) {
      onDeleteEvent(deleteEventId);
      setDeleteEventId(null);
    }
  };

  const openAddTargetModal = (eventId: string) => {
    setCurrentTargetEventId(eventId);
    setCurrentTarget(initialTargetFormState);
    setIsTargetModalOpen(true);
  };

  const closeTargetModal = () => {
    setIsTargetModalOpen(false);
    setCurrentTargetEventId(null);
  };

  const handleTargetChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { id, value, type } = e.target;
    setCurrentTarget((prev) => ({
      ...prev,
      [id]: type === 'number' ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleTargetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentTargetEventId) {
      onAddEventTarget(currentTargetEventId, currentTarget);
    }
    closeTargetModal();
  };

  const openResultModal = (eventId: string, targetId: string) => {
    setCurrentResultEventId(eventId);
    setCurrentResultTargetId(targetId);
    setCurrentResultDate(new Date().toISOString().slice(0, 10)); // Default to today
    setCurrentResultValue(0); // Reset value
    setIsResultModalOpen(true);
  };

  const closeResultModal = () => {
    setIsResultModalOpen(false);
    setCurrentResultEventId(null);
    setCurrentResultTargetId(null);
  };

  const handleResultSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentResultEventId && currentResultTargetId) {
      onUpdateEventTargetResult(
        currentResultEventId,
        currentResultTargetId,
        currentResultDate,
        currentResultValue,
      );
    }
    closeResultModal();
  };

  const getProgress = (event: Event) => {
    const totalGoal = event.targets.reduce((sum, target) => sum + target.goal, 0);
    const totalAchieved = event.targets.reduce((sum, target) =>
      sum + target.results.reduce((s, r) => s + r.result, 0), 0);

    if (totalGoal === 0) return 0;
    return Math.min(100, (totalAchieved / totalGoal) * 100);
  };

  const sortedEvents = useMemo(() => {
    return [...events].sort(
      (a, b) => new Date(b.fromDate).getTime() - new Date(a.fromDate).getTime(),
    );
  }, [events]);

  return (
    <Layout title="Tạo và Theo Dõi Sự Kiện (Đợt Công Tác/Cao Điểm)">
      <div className="mb-6">
        <Button onClick={openAddEventModal}>Tạo Sự Kiện Mới</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedEvents.map((event) => {
          const progress = getProgress(event);
          const isOngoing =
            event.fromDate <= new Date().toISOString().slice(0, 10) &&
            event.toDate >= new Date().toISOString().slice(0, 10);
          const statusColor = isOngoing ? 'bg-blue-500' : 'bg-gray-400';
          const statusText = isOngoing ? 'Đang diễn ra' : 'Đã kết thúc';

          return (
            <div
              key={event.id}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col"
            >
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                {event.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Từ: {event.fromDate} - Đến: {event.toDate}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{event.content}</p>

              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                  <span>Tiến độ:</span>
                  <span>{progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-1">
                  <div
                    className="h-2.5 rounded-full bg-blue-600"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className={`mt-2 text-xs font-medium text-white px-2 py-0.5 rounded-full inline-block ${statusColor}`}>
                  {statusText}
                </div>
              </div>

              <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Chỉ tiêu:</h4>
              <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 mb-4">
                {event.targets.length === 0 ? (
                  <li>Chưa có chỉ tiêu nào được thêm.</li>
                ) : (
                  event.targets.map((target) => {
                    const achieved = target.results.reduce((sum, res) => sum + res.result, 0);
                    return (
                      <li key={target.id}>
                        {target.name}: {achieved} / {target.goal} {target.unit}
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-2 py-0.5 px-2 text-xs"
                          onClick={() => openResultModal(event.id, target.id)}
                        >
                          Nhập KQ
                        </Button>
                      </li>
                    );
                  })
                )}
              </ul>

              <div className="flex justify-end space-x-2 mt-auto">
                <Button size="sm" onClick={() => openAddTargetModal(event.id)}>
                  Thêm Chỉ Tiêu
                </Button>
                <Button size="sm" variant="secondary" onClick={() => openEditEventModal(event)}>
                  Sửa
                </Button>
                <Button size="sm" variant="danger" onClick={() => confirmDeleteEvent(event.id)}>
                  Xóa
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={isEventModalOpen}
        onClose={closeEventModal}
        title={isEditingEvent ? 'Sửa Thông Tin Sự Kiện' : 'Tạo Sự Kiện Mới'}
      >
        <form onSubmit={handleEventSubmit}>
          <InputField
            label="Tên Sự Kiện"
            id="name"
            value={currentEvent.name}
            onChange={handleEventChange}
            required
          />
          <DatePicker
            label="Từ Ngày"
            id="fromDate"
            value={currentEvent.fromDate}
            onChange={handleEventChange}
            required
          />
          <DatePicker
            label="Đến Ngày"
            id="toDate"
            value={currentEvent.toDate}
            onChange={handleEventChange}
            required
          />
          <div className="mb-4">
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Nội dung
            </label>
            <textarea
              id="content"
              value={currentEvent.content}
              onChange={handleEventChange}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            ></textarea>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={closeEventModal}>
              Hủy
            </Button>
            <Button type="submit">{isEditingEvent ? 'Lưu Thay Đổi' : 'Tạo Sự Kiện'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isTargetModalOpen} onClose={closeTargetModal} title="Thêm Chỉ Tiêu Mới">
        <form onSubmit={handleTargetSubmit}>
          <InputField
            label="Tên Chỉ Tiêu"
            id="name"
            value={currentTarget.name}
            onChange={handleTargetChange}
            required
          />
          <InputField
            label="Số lượng/Mục tiêu"
            id="goal"
            type="number"
            value={currentTarget.goal}
            onChange={handleTargetChange}
            min="0"
            required
          />
          <SelectField
            label="Đơn vị tính"
            id="unit"
            value={currentTarget.unit}
            onChange={handleTargetChange}
            options={unitOptions}
            required
          />
          <div className="mt-6 flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={closeTargetModal}>
              Hủy
            </Button>
            <Button type="submit">Thêm Chỉ Tiêu</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isResultModalOpen} onClose={closeResultModal} title="Nhập Kết Quả Chỉ Tiêu">
        <form onSubmit={handleResultSubmit}>
          <DatePicker
            label="Ngày nhập kết quả"
            id="resultDate"
            value={currentResultDate}
            onChange={(e) => setCurrentResultDate(e.target.value)}
            required
          />
          <InputField
            label="Kết quả đạt được"
            id="resultValue"
            type="number"
            value={currentResultValue}
            onChange={(e) => setCurrentResultValue(parseInt(e.target.value, 10) || 0)}
            min="0"
            required
          />
          <div className="mt-6 flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={closeResultModal}>
              Hủy
            </Button>
            <Button type="submit">Lưu Kết Quả</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Xác Nhận Xóa Sự Kiện */}
      <Modal
        isOpen={!!deleteEventId}
        onClose={() => setDeleteEventId(null)}
        title="Xác nhận xóa sự kiện"
        maxWidth="max-w-md"
        footer={
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setDeleteEventId(null)}>
              Hủy
            </Button>
            <Button variant="danger" onClick={handleDeleteEventAction}>
              Xóa Sự Kiện
            </Button>
          </div>
        }
      >
        <p className="text-gray-700 dark:text-gray-300">
          Bạn có chắc chắn muốn xóa sự kiện này không? Tất cả các chỉ tiêu và kết quả liên quan cũng sẽ bị xóa. Hành động này không thể hoàn tác.
        </p>
      </Modal>
    </Layout>
  );
};

export default EventManagement;
