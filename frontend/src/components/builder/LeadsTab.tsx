"use client";

import { useState } from "react";
import { User, Mail, Phone, Clock, Search, RefreshCcw } from "lucide-react";
import { useGetLeadsQuery } from "@/redux/slices/crm/crmApi";

export function LeadsTab({ batchId }: { batchId: string }) {
    const [search, setSearch] = useState("");

    const { data, isLoading, isFetching, refetch } = useGetLeadsQuery(
        { batchId: Number(batchId), limit: 100 },
        { skip: !batchId }
    );

    const leads = data?.data ?? [];

    const filteredLeads = leads.filter((l) => {
        const q = search.toLowerCase();
        return l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q);
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-[14px] font-bold text-gray-900 tracking-tight">Student Enquiries</h2>
                    <p className="text-[11px] text-gray-500 font-medium">
                        Real-time leads from this batch.
                        {data?.pagination && ` ${data.pagination.total} total`}
                    </p>
                </div>
                <button
                    onClick={refetch}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
                >
                    <RefreshCcw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
                </button>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search leads..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[13px] outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                />
            </div>

            <div className="space-y-3">
                {isLoading ? (
                    [1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-gray-50 animate-pulse rounded-2xl border border-gray-100" />
                    ))
                ) : filteredLeads.length === 0 ? (
                    <div className="py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <User className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                        <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">No leads yet</p>
                    </div>
                ) : (
                    filteredLeads.map((lead) => (
                        <div
                            key={lead.id}
                            className="p-4 bg-white border border-gray-100 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all group"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-[11px]">
                                        {lead.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-[13px] font-bold text-gray-900 leading-tight">{lead.name}</h3>
                                        <p className="text-[10px] text-gray-400 font-medium capitalize flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(lead.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                                    lead.status === "NEW" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                                }`}>
                                    {lead.status}
                                </div>
                            </div>

                            <div className="space-y-1.5 pt-2 border-t border-gray-50">
                                <div className="flex items-center gap-2 text-[11px] text-gray-600 font-medium">
                                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                                    {lead.email}
                                </div>
                                {lead.phone && (
                                    <div className="flex items-center gap-2 text-[11px] text-gray-600 font-medium">
                                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                                        {lead.phone}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <p className="text-[10px] text-gray-400 italic text-center px-4">
                Leads are captured whenever a student clicks &apos;Enroll&apos; and fills the enquiry form.
            </p>
        </div>
    );
}
