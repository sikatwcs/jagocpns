type StatCardProps = {
  label: string;
  value: string | number;
  tone?: 'blue' | 'gold' | 'green' | 'red';
};

export const StatCard = ({ label, value, tone = 'blue' }: StatCardProps) => (
  <div className={`stat-card stat-card--${tone}`}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);
