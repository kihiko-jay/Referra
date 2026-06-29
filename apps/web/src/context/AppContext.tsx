/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Business, Agent, Campaign, ReferralLink, Click, Lead, Conversion, Wallet, WalletTransaction, PayoutRequest, UserRole } from "../types";
import {
  INITIAL_USERS,
  INITIAL_BUSINESSES,
  INITIAL_AGENTS,
  INITIAL_CAMPAIGNS,
  INITIAL_REFERRAL_LINKS,
  INITIAL_CLICKS,
  INITIAL_LEADS,
  INITIAL_CONVERSIONS,
  INITIAL_WALLETS,
  INITIAL_TRANSACTIONS,
  INITIAL_PAYOUTS
} from "../data";

interface AppContextType {
  users: User[];
  businesses: Business[];
  agents: Agent[];
  campaigns: Campaign[];
  referralLinks: ReferralLink[];
  clicks: Click[];
  leads: Lead[];
  conversions: Conversion[];
  wallets: Wallet[];
  transactions: WalletTransaction[];
  payoutRequests: PayoutRequest[];
  
  // Simulation / Authentication Role State
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  activeBusiness: Business | null;
  setActiveBusiness: (biz: Business | null) => void;
  activeAgent: Agent | null;
  setActiveAgent: (agent: Agent | null) => void;

  // Actions
  addNewCampaign: (campaign: Omit<Campaign, "id" | "clicksCount" | "leadsCount" | "conversionsCount">) => void;
  addNewAgent: (agent: Omit<Agent, "id" | "userId" | "joinedDate" | "status" | "rating">) => void;
  generateReferralLink: (campaignId: string, agentId: string) => ReferralLink;
  trackClick: (referralLinkId: string, ip?: string, location?: string) => void;
  recordLead: (referralLinkId: string, name: string, email: string, phone: string, notes?: string) => void;
  convertLead: (leadId: string, customAmount?: number) => void;
  approveConversion: (conversionId: string) => void;
  rejectConversion: (conversionId: string) => void;
  requestPayout: (agentId: string, amount: number) => { success: boolean, message: string };
  processPayout: (payoutId: string, approve: boolean) => void;
  fundBusinessWallet: (businessId: string, amount: number, mpesaRef: string) => void;
  approveAgent: (agentId: string) => void;
  suspendAgent: (agentId: string) => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial data from localStorage or fallback
  const getStored = <T,>(key: string, fallback: T): T => {
    try {
      const stored = localStorage.getItem(`referraios_${key}`);
      return stored ? JSON.parse(stored) : fallback;
    } catch {
      return fallback;
    }
  };

