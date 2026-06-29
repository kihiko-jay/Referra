/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { MetricChart } from "./MetricChart";
import {
  Briefcase,
  Users2,
  TrendingUp,
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  ArrowUpRight,
  TrendingDown,
  Info,
  DollarSign
} from "lucide-react";

export const BusinessOwnerPortal: React.FC = () => {
  const {
    activeBusiness,
    campaigns,
    agents,
    referralLinks,
    leads,
    conversions,
    wallets,
    transactions,
    addNewCampaign,
    convertLead,
    approveConversion,
    rejectConversion,
    fundBusinessWallet
  } = useApp();

  // Selected sub-tab within Business Owner Portal
  const [activeTab, setActiveTab] = useState<"overview" | "campaigns" | "leads" | "wallet">("overview");

  // New campaign form state
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const [newCampTitle, setNewCampTitle] = useState("");
  const [newCampDesc, setNewCampDesc] = useState("");
  const [newCampRewardType, setNewCampRewardType] = useState<"PERCENTAGE" | "FIXED">("FIXED");
  const [newCampRewardValue, setNewCampRewardValue] = useState<number>(2000);
  const [newCampProductPrice, setNewCampProductPrice] = useState<number>(10000);
  const [newCampTerms, setNewCampTerms] = useState("");
  const [newCampExpiry, setNewCampExpiry] = useState("");

  // Funding state
  const [fundAmount, setFundAmount] = useState<number>(25000);
  const [fundingRef, setFundingRef] = useState("");
  const [showFundModal, setShowFundModal] = useState(false);

  if (!activeBusiness) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <Briefcase className="h-12 w-12 text-zinc-300 mb-4 animate-pulse" />
        <h3 className="text-lg font-semibold text-zinc-800">No Business Workspace Loaded</h3>
        <p className="text-zinc-500 max-w-sm mt-1">Please select a Business Owner persona from the top bar utility.</p>
      </div>
    );
  }

  // Filter entities according to active business
  const bizCampaigns = campaigns.filter(c => c.businessId === activeBusiness.id);
  const campaignIds = bizCampaigns.map(c => c.id);
  
  // Find referral links associated with client business
  const bizLinks = referralLinks.filter(l => campaignIds.includes(l.campaignId));
  const linkIds = bizLinks.map(l => l.id);

  // Filter clicks, leads, conversions
  const bizLeads = leads.filter(l => linkIds.includes(l.referralLinkId));
  const bizConversions = conversions.filter(c => linkIds.includes(c.referralLinkId));

  // Wallets
  const bizWallet = wallets.find(w => w.holderId === activeBusiness.id && w.holderType === "BUSINESS");
  const bizTransactions = transactions.filter(t => t.walletId === bizWallet?.id);

  // Key Analytics Calculations
  const totalSpend = bizConversions
    .filter(c => c.status === "PAID" || c.status === "APPROVED")
    .reduce((sum, c) => sum + c.commissionEarned, 0);

  const pendingSpend = bizConversions
    .filter(c => c.status === "PENDING_APPROVAL")
    .reduce((sum, c) => sum + c.commissionEarned, 0);

  const totalReferredRevenue = bizConversions
    .filter(c => c.status === "PAID" || c.status === "APPROVED")
    .reduce((sum, c) => sum + c.amount, 0);

  const roiRatio = totalSpend > 0 ? (totalReferredRevenue / totalSpend).toFixed(1) : "0.0";

  // Create Campaign logic
  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampTitle || !newCampDesc) return;

    addNewCampaign({
      businessId: activeBusiness.id,
      businessName: activeBusiness.name,
      title: newCampTitle,
      description: newCampDesc,
      rewardType: newCampRewardType,
      rewardValue: Number(newCampRewardValue),
      productPrice: Number(newCampProductPrice),
      terms: newCampTerms || "Commission credited on verified completion and checkouts.",
      status: "ACTIVE",
      expiryDate: newCampExpiry || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Reset Form
    setNewCampTitle("");
    setNewCampDesc("");
    setNewCampRewardType("FIXED");
    setNewCampRewardValue(2000);
    setNewCampProductPrice(10000);
    setNewCampTerms("");
    setNewCampExpiry("");
    setShowAddCampaign(false);
    setActiveTab("campaigns");
  };

  const handleFundWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundAmount || fundAmount <= 0) return;
    const ref = fundingRef || `MP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    fundBusinessWallet(activeBusiness.id, fundAmount, ref);
    setShowFundModal(false);
    setFundingRef("");
  };

  // Pre-generate SVG chart points for conversions & clicks
  const clickTimelineData = [
    { date: "May 30", value: 45 },
    { date: "Jun 01", value: 38 },
    { date: "Jun 03", value: 55 },
    { date: "Jun 05", value: 68 },
    { date: "Jun 07", value: 85 },
    { date: "Today", value: bizCampaigns.reduce((s, c) => s + c.clicksCount, 0) % 100 }
  ];

  const leadTimelineData = [
    { date: "May 30", value: 5 },
    { date: "Jun 01", value: 3 },
    { date: "Jun 03", value: 7 },
    { date: "Jun 05", value: 9 },
    { date: "Jun 07", value: 12 },
    { date: "Today", value: bizLeads.length }
  ];

  return (
    <div id="business-owner-portal" className="space-y-6">
      {/* Upper Brand Info Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border border-zinc-700/50 rounded-2xl p-6 text-white relative overflow-hidden shadow-md">
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-12 -translate-y-12">
          <Briefcase className="h-48 w-48 text-emerald-400" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between relative z-10 gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider bg-emerald-600 text-white px-2.5 py-1 rounded-full border border-emerald-500">
                Business Console
              </span>
              <span className="text-zinc-400 text-sm">Workspace ID: {activeBusiness.id}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-2.5">{activeBusiness.name}</h1>
            <p className="text-zinc-300 text-xs sm:text-sm mt-1 focus:outline-none">
              Industry: <span className="text-emerald-400 font-semibold">{activeBusiness.industry}</span> | Located: {activeBusiness.location}
            </p>
          </div>

          <div className="bg-zinc-800/80 backdrop-blur-md border border-zinc-700/60 p-4 rounded-xl flex items-center justify-between min-w-[240px]">
            <div>
              <span className="text-xs text-zinc-400 font-medium">Business Billing Balance</span>
              <p className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
                KES {(bizWallet?.availableBalance || 0).toLocaleString()}
              </p>
              {bizWallet && bizWallet.availableBalance < 5000 && (
                <span className="text-[10px] text-amber-400 font-medium flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3" /> Low Balance (Alert)
                </span>
              )}
            </div>
            <button
              id="fund-wallet-trigger"
              onClick={() => setShowFundModal(true)}
              className="ml-4 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium font-sans flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 active:scale-95 transition-all"
            >
              <Plus className="h-3.5 w-3.5" /> Deposit
            </button>
          </div>
        </div>
      </div>

      {/* Sub Tabs Toggle Navigation */}
      <div className="flex border-b border-zinc-200 gap-6">
        <button
          id="btn-subtab-overview"
          onClick={() => setActiveTab("overview")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "overview"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          Overview & ROI
        </button>
        <button
          id="btn-subtab-campaigns"
          onClick={() => {
            setActiveTab("campaigns");
            setShowAddCampaign(false);
          }}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "campaigns"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          My Campaigns ({bizCampaigns.length})
        </button>
        <button
          id="btn-subtab-leads"
          onClick={() => setActiveTab("leads")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === "leads"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          Lead Queue & Approvals
          {bizLeads.filter(l => l.status === "PENDING").length > 0 && (
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {bizLeads.filter(l => l.status === "PENDING").length}
            </span>
          )}
          {bizConversions.filter(c => c.status === "PENDING_APPROVAL").length > 0 && (
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {bizConversions.filter(c => c.status === "PENDING_APPROVAL").length} PAY
            </span>
          )}
        </button>
        <button
          id="btn-subtab-wallet"
          onClick={() => setActiveTab("wallet")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "wallet"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          Audit Ledger
        </button>
      </div>

      {/* OVERVIEW TAB CONTENT */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Key Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-zinc-100 flex items-center space-x-4">
              <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Referred Revenue</span>
                <p className="text-2xl font-bold font-mono text-zinc-900 mt-0.5">KES {totalReferredRevenue.toLocaleString()}</p>
                <span className="text-[10px] text-zinc-500">From paid referred sales</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-100 flex items-center space-x-4">
              <div className="bg-indigo-50 text-indigo-700 p-3 rounded-xl">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Commissions Paid</span>
                <p className="text-2xl font-bold font-mono text-zinc-900 mt-0.5">KES {totalSpend.toLocaleString()}</p>
                <span className="text-[10px] text-zinc-500">Spent on affiliate payouts</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-100 flex items-center space-x-4">
              <div className="bg-amber-50 text-amber-700 p-3 rounded-xl">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Unpaid Pipeline</span>
                <p className="text-2xl font-bold font-mono text-zinc-900 mt-0.5">KES {pendingSpend.toLocaleString()}</p>
                <span className="text-[10px] text-amber-600 font-medium">Under review / Pushing</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-100 flex items-center space-x-4">
              <div className="bg-purple-50 text-purple-700 p-3 rounded-xl">
                <ArrowUpRight className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Growth Factor (ROI)</span>
                <p className="text-2xl font-bold font-mono text-zinc-900 mt-0.5">{roiRatio}x</p>
                <span className="text-[10px] text-zinc-500">Revenue to commission spend</span>
              </div>
            </div>
          </div>

          {/* Interactive Graph / Core Chart Visualizers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricChart label="Campaign Traffic (Ad Clicks)" data={clickTimelineData} color="bg-emerald-500" />
            <MetricChart label="Generated Lead Flow" data={leadTimelineData} color="bg-emerald-600" />
          </div>

          {/* Prompt Sandbox Help Alert */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 text-blue-900">
            <Info className="h-5 w-5 text-blue-600 shrink-0" />
            <div className="text-xs">
              <span className="font-semibold block">Interactive ReferraIOS Simulator Loop:</span>
              Want to see this change in real-time? Go to a <strong>Sales Agent</strong> persona, copy their unique tracking code, click <strong>"Simulate Landing Page Visit"</strong> at the bottom of the screens to register test traffic/leads, and then watch them immediately populate here in the verification tabs.
            </div>
          </div>
        </div>
      )}

      {/* CAMPAIGNS TAB CONTENT */}
      {activeTab === "campaigns" && (
        <div id="campaign-sub-view" className="space-y-6">
          <div className="flex justify-between items-center bg-zinc-50 p-4 rounded-xl border border-zinc-200/50">
            <div>
              <h2 className="text-base font-bold text-zinc-800">Available Campaigns & Reward Terms</h2>
              <p className="text-xs text-zinc-500">These incentives are promoted globally by our verified sales agent network.</p>
            </div>
            {!showAddCampaign && (
              <button
                id="create-campaign-trigger"
                onClick={() => setShowAddCampaign(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium font-sans flex items-center gap-1 shadow-sm active:scale-95 transition-all"
              >
                <Plus className="h-4 w-4" /> New Campaign
              </button>
            )}
          </div>

          {/* ADD CAMPAIGN FORM COLLAPSED */}
          {showAddCampaign && (
            <div id="add-campaign-f" className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wider border-b pb-2">Create New Referral Campaign</h3>
              <form onSubmit={handleCreateCampaign} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 uppercase mb-1">Campaign Title (Unique)</label>
                    <input
                      type="text"
                      required
                      value={newCampTitle}
                      onChange={(e) => setNewCampTitle(e.target.value)}
                      placeholder="e.g., Enterprise Sales Referral"
                      className="w-full text-xs border border-zinc-200 rounded-lg p-2.5 outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 uppercase mb-1 flex items-center justify-between">
                      <span>Reward Commission Type</span>
                      <span className="text-[10px] text-emerald-600 font-bold lowercase">Fixed standard or percentage reward</span>
                    </label>
                    <select
                      value={newCampRewardType}
                      onChange={(e) => setNewCampRewardType(e.target.value as "PERCENTAGE" | "FIXED")}
                      className="w-full text-xs border border-zinc-200 rounded-lg p-2.5 outline-none focus:border-emerald-600"
                    >
                      <option value="FIXED">FIXED AMOUNT IN KES</option>
                      <option value="PERCENTAGE">PERCENTAGE ON PRODUCT VALUE (%)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-600 uppercase mb-1">Campaign Core Description</label>
                  <textarea
                    required
                    value={newCampDesc}
                    onChange={(e) => setNewCampDesc(e.target.value)}
                    placeholder="Describe your product so agents know who to refer, how to present it, who is the ideal target audience."
                    rows={2}
                    className="w-full text-xs border border-zinc-200 rounded-lg p-2.5 outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 uppercase mb-1">Reward Value</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newCampRewardValue}
                      onChange={(e) => setNewCampRewardValue(Number(e.target.value))}
                      placeholder={newCampRewardType === "FIXED" ? "KES (e.g., 2000)" : "Percentage (e.g., 10)"}
                      className="w-full text-xs border border-zinc-200 rounded-lg p-2.5 outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 uppercase mb-1">Product Basket Price (Avg)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newCampProductPrice}
                      onChange={(e) => setNewCampProductPrice(Number(e.target.value))}
                      placeholder="e.g., KES 45,000"
                      className="w-full text-xs border border-zinc-200 rounded-lg p-2.5 outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 uppercase mb-1">Expiry Date</label>
                    <input
                      type="date"
                      value={newCampExpiry}
                      onChange={(e) => setNewCampExpiry(e.target.value)}
                      className="w-full text-xs border border-zinc-200 rounded-lg p-2.5 outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-600 uppercase mb-1">Payout Terms & Fine Print</label>
                  <input
                    type="text"
                    value={newCampTerms}
                    onChange={(e) => setNewCampTerms(e.target.value)}
                    placeholder="e.g., Commission is calculated instantly once the final contract/deposit of 10% is fully processed."
                    className="w-full text-xs border border-zinc-200 rounded-lg p-2.5 outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCampaign(false)}
                    className="px-4 py-2 text-xs font-semibold text-zinc-600 bg-zinc-50 rounded-lg hover:bg-zinc-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-all shadow-sm"
                  >
                    Launch Campaign
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List of active campaigns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bizCampaigns.map((camp) => (
              <div key={camp.id} className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-mono bg-emerald-50 text-emerald-800 border border-emerald-100 px-1.5 py-0.5 rounded font-bold">
                        ACTIVE OFFER
                      </span>
                      <h3 className="font-bold text-zinc-900 mt-1 text-sm">{camp.title}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-zinc-400 font-medium">Earn Potential</span>
                      <p className="text-emerald-600 font-bold font-mono text-sm">
                        {camp.rewardType === "FIXED" ? `KES ${camp.rewardValue.toLocaleString()}` : `${camp.rewardValue}%`}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-500 mt-2.5 line-clamp-3">{camp.description}</p>
                  
                  <div className="bg-zinc-50/70 p-2.5 rounded-lg border border-zinc-100 mt-3">
                    <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Contract Conditions:</span>
                    <span className="text-[10.5px] text-zinc-600">{camp.terms}</span>
                  </div>
                </div>

                <div className="border-t border-zinc-100 pt-3 mt-4 flex justify-between items-center text-[11px] font-medium text-zinc-400">
                  <div className="flex space-x-3">
                    <span>Clicks: <strong className="text-zinc-800 font-bold">{camp.clicksCount}</strong></span>
                    <span>Leads: <strong className="text-zinc-800 font-bold">{camp.leadsCount}</strong></span>
                    <span>Conversions: <strong className="text-zinc-800 font-bold">{camp.conversionsCount}</strong></span>
                  </div>
                  <span>Exp: {new Date(camp.expiryDate).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LEADS & APPROVALS TAB CONTENT */}
      {activeTab === "leads" && (
        <div id="leads-sub-view" className="space-y-6">
          {/* Section 1: Generated Leads queue */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">Simulated Customer Leads Pipeline ({bizLeads.length})</h3>
            
            {bizLeads.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl border text-center text-zinc-500 text-xs">
                No customer leads captured yet. Simulating visiting a referral link will add leads here.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-zinc-100">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase">Customer</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase">Promoting Agent</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase">Origin Campaign</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase">Date Logged</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-center text-[10px] font-bold text-zinc-500 uppercase">Convert Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-xs">
                    {bizLeads.map((lead) => {
                      const link = referralLinks.find(ln => ln.id === lead.referralLinkId);
                      const agent = agents.find(ag => ag.id === link?.agentId);
                      const campaign = campaigns.find(cp => cp.id === link?.campaignId);

                      return (
                        <tr key={lead.id} className="hover:bg-zinc-50/50 transition-all">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-zinc-850">{lead.customerName}</div>
                            <div className="text-[10px] text-zinc-400">{lead.customerEmail} | {lead.customerPhone}</div>
                          </td>
                          <td className="px-4 py-3 text-zinc-650 font-medium">
                            {agent ? agent.name : "Unknown Agent"}
                          </td>
                          <td className="px-4 py-3 font-medium text-zinc-700">
                            {campaign ? campaign.title : "Direct Campaign"}
                          </td>
                          <td className="px-4 py-3 text-zinc-400 text-[10.5px]">
                            {new Date(lead.timestamp).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              lead.status === "PENDING"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : lead.status === "CONVERTED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-zinc-100 text-zinc-500"
                            }`}>
                              {lead.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {lead.status === "PENDING" ? (
                              <button
                                id={`convert-lead-${lead.id}`}
                                onClick={() => convertLead(lead.id)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-[11px] font-medium transition-all"
                              >
                                Record Sale ➔
                              </button>
                            ) : (
                              <span className="text-[11px] text-zinc-400">Converted</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 2: Conversions waiting commission payout approval */}
          <div className="space-y-3 pt-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">Commission Invoices & approvals ({bizConversions.length})</h3>

            {bizConversions.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl border text-center text-zinc-500 text-xs">
                No recorded sales waiting verification. Convert a lead to trigger payouts.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-zinc-100">
                  <thead className="bg-zinc-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase">Referral Details</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase">Sale Value</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase">Commission Owed</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-center text-[10px] font-bold text-zinc-500 uppercase">Payout Authorization</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-xs">
                    {bizConversions.map((conv) => {
                      const lead = leads.find(l => l.id === conv.leadId);
                      const link = referralLinks.find(ln => ln.id === conv.referralLinkId);
                      const agent = agents.find(ag => ag.id === link?.agentId);
                      const campaign = campaigns.find(cp => cp.id === link?.campaignId);

                      return (
                        <tr key={conv.id} className="hover:bg-zinc-50/50 transition-all">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-zinc-800">For: {lead ? lead.customerName : "Conversion Sale"}</div>
                            <div className="text-[10px] text-zinc-400">Agent: {agent ? agent.name : "Unknown"} on campaign {campaign ? campaign.title : ""}</div>
                          </td>
                          <td className="px-4 py-3 font-mono text-zinc-700">
                            KES {conv.amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 font-bold text-emerald-600 font-mono">
                            KES {conv.commissionEarned.toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              conv.status === "PENDING_APPROVAL"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : conv.status === "PAID"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-zinc-100 text-zinc-500"
                            }`}>
                              {conv.status === "PENDING_APPROVAL" ? "AWAITING AUTHORIZATION" : conv.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center flex items-center justify-center space-x-2">
                            {conv.status === "PENDING_APPROVAL" ? (
                              <>
                                <button
                                  id={`approve-conv-${conv.id}`}
                                  onClick={() => approveConversion(conv.id)}
                                  className="bg-emerald-600 hover:bg-emerald-5050 text-white px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1 active:scale-95 shadow-sm"
                                >
                                  <CheckCircle className="h-3.5 w-3.5" /> Approve Payout
                                </button>
                                <button
                                  id={`reject-conv-${conv.id}`}
                                  onClick={() => rejectConversion(conv.id)}
                                  className="bg-zinc-100 hover:bg-zinc-200 text-zinc-600 px-2 py-1 rounded text-[11px] font-medium"
                                  title="Reject Conversion"
                                >
                                  Disqualify
                                </button>
                              </>
                            ) : (
                              <span className="text-zinc-500 font-medium text-[11px] flex items-center gap-1">
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> Settled
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* WALLET & AUDIT LEDGER */}
      {activeTab === "wallet" && (
        <div id="wallet-sub-view" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest block">Corporate Account Transaction History</h3>
            <span className="text-xs font-mono text-zinc-500">M-Pesa API Webhook Signatures Active</span>
          </div>

          {bizTransactions.length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border text-center text-zinc-500 text-xs">
              No transactions logged yet. Depositing money or paying commissions generates real ledger items.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm">
              <table className="min-w-full divide-y divide-zinc-100">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase">Timestamp</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase">M-Pesa ID / Ref</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase">Movement Description</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase">Flow Type</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold text-zinc-500 uppercase">Amount (KES)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-xs font-mono">
                  {bizTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-zinc-50/30">
                      <td className="px-4 py-3 text-zinc-500 text-[11px]">
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-zinc-700">
                        {tx.reference}
                      </td>
                      <td className="px-4 py-3 font-sans text-zinc-600">
                        {tx.description}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          tx.type === "DEPOSIT"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${
                        tx.type === "DEPOSIT" ? "text-emerald-600" : "text-zinc-800"
                      }`}>
                        {tx.type === "DEPOSIT" ? "+" : "-"} {tx.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* FUND WALLET DIALOG MODAL SIMULATED */}
      {showFundModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border max-w-sm w-full p-6 shadow-2xl relative">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-2">Simulate Corporate Wallet Deposit</h3>
            <p className="text-xs text-zinc-500 mb-4">
              Typically handles direct integration with standard payment processors. Enter simulated parameters here.
            </p>

            <form onSubmit={handleFundWallet} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Deposit Amount (KES)</label>
                <input
                  type="number"
                  required
                  min={100}
                  step={50}
                  value={fundAmount}
                  onChange={(e) => setFundAmount(Number(e.target.value))}
                  className="w-full text-sm border font-mono border-zinc-200 rounded-lg p-2.5 focus:border-emerald-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1 flex justify-between">
                  <span>M-Pesa Reference / Receipt Code</span>
                  <span className="text-[9px] text-zinc-400 font-normal">Optional auto-generated</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., REQ39DMDKS"
                  value={fundingRef}
                  onChange={(e) => setFundingRef(e.target.value.toUpperCase())}
                  className="w-full text-xs font-mono border border-zinc-200 rounded-lg p-2.5 outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFundModal(false)}
                  className="w-1/2 p-2.5 text-xs text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-all font-semibold"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="w-1/2 p-2.5 text-xs text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all font-semibold shadow-sm shadow-emerald-600/20 active:scale-95"
                >
                  Verify Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
