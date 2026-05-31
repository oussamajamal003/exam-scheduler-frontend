import { AppRoutes } from '@/routes/AppRoutes';
import { QueryProvider } from '@/providers/QueryProvider';
import { ToastProvider } from '@/components/ui/toast';
import { PageTranslationProvider } from '@/components/shared/PageTranslationProvider';

function App() {
  return (
    <QueryProvider>
      <ToastProvider>
        <PageTranslationProvider>
          <div className="font-sans antialiased text-slate-900">
            <AppRoutes />
          </div>
        </PageTranslationProvider>
      </ToastProvider>
    </QueryProvider>
  );
}

export default App;
