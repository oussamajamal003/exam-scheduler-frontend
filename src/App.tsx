import { AppRoutes } from '@/routes/AppRoutes';
import { QueryProvider } from '@/providers/QueryProvider';
import { ToastProvider } from '@/components/ui/toast';

function App() {
  return (
    <QueryProvider>
      <ToastProvider>
        <div className="font-sans antialiased text-slate-900">
          <AppRoutes />
        </div>
      </ToastProvider>
    </QueryProvider>
  );
}

export default App;
