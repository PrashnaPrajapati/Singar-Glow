"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminDashboardUI from "../../../components/AdminDashboardUI"; 

export default function AdminDashboard() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      router.replace("/login"); 
      return;
    }

    if (role !== "admin") {
      router.replace("/dashboard"); 
      return;
    }
  }, [router]);

  return (
    <div>
      <AdminDashboardUI />  
    </div>
  );
}
