"use client";
import "../globals.css";
import "../prism.css";
import 'katex/dist/katex.min.css';
import { Toaster } from "react-hot-toast";

export default function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      <Toaster toastOptions={
        {
          success: {style: { background: "black", color: "white"}},
          error: {style: { background: "black", color: "white"}}
        }
      }/>
      {children}
    </div>
  );
}
