import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

let CATEGORY_GRADIENTS = [
  ['#1DB954', '#107C41'],
  ['#FFD700', '#E6C200'],
  ['#7A9A6E', '#5C7A52'],
  ['#D4AF37', '#B8941F'],
  ['#5C8A3A', '#3E6B2F'],
  ['#B8860B', '#9A6F08'],
  ['#3E6B2F', '#2A4D20'],
  ['#C9A227', '#A8851C']
];

function SpendingChart({ spending }) {
  let pieData = Object.keys(spending).map(category => ({
    name: category,
    value: spending[category]
  }));

  return (
    <div style={{ background: '#161B22', padding: '20px', borderRadius: '12px', border: '1px solid #30363D' }}>
      <h2 style={{ fontSize: '16px', marginBottom: '16px', color: '#E8F5E9' }}>Spending By Category</h2>
      {pieData.length === 0 ? (
        <p style={{ color: '#8B949E' }}>No spending data for this period</p>
      ) : (
        <>
          <svg width="0" height="0">
            <defs>
              {pieData.map((entry, index) => {
                let [start, end] = CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length];
                return (
                  <linearGradient key={index} id={`pieGrad${index}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={start} />
                    <stop offset="100%" stopColor={end} />
                  </linearGradient>
                );
              })}
            </defs>
          </svg>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={85}
                labelLine={false}
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                  if (percent < 0.05) return null;
                  let RADIAN = Math.PI / 180;
                  let radius = innerRadius + (outerRadius - innerRadius) * 0.55;
                  let x = cx + radius * Math.cos(-midAngle * RADIAN);
                  let y = cy + radius * Math.sin(-midAngle * RADIAN);
                  return (
                    <text x={x} y={y} fill="#0D1117" fontSize={13} fontWeight="bold" textAnchor="middle" dominantBaseline="central">
                      {(percent * 100).toFixed(0)}%
                    </text>
                  );
                }}
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={`url(#pieGrad${index})`} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => `$${Number(value).toFixed(2)}`}
                contentStyle={{ background: '#161B22', border: '1px solid #30363D', color: '#fff' }}
              />
              <Legend wrapperStyle={{ color: '#E8F5E9', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}

export default SpendingChart;