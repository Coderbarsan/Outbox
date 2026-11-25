const API = "/api/emails";

export interface ScheduledEmail {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledAt: string;
  status: string;
  jobId: string;
  sender: string;
  createdAt: string;
  sentAt: string | null;
  error: string | null;
}

export interface ScheduleEmailPayload {
  recipients: string[];
  subject: string;
  body: string;
  scheduledAt: string;
  delay?: number;
  hourlyLimit?: number;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.message || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const emailApi = {
  getScheduled: () => request<ScheduledEmail[]>(`${API}/scheduled`),

  getSent: () => request<ScheduledEmail[]>(`${API}/sent`),

  schedule: (payload: ScheduleEmailPayload) =>
    request<{ message: string; count: number; emails: ScheduledEmail[] }>(
      `${API}/schedule`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    ),
};
