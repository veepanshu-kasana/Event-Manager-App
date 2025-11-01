'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, ArrowLeft, Upload, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminForm() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const eventId = searchParams.get('id'); // If present, we're updating instead of creating.
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Prefill for edit:
  useEffect(() => {
    if (!eventId) return;
    async function getEvent() {
      const { data } = await supabase.from("events").select("*").eq("id", eventId).single();
      if (data) {
        setTitle(data.title || "");
        setDescription(data.description || "");
        setDate(new Date(data.date).toISOString().slice(0, 16));
      }
    }
    getEvent();
  }, [eventId, supabase]);

  const uploadBanner = async () => {
    if (!bannerFile) return "";
    const fileExt = bannerFile.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `banners/${fileName}`;

    const { error } = await supabase.storage
      .from("event-banners")
      .upload(filePath, bannerFile, { upsert: true });

    if (error) {
      alert("Error uploading banner: " + error.message);
      return "";
    }
    const urlData = supabase.storage.from("event-banners").getPublicUrl(filePath);
    return urlData.data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !date) {
      alert("Please fill required fields");
      return;
    }

    setLoading(true);

    let uploadedBannerUrl = "";
    if (bannerFile) {
      uploadedBannerUrl = await uploadBanner();
      if (!uploadedBannerUrl) {
        setLoading(false);
        return;
      }
    }

    const { data: { user } } = await supabase.auth.getUser();

    // const { data: userProfile } = await supabase
    //   .from('users')
    //   .select('role')
    //   .eq('id', user.id)
    //   .single();
    
    // if (userProfile.role !== 'admin') {
    //   // Hide admin controls or return early
    // }

    if (eventId) {
      // UPDATE MODE
      const { error } = await supabase.from("events")
        .update({
          title,
          description,
          date,
          ...(uploadedBannerUrl && { banner_url: uploadedBannerUrl }),
        })
        .eq("id", eventId);

      setLoading(false);
      if (error) {
        alert("Error updating event: " + error.message);
      } else {
        alert("Event updated successfully!");
        router.push("/admin");
      }
    } else {
      // CREATE MODE (already implemented)
      const { error } = await supabase.from("events")
        .insert({
          title,
          description,
          date,
          banner_url: uploadedBannerUrl,
          created_by: user?.id,
        });

      setLoading(false);
      if (error) {
        alert("Error creating event: " + error.message);
      } else {
        alert("Event created successfully!");
        setTitle("");
        setDescription("");
        setDate("");
        setBannerFile(null);
        router.push("/admin");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        {/* Back Button */}
        <Link href="/admin">
          <Button variant="outline" className="mb-6 group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="max-w-2xl mx-auto">
          <Card className="border-2 shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl sm:text-3xl bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                    {eventId ? 'Edit Event' : 'Create New Event'}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {eventId ? 'Update event details below' : 'Fill in the details to create an event'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title Field */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-semibold">
                    Event Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="e.g., Tech Conference 2025"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="h-11 border-2"
                  />
                </div>

                {/* Description Field */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold">
                    Event Description
                  </Label>
                  <textarea
                    id="description"
                    placeholder="Describe your event..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 dark:bg-slate-950 dark:border-slate-800"
                  />
                </div>

                {/* Date Field */}
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-semibold">
                    Event Date & Time <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="h-11 border-2"
                  />
                </div>

                {/* Banner Upload */}
                <div className="space-y-2">
                  <Label htmlFor="banner" className="text-sm font-semibold">
                    Event Banner Image
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="banner"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setBannerFile(e.target.files ? e.target.files[0] : null)}
                      className="h-11 border-2 cursor-pointer"
                    />
                    {bannerFile && (
                      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                        <Upload className="w-4 h-4" />
                        <span className="truncate max-w-[150px]">{bannerFile.name}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {eventId ? 'Leave empty to keep current banner' : 'Recommended: 1200x630px'}
                  </p>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full h-12 text-base font-bold bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {eventId ? "Updating Event..." : "Creating Event..."}
                    </>
                  ) : (
                    <>
                      <Calendar className="w-5 h-5 mr-2" />
                      {eventId ? "Update Event" : "Create Event"}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
