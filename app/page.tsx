import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <main className="min-h-screen flex items-center justify-center bg-muted py-10">
      <Card className="w-full max-w-2xl mx-auto shadow-xl border">
        <CardHeader>
          <CardTitle className="text-4xl font-extrabold text-primary mb-2">
            Welcome to the Event App
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground mb-2">
            Browse upcoming and past events, register for events, or log in as an admin to manage your events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-8">
            <Link href="/events" passHref>
              <Button size="lg" className="w-44 text-lg font-semibold">
                Browse Events
              </Button>
            </Link>
            {!session ? (
              <Link href="/auth/login" passHref>
                <Button variant="outline" size="lg" className="w-44 text-lg font-semibold border-primary text-primary hover:bg-primary/10">
                  Admin Login
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground text-sm">Logged in as 
                  <strong>
                    {" "}
                    {session.user.email
                      ? session.user.email.split("@")[0].replace(/\d+$/, " ")
                      : "Unknown"}
                  </strong>
                </span>
                <LogoutButton />
              </div>
            )}
          </div>
          <div className="mt-6 text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Event App. Built with Next.js & Supabase.
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
