"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function AdminPage() {
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const uploadBanner = async () => {
    if (!bannerFile) return "";
    const fileExt = bannerFile.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `banners/${fileName}`;

    const { data, error } = await supabase.storage
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

    const { error } = await supabase.from("events").insert({
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
        {loading ? "Creating..." : "Create Event"}
      </Button>
    </form>
  );
}
