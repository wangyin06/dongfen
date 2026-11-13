import { useEffect, useState } from 'react';
import type { PageId, OpenLogOptions, WorkoutRecord } from './types';
import { AppProvider, useApp } from './state/AppContext';
import { AppShell } from './components/AppShell';
import { LogSheet } from './components/LogSheet';
import { ToastHost } from './components/Toast';
import { TodayPage } from './pages/TodayPage';
import { RecordsPage } from './pages/RecordsPage';
import { StatsPage } from './pages/StatsPage';
import { LibraryPage } from './pages/LibraryPage';
import { SettingsPage } from './pages/SettingsPage';

const PAGES: PageId[] = ['today', 'records', 'stats', 'library', 'settings'];

function pageFromHash(): PageId {
  const value = window.location.hash.replace(/^#\/?/, '');
  return PAGES.includes(value as PageId) ? (value as PageId) : 'today';
}

function LoadingScreen() {
  return (
    <div className="boot-screen">
      <div className="boot-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <p className="eyebrow">MOVE / SCORE</p>
      <h1>动分</h1>
      <p>正在整理今天的训练…</p>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="boot-screen">
      <div className="boot-error-icon">!</div>
      <h1>数据没有打开</h1>
      <p>{message}</p>
      <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
        重新加载
      </button>
    </div>
  );
}

function AppContent() {
  const { loading, error } = useApp();
  const [page, setPage] = useState<PageId>(pageFromHash);
  const [logOpen, setLogOpen] = useState(false);
  const [logOptions, setLogOptions] = useState<OpenLogOptions>({});

  useEffect(() => {
    const onHashChange = () => setPage(pageFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (next: PageId) => {
    if (next === page) return;
    // 底部 Tab 是同一层的页面切换，不进入浏览器/WebView 历史。
    // 否则 Android 返回手势会把“返回上一个 Tab”误当成“返回上一页”。
    window.history.replaceState(null, '', `#/${next}`);
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openLog = (options?: OpenLogOptions) => {
    setLogOptions(options ?? {});
    setLogOpen(true);
  };

  const editRecord = (record: WorkoutRecord) => {
    openLog({ record });
  };

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} />;

  return (
    <>
      <AppShell page={page} onNavigate={navigate} onOpenLog={() => openLog()}>
        {page === 'today' ? (
          <TodayPage
            onOpenLog={openLog}
            onEditRecord={editRecord}
            onNavigate={(target) => navigate(target)}
          />
        ) : null}
        {page === 'records' ? <RecordsPage onOpenLog={openLog} onEditRecord={editRecord} /> : null}
        {page === 'stats' ? <StatsPage onOpenLog={openLog} /> : null}
        {page === 'library' ? <LibraryPage onOpenLog={openLog} /> : null}
        {page === 'settings' ? <SettingsPage /> : null}
      </AppShell>

      <LogSheet
        open={logOpen}
        onClose={() => setLogOpen(false)}
        editRecord={logOptions.record ?? null}
        initialExercise={logOptions.exercise ?? null}
        initialDate={logOptions.date}
      />
      <ToastHost />
    </>
  );
}

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
