
import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface ChartData {
  name: string;
  value?: number; // Make value optional as we can use dataKey to point to other properties
  [key: string]: any; // Allow for other properties like specific data points
}

interface ChartComponentProps {
  data: ChartData[];
  type: 'line' | 'bar' | 'pie';
  dataKey: string; // The key for the value in each data object
  nameKey?: string; // The key for the name/label in each data object (default 'name')
  title?: string;
  height?: number;
  width?: number; // Not always needed with ResponsiveContainer
  colors?: string[]; // For pie/bar charts
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const ChartComponent: React.FC<ChartComponentProps> = ({
  data,
  type,
  dataKey,
  nameKey = 'name',
  title,
  height = 300,
  colors = COLORS,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 p-4">
        {title ? `${title}: ` : ''}Không có dữ liệu biểu đồ.
      </div>
    );
  }

  const chartTitle = title ? (
    <h3 className="text-lg font-semibold text-center mb-4 text-gray-800 dark:text-gray-100">
      {title}
    </h3>
  ) : null;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg">
      {chartTitle}
      <ResponsiveContainer width="100%" height={height}>
        {type === 'line' && (
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" className="dark:stroke-gray-600" />
            <XAxis dataKey={nameKey} stroke="#888" className="dark:stroke-gray-300" />
            <YAxis stroke="#888" className="dark:stroke-gray-300" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgb(55 65 81)',
                borderColor: '#4b5563',
                color: '#f3f4f6',
              }}
              labelStyle={{ color: '#9ca3af' }}
              itemStyle={{ color: '#e5e7eb' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={colors[0]}
              activeDot={{ r: 8 }}
              name={dataKey.charAt(0).toUpperCase() + dataKey.slice(1)}
            />
          </LineChart>
        )}

        {type === 'bar' && (
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" className="dark:stroke-gray-600" />
            <XAxis dataKey={nameKey} stroke="#888" className="dark:stroke-gray-300" />
            <YAxis stroke="#888" className="dark:stroke-gray-300" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgb(55 65 81)',
                borderColor: '#4b5563',
                color: '#f3f4f6',
              }}
              labelStyle={{ color: '#9ca3af' }}
              itemStyle={{ color: '#e5e7eb' }}
            />
            <Legend />
            <Bar dataKey={dataKey} fill={colors[0]} name={dataKey.charAt(0).toUpperCase() + dataKey.slice(1)}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        )}

        {type === 'pie' && (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKey}
              nameKey={nameKey}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgb(55 65 81)',
                borderColor: '#4b5563',
                color: '#f3f4f6',
              }}
              labelStyle={{ color: '#9ca3af' }}
              itemStyle={{ color: '#e5e7eb' }}
            />
            <Legend />
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default ChartComponent;
