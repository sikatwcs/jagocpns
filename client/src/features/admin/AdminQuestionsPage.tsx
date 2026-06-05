import { FormEvent, useState } from 'react';
import { ErrorState, LoadingState } from '../../components/StateViews';
import { useAsync } from '../../lib/utils/useAsync';
import type { QuestionCategory } from '../../lib/supabase/database.types';
import { getPublishedTryouts } from '../tryouts/tryoutRepository';
import { saveQuestion } from './adminRepository';

export const AdminQuestionsPage = () => {
  const tryouts = useAsync(() => getPublishedTryouts(), []);
  const [tryoutId, setTryoutId] = useState('');
  const [questionNumber, setQuestionNumber] = useState(1);
  const [category, setCategory] = useState<QuestionCategory>('TWK');
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState({
    a: '',
    b: '',
    c: '',
    d: '',
    e: '',
  });
  const [scores, setScores] = useState({
    a: 0,
    b: 0,
    c: 0,
    d: 0,
    e: 0,
  });
  const [explanation, setExplanation] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await saveQuestion({
        tryout_list_id: tryoutId,
        question_number: questionNumber,
        category,
        question_text: questionText,
        option_a: options.a,
        option_b: options.b,
        option_c: options.c,
        option_d: options.d,
        option_e: options.e,
        score_a: scores.a,
        score_b: scores.b,
        score_c: scores.c,
        score_d: scores.d,
        score_e: scores.e,
        explanation,
      });
      setMessage('Soal tersimpan.');
      setQuestionNumber((current) => current + 1);
      setQuestionText('');
      setOptions({ a: '', b: '', c: '', d: '', e: '' });
      setScores({ a: 0, b: 0, c: 0, d: 0, e: 0 });
      setExplanation('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Soal gagal disimpan');
    }
  };

  return (
    <section className="stack">
      <div className="section-heading">
        <span className="eyebrow">Admin</span>
        <h1>Bank soal</h1>
      </div>
      {tryouts.loading ? <LoadingState title="Memuat paket tryout" /> : null}
      {tryouts.error ? <ErrorState title="Tryout gagal dimuat" description={tryouts.error} /> : null}
      <form className="panel form-grid" onSubmit={handleSubmit}>
        <label className="span-2">
          Tryout
          <select
            value={tryoutId}
            onChange={(event) => setTryoutId(event.target.value)}
            required
          >
            <option value="">Pilih tryout</option>
            {tryouts.data?.map((tryout) => (
              <option key={tryout.id} value={tryout.id}>
                {tryout.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Nomor
          <input
            type="number"
            min={1}
            value={questionNumber}
            onChange={(event) => setQuestionNumber(Number(event.target.value))}
          />
        </label>
        <label>
          Kategori
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as QuestionCategory)}
          >
            <option value="TWK">TWK</option>
            <option value="TIU">TIU</option>
            <option value="TKP">TKP</option>
            <option value="OTHER">OTHER</option>
          </select>
        </label>
        <label className="span-2">
          Pertanyaan
          <textarea
            value={questionText}
            onChange={(event) => setQuestionText(event.target.value)}
            required
          />
        </label>
        {(['a', 'b', 'c', 'd', 'e'] as const).map((key) => (
          <label key={key}>
            Opsi {key.toUpperCase()}
            <input
              value={options[key]}
              onChange={(event) =>
                setOptions((current) => ({ ...current, [key]: event.target.value }))
              }
            />
            <input
              type="number"
              value={scores[key]}
              onChange={(event) =>
                setScores((current) => ({
                  ...current,
                  [key]: Number(event.target.value),
                }))
              }
              aria-label={`Skor ${key.toUpperCase()}`}
            />
          </label>
        ))}
        <label className="span-2">
          Pembahasan
          <textarea
            value={explanation}
            onChange={(event) => setExplanation(event.target.value)}
          />
        </label>
        <button className="primary-button">Simpan soal</button>
        {message ? <div className="form-success span-2">{message}</div> : null}
        {error ? <div className="form-error span-2">{error}</div> : null}
      </form>
    </section>
  );
};
