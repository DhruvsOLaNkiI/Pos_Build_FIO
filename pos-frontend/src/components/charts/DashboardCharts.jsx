import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

const COLORS = ['#6C5CE7', '#00CEC9', '#00B894', '#FDCB6E', '#E17055'];

export const SalesChart = ({ data }) => {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: '#888888' }}
                    stroke="#e5e7eb"
                />
                <YAxis
                    tickFormatter={(value) => `₹${value}`}
                    tick={{ fontSize: 12, fill: '#888888' }}
                    stroke="#e5e7eb"
                />
                <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a1a', borderRadius: '12px', border: '1px solid #333' }}
                    itemStyle={{ color: '#fff' }}
                    labelStyle={{ color: '#cccccc' }}
                />
                <Bar
                    dataKey="amount"
                    fill="#6C5CE7"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                />
            </BarChart>
        </ResponsiveContainer>
    );
};

export const TopProductsChart = ({ data }) => {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip backgroundColor="#1a1a1a" />
            </PieChart>
        </ResponsiveContainer>
    );
};
