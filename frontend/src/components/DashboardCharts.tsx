"use client";
 
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
 
const budgetData = [
  { name: 'Road Repair', spent: 45000, allocated: 100000 },
  { name: 'Pothole Filling', spent: 12000, allocated: 30000 },
  { name: 'Street Lights', spent: 8500, allocated: 20000 },
  { name: 'Signage', spent: 3000, allocated: 10000 },
];
 
export function BudgetBarChart({ data }: { data?: any[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data || budgetData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EAE8E3" vertical={false} />
          <XAxis dataKey="name" stroke="#605E59" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#605E59" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}L`} />
          <RechartsTooltip 
            cursor={{ fill: '#FAF9F5' }}
            contentStyle={{ 
              backgroundColor: '#FFFFFF', 
              borderColor: '#EAE8E3', 
              borderRadius: '16px', 
              color: '#1F1E1B',
              boxShadow: '0 10px 30px -10px rgba(0,0,0,0.08)',
              fontSize: '11px',
              fontFamily: 'sans-serif'
            }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 'bold' }} />
          <Bar dataKey="spent" name="Spent" fill="#FF5A1F" radius={[4, 4, 0, 0]} />
          <Bar dataKey="allocated" name="Allocated" fill="#E4E2DD" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
 
export function SeverityPieChart({ severityData }: { severityData: any[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={severityData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {severityData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <RechartsTooltip 
            contentStyle={{ 
              backgroundColor: '#FFFFFF', 
              borderColor: '#EAE8E3', 
              borderRadius: '16px', 
              color: '#1F1E1B',
              boxShadow: '0 10px 30px -10px rgba(0,0,0,0.08)',
              fontSize: '11px',
              fontFamily: 'sans-serif'
            }}
          />
          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
