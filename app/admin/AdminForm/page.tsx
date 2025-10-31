'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from 'next/navigation';

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
    <form
      onSubmit={handleSubmit}
      className="space-y-4 max-w-md mx-auto mt-10 p-4 border rounded"
    >
      <input
        type="text"
        placeholder="Event Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        className="input input-bordered w-full"
      />
      <textarea
        placeholder="Event Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="textarea textarea-bordered w-full"
      />
      <input
        type="datetime-local"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
        className="input input-bordered w-full"
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setBannerFile(e.target.files ? e.target.files[0] : null)}
        className="file-input file-input-bordered w-full"
      />
      <Button type="submit" disabled={loading} className="w-full">
        {loading
          ? eventId
            ? "Updating..."
            : "Creating..."
          : eventId
          ? "Update Event"
          : "Create Event"}
      </Button>
    </form>
  );
}
