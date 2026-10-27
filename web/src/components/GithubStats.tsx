import { useEffect, useState } from 'react';
import { getGithubSummary, type GithubSummary } from '../lib/github';

type GithubStatsProps = { username: string };
type ContributionDay = { date: string; count: number; level: number };

function ContributionCalendar({ username }: GithubStatsProps) {
  const [days, setDays] = useState<ContributionDay[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(username)}?y=last`, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error('Calendar unavailable'); return response.json(); })
      .then((result: { contributions: ContributionDay[] }) => setDays(result.contributions))
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [username]);

  if (failed) return <p className="calendar-message">Календарь активности временно недоступен</p>;
  if (!days?.length) return <p className="calendar-message">ЗАГРУЗКА АКТИВНОСТИ...</p>;

  const offset = new Date(`${days[0].date}T00:00:00Z`).getUTCDay();
  const columns = Math.ceil((days.length + offset) / 7);
  const months = days.flatMap((day, index) => {
    if (!day.date.endsWith('-01')) return [];
    const date = new Date(`${day.date}T00:00:00Z`);
    return [{ label: new Intl.DateTimeFormat('ru', { month: 'short', timeZone: 'UTC' }).format(date).replace('.', ''), column: Math.floor((index + offset) / 7) + 1 }];
  });

  const total = days.reduce((sum, day) => sum + day.count, 0);
  return <div className="calendar" role="group" aria-label={`Календарь GitHub: ${total} вкладов за последние ${days.length} дней`}>
    <div className="calendar-scroll-hint" aria-hidden="true">ПРОКРУТИТЕ →</div>
    <div className="calendar-scroll" tabIndex={0} role="region" aria-label="Прокрутка календаря вкладов"><div className="calendar-content" style={{ '--weeks': columns } as React.CSSProperties} aria-hidden="true">
      <div className="calendar-months">{months.map((month, index) => <span key={`${month.label}-${index}`} style={{ gridColumn: month.column }}>{month.label}</span>)}</div>
      <div className="calendar-weekdays" aria-hidden="true"><span>Пн</span><span>Ср</span><span>Пт</span></div>
      <div className="contribution-grid">
        {Array.from({ length: offset }, (_, index) => <span className="calendar-empty" key={`empty-${index}`} />)}
        {days.map((day) => <span key={day.date} className={`contribution-day level-${day.level}`} title={`${day.date}: ${day.count} вкладов`} />)}
      </div>
    </div></div>
    <div className="calendar-legend"><span>МЕНЬШЕ</span>{[0, 1, 2, 3, 4].map((level) => <i key={level} className={`level-${level}`} />)}<span>БОЛЬШЕ</span></div>
  </div>;
}

export function GithubStats({ username }: GithubStatsProps) {
  const [data, setData] = useState<GithubSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getGithubSummary(username)
      .then((summary) => {
        if (!controller.signal.aborted) setData(summary);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'GITHUB OFFLINE');
      });
    return () => controller.abort();
  }, [username]);

  if (error) {
    return (
      <section className="github-panel panel" aria-labelledby="github-title">
        <div className="panel-kicker">GITHUB</div>
        <h2 id="github-title"><a className="github-profile-link" href={`https://github.com/${username}`} target="_blank" rel="noreferrer noopener">@{username}</a></h2>
        <ContributionCalendar username={username} />
        <p className="calendar-message">Языки временно недоступны: {error}</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="github-panel panel is-loading" aria-label="Загрузка GitHub статистики">
        <div className="panel-kicker">GITHUB</div>
        <div className="loading-line" /><div className="loading-line short" />
      </section>
    );
  }

  return (
    <section className="github-panel panel" aria-labelledby="github-title">
      <div className="github-heading">
        <div>
          <div className="panel-kicker">GITHUB</div>
          <h2 id="github-title"><a className="github-profile-link" href={data.user.html_url} target="_blank" rel="noreferrer noopener">@{data.user.login}</a></h2>
        </div>
      </div>
      <ContributionCalendar username={username} />
      <div className="languages">
        <div className="languages-heading"><span>ЯЗЫКИ</span>{data.stale && <span>СОХРАНЁННЫЕ ДАННЫЕ</span>}</div>
        {data.languages.length ? <>
          <div className="language-strip" aria-hidden="true">{data.languages.map((language) => <span key={language.name} style={{ width: `${language.percent}%` }} />)}</div>
          <div className="language-legend">{data.languages.map((language) => <span key={language.name}>{language.name} <strong>{language.percent < 0.1 ? '<0.1' : language.percent.toFixed(1)}%</strong></span>)}</div>
        </> : <p className="languages-note">Данные о языках недоступны</p>}
      </div>
    </section>
  );
}
