import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <h1 className="text-3xl font-bold text-slate-900">Router Setup Successfully</h1>
      </div>
    ),
  },
  {
    path: "*",
    element: (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <h1 className="text-3xl font-bold text-red-600">404 Not Found</h1>
      </div>
    ),
  },
]);
