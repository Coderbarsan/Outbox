import { emailApi, type ScheduledEmail } from "./services/api";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutDashboard,
  Send,
  Clock,
  Search,
  Plus,
  ChevronDown,
  Settings,
  HelpCircle,
  Bell,
  Menu,
  X,
  Upload,
  Calendar,
  Mail,
  Users,
  CheckCircle2,
  AlertCircle,
  FileText,
  Trash2,
  ArrowUpRight,
  Zap,
  Inbox,
  Loader2,
} from "lucide-react";

function App() {
  const [activeTab, setActiveTab] = useState("scheduled");
  const [modalOpen, setModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [delay, setDelay] = useState("2");
  const [hourlyLimit, setHourlyLimit] = useState("200");
  const [notice, setNotice] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [sentEmails, setSentEmails] = useState<ScheduledEmail[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(true);
  const [apiError, setApiError] = useState("");

  const currentEmails = activeTab === "sent" ? sentEmails : scheduledEmails;

  async function loadEmails() {
    try {
      setLoadingEmails(true);
      setApiError("");
      const [scheduled, sent] = await Promise.all([
        emailApi.getScheduled(),
        emailApi.getSent(),
      ]);
      setScheduledEmails(scheduled);
      setSentEmails(sent);
    } catch (error) {
      setApiError(
        error instanceof Error ? error.message : "Failed to load emails",
      );
    } finally {
      setLoadingEmails(false);
    }
  }

  useEffect(() => {
    void loadEmails();
  }, []);

  const filteredEmails = useMemo(() => {
    return currentEmails.filter((item) =>
      `${item.recipient} ${item.subject}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  }, [currentEmails, search]);

  const handleFile = (file?: File) => {
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = () => {
      const text = String(reader.result || "");
      const matches = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);
      const uniqueEmails = [...new Set(matches || [])];

      setRecipients(uniqueEmails);
    };

    reader.readAsText(file);
  };

  const handleSchedule = async () => {
    if (
      !subject.trim() ||
      !body.trim() ||
      recipients.length === 0 ||
      !scheduleDate
    ) {
      setNotice("Please fill in the subject, body, recipients and start time.");
      return;
    }

    const startDate = new Date(scheduleDate);
    if (
      Number.isNaN(startDate.getTime()) ||
      startDate.getTime() <= Date.now()
    ) {
      setNotice("Please select a valid future scheduling time.");
      return;
    }

    try {
      setNotice("");
      await emailApi.schedule({
        recipients,
        subject: subject.trim(),
        body: body.trim(),
        scheduledAt: startDate.toISOString(),
        delay: Math.max(1, Number(delay) || 2) * 1000,
        hourlyLimit: Math.max(1, Number(hourlyLimit) || 200),
      });

      await loadEmails();
      setNotice(`${recipients.length} email(s) successfully scheduled.`);
      setModalOpen(false);
      setSubject("");
      setBody("");
      setRecipients([]);
      setFileName("");
      setScheduleDate("");
      setSearch("");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Scheduling failed.");
    }
  };

  const navItems = [
    { label: "Overview", icon: LayoutDashboard, key: "overview" },
    { label: "Scheduled emails", icon: Clock, key: "scheduled" },
    { label: "Sent emails", icon: Send, key: "sent" },
  ];

  return (
    <div className="min-h-screen bg-[#08090c] text-gray-200">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden">
          <div className="w-72 h-full bg-[#101116] border-r border-white/5 p-5">
            <div className="flex justify-between items-center mb-10">
              <Logo />
              <button onClick={() => setSidebarOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <SidebarNav
              items={navItems}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              setSidebarOpen={setSidebarOpen}
            />
          </div>
        </div>
      )}

      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-[250px] shrink-0 flex-col border-r border-white/[0.06] bg-[#0d0e12] px-5 py-6">
          <Logo />

          <button
            onClick={() => setModalOpen(true)}
            className="mt-9 flex w-full items-center justify-center gap-2 rounded-xl bg-[#6d4aff] px-4 py-3 text-sm font-semibold text-white hover:bg-[#7d60ff] transition"
          >
            <Plus size={18} /> Compose email
          </button>

          <SidebarNav
            items={navItems}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />

          <div className="mt-auto space-y-2 pt-8">
            <SidebarButton
              icon={<HelpCircle size={17} />}
              label="Help & support"
            />
            <SidebarButton icon={<Settings size={17} />} label="Settings" />

            <div className="mt-5 rounded-2xl border border-white/[0.07] bg-[#15161c] p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Zap size={16} className="text-purple-400" />
                Upgrade your workflow
              </div>
              <p className="mt-2 text-xs leading-5 text-gray-500">
                Discover powerful tools to scale your email outreach.
              </p>
              <button className="mt-3 text-xs font-semibold text-purple-400 hover:text-purple-300">
                Explore features →
              </button>
            </div>

            <div className="flex items-center gap-3 border-t border-white/[0.06] pt-5 mt-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-sm font-bold">
                BS
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">Barsan Sahu</p>
                <p className="text-xs text-gray-500">Free plan</p>
              </div>
              <ChevronDown size={16} className="ml-auto text-gray-500" />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 flex-1">
          <header className="flex h-[76px] items-center justify-between border-b border-white/[0.06] px-4 sm:px-7 lg:px-9">
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden text-gray-400"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={22} />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-white">
                  {activeTab === "overview"
                    ? "Overview"
                    : activeTab === "scheduled"
                      ? "Scheduled emails"
                      : "Sent emails"}
                </h1>
                <p className="hidden sm:block text-xs text-gray-500 mt-1">
                  Manage and monitor your email campaigns.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative rounded-xl border border-white/[0.07] p-2.5 text-gray-400 hover:bg-white/5">
                <Bell size={17} />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-purple-500" />
              </button>
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-[#6d4aff] px-3 sm:px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#7d60ff]"
              >
                <Plus size={17} />
                <span className="hidden sm:inline">New email</span>
              </button>
            </div>
          </header>

          <div className="mx-auto max-w-[1400px] p-4 sm:p-7 lg:p-9">
            {/* Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard
                icon={<Mail size={19} />}
                title="Total emails"
                value={scheduledEmails.length + sentEmails.length}
                subtitle="Across all campaigns"
              />
              <StatCard
                icon={<Clock size={19} />}
                title="Scheduled"
                value={scheduledEmails.length}
                subtitle="Waiting in queue"
              />
              <StatCard
                icon={<Send size={19} />}
                title="Sent emails"
                value={sentEmails.length}
                subtitle="Successfully delivered"
              />
              <StatCard
                icon={<Users size={19} />}
                title="Recipients"
                value={scheduledEmails.length + sentEmails.length}
                subtitle="Unique email records"
              />
            </div>

            {/* Quick banner */}
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-purple-500/20 bg-gradient-to-r from-[#171328] to-[#101117] p-5 sm:p-6">
              <div className="flex gap-4 items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400">
                  <Zap size={22} />
                </div>
                <div>
                  <h2 className="font-semibold text-white">
                    Ready to reach your audience?
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-gray-400">
                    Schedule your next email campaign with Outbox.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(true)}
                className="shrink-0 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-sm text-purple-300 hover:bg-purple-500/20"
              >
                Start scheduling →
              </button>
            </div>

            {/* Table section */}
            <div className="mt-8 rounded-2xl border border-white/[0.06] bg-[#101116]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] p-5 sm:p-6">
                <div>
                  <h2 className="text-base font-semibold text-white">
                    Email activity
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Review and manage your email messages.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab("scheduled")}
                    className={`rounded-lg px-3 py-2 text-xs font-medium ${
                      activeTab === "scheduled"
                        ? "bg-purple-500/15 text-purple-300"
                        : "text-gray-500 hover:bg-white/5"
                    }`}
                  >
                    Scheduled
                  </button>
                  <button
                    onClick={() => setActiveTab("sent")}
                    className={`rounded-lg px-3 py-2 text-xs font-medium ${
                      activeTab === "sent"
                        ? "bg-purple-500/15 text-purple-300"
                        : "text-gray-500 hover:bg-white/5"
                    }`}
                  >
                    Sent
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-5">
                <div className="mb-5 flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                    />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by email or subject..."
                      className="w-full rounded-xl border border-white/[0.07] bg-[#0c0d11] py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-purple-500/50"
                    />
                  </div>
                  <button
                    onClick={() => setModalOpen(true)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.07] px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5"
                  >
                    <Plus size={16} /> Add email
                  </button>
                </div>

                {apiError && (
                  <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                    {apiError}
                    <button
                      onClick={() => void loadEmails()}
                      className="ml-3 underline"
                    >
                      Retry
                    </button>
                  </div>
                )}
                {loadingEmails && (
                  <div className="flex items-center gap-2 py-6 text-sm text-gray-400">
                    <Loader2 size={16} className="animate-spin" /> Loading email
                    records...
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-xs text-gray-500">
                        <th className="pb-4 pl-2 font-medium">RECIPIENT</th>
                        <th className="pb-4 font-medium">SUBJECT</th>
                        <th className="pb-4 font-medium">
                          {activeTab === "scheduled"
                            ? "SCHEDULED AT"
                            : "SENT AT"}
                        </th>
                        <th className="pb-4 font-medium">STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmails.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]"
                        >
                          <td className="py-4 pl-2">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#20202a] text-purple-300">
                                <Mail size={15} />
                              </div>
                              <span className="text-sm text-gray-300">
                                {item.recipient}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 text-sm text-gray-300">
                            {item.subject}
                          </td>
                          <td className="py-4 text-xs text-gray-400">
                            {new Date(
                              activeTab === "sent"
                                ? item.sentAt || item.scheduledAt
                                : item.scheduledAt,
                            ).toLocaleString()}
                          </td>
                          <td className="py-4">
                            <Status status={item.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredEmails.length === 0 && (
                    <div className="py-16 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04] text-gray-500">
                        <Inbox size={22} />
                      </div>
                      <p className="mt-4 text-sm text-gray-300">
                        No emails found
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {search
                          ? "Try another search term."
                          : "Your emails will appear here."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex flex-col sm:flex-row justify-between gap-2 text-xs text-gray-600">
              <p>Outbox · Email scheduling dashboard</p>
              <p>Built for ReachInbox Hiring Assignment</p>
            </div>
          </div>
        </main>
      </div>

      {/* Compose Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-5 backdrop-blur-sm">
          <div className="flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121319] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Compose email
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Configure your email scheduling campaign.
                </p>
              </div>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setNotice("");
                }}
                className="rounded-lg p-2 text-gray-400 hover:bg-white/5"
              >
                <X size={19} />
              </button>
            </div>

            <div className="overflow-y-auto p-5 space-y-5">
              {/* Upload */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Recipients
                </label>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full rounded-xl border border-dashed border-white/15 bg-[#0d0e12] p-6 text-center hover:border-purple-500/40 transition"
                >
                  <Upload className="mx-auto text-purple-400" size={23} />
                  <p className="mt-3 text-sm text-gray-300">
                    Upload a CSV or TXT file
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Email addresses will be detected automatically.
                  </p>
                </button>

                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />

                {fileName && (
                  <div className="mt-3 flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#0c0d11] p-3">
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-purple-400" />
                      <div>
                        <p className="text-sm text-gray-300">{fileName}</p>
                        <p className="text-xs text-gray-500">
                          {recipients.length} unique email addresses detected
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setFileName("");
                        setRecipients([]);
                      }}
                      className="text-gray-500 hover:text-red-400"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                )}
              </div>

              {/* Subject */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Subject
                </label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter your email subject..."
                  className="w-full rounded-xl border border-white/[0.07] bg-[#0c0d11] px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50"
                />
              </div>

              {/* Body */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Email body
                </label>
                <textarea
                  rows={5}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your email message here..."
                  className="w-full resize-y rounded-xl border border-white/[0.07] bg-[#0c0d11] px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50"
                />
              </div>

              {/* Schedule */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Start scheduling at
                </label>
                <div className="relative">
                  <Calendar
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.07] bg-[#0c0d11] py-3 pl-10 pr-3 text-sm text-white outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Delay between emails
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={delay}
                      onChange={(e) => setDelay(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.07] bg-[#0c0d11] px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                      seconds
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Hourly limit
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={hourlyLimit}
                      onChange={(e) => setHourlyLimit(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.07] bg-[#0c0d11] px-4 py-3 text-sm text-white outline-none focus:border-purple-500/50"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                      emails
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-purple-500/15 bg-purple-500/[0.06] p-3">
                <p className="text-xs leading-5 text-purple-300">
                  <Zap size={14} className="mr-1 inline" />
                  {recipients.length} recipient(s) · {delay || 0}s delay ·
                  {hourlyLimit || 0} emails/hour
                </p>
              </div>

              {notice && (
                <p className="rounded-xl bg-red-500/10 p-3 text-xs text-red-300">
                  {notice}
                </p>
              )}
            </div>

            <div className="flex justify-between gap-3 border-t border-white/[0.06] p-4">
              <button
                onClick={() => {
                  setModalOpen(false);
                  setNotice("");
                }}
                className="rounded-xl border border-white/[0.08] px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleSchedule}
                className="flex items-center gap-2 rounded-xl bg-[#6d4aff] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#7d60ff]"
              >
                <Clock size={16} /> Schedule emails
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {notice && !modalOpen && (
        <div className="fixed bottom-5 right-5 z-[60] flex max-w-sm items-start gap-3 rounded-xl border border-white/10 bg-[#191a21] p-4 shadow-xl">
          <CheckCircle2 size={18} className="mt-0.5 text-green-400" />
          <p className="text-sm text-gray-300">{notice}</p>
          <button
            onClick={() => setNotice("")}
            className="ml-auto text-gray-500"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6d4aff] text-white">
        <Send size={18} />
      </div>
      <span className="text-lg font-bold tracking-tight text-white">
        Outbox<span className="text-purple-400">.</span>
      </span>
    </div>
  );
}

function SidebarNav({ items, activeTab, setActiveTab, setSidebarOpen }: any) {
  return (
    <nav className="mt-8 space-y-1">
      <p className="mb-3 px-3 text-[10px] font-semibold tracking-[0.15em] text-gray-600">
        WORKSPACE
      </p>
      {items.map((item: any) => (
        <button
          key={item.key}
          onClick={() => {
            setActiveTab(item.key === "overview" ? "overview" : item.key);
            setSidebarOpen?.(false);
          }}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
            activeTab === item.key
              ? "bg-purple-500/10 text-purple-300"
              : "text-gray-500 hover:bg-white/[0.04] hover:text-gray-300"
          }`}
        >
          <item.icon size={18} />
          {item.label}
        </button>
      ))}
    </nav>
  );
}

function SidebarButton({ icon, label }: any) {
  return (
    <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-gray-500 hover:bg-white/[0.04] hover:text-gray-300">
      {icon} {label}
    </button>
  );
}

function StatCard({ icon, title, value, subtitle }: any) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#101116] p-5">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
          {icon}
        </div>
        <ArrowUpRight size={16} className="text-gray-600" />
      </div>
      <p className="mt-5 text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-xs text-gray-600">{subtitle}</p>
    </div>
  );
}

function Status({ status }: { status: string }) {
  const isSent = status.toLowerCase() === "sent";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 text-xs ${
        isSent
          ? "bg-green-500/10 text-green-400"
          : "bg-purple-500/10 text-purple-300"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isSent ? "bg-green-400" : "bg-purple-400"
        }`}
      />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default App;
