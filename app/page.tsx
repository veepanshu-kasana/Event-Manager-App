import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Sparkles, Users, ArrowRight } from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Left Section - Content */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-950 dark:via-slate-900 dark:to-indigo-950 p-6 sm:p-8 lg:p-12 xl:p-16">
        <div className="w-full max-w-2xl space-y-8 animate-in fade-in slide-in-from-left duration-700">
          
          {/* Header with Badge */}
          <div className="space-y-4">
            <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 border-0">
              <Sparkles className="w-4 h-4 mr-1.5 inline" />
              Event Management Platform
            </Badge>
            
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                VK EVENTS
              </h1>
            </div>
            
            <p className="text-xl sm:text-2xl text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
              Your premier destination for discovering and managing unforgettable events
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="border-2 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300 hover:shadow-lg">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mb-2">
                  <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <CardTitle className="text-lg">Seamless Experience</CardTitle>
                <CardDescription>
                  Browse and register for events with just a few clicks
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="border-2 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:shadow-lg">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-2">
                  <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-lg">Admin Control</CardTitle>
                <CardDescription>
                  Powerful tools to manage and organize your events
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/events" className="flex-1">
                <Button 
                  size="lg" 
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40 transition-all duration-300 group"
                >
                  Browse Events
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              {!authUser && (
                <Link href="/auth/login" className="flex-1">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full h-14 text-lg font-bold border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Login
                  </Button>
                </Link>
              )}
            </div>

            {!authUser && (
              <div className="text-center">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Don&apos;t have an account?{" "}
                  <Link 
                    href="/auth/sign-up" 
                    className="font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 underline underline-offset-4 decoration-2 hover:decoration-indigo-600 transition-colors"
                  >
                    Sign up for free
                  </Link>
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-8 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-500">
              &copy; {new Date().getFullYear()} VK Events. Built with Next.js & Supabase.
            </p>
          </div>
        </div>
      </div>

      {/* Right Section - Image */}
      <div className="flex-1 relative min-h-[400px] lg:min-h-screen order-first lg:order-last">
        <div className="absolute inset-0 bg-gradient-to-bl from-indigo-600 via-purple-600 to-blue-700">
          <Image
            src="/homepage.png"
            alt="VK Events Platform - Modern Event Management"
            fill
            className="object-cover mix-blend-overlay opacity-90"
            priority
            quality={100}
          />
        </div>
        {/* Overlay gradient for better text visibility if needed */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </div>
    </main>
  );
}
