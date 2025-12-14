
import React, { useMemo } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import ChartComponent from '../components/ChartComponent';
import Table, { Column } from '../components/Table';
import { TrafficAccident, VehicleRegistration, Event, DailyTask } from '../types';

interface DashboardProps {
  trafficAccidents: TrafficAccident[];
  vehicleRegistrations: VehicleRegistration[];
  events: Event[];
  dailyTasks: DailyTask[];
}

interface RegistrationStat {
  type: string;
  first: number;
  transfer: number;
  recall: number;
  renewal: number;
  total: number;
}

const Dashboard: React.FC<DashboardProps> = ({
  trafficAccidents,
  vehicleRegistrations,
  events,
  dailyTasks,
}) => {
  // Memoized calculations for key metrics
  const totalAccidents = useMemo(() => trafficAccidents.length, [trafficAccidents]);
  const totalDeaths = useMemo(
    () => trafficAccidents.reduce((sum, acc) => sum + acc.deaths, 0),
    [trafficAccidents],
  );
  const totalInjuries = useMemo(
    () => trafficAccidents.reduce((sum, acc) => sum + acc.injuries, 0),
    [trafficAccidents],
  );
  const totalRegistrationsToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return vehicleRegistrations
      .filter((reg) => reg.date === today)
      .reduce(
        (sum, reg) =>
          sum + reg.firstTimeCount + reg.transferCount + reg.renewalCount,
        0,
      );
  }, [vehicleRegistrations]);

  const activeEvents = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return events.filter((event) => event.fromDate <= today && event.toDate >= today).length;
  }, [events]);

  const totalDailyTasksToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return dailyTasks.filter((task) => task.date === today).length;
  }, [dailyTasks]);

  // Chart Data preparation
  const accidentTrendData = useMemo(() => {
    const monthCounts: { [key: string]: number } = {};
    trafficAccidents.forEach((acc) => {
      const monthYear = acc.date.substring(0, 7); // YYYY-MM
      monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1;
    });
    return Object.keys(monthCounts)
      .sort()
      .map((monthYear) => ({ name: monthYear, accidents: monthCounts[monthYear] }));
  }, [trafficAccidents]);

  // Replace Pie Chart logic with Table Summary Logic
  const registrationStats = useMemo<RegistrationStat[]>(() => {
    const stats = {
      'Ô tô': { first: 0, transfer: 0, recall: 0, renewal: 0, total: 0 },
      'Xe máy': { first: 0, transfer: 0, recall: 0, renewal: 0, total: 0 },
      'Tổng cộng': { first: 0, transfer: 0, recall: 0, renewal: 0, total: 0 }
    };

    vehicleRegistrations.forEach(reg => {
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
  }, [vehicleRegistrations]);

  const registrationColumns: Column<RegistrationStat>[] = [
    { header: 'Loại phương tiện', accessor: 'type', className: 'font-bold' },
    { header: 'Đăng ký mới', accessor: 'first' },
    { header: 'Sang tên', accessor: 'transfer' },
    { header: 'Thu hồi', accessor: 'recall' },
    { header: 'Cấp đổi', accessor: 'renewal' },
    { header: 'Tổng cộng', accessor: 'total', className: 'font-bold text-blue-600' },
  ];

  const eventProgressData = useMemo(() => {
    return events.map(event => {
      const totalGoal = event.targets.reduce((sum, target) => sum + target.goal, 0);
      const totalAchieved = event.targets.reduce((sum, target) =>
        sum + target.results.reduce((s, r) => s + r.result, 0), 0);
      const progress = totalGoal > 0 ? (totalAchieved / totalGoal) * 100 : 0;
      return { name: event.name, progress: parseFloat(progress.toFixed(2)) };
    });
  }, [events]);

  return (
    <Layout title="Tổng Quan Ứng Dụng">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card
          title="Tổng Vụ TNGT"
          value={totalAccidents}
          description="Số vụ tai nạn giao thông đã ghi nhận"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-8 h-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.732 0 2.818-1.874 1.945-3.376L12.944 3.376c-.867-1.5-3.032-1.5-3.898 0L2.697 16.376ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          }
        />
        <Card
          title="Tổng Số Người Chết"
          value={totalDeaths}
          description="Tổng số người chết do TNGT"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-8 h-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
              />
            </svg>
          }
        />
        <Card
          title="Đăng Ký Xe Hôm Nay"
          value={totalRegistrationsToday}
          description="Số lượng xe đăng ký, sang tên, cấp đổi hôm nay"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-8 h-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375M12 18.75a1.5 1.5 0 0 1 3 0m-3 0a1.5 1.5 0 0 0 3 0m-3 0h6m-9 0H3.375M12 18.75c-1.011 0-1.944-.391-2.651-1.033M15 18.75c.083.67.1 1.35.047 2.025m-12 .025a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12 11.25v4.5m-3-4.5v4.5m-3-8.25h18.75c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125H3.375c-.621 0-1.125-.504-1.125-1.125V3.375c0-.621.504-1.125 1.125-1.125H12c.305 0 .597.068.865.197"
              />
            </svg>
          }
        />
        <Card
          title="Sự Kiện Đang Diễn Ra"
          value={activeEvents}
          description="Số sự kiện/chiến dịch đang hoạt động"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-8 h-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25m.75 3.75-.9.9a2.25 2.25 0 0 1-3.182-3.182l.9-.9m3.182 3.182A4.5 4.5 0 0 0 12 14.25m7.5-2.25-.9.9a2.25 2.25 0 0 1-3.182-3.182l.9-.9m3.182 3.182A4.5 4.5 0 0 0 12 9.75M12 9.75a4.5 4.5 0 0 1 1.5 3.75m-1.5-3.75a4.5 4.5 0 0 0-1.5 3.75H12m0 0H9.563M12 12.75h7.5M7.5 7.5h-.75A2.25 2.25 0 0 0 4.5 9.75v.75m7.5-7.5h-.75A2.25 2.25 0 0 0 9 4.5m1.5 0h-.75M6.75 6.75H6m6-3.75h.25M18 6.75h-.25m-3 0h-.25m0 0V4.5m0 3.75v.25M12 12.75h.25V12M7.5 7.5h-.25V7.5m6-3h3.375a2.25 2.25 0 0 1 2.25 2.25v1.5m-4.5-4.5H12M5.625 10.5H5.25m0 0v2.25m0 0h2.25m4.5-4.5h-.086A2.25 2.25 0 0 0 9 7.5h-.584m1.06 4.342L12 16.5m-2.25 2.25L12 16.5m0 0L14.25 18.75"
              />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartComponent
          title="Xu Hướng Vụ TNGT Hàng Tháng"
          data={accidentTrendData}
          type="line"
          dataKey="accidents"
          nameKey="name"
          height={300}
        />
        
        {/* Replaced Pie Chart with Summary Table */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg flex flex-col">
          <h3 className="text-lg font-semibold text-center mb-4 text-gray-800 dark:text-gray-100">
            Thống Kê Tổng Hợp Đăng Ký Xe
          </h3>
          <div className="flex-1 overflow-auto">
             <Table 
              data={registrationStats} 
              columns={registrationColumns} 
              keyAccessor="type" 
              className="shadow-none border-0"
            />
          </div>
        </div>

         <ChartComponent
          title="Tiến Độ Thực Hiện Sự Kiện (%)"
          data={eventProgressData}
          type="bar"
          dataKey="progress"
          nameKey="name"
          height={300}
        />
      </div>
    </Layout>
  );
};

export default Dashboard;
