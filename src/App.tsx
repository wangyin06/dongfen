import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  const scrollPositions = useRef<Record<PageId, number>>({
    today: 0,
    records: 0,
    stats: 0,
    library: 0,
    settings: 0,
  });
  const pendingScroll = useRef<number | null>(null);

  useEffect(() => {
    const onHashChange = () => {
      const next = pageFromHash();
      if (next === page) return;
      scrollPositions.current[page] = window.scrollY;
      pendingScroll.current = scrollPositions.current[next] ?? 0;
      setPage(next);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [page]);

  useLayoutEffect(() => {
    if (pendingScroll.current === null) return;
    const top = pendingScroll.current;
    pendingScroll.current = null;
    window.scrollTo(0, top);
  }, [page]);

  const navigate = (next: PageId) => {
    if (next === page) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    scrollPositions.current[page] = window.scrollY;
    pendingScroll.current = scrollPositions.current[next] ?? 0;
    // 底部 Tab 是同一层的页面切换，不进入浏览器/WebView 历史。
    // 否则 Android 返回手势会把“返回上一个 Tab”误当成“返回上一页”。
    window.history.replaceState(null, '', `#/${next}`);
    setPage(next);
  };

  const openLog = (options?: OpenLogOptions) => {
    setLogOptions(options ?? {});
    setLogOpen(true);
  };

  const editRecord = (record: WorkoutRecord) => {
    openLog({ record });
  };

  const pageContent = (id: PageId) => {
    switch (id) {
      case 'today':
        return (
          <TodayPage
            onOpenLog={openLog}
            onEditRecord={editRecord}
            onNavigate={(target) => navigate(target)}
          />
        );
      case 'records':
        return <RecordsPage onOpenLog={openLog} onEditRecord={editRecord} />;
      case 'stats':
        return <StatsPage onOpenLog={openLog} />;
      case 'library':
        return <LibraryPage onOpenLog={openLog} />;
      case 'settings':
        return <SettingsPage />;
    }
  };

  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen message={error} />;

  return (
    <>
      <AppShell page={page} onNavigate={navigate} onOpenLog={() => openLog()}>
        {PAGES.map((id) => (
          <div key={id} className="page-slot" hidden={page !== id}>
            {pageContent(id)}
          </div>
        ))}
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
