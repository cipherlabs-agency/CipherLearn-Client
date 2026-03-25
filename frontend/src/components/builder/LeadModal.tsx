"use client";

import { useState } from "react";
import { X, CheckCircle2, Loader2, Send, GraduationCap } from "lucide-react";
import { useBuilderStore } from "./store";
import { toast } from "sonner";

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchId?: string;
}

export function LeadModal({ isOpen, onClose, batchId }: LeadModalProps) {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { theme } = useBuilderStore();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`${apiUrl}/dashboard/crm/public/leads`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          batchId: Number(batchId)
        })
      });

      const json = await response.json();

      if (json.success) {
        setIsSuccess(true);
        toast.success("Enquiry Sent!", {
          description: "Our team will contact you shortly.",
        });
        setFormData({ name: "", email: "", phone: "" });
      } else {
        toast.error("Submission Failed", {
          description: json.message || "Something went wrong."
        });
      }
    } catch (error) {
      toast.error("Connection Error", {
        description: "Could not reach the server."
      });
    } finally {
      setIsSubmitting(false);
    }

    if (isSuccess) {
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
      }, 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
        style={{ fontFamily: theme.fontFamily }}
      >
        {/* Header */}
        <div className="relative h-32 bg-gray-50 flex items-center justify-center border-b border-gray-100">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200/50 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3"
            style={{ backgroundColor: theme.primaryColor }}
          >
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {isSuccess ? (
            <div className="py-8 text-center animate-in zoom-in-90 duration-500">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Enrollment Initiated</h2>
              <p className="text-gray-500 leading-relaxed">
                Thank you for your interest. We've received your details and will get back to you within 24 hours.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Reserve Your Seat</h2>
                <p className="text-gray-500 text-[15px]">Fill in your details and our academic counselors will reach out to you.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">Full Name</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">Email Address</label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">Phone Number</label>
                  <input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="pt-4">
                  <button
                    disabled={isSubmitting}
                    type="submit"
                    className="w-full h-14 rounded-xl text-white font-bold text-[16px] flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 disabled:opacity-70 disabled:scale-100"
                    style={{ 
                      backgroundColor: theme.primaryColor,
                      boxShadow: `0 10px 25px -5px ${theme.primaryColor}40`
                    }}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>Submit Enquiry</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <p className="text-center text-[12px] text-gray-400 mt-4 italic font-medium">
                    * No payment required now. This is a preliminary enquiry.
                  </p>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


