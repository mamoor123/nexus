/**
 * Email Service
 * 
 * Connects to email providers via IMAP/SMTP or API.
 * Supports reading, composing, and automated responses.
 */

const db = require('../config/db');

// In-memory email store (replace with real IMAP/API in production)
let emailStore = [];
let emailIdCounter = 1;

/**
 * Initialize with demo emails
 */
function seedEmails() {
  if (emailStore.length > 0) return;

  const demoEmails = [
    {
      id: emailIdCounter++, from: 'client@acmecorp.com', to: 'sales@company.com',
      subject: 'Q2 Partnership Proposal', body: 'Hi team,\n\nWe\'d like to discuss a potential partnership for Q2. Our marketing team has identified significant synergy between our products.\n\nCan we schedule a call this week?\n\nBest regards,\nSarah Chen\nVP Partnerships, Acme Corp',
      folder: 'inbox', read: false, starred: true, date: new Date(Date.now() - 3600000).toISOString(), labels: ['sales', 'urgent']
    },
    {
      id: emailIdCounter++, from: 'support@vendor.io', to: 'admin@company.com',
      subject: 'Your API key has been renewed', body: 'Hello,\n\nYour API key for vendor.io has been automatically renewed. The new key is valid until December 2026.\n\nNo action required.',
      folder: 'inbox', read: true, starred: false, date: new Date(Date.now() - 7200000).toISOString(), labels: ['system']
    },
    {
      id: emailIdCounter++, from: 'newsletter@industry.com', to: 'marketing@company.com',
      subject: 'Weekly Industry Digest - AI Trends', body: 'This week in AI:\n\n1. New LLM benchmarks released\n2. Enterprise adoption up 40%\n3. Regulatory updates from EU\n4. Open source model releases\n\nRead more at industry.com',
      folder: 'inbox', read: false, starred: false, date: new Date(Date.now() - 10800000).toISOString(), labels: ['newsletter']
    },
    {
      id: emailIdCounter++, from: 'hr@company.com', to: 'team@company.com',
      subject: 'Team Building Event - April 15th', body: 'Hi everyone!\n\nWe\'re organizing a team building event on April 15th at 3pm. Activities include escape room and dinner.\n\nPlease RSVP by April 10th.\n\nHR Team',
      folder: 'inbox', read: true, starred: false, date: new Date(Date.now() - 86400000).toISOString(), labels: ['hr']
    },
    {
      id: emailIdCounter++, from: 'devops@company.com', to: 'engineering@company.com',
      subject: 'Server Maintenance - Tonight 2am', body: 'Heads up team,\n\nWe\'ll be performing scheduled maintenance on the production servers tonight from 2am to 4am UTC.\n\nExpected downtime: ~30 minutes\n\nDevOps',
      folder: 'inbox', read: false, starred: true, date: new Date(Date.now() - 172800000).toISOString(), labels: ['engineering', 'ops']
    },
  ];

  emailStore = demoEmails;
}

seedEmails();

/**
 * Get emails by folder
 */
function getEmails(folder = 'inbox', options = {}) {
  let results = emailStore.filter(e => e.folder === folder);

  if (options.unreadOnly) results = results.filter(e => !e.read);
  if (options.starred) results = results.filter(e => e.starred);
  if (options.label) results = results.filter(e => e.labels.includes(options.label));
  if (options.search) {
    const q = options.search.toLowerCase();
    results = results.filter(e =>
      e.subject.toLowerCase().includes(q) ||
      e.body.toLowerCase().includes(q) ||
      e.from.toLowerCase().includes(q)
    );
  }

  results.sort((a, b) => new Date(b.date) - new Date(a.date));
  return results;
}

/**
 * Get single email
 */
function getEmail(id) {
  return emailStore.find(e => e.id === parseInt(id));
}

/**
 * Mark as read
 */
function markRead(id) {
  const email = emailStore.find(e => e.id === parseInt(id));
  if (email) email.read = true;
  return email;
}

/**
 * Toggle star
 */
function toggleStar(id) {
  const email = emailStore.find(e => e.id === parseInt(id));
  if (email) email.starred = !email.starred;
  return email;
}

/**
 * Move to folder
 */
function moveToFolder(id, folder) {
  const email = emailStore.find(e => e.id === parseInt(id));
  if (email) email.folder = folder;
  return email;
}

/**
 * Send email (simulated)
 */
function sendEmail({ from, to, subject, body, inReplyTo }) {
  const email = {
    id: emailIdCounter++,
    from: from || 'admin@company.com',
    to,
    subject: inReplyTo ? `Re: ${subject}` : subject,
    body,
    folder: 'sent',
    read: true,
    starred: false,
    date: new Date().toISOString(),
    labels: [],
    inReplyTo: inReplyTo || null,
  };
  emailStore.push(email);
  return email;
}

/**
 * Draft email
 */
function saveDraft({ from, to, subject, body }) {
  const email = {
    id: emailIdCounter++,
    from: from || 'admin@company.com',
    to: to || '',
    subject: subject || '(no subject)',
    body: body || '',
    folder: 'drafts',
    read: true,
    starred: false,
    date: new Date().toISOString(),
    labels: [],
  };
  emailStore.push(email);
  return email;
}

/**
 * Get stats
 */
function getEmailStats() {
  return {
    inbox: emailStore.filter(e => e.folder === 'inbox').length,
    unread: emailStore.filter(e => e.folder === 'inbox' && !e.read).length,
    sent: emailStore.filter(e => e.folder === 'sent').length,
    drafts: emailStore.filter(e => e.folder === 'drafts').length,
    starred: emailStore.filter(e => e.starred).length,
  };
}

/**
 * Generate AI draft reply
 */
async function generateReply(emailId, instructions = '') {
  const email = getEmail(emailId);
  if (!email) throw new Error('Email not found');

  const prompt = `You are an email assistant. Draft a professional reply to this email.

From: ${email.from}
Subject: ${email.subject}
Body: ${email.body}

${instructions ? `Additional instructions: ${instructions}` : 'Write a helpful, professional reply.'}

Reply:`;

  // Simulated AI response
  return `Hi,

Thank you for your email regarding "${email.subject}".

I've reviewed your message and would be happy to discuss this further. Let me check with the team and get back to you with a detailed response by end of day.

Please let me know if you need anything else in the meantime.

Best regards,
Company OS Assistant`;
}

module.exports = {
  getEmails,
  getEmail,
  markRead,
  toggleStar,
  moveToFolder,
  sendEmail,
  saveDraft,
  getEmailStats,
  generateReply,
};
