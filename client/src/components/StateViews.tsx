type StateViewProps = {
  title: string;
  description?: string;
};

export const LoadingState = ({ title }: StateViewProps) => (
  <div className="state-view">
    <div className="spinner" />
    <p>{title}</p>
  </div>
);

export const EmptyState = ({ title, description }: StateViewProps) => (
  <div className="state-view">
    <strong>{title}</strong>
    {description ? <span>{description}</span> : null}
  </div>
);

export const ErrorState = ({ title, description }: StateViewProps) => (
  <div className="state-view state-view--error">
    <strong>{title}</strong>
    {description ? <span>{description}</span> : null}
  </div>
);
