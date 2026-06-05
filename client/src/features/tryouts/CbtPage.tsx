import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EmptyState, ErrorState, LoadingState } from '../../components/StateViews';
import { useAuth } from '../auth/AuthProvider';
import { useAsync } from '../../lib/utils/useAsync';
import {
  getTryoutById,
  getTryoutQuestions,
  startAttempt,
  submitAttempt,
} from './tryoutRepository';

const options = ['A', 'B', 'C', 'D', 'E'] as const;

export const CbtPage = () => {
  const { id } = useParams();
  const { profile } = useAuth();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const state = useAsync(async () => {
    if (!id) return null;
    const [tryout, questions] = await Promise.all([
      getTryoutById(id),
      getTryoutQuestions(id),
    ]);
    return { tryout, questions };
  }, [id]);

  const handleSubmit = async () => {
    if (!profile || !id || !state.data) {
      setActionError('Masuk akun dahulu untuk submit tryout.');
      return;
    }
    setBusy(true);
    setActionError(null);
    try {
      const attempt = await startAttempt(profile, id);
      const saved = await submitAttempt(profile, attempt, state.data.questions, answers);
      setResult(saved.score.total_score);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Submit gagal');
    } finally {
      setBusy(false);
    }
  };

  if (state.loading) return <LoadingState title="Memuat CBT" />;
  if (state.error) return <ErrorState title="CBT gagal dimuat" description={state.error} />;
  if (!state.data?.tryout) return <EmptyState title="Tryout tidak ditemukan" />;

  return (
    <main className="cbt-shell">
      <header className="cbt-header">
        <div>
          <span className="eyebrow">CBT</span>
          <h1>{state.data.tryout.title}</h1>
        </div>
        <Link className="secondary-button" to="/app/my-tryouts">
          Keluar
        </Link>
      </header>
      {result !== null ? (
        <div className="panel panel--center">
          <span className="eyebrow">Hasil</span>
          <h2>Skor total {result}</h2>
          <Link className="primary-button" to="/app/my-tryouts">
            Lihat riwayat
          </Link>
        </div>
      ) : (
        <>
          <div className="question-list">
            {state.data.questions.map((question) => (
              <article className="question-card" key={question.id}>
                <span className="eyebrow">
                  {question.category} No. {question.question_number}
                </span>
                <h2>{question.question_text}</h2>
                {question.image_url ? <img src={question.image_url} alt="" /> : null}
                <div className="answer-grid">
                  {options.map((option) => {
                    const text =
                      question[
                        `option_${option.toLowerCase()}` as keyof typeof question
                      ];
                    return (
                      <button
                        key={option}
                        className={answers[question.id] === option ? 'active' : ''}
                        onClick={() =>
                          setAnswers((current) => ({
                            ...current,
                            [question.id]: option,
                          }))
                        }
                      >
                        <strong>{option}</strong>
                        <span>{String(text || '-')}</span>
                      </button>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
          {actionError ? <div className="form-error">{actionError}</div> : null}
          <div className="sticky-submit">
            <span>
              Terjawab {Object.keys(answers).length}/{state.data.questions.length}
            </span>
            <button className="primary-button" disabled={busy} onClick={handleSubmit}>
              {busy ? 'Submit...' : 'Submit tryout'}
            </button>
          </div>
        </>
      )}
    </main>
  );
};
