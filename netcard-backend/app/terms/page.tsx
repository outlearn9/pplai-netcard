import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — PPL AI',
  description: 'The terms and conditions governing your use of PPL AI.',
}

const LAST_UPDATED = 'April 20, 2026'

export default function TermsPage() {
  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #F5F4F1; --card: #FFFFFF; --border: #E2E0DC; --border-s: #D0CEC9;
          --indigo: #6366F1; --indigo-light: #EEF2FF; --indigo-mid: #C7D2FE;
          --t1: #111110; --t2: #6B6A6F; --t3: #9898A2; --t4: #C4C2C8;
          --fs: 'DM Sans', system-ui, sans-serif;
          --serif: 'Fraunces', Georgia, serif;
        }
        body { background: var(--bg); color: var(--t1); font-family: var(--fs); -webkit-font-smoothing: antialiased; }
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 40px; height: 64px;
          background: rgba(245,244,241,0.90); backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
        }
        .nav-right { display: flex; align-items: center; gap: 10px; }
        .btn-ghost-sm { font-size:14px; font-weight:500; color:var(--t2); background:none; border:1px solid var(--border); border-radius:9px; padding:8px 16px; text-decoration:none; }
        .btn-ghost-sm:hover { color:var(--t1); border-color:var(--border-s); background:#EDECE9; }
        .btn-cta { font-size:14px; font-weight:600; color:#fff; background:var(--indigo); border:none; border-radius:9px; padding:9px 20px; text-decoration:none; }
        .btn-cta:hover { background:#4F46E5; }
        .page { max-width: 740px; margin: 0 auto; padding: 112px 24px 80px; }
        .page-label { font-size:11px; font-weight:700; color:var(--indigo); letter-spacing:1.5px; text-transform:uppercase; margin-bottom:16px; }
        .page-title { font-family:var(--serif); font-size:clamp(32px,4vw,48px); font-weight:700; letter-spacing:-1.5px; color:var(--t1); line-height:1.1; margin-bottom:12px; }
        .page-meta { font-size:14px; color:var(--t3); margin-bottom:48px; padding-bottom:32px; border-bottom:1px solid var(--border); }
        .prose h2 { font-family:var(--serif); font-size:22px; font-weight:700; color:var(--t1); letter-spacing:-0.4px; margin:40px 0 12px; }
        .prose h3 { font-size:16px; font-weight:700; color:var(--t1); margin:24px 0 8px; }
        .prose p { font-size:15px; color:var(--t2); line-height:1.75; margin-bottom:16px; }
        .prose ul { margin:0 0 16px 20px; }
        .prose li { font-size:15px; color:var(--t2); line-height:1.75; margin-bottom:6px; }
        .prose a { color:var(--indigo); text-decoration:none; }
        .prose a:hover { text-decoration:underline; }
        .prose strong { color:var(--t1); font-weight:600; }
        .warning-box { background:#FFFBEB; border:1px solid #FDE68A; border-radius:14px; padding:18px 22px; margin:32px 0; }
        .warning-box p { color:#92400E; font-size:14px; font-weight:500; margin:0; }
        .footer { border-top:1px solid var(--border); padding:32px 40px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:14px; background:var(--card); }
        .footer-links { display:flex; gap:20px; list-style:none; }
        .footer-links a { font-size:13px; color:var(--t3); text-decoration:none; }
        .footer-links a:hover { color:var(--t2); }
        .footer-copy { font-size:12px; color:var(--t4); }
      `}</style>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,600&display=swap" rel="stylesheet" />

      <nav className="nav">
        <a href="/" style={{ display:'flex', alignItems:'center' }}>
          <svg height="24" viewBox="0 0 112 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18.7357 37.1127C20.8454 37.1127 22.7768 36.3187 24.1736 34.8766C25.5627 33.442 26.3286 31.4565 26.3286 29.2852H23.0879C23.0879 30.6096 22.6472 31.7946 21.8457 32.6221C21.0539 33.4398 19.978 33.8719 18.7357 33.8719C16.2469 33.8719 14.3695 31.9923 14.3695 29.5012H11.1288C11.1288 31.585 11.9109 33.5122 13.3314 34.9274C14.7454 36.336 16.6649 37.1127 18.7347 37.1127H18.7357Z" fill="#111111"/>
            <path d="M23.0876 29.2889L26.3286 29.2792C26.3178 25.5987 24.8378 22.1614 22.1629 19.6011C19.5766 17.1252 16.098 15.7867 12.6193 15.9304C9.25736 16.0676 6.09634 17.5216 3.71639 20.0235C1.32455 22.5384 0.00440025 25.8267 7.82013e-05 29.2824L3.24104 29.2868C3.24753 23.9222 7.5148 19.3829 12.7522 19.169C15.3536 19.061 17.9691 20.0732 19.9223 21.9431C21.9555 23.8887 23.0801 26.4986 23.0887 29.2889H23.0876Z" fill="#111111"/>
            <path d="M34.2144 29.5056L37.4553 29.4959C37.4445 25.8154 35.9645 22.378 33.2896 19.8178C30.7033 17.3418 27.2247 16.0045 23.746 16.1471C20.3841 16.2843 17.223 17.7383 14.8431 20.2402C12.4513 22.755 11.1311 26.0433 11.1268 29.4991L14.3678 29.5034C14.3742 24.1388 18.6415 19.5996 23.8789 19.3857C26.4825 19.2777 29.0958 20.2899 31.049 22.1598C33.0822 24.1054 34.2068 26.7153 34.2154 29.5056H34.2144Z" fill="#111111"/>
            <path d="M25.896 3.25586C24.4927 3.30123 23.2429 3.87917 22.3237 5.10094C21.8127 5.78043 21.507 6.55065 21.4174 7.39866C21.2283 9.19837 21.8268 10.7043 23.1965 11.872C24.6753 13.1327 26.7774 13.2569 28.4237 12.2328C29.5698 11.5188 30.2709 10.4817 30.5517 9.17461C30.892 7.59527 30.5701 6.14663 29.5428 4.89137C28.6354 3.78194 27.4256 3.27963 25.896 3.25586Z" fill="#111111"/>
            <path d="M5.46739 6.78738C5.48684 7.82983 5.86275 9.09266 6.64159 10.2248C7.38587 11.3072 8.3397 12.1412 9.58412 12.6003C11.2574 13.2171 12.9004 13.122 14.4764 12.2902C15.8278 11.5773 16.7968 10.4916 17.4082 9.09266C17.8899 7.98971 18.0541 6.83707 17.9191 5.6423C17.7841 4.44321 17.3714 3.34999 16.6444 2.38532C15.8451 1.32342 14.8016 0.613685 13.5172 0.255038C12.0157 -0.165183 10.5498 -0.0711981 9.13474 0.574798C7.82876 1.1711 6.8652 2.1401 6.20087 3.4094C5.70072 4.36435 5.46091 5.38412 5.46631 6.78846L5.46739 6.78738Z" fill="#111111"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M36.2342 10.0078C36.4855 10.0078 36.7034 10.1817 36.7591 10.4267L37.057 11.7365C37.1947 12.3423 37.6678 12.8153 38.2736 12.9531L39.5834 13.2509C39.8285 13.3066 40.0024 13.5245 40.0024 13.7758C40.0024 14.0271 39.8285 14.2449 39.5834 14.3007L38.2736 14.5985C37.6678 14.7362 37.1947 15.2093 37.057 15.8151L36.7591 17.1248C36.7034 17.3699 36.4855 17.5437 36.2342 17.5437C35.9829 17.5437 35.765 17.3699 35.7093 17.1248L35.4115 15.8151C35.2737 15.2093 34.8006 14.7362 34.1948 14.5985L32.885 14.3007C32.64 14.2449 32.4661 14.0271 32.4661 13.7758C32.4661 13.5245 32.64 13.3066 32.885 13.2509L34.1948 12.9531C34.8006 12.8153 35.2737 12.3423 35.4115 11.7365L35.7093 10.4267C35.765 10.1817 35.9829 10.0078 36.2342 10.0078Z" fill="#111111"/>
            <path d="M49.6104 32.0966V13.7606H52.8264L53.2104 15.8006C54.0744 14.4326 55.6344 13.4246 57.5544 13.4246C60.6504 13.4246 63.5064 16.1606 63.5064 20.4086C63.5064 24.6806 60.7464 27.3926 57.6264 27.3926C55.8984 27.3926 54.2664 26.4806 53.4504 25.1126V32.0966H49.6104ZM53.4024 20.4086C53.4024 22.4726 54.6984 23.9366 56.4744 23.9366C58.2984 23.9366 59.6184 22.4246 59.6184 20.3846C59.6184 18.3446 58.2984 16.8806 56.4984 16.8806C54.6984 16.8806 53.4024 18.3446 53.4024 20.4086ZM64.7933 32.0966V13.7606H68.0093L68.3933 15.8006C69.2573 14.4326 70.8173 13.4246 72.7373 13.4246C75.8333 13.4246 78.6893 16.1606 78.6893 20.4086C78.6893 24.6806 75.9293 27.3926 72.8093 27.3926C71.0813 27.3926 69.4493 26.4806 68.6333 25.1126V32.0966H64.7933ZM68.5853 20.4086C68.5853 22.4726 69.8813 23.9366 71.6573 23.9366C73.4813 23.9366 74.8013 22.4246 74.8013 20.3846C74.8013 18.3446 73.4813 16.8806 71.6813 16.8806C69.8813 16.8806 68.5853 18.3446 68.5853 20.4086ZM80.0001 27.0566V7.78464H83.8401V27.0566H80.0001ZM95.8148 27.3926C92.8148 27.3926 89.9108 24.6086 89.9108 20.4566C89.9108 16.2086 92.8148 13.4246 95.8148 13.4246C97.8068 13.4246 99.3188 14.4326 100.183 15.8006L100.567 13.7606H103.807V27.0566H100.567L100.183 25.0166C99.3188 26.4086 97.8068 27.3926 95.8148 27.3926ZM93.7748 20.4086C93.7748 22.4486 95.1188 23.9366 96.9428 23.9366C98.7188 23.9366 100.039 22.4726 100.039 20.4086C100.039 18.3446 98.7188 16.8806 96.9428 16.8806C95.1188 16.8806 93.7748 18.3926 93.7748 20.4086ZM105.814 27.0566V13.7606H109.654V27.0566H105.814ZM105.622 9.84864C105.622 8.69664 106.534 7.78464 107.734 7.78464C108.886 7.78464 109.822 8.69664 109.822 9.84864C109.822 11.0246 108.886 11.9366 107.734 11.9366C106.534 11.9366 105.622 11.0246 105.622 9.84864Z" fill="#111111"/>
          </svg>
        </a>
        <div className="nav-right">
          <a href="/sign-in" className="btn-ghost-sm">Sign in</a>
          <a href="/sign-up" className="btn-cta">Create Free Card →</a>
        </div>
      </nav>

      <main className="page">
        <div className="page-label">Legal</div>
        <h1 className="page-title">Terms of Service</h1>
        <p className="page-meta">Last updated: {LAST_UPDATED}</p>

        <div className="warning-box">
          <p>By creating a PPL AI account or using the service, you agree to these Terms. Please read them carefully — they include important information about your rights and our limitations of liability.</p>
        </div>

        <div className="prose">
          <h2>1. About PPL AI</h2>
          <p>PPL AI (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;the Service&rdquo;) is a digital networking platform that lets you create and share a digital V.Card, manage contacts, and use AI-powered follow-up suggestions. The Service is operated by PPL AI and is accessible at pplai.app.</p>

          <h2>2. Eligibility</h2>
          <p>You must be at least 16 years old to use PPL AI. By creating an account, you confirm that you meet this requirement. If you are using the Service on behalf of an organisation, you confirm you have the authority to bind that organisation to these Terms.</p>

          <h2>3. Your Account</h2>
          <p>You are responsible for maintaining the security of your account credentials and for all activity that occurs under your account. You must notify us immediately at <a href="mailto:security@pplai.app">security@pplai.app</a> if you suspect unauthorised access.</p>
          <p>You may not share your account or transfer it to another person. We may suspend or terminate your account if we detect misuse or a breach of these Terms.</p>

          <h2>4. Acceptable Use</h2>
          <p>You agree not to use PPL AI to:</p>
          <ul>
            <li>Upload or share false, misleading, or fraudulent contact information</li>
            <li>Harass, spam, or send unsolicited messages to contacts</li>
            <li>Scrape, crawl, or extract data from the platform programmatically without our written consent</li>
            <li>Reverse engineer, decompile, or attempt to extract source code from the Service</li>
            <li>Circumvent any rate limits, security measures, or access controls</li>
            <li>Use the Service for any unlawful purpose or in violation of applicable regulations (including GDPR, CAN-SPAM, CASL)</li>
          </ul>

          <h2>5. Your Content</h2>
          <p>You retain ownership of all content you upload to PPL AI (your V.Card data, contact notes, and messages). By uploading content, you grant PPL AI a limited, non-exclusive licence to store and display that content solely for the purpose of operating the Service.</p>
          <p>You are responsible for ensuring that your content does not infringe the intellectual property rights, privacy rights, or other rights of third parties.</p>

          <h2>6. AI-Generated Content</h2>
          <p>The AI follow-up suggestions generated by PPL AI are provided for convenience only. They are not professional advice and may occasionally be inaccurate or inappropriate. You are solely responsible for reviewing, editing, and deciding whether to send any AI-generated message. PPL AI is not liable for any consequences of sending AI-generated content.</p>

          <h2>7. Free and Paid Plans</h2>
          <p>PPL AI offers a free tier with core features at no cost. We may introduce paid plans with additional features in the future. We will provide at least 30 days&apos; notice before any paid feature previously available for free is moved behind a paywall.</p>
          <p>Paid plans (when available) are billed in advance. Refunds are available within 14 days of payment for annual plans if you have not used the paid features. Monthly plans are non-refundable once the billing period has started.</p>

          <h2>8. Intellectual Property</h2>
          <p>The PPL AI name, logo, and all software, design, and content created by us are our intellectual property. You may not use our branding without prior written permission except as necessary to share your V.Card link.</p>

          <h2>9. Disclaimers</h2>
          <p>THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. We do not guarantee that the Service will be uninterrupted, error-free, or that AI suggestions will be accurate or suitable for your needs.</p>

          <h2>10. Limitation of Liability</h2>
          <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, PPL AI SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL, ARISING OUT OF YOUR USE OF OR INABILITY TO USE THE SERVICE. OUR TOTAL LIABILITY TO YOU SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM, OR £50 IF YOU HAVE PAID NOTHING.</p>

          <h2>11. Changes to the Service</h2>
          <p>We may modify, suspend, or discontinue any part of the Service at any time. For material changes that negatively affect you, we will provide at least 30 days&apos; notice where reasonably practicable.</p>

          <h2>12. Changes to These Terms</h2>
          <p>We may update these Terms from time to time. We will notify you by email or in-app notice at least 14 days before material changes take effect. Continued use of the Service after the effective date constitutes acceptance.</p>

          <h2>13. Governing Law</h2>
          <p>These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales, unless you are a consumer resident in another jurisdiction with mandatory local consumer protection laws, in which case those laws may apply.</p>

          <h2>14. Contact</h2>
          <p>Questions about these Terms? Contact us at <a href="mailto:legal@pplai.app">legal@pplai.app</a> or via our <a href="/support">Support page</a>.</p>
        </div>
      </main>

      <footer className="footer">
        <div style={{ fontSize:13, color:'var(--t3)' }}>PPL AI · AI-powered networking for professionals</div>
        <ul className="footer-links">
          <li><a href="/privacy">Privacy</a></li>
          <li><a href="/terms" style={{ color:'var(--indigo)', fontWeight:600 }}>Terms</a></li>
          <li><a href="/support">Support</a></li>
        </ul>
        <div className="footer-copy">© {new Date().getFullYear()} PPL AI. All rights reserved.</div>
      </footer>
    </>
  )
}
