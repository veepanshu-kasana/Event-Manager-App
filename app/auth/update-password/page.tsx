import { UpdatePasswordForm } from "@/components/update-password-form";
import { Calendar } from "lucide-react";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 md:p-10 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-slate-900">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              VK EVENTS
            </h1>
          </div>
        </div>
        
        <UpdatePasswordForm />
      </div>
    </div>
  );
}
