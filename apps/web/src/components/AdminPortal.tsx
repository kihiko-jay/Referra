/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import {
  Shield,
  Briefcase,
  Users2,
  TrendingUp,
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  PlusCircle,
  Info
} from "lucide-react";

export const AdminPortal: React.FC = () => {
  const {
    businesses,
    agents,
    campaigns,
    referralLinks,
    conversions,
    wallets,
    payoutRequests,
    processPayout,
    addNewAgent,
    approveAgent,
    suspendAgent
  } = useApp();

  // Selected sub-tab within Business Owner Portal
  const [activeTab, setActiveTab] = useState<"settlements" | "partners" | "businesses">("settlements");

  // New agent onboarding form
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [agentEmail, setAgentEmail] = useState("");
  const [agentPhone, setAgentPhone] = useState("2547");
  const [agentMpesa, setAgentMpesa] = useState("2547");

  // Core aggregated platform figures
  const globalTotalConversionsAmount = conversions
    .filter(c => c.status === "PAID" || c.status === "APPROVED")
    .reduce((sum, c) => sum + c.amount, 0);

  const globalTotalCommissions = conversions
    .filter(c => c.status === "PAID" || c.status === "APPROVED")
    .reduce((sum, c) => sum + c.commissionEarned, 0);

  const totalRegisteredClicks = campaigns.reduce((sum, c) => sum + c.clicksCount, 0);
  const totalRegisteredLeads = campaigns.reduce((sum, c) => sum + c.leadsCount, 0);

  const avgConversionPercentage = totalRegisteredClicks > 0 
    ? ((conversions.length / totalRegisteredClicks) * 100).toFixed(1)
    : "0.0";

  // System Escrow Pool
  const platformBalance = wallets
    .filter(w => w.holderType === "AGENT" || w.holderType === "BUSINESS")
    .reduce((sum, w) => sum + w.availableBalance, 0);

  const handleOnboardAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentName || !agentEmail || !agentPhone) return;

    addNewAgent({
      name: agentName,
      email: agentEmail,
      phone: agentPhone,
      mpesaNumber: agentMpesa || agentPhone
    });

    setAgentName("");
    setAgentEmail("");
    setAgentPhone("2547");
    setAgentMpesa("2547");
    setShowAddAgent(false);
    setActiveTab("partners");
  };

  return (
    <div id="platform-admin-portal" className="space-y-6">
      
      {/* Platform Title Indicator */}
      <div className="bg-gradient-to-r from-red-950 via-zinc-900 to-red-950 border border-zinc-800 rounded-2xl p-6 text-white relative overflow-hidden shadow">
        <div className="relative z-10">
          <div className="flex items-center space-x-2.5">
            <span className="text-[10px] bg-red-800 text-white font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Root Authority Mode
            </span>
            <span className="text-zinc-400 text-sm">Aggregated Ledger Logs Active</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-2 flex items-center gap-2">
            <Shield className="h-6 w-6 text-emerald-500" /> ReferraIOS Operations Matrix
          </h1>
          <p className="text-zinc-350 text-xs sm:text-sm mt-1 max-w-xl">
            Authorize real-time M-Pesa Daraja withdrawals, monitor subscription status, monitor security, fraud parameters, and check platform key performance metrics.
          </p>
        </div>
      </div>

      {/* Aggregate stats dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm flex items-center space-x-4">
          <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Global Referred Revenue</span>
            <p className="text-xl font-bold font-mono text-zinc-900 mt-0.5">KES {globalTotalConversionsAmount.toLocaleString()}</p>
            <span className="text-[9.5px] text-zinc-500">Total verified sales</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm flex items-center space-x-4">
          <div className="bg-indigo-50 text-indigo-700 p-3 rounded-xl">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Escrow Assets Pool</span>
            <p className="text-xl font-bold font-mono text-zinc-900 mt-0.5">KES {platformBalance.toLocaleString()}</p>
            <span className="text-[9.5px] text-zinc-500">Aggregated active balances</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm flex items-center space-x-4">
          <div className="bg-blue-50 text-blue-700 p-3 rounded-xl">
            <Users2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Network Conversion Ratio</span>
            <p className="text-xl font-bold font-mono text-zinc-900 mt-0.5">{avgConversionPercentage}%</p>
            <span className="text-[9.5px] text-zinc-500">{totalRegisteredClicks} clicks logged</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm flex items-center space-x-4">
          <div className="bg-purple-50 text-purple-700 p-3 rounded-xl">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">SME Clients</span>
            <p className="text-xl font-bold font-mono text-zinc-900 mt-0.5">{businesses.length} Businesses</p>
            <span className="text-[9.5px] text-zinc-500">{campaigns.length} campaigns initiated</span>
          </div>
        </div>
      </div>

      {/* Admin Subtabs Menu */}
      <div className="flex border-b border-zinc-200 gap-6">
        <button
          id="btn-admin-settlements"
          onClick={() => setActiveTab("settlements")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "settlements"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          Withdrawal Requests Queue ({payoutRequests.filter(p => p.status === "PENDING").length})
        </button>
        <button
          id="btn-admin-partners"
          onClick={() => {
            setActiveTab("partners");
            setShowAddAgent(false);
          }}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "partners"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          Sales Agents ({agents.length})
        </button>
        <button
          id="btn-admin-businesses"
          onClick={() => setActiveTab("businesses")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "businesses"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          SME Clients & Billing ({businesses.length})
        </button>
      </div>

      {/* TAB CONTENT: PAYOUT REQUESTS QUEUE */}
      {activeTab === "settlements" && (
        <div id="admin-settlements-sub" className="space-y-4">
          <div className="flex justify-between items-center bg-zinc-50 p-4 rounded-xl border border-zinc-200/50">
            <div>
              <h2 className="text-base font-bold text-zinc-800">M-Pesa Daraja Payout Authorizations</h2>
              <p className="text-xs text-zinc-500 font-medium">Verify credentials and trigger outbound mobile payout requests immediately.</p>
            </div>
          </div>

          {payoutRequests.filter(p => p.status === "PENDING").length === 0 ? (
            <div className="bg-white p-6 rounded-2xl border text-center text-zinc-500 text-xs">
              All M-Pesa withdrawal queues are currently processed and clear.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm">
              <table className="min-w-full divide-y divide-zinc-100 text-xs">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase">Agent Name</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase">Registered Mobile No</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase">Amount (KES)</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase">Awaiting Since</th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold text-zinc-500 uppercase">Direct Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium">
                  {payoutRequests.filter(p => p.status === "PENDING").map((req) => (
                    <tr key={req.id}>
                      <td className="px-4 py-3 text-zinc-800">{req.agentName}</td>
                      <td className="px-4 py-3 font-mono text-zinc-600">+{req.mpesaNumber}</td>
                      <td className="px-4 py-3 font-mono text-emerald-600 font-bold">KES {req.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-zinc-400 text-[10.5px]">
                        {new Date(req.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center flex items-center justify-center space-x-2">
                        <button
                          id={`approve-payout-${req.id}`}
                          onClick={() => processPayout(req.id, true)}
                          className="bg-emerald-600 hover:bg-emerald-5050 text-white px-2.5 py-1 rounded text-[11px] font-medium transition-all"
                        >
                          Approve Payout
                        </button>
                        <button
                          id={`decline-payout-${req.id}`}
                          onClick={() => processPayout(req.id, false)}
                          className="bg-zinc-100 hover:bg-zinc-250 text-zinc-650 px-2.5 py-1 rounded text-[11px] font-medium transition-all"
                        >
                          Decline
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Processed Log history block */}
          <div className="space-y-3 pt-4">
            <h3 className="text-xs font-bold text-zinc-405 uppercase tracking-widest block">Settled Transactions Archive</h3>
            <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm">
              <table className="min-w-full divide-y divide-zinc-100 text-xs">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold text-zinc-500 uppercase">Recipient</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold text-zinc-500 uppercase">Amount</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold text-zinc-500 uppercase">Settlement Date</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-bold text-zinc-500 uppercase text-right">M-Pesa Receipt Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium font-mono text-[11px] text-zinc-600">
                  {payoutRequests.filter(p => p.status !== "PENDING").map((req) => (
                    <tr key={req.id}>
                      <td className="px-4 py-3 font-sans text-zinc-850">
                        {req.agentName} ({req.mpesaNumber})
                      </td>
                      <td className="px-4 py-3 font-bold text-zinc-800">
                        KES {req.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-[10.5px] text-zinc-400">
                        {req.completedAt ? new Date(req.completedAt).toLocaleDateString() : ""}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-bold">
                        {req.mpesaReceiptNumber || <span className="text-red-500 font-semibold italic text-[10px]">REJECTED / CASH BACKED</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SALES PARTNERS DIRECTORY */}
      {activeTab === "partners" && (
        <div id="admin-partners-sub" className="space-y-4">
          <div className="flex justify-between items-center bg-zinc-50 p-4 rounded-xl border border-zinc-200/50">
            <div>
              <h2 className="text-base font-bold text-zinc-800">Ecosystem Sales Agents & Influencers</h2>
              <p className="text-xs text-zinc-500 font-medium">Manage agent credentials, approve applications, or suspend partners.</p>
            </div>
            {!showAddAgent && (
              <button
                id="add-agent-trigger"
                onClick={() => setShowAddAgent(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-all"
              >
                Onboard New Partner
              </button>
            )}
          </div>

          {/* ADD AGENT FORM */}
          {showAddAgent && (
            <div id="add-agent-form-box" className="bg-white rounded-2xl p-5 border shadow-sm">
              <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-widest border-b pb-2 mb-4 block">Register Partner Broker</h3>
              <form onSubmit={handleOnboardAgent} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Broker Name</label>
                  <input
                    type="text"
                    required
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="e.g. Kiprono Bett"
                    className="w-full text-xs border border-zinc-200 p-2.5 rounded-lg outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={agentEmail}
                    onChange={(e) => setAgentEmail(e.target.value)}
                    placeholder="kiprono@gmail.com"
                    className="w-full text-xs border border-zinc-200 p-2.5 rounded-lg outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={agentPhone}
                    onChange={(e) => setAgentPhone(e.target.value)}
                    className="w-full text-xs border border-zinc-200 p-2.5 rounded-lg outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Payout M-Pesa Mobile</label>
                  <input
                    type="text"
                    required
                    value={agentMpesa}
                    onChange={(e) => setAgentMpesa(e.target.value)}
                    className="w-full text-xs border border-zinc-200 p-2.5 rounded-lg outline-none focus:border-emerald-600 font-mono"
                  />
                </div>
                <div className="sm:col-span-2 flex justify-end space-x-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAddAgent(false)}
                    className="px-4 py-2 text-xs text-zinc-650 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm"
                  >
                    Save & Create Codes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List of Sales Partners */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {agents.map((agent) => {
              const linksCount = referralLinks.filter(l => l.agentId === agent.id).length;
              return (
                <div key={agent.id} className="bg-white rounded-2xl border border-zinc-150 p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-zinc-800 text-sm">{agent.name}</h3>
                        <p className="text-zinc-500 text-xs mt-0.5">{agent.email}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        agent.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}>
                        {agent.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono font-medium text-zinc-600 pt-4 mt-2 border-t">
                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase font-sans">Mpesa Registered</span>
                        <p className="text-zinc-700">+{agent.mpesaNumber}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase font-sans">Active Contracts</span>
                        <p className="text-zinc-[700]">{linksCount} tracking links</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t mt-4 flex justify-between items-center">
                    <span className="text-xs text-amber-500 font-bold">★ {agent.rating || "5.0"} rating</span>
                    <div className="flex gap-1">
                      {agent.status === "ACTIVE" ? (
                        <button
                          onClick={() => suspendAgent(agent.id)}
                          className="bg-red-50 hover:bg-red-100/50 text-red-650 px-2.5 py-1 rounded text-[10.5px] font-semibold border border-red-100"
                        >
                          Suspend Agent
                        </button>
                      ) : (
                        <button
                          onClick={() => approveAgent(agent.id)}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded text-[10.5px] font-semibold"
                        >
                          Approve Agent
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: BUSINESS CLIENTS & SUBSCRIPTIONS */}
      {activeTab === "businesses" && (
        <div id="admin-businesses-sub" className="space-y-4">
          <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200/50">
            <h2 className="text-base font-bold text-zinc-800">Subscribed SME Clients</h2>
            <p className="text-xs text-zinc-500 font-medium">B2B subscribers paying monthly operation licensing fees.</p>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-zinc-100 text-xs">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase">Business Enterprise Name</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase">Billing Tier</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase">Registration Fee / Month</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-zinc-500 uppercase">Integrations</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-zinc-500 uppercase">Escrow Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium">
                {businesses.map((biz) => {
                  const subFee = biz.subscriptionPlan === "STARTER" ? "KES 10,000" : biz.subscriptionPlan === "GROWTH" ? "KES 30,000" : "KES 100,000";
                  const bizWallet = wallets.find(w => w.holderId === biz.id && w.holderType === "BUSINESS");
                  const activeCap = campaigns.filter(c => c.businessId === biz.id).length;

                  return (
                    <tr key={biz.id}>
                      <td className="px-4 py-3 text-zinc-800">
                        <div className="font-bold">{biz.name}</div>
                        <div className="text-[10px] text-zinc-400">{biz.industry} | {biz.location}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          biz.subscriptionPlan === "ENTERPRISE"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {biz.subscriptionPlan}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono">{subFee}/mo</td>
                      <td className="px-4 py-3 font-semibold text-zinc-500">{activeCap} Active campaigns</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                        KES {(bizWallet?.availableBalance || 0).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
