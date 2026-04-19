import { Outlet } from "react-router-dom";

export default function SupervisorLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-16 bg-white border-b flex items-center px-6 justify-between shadow-sm sticky top-0 z-10 w-full">
        <h3 className="font-semibold text-slate-800">Smart SIS - Supervisor Portal</h3>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">SV</div>
        </div>
      </header>
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}