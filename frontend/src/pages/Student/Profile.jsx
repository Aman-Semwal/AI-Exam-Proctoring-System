import { useEffect, useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import { FaCamera } from "react-icons/fa";

import api from "../../services/api";

const Profile = () => {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    role: "",
    phone: "",
    university: "",
    course: "",
    semester: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/users/me");
        const data = response.data?.data || {};

        setProfile((prev) => ({
          ...prev,
          name: data.name || "",
          email: data.email || "",
          role: data.role || "",
          phone: data.phone || "",
          university: data.university || "",
          course: data.course || "",
          semester: data.semester || "",
        }));
      } catch (err) {
        console.error("Failed to fetch profile:", err);

        setError(
          err.response?.data?.message ||
            "Unable to load your profile."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      const response = await api.put("/users/me", {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        university: profile.university,
        course: profile.course,
        semester: profile.semester,
      });

      const updatedData = response.data?.data;

      if (updatedData) {
        setProfile((prev) => ({
          ...prev,
          ...updatedData,
        }));

        localStorage.setItem(
          "user",
          JSON.stringify({
            ...JSON.parse(localStorage.getItem("user") || "{}"),
            ...updatedData,
          })
        );
      }

      setMessage("Profile updated successfully.");
    } catch (err) {
      console.error("Failed to update profile:", err);

      setError(
        err.response?.data?.message ||
          "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const initials = profile.name
    ? profile.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <div className="flex bg-[#090a0f] min-h-screen text-slate-100">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />

        <main className="p-6 lg:p-8 flex-1 overflow-y-auto max-w-4xl mx-auto w-full">
          <div className="pb-4 mb-6 border-b border-white/[0.06]">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              My Profile
            </h2>

            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Manage your personal information and student account credentials.
            </p>
          </div>

          {loading ? (
            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-10 text-center">
              <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />

              <p className="text-sm text-slate-400">
                Loading profile...
              </p>
            </div>
          ) : (
            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-6 sm:p-8 shadow-sm">
              {/* Avatar Section */}
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-white/[0.06]">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-2xl font-bold text-blue-400 shadow-md">
                    {initials}
                  </div>

                  <button
                    type="button"
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition shadow"
                  >
                    <FaCamera size={12} />
                  </button>
                </div>

                <div className="text-center sm:text-left">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {profile.name || "Student"}
                  </h3>

                  <p className="text-xs text-slate-400 mt-0.5">
                    {profile.email || "No email available"}
                  </p>

                  <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {profile.role || "STUDENT"}
                  </span>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mt-5 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
                  <p className="text-xs text-red-300">
                    {error}
                  </p>
                </div>
              )}

              {/* Success */}
              {message && (
                <div className="mt-5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                  <p className="text-xs text-emerald-300">
                    {message}
                  </p>
                </div>
              )}

              {/* Input Form Fields */}
              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">
                    Full Name
                  </label>

                  <input
                    name="name"
                    value={profile.name}
                    onChange={handleChange}
                    className="w-full bg-[#090a0f] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-xs text-white focus:border-blue-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">
                    Email
                  </label>

                  <input
                    name="email"
                    type="email"
                    value={profile.email}
                    onChange={handleChange}
                    className="w-full bg-[#090a0f] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-xs text-white focus:border-blue-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">
                    Phone
                  </label>

                  <input
                    name="phone"
                    value={profile.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    className="w-full bg-[#090a0f] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-xs text-white focus:border-blue-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">
                    University
                  </label>

                  <input
                    name="university"
                    value={profile.university}
                    onChange={handleChange}
                    placeholder="Enter university"
                    className="w-full bg-[#090a0f] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-xs text-white focus:border-blue-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">
                    Course
                  </label>

                  <input
                    name="course"
                    value={profile.course}
                    onChange={handleChange}
                    placeholder="Enter course"
                    className="w-full bg-[#090a0f] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-xs text-white focus:border-blue-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">
                    Semester
                  </label>

                  <input
                    name="semester"
                    value={profile.semester}
                    onChange={handleChange}
                    placeholder="Enter semester"
                    className="w-full bg-[#090a0f] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-xs text-white focus:border-blue-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Save */}
              <div className="mt-8 pt-6 border-t border-white/[0.06] flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2.5 rounded-lg text-white text-xs font-semibold transition active:scale-[0.98] shadow-sm"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Profile;