  const [users, setUsers] = useState<User[]>(() => getStored("users", INITIAL_USERS));
  const [businesses, setBusinesses] = useState<Business[]>(() => getStored("businesses", INITIAL_BUSINESSES));
  const [agents, setAgents] = useState<Agent[]>(() => getStored("agents", INITIAL_AGENTS));
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => getStored("campaigns", INITIAL_CAMPAIGNS));
  const [referralLinks, setReferralLinks] = useState<ReferralLink[]>(() => getStored("referralLinks", INITIAL_REFERRAL_LINKS));
  const [clicks, setClicks] = useState<Click[]>(() => getStored("clicks", INITIAL_CLICKS));
  const [leads, setLeads] = useState<Lead[]>(() => getStored("leads", INITIAL_LEADS));
  const [conversions, setConversions] = useState<Conversion[]>(() => getStored("conversions", INITIAL_CONVERSIONS));
  const [wallets, setWallets] = useState<Wallet[]>(() => getStored("wallets", INITIAL_WALLETS));
  const [transactions, setTransactions] = useState<WalletTransaction[]>(() => getStored("transactions", INITIAL_TRANSACTIONS));
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>(() => getStored("payouts", INITIAL_PAYOUTS));

  // Simulation controls
  const [currentRole, setCurrentRole] = useState<UserRole>("BUSINESS_OWNER");
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const owners = INITIAL_USERS.filter(u => u.role === "BUSINESS_OWNER");
    return owners[0];
  });
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(() => {
    return INITIAL_BUSINESSES[0];
  });
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);

  // Sync state back to local storage on any state change
  useEffect(() => {
    localStorage.setItem("referraios_users", JSON.stringify(users));
    localStorage.setItem("referraios_businesses", JSON.stringify(businesses));
    localStorage.setItem("referraios_agents", JSON.stringify(agents));
    localStorage.setItem("referraios_campaigns", JSON.stringify(campaigns));
    localStorage.setItem("referraios_referralLinks", JSON.stringify(referralLinks));
    localStorage.setItem("referraios_clicks", JSON.stringify(clicks));
    localStorage.setItem("referraios_leads", JSON.stringify(leads));
    localStorage.setItem("referraios_conversions", JSON.stringify(conversions));
    localStorage.setItem("referraios_wallets", JSON.stringify(wallets));
    localStorage.setItem("referraios_transactions", JSON.stringify(transactions));
    localStorage.setItem("referraios_payouts", JSON.stringify(payoutRequests));
  }, [users, businesses, agents, campaigns, referralLinks, clicks, leads, conversions, wallets, transactions, payoutRequests]);

  // Handle switching personas on role change
  useEffect(() => {
    if (currentRole === "ADMIN") {
      const admin = users.find(u => u.role === "ADMIN");
      if (admin) {
        setCurrentUser(admin);
        setActiveBusiness(null);
        setActiveAgent(null);
      }
    } else if (currentRole === "BUSINESS_OWNER") {
      // Find active business owner
      const firstOwnerUser = users.find(u => u.id === "user_owner_pesapos");
      if (firstOwnerUser) {
        setCurrentUser(firstOwnerUser);
        const biz = businesses.find(b => b.id === "biz_pesapos");
        setActiveBusiness(biz || null);
        setActiveAgent(null);
      }
    } else if (currentRole === "AGENT") {
      const firstAgentUser = users.find(u => u.id === "user_agent_otieno");
      if (firstAgentUser) {
        setCurrentUser(firstAgentUser);
        const ag = agents.find(a => a.userId === firstAgentUser.id);
        setActiveAgent(ag || null);
        setActiveBusiness(null);
      }
    }
  }, [currentRole]);

  const resetAllData = () => {
    setUsers(INITIAL_USERS);
    setBusinesses(INITIAL_BUSINESSES);
    setAgents(INITIAL_AGENTS);
    setCampaigns(INITIAL_CAMPAIGNS);
    setReferralLinks(INITIAL_REFERRAL_LINKS);
    setClicks(INITIAL_CLICKS);
    setLeads(INITIAL_LEADS);
    setConversions(INITIAL_CONVERSIONS);
    setWallets(INITIAL_WALLETS);
    setTransactions(INITIAL_TRANSACTIONS);
    setPayoutRequests(INITIAL_PAYOUTS);
    
    // Reset to default roles
    setCurrentRole("BUSINESS_OWNER");
    const bizOwner = INITIAL_USERS.find(u => u.role === "BUSINESS_OWNER")!;
    setCurrentUser(bizOwner);
    setActiveBusiness(INITIAL_BUSINESSES[0]);
    setActiveAgent(null);
  };

  // Add a new campaign
  const addNewCampaign = (campaign: Omit<Campaign, "id" | "clicksCount" | "leadsCount" | "conversionsCount">) => {
    const id = `camp_${Date.now()}`;
    const newCamp: Campaign = {
      ...campaign,
      id,
      clicksCount: 0,
      leadsCount: 0,
      conversionsCount: 0
    };
    setCampaigns(prev => [newCamp, ...prev]);

    // Create automatic referral links for existing active agents so they get immediate links
    const newLinks: ReferralLink[] = agents.map(agent => ({
      id: `link_${agent.id}_${id}`,
      campaignId: id,
      agentId: agent.id,
      uniqueCode: `${agent.name.toLowerCase().split(" ")[0]}-${campaign.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      clicksCount: 0,
      leadsCount: 0,
      conversionsCount: 0
    }));

    setReferralLinks(prev => [...newLinks, ...prev]);
  };

  // Onboard new sales agents
  const addNewAgent = (agent: Omit<Agent, "id" | "userId" | "joinedDate" | "status" | "rating">) => {
    const id = `agent_${Date.now()}`;
    const userId = `user_${id}`;
    
    const newUser: User = {
      id: userId,
      name: agent.name,
      email: agent.email,
      role: "AGENT",
      phone: agent.phone
    };

    const newAgent: Agent = {
      ...agent,
      id,
      userId,
      joinedDate: new Date().toISOString(),
      status: "ACTIVE",
      rating: 5.0
    };

    const newWallet: Wallet = {
      id: `wallet_${id}`,
      holderId: id,
      holderType: "AGENT",
      availableBalance: 0,
      pendingBalance: 0,
      lifetimeEarnings: 0
    };

    setUsers(prev => [...prev, newUser]);
    setAgents(prev => [...prev, newAgent]);
    setWallets(prev => [...prev, newWallet]);

    // Pre-generate links for this new agent across all active campaigns
    const newLinks: ReferralLink[] = campaigns.filter(c => c.status === "ACTIVE").map(campaign => ({
      id: `link_${id}_${campaign.id}`,
      campaignId: campaign.id,
      agentId: id,
      uniqueCode: `${agent.name.toLowerCase().split(" ")[0]}-${campaign.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      clicksCount: 0,
      leadsCount: 0,
      conversionsCount: 0
    }));

    setReferralLinks(prev => [...newLinks, ...prev]);
  };

  const generateReferralLink = (campaignId: string, agentId: string): ReferralLink => {
    const existing = referralLinks.find(link => link.campaignId === campaignId && link.agentId === agentId);
    if (existing) return existing;

    const campaign = campaigns.find(c => c.id === campaignId);
    const agent = agents.find(a => a.id === agentId);
    const code = `${agent ? agent.name.toLowerCase().split(" ")[0] : "agent"}-${campaign ? campaign.title.toLowerCase().replace(/[^a-z0-9]/g, "-") : "cmp"}`;

    const newLink: ReferralLink = {
      id: `link_${Date.now()}`,
      campaignId,
      agentId,
      uniqueCode: code,
      clicksCount: 0,
      leadsCount: 0,
      conversionsCount: 0
    };

    setReferralLinks(prev => [...prev, newLink]);
    return newLink;
  };

  // Simulating tracking actions
  const trackClick = (referralLinkId: string, ip: string = "197.100.200.5", location: string = "Nairobi, KE") => {
    const newClick: Click = {
      id: `click_${Date.now()}`,
      referralLinkId,
      timestamp: new Date().toISOString(),
      ipAddress: ip,
      userAgent: "Mozilla Simulator Tool (ReferraIOS Applet)",
      location
    };

    setClicks(prev => [newClick, ...prev]);

    // Increment clicks stats
    setReferralLinks(prev => prev.map(link => {
      if (link.id === referralLinkId) {
        // Also increment campaign click
        setCampaigns(camps => camps.map(camp => {
          if (camp.id === link.campaignId) {
            return { ...camp, clicksCount: camp.clicksCount + 1 };
          }
          return camp;
        }));
        return { ...link, clicksCount: link.clicksCount + 1 };
      }
      return link;
    }));
  };

  const recordLead = (referralLinkId: string, name: string, email: string, phone: string, notes?: string) => {
    const newLead: Lead = {
      id: `lead_${Date.now()}`,
      referralLinkId,
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      timestamp: new Date().toISOString(),
      status: "PENDING",
      notes
    };

    setLeads(prev => [newLead, ...prev]);

    // Increment lead counts
    setReferralLinks(prev => prev.map(link => {
      if (link.id === referralLinkId) {
        setCampaigns(camps => camps.map(camp => {
          if (camp.id === link.campaignId) {
            return { ...camp, leadsCount: camp.leadsCount + 1 };
          }
          return camp;
        }));
        return { ...link, leadsCount: link.leadsCount + 1 };
      }
      return link;
    }));
  };

  // Business owner converts a Lead to a Conversion (Approved Sale)
  const convertLead = (leadId: string, customAmount?: number) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead || lead.status !== "PENDING") return;

    const link = referralLinks.find(ln => ln.id === lead.referralLinkId);
    if (!link) return;

    const campaign = campaigns.find(cp => cp.id === link.campaignId);
    if (!campaign) return;

    const saleAmount = customAmount || campaign.productPrice;
    
    // Calculate Commission
    let commission = 0;
    if (campaign.rewardType === "FIXED") {
      commission = campaign.rewardValue;
    } else {
      commission = Math.round((saleAmount * campaign.rewardValue) / 100);
    }

    const convId = `conv_${Date.now()}`;
    const newConv: Conversion = {
      id: convId,
      leadId,
      referralLinkId: lead.referralLinkId,
      amount: saleAmount,
      commissionEarned: commission,
      timestamp: new Date().toISOString(),
      status: "PENDING_APPROVAL"
    };

    setConversions(prev => [newConv, ...prev]);
    
    // Mark lead as converted
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: "CONVERTED" as const } : l));

    // Increment campaign conversions count
    setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, conversionsCount: c.conversionsCount + 1 } : c));
    setReferralLinks(prev => prev.map(l => l.id === link.id ? { ...l, conversionsCount: l.conversionsCount + 1 } : l));

    // Update agent's WALLET (Pending Balance increments)
    setWallets(prev => prev.map(w => {
      if (w.holderId === link.agentId && w.holderType === "AGENT") {
        return {
          ...w,
          pendingBalance: w.pendingBalance + commission
        };
      }
      return w;
    }));
  };

  // Business Owner approves the calculated Conversion (Funds verified)
  const approveConversion = (conversionId: string) => {
    const conv = conversions.find(c => c.id === conversionId);
    if (!conv || conv.status !== "PENDING_APPROVAL") return;

    const link = referralLinks.find(ln => ln.id === conv.referralLinkId);
    if (!link) return;

    const businessId = campaigns.find(cp => cp.id === link.campaignId)?.businessId;
    if (!businessId) return;

    const bizWallet = wallets.find(w => w.holderId === businessId && w.holderType === "BUSINESS");
    
    // Check if Business Owner has enough money in their balance to pay the agent!
    if (!bizWallet || bizWallet.availableBalance < conv.commissionEarned) {
      alert(`Insufficient funds in business wallet! Campaign holder needs to load at least KES ${conv.commissionEarned - (bizWallet?.availableBalance || 0)} more to process commission payout.`);
      return;
    }

    // Deduct from Business, Transfer to Agent
    setWallets(prev => prev.map(w => {
      // Deduct business wallet
      if (w.holderId === businessId && w.holderType === "BUSINESS") {
        return {
          ...w,
          availableBalance: w.availableBalance - conv.commissionEarned
        };
      }
      // Credit Agent wallet: Pending turns to Available and Lifetime earnings increments
      if (w.holderId === link.agentId && w.holderType === "AGENT") {
        return {
          ...w,
          availableBalance: w.availableBalance + conv.commissionEarned,
          pendingBalance: Math.max(0, w.pendingBalance - conv.commissionEarned),
          lifetimeEarnings: w.lifetimeEarnings + conv.commissionEarned
        };
      }
      return w;
    }));

    // Log the transaction
    const agentW = wallets.find(w => w.holderId === link.agentId && w.holderType === "AGENT");
    const newTx: WalletTransaction = {
      id: `tx_${Date.now()}`,
      walletId: agentW?.id || `wallet_${link.agentId}`,
      type: "COMMISSION_CREDIT",
      amount: conv.commissionEarned,
      status: "SUCCESS",
      reference: `MP-REF-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      description: `Commission Credit - Approved sale on Campaign (Conv ID: ${conv.id})`,
      timestamp: new Date().toISOString()
    };

    setTransactions(prev => [newTx, ...prev]);

    // Mark Conversion as Approved/Paid
    setConversions(prev => prev.map(c => c.id === conversionId ? { ...c, status: "PAID" as const } : c));
  };

  // Business Owner rejects Conversion
  const rejectConversion = (conversionId: string) => {
    const conv = conversions.find(c => c.id === conversionId);
    if (!conv || conv.status !== "PENDING_APPROVAL") return;

    const link = referralLinks.find(ln => ln.id === conv.referralLinkId);
    if (!link) return;

    // Deduct pending balance from agent
    setWallets(prev => prev.map(w => {
      if (w.holderId === link.agentId && w.holderType === "AGENT") {
        return {
          ...w,
          pendingBalance: Math.max(0, w.pendingBalance - conv.commissionEarned)
        };
      }
      return w;
    }));

    setConversions(prev => prev.map(c => c.id === conversionId ? { ...c, status: "REJECTED" as const } : c));
  };

  // Agent requests M-Pesa withdrawal payout
  const requestPayout = (agentId: string, amount: number) => {
    const w = wallets.find(wl => wl.holderId === agentId && wl.holderType === "AGENT");
    if (!w || w.availableBalance < amount) {
      return { success: false, message: "Insufficient available balance for withdrawal." };
    }

    const agent = agents.find(ag => ag.id === agentId);
    if (!agent) {
      return { success: false, message: "Agent profile not found." };
    }

    const payId = `pay_${Date.now()}`;
    const newPay: PayoutRequest = {
      id: payId,
      agentId,
      agentName: agent.name,
      mpesaNumber: agent.mpesaNumber,
      amount,
      status: "PENDING",
      timestamp: new Date().toISOString()
    };

    // Deduct immediately from available wallet to prevent double withdrawal, move to pending
    setWallets(prev => prev.map(wl => {
      if (wl.holderId === agentId && wl.holderType === "AGENT") {
        return {
          ...wl,
          availableBalance: wl.availableBalance - amount
        };
      }
      return wl;
    }));

    setPayoutRequests(prev => [newPay, ...prev]);
    return { success: true, message: "M-Pesa withdrawal request submitted successfully!" };
  };

  // Admin approves payout and processes transaction simulated over M-Pesa Daraja
  const processPayout = (payoutId: string, approve: boolean) => {
    const pay = payoutRequests.find(p => p.id === payoutId);
    if (!pay || pay.status !== "PENDING") return;

    if (approve) {
      const receiptNo = `MP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      setPayoutRequests(prev => prev.map(p => p.id === payoutId ? {
        ...p,
        status: "APPROVED",
        completedAt: new Date().toISOString(),
        mpesaReceiptNumber: receiptNo
      } : p));

      // Create ledger logs
      const agentW = wallets.find(wl => wl.holderId === pay.agentId && wl.holderType === "AGENT");
      const newTx: WalletTransaction = {
        id: `tx_${Date.now()}`,
        walletId: agentW?.id || `wallet_${pay.agentId}`,
        type: "COMMISSION_PAYOUT",
        amount: pay.amount,
        status: "SUCCESS",
        reference: receiptNo,
        description: `M-Pesa Daraja Payout completed safely to ${pay.mpesaNumber}`,
        timestamp: new Date().toISOString()
      };

      setTransactions(prev => [newTx, ...prev]);
    } else {
      // Rejected payout: Return funds back to available agent wallet balance
      setPayoutRequests(prev => prev.map(p => p.id === payoutId ? {
        ...p,
        status: "FAILED",
        completedAt: new Date().toISOString()
      } : p));

      setWallets(prev => prev.map(wl => {
        if (wl.holderId === pay.agentId && wl.holderType === "AGENT") {
          return {
            ...wl,
            availableBalance: wl.availableBalance + pay.amount
          };
        }
        return wl;
      }));
    }
  };

  const fundBusinessWallet = (businessId: string, amount: number, mpesaRef: string) => {
    setWallets(prev => prev.map(w => {
      if (w.holderId === businessId && w.holderType === "BUSINESS") {
        return {
          ...w,
          availableBalance: w.availableBalance + amount
        };
      }
      return w;
    }));

    const bizWall = wallets.find(w => w.holderId === businessId && w.holderType === "BUSINESS");
    const newTx: WalletTransaction = {
      id: `tx_${Date.now()}`,
      walletId: bizWall?.id || `wallet_biz_${businessId}`,
      type: "DEPOSIT",
      amount,
      status: "SUCCESS",
      reference: mpesaRef,
      description: `Funded via M-Pesa Toll Checkout`,
      timestamp: new Date().toISOString()
    };

    setTransactions(prev => [newTx, ...prev]);
  };

  const approveAgent = (agentId: string) => {
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: "ACTIVE" } : a));
  };

  const suspendAgent = (agentId: string) => {
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: "SUSPENDED" } : a));
  };

  return (
    <AppContext.Provider
      value={{
        users,
        businesses,
        agents,
        campaigns,
        referralLinks,
        clicks,
        leads,
        conversions,
        wallets,
        transactions,
        payoutRequests,
        currentRole,
        setCurrentRole,
        currentUser,
        setCurrentUser,
        activeBusiness,
        setActiveBusiness,
        activeAgent,
        setActiveAgent,
        addNewCampaign,
        addNewAgent,
        generateReferralLink,
        trackClick,
        recordLead,
        convertLead,
        approveConversion,
        rejectConversion,
        requestPayout,
        processPayout,
        fundBusinessWallet,
        approveAgent,
        suspendAgent,
        resetAllData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside an AppProvider");
  return context;
};
