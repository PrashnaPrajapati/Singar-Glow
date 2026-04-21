"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jwtDecode } from "jwt-decode";
import NotificationSystem from "./NotificationSystem";

export default function Navbar({ onMenuClick }) {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const fetchProfile = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setUserId(null);
      setUserRole(null);
      return;
    }
 
    try {
      const decoded = jwtDecode(token);
      setUserId(decoded.id);
      setUserRole(decoded.role);
    } catch (error) {
      console.error("Error decoding token:", error);
      setUserId(null);
      setUserRole(null);
    }

    fetch("http://localhost:5001/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.photoUrl && !data.photoUrl.startsWith("http")) {
          data.photoUrl = `http://localhost:5001${data.photoUrl}`;
        }
        setUser(data);
      })
      .catch(() => {
        setUser(null);
        setUserId(null);
        setUserRole(null);
      });
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    const handleProfileUpdate = () => fetchProfile();
    window.addEventListener("profileUpdated", handleProfileUpdate);

    return () =>
      window.removeEventListener("profileUpdated", handleProfileUpdate);
  }, []);

  const handleLogout = () => {
    setShowProfileMenu(false);

    toast(
      ({ closeToast }) => (
        <div className="flex flex-col gap-3">
          <p>Are you sure you want to logout?</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                localStorage.removeItem("token");
                router.push("/login");
                closeToast();
              }}
              className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600"
            >
              Yes, Logout
            </button>
            <button
              onClick={closeToast}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      {
        position: "top-center",
        autoClose: false,
        closeButton: false,
      }
    );
  };

}