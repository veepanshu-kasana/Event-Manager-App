import { SignUpForm } from "@/components/sign-up-form";
import { Calendar } from "lucide-react";

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Section - Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-12 items-center justify-center relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="relative z-10 max-w-md text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Calendar className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-black">VK EVENTS</h1>
          </div>
          
          <h2 className="text-3xl font-bold mb-4">Join Us Today!</h2>
          <p className="text-xl text-emerald-100 leading-relaxed mb-8">
            Create your account and start exploring amazing events. Connect with others and never miss an exciting opportunity.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-lg">✓</span>
              </div>
              <span className="text-emerald-100">Free account creation</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-lg">✓</span>
              </div>
              <span className="text-emerald-100">Instant access to all events</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-lg">✓</span>
              </div>
              <span className="text-emerald-100">Personalized experience</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Sign Up Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 bg-gradient-to-br from-slate-50 to-emerald-50 dark:from-gray-950 dark:to-slate-900">
        <div className="w-full max-w-md">
          {/* Mobile Branding */}
          <div className="lg:hidden mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                VK EVENTS
              </h1>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Create your account to get started
            </p>
          </div>
          
          <SignUpForm />
        </div>
      </div>
    </div>
  );
}
