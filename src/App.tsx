import { AppRoutes } from '@/routes/AppRoutes';
import { QueryProvider } from '@/providers/QueryProvider';

function App() {
  return (
    <QueryProvider>
      <div className="font-sans antialiased text-slate-900">
        <AppRoutes /> 
      </div>
    </QueryProvider>
  );
}

export default App;
