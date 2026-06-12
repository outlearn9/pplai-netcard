import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import ContactSection from './_components/ContactSection'
import JobsSection from './_components/JobsSection'

const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL ?? 'http://localhost:5173'
const PROFILE_FIELDS = ['name', 'role', 'company', 'email', 'phone', 'linkedin_url', 'seeking', 'offering'] as const

export const metadata: Metadata = {
  title: 'PPL AI — AI-Powered Networking Cards',
  description: 'Create your digital V.Card in seconds. Share via QR or link. AI drafts your follow-ups so no connection goes cold.',
  metadataBase: new URL('https://pplai.app'),
  openGraph: {
    title: 'PPL AI — AI-Powered Networking Cards',
    description: 'Stop losing contacts. Start building relationships. Your smart digital business card with AI follow-ups.',
    url: 'https://pplai.app',
    siteName: 'PPL AI',
  },
}

export default async function LandingPage() {
  const { userId } = await auth()

  let profile: Record<string, string> | null = null
  if (userId) {
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('name, role, company, email, phone, linkedin_url, seeking, offering')
      .eq('id', userId)
      .single()
    profile = data ?? null
  }

  const firstName = profile?.name?.split(' ')[0] ?? 'there'
  const initials  = profile?.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() ?? ''
  const pct = profile
    ? Math.round(PROFILE_FIELDS.filter(f => (profile as Record<string, string>)[f]?.trim()).length / PROFILE_FIELDS.length * 100)
    : 0

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:       #F5F4F1;
          --bg2:      #EEECEA;
          --card:     #FFFFFF;
          --elevated: #EDECE9;
          --border:   #E2E0DC;
          --border-s: #D0CEC9;
          --indigo:        #6366F1;
          --indigo-dark:   #4F46E5;
          --indigo-light:  #EEF2FF;
          --indigo-mid:    #C7D2FE;
          --green:         #32D583;
          --green-bg:      #F0FDF7;
          --green-border:  #BBF7D0;
          --amber:         #FFB547;
          --coral:         #E85A4F;
          --t1:  #111110;
          --t2:  #6B6A6F;
          --t3:  #9898A2;
          --t4:  #C4C2C8;
          --fs:    'DM Sans', system-ui, sans-serif;
          --serif: 'Fraunces', Georgia, serif;
        }

        html { scroll-behavior: smooth; }
        body {
          background: var(--bg);
          color: var(--t1);
          font-family: var(--fs);
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        /* ── Nav ── */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 40px; height: 64px;
          background: rgba(245,244,241,0.88);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
        }
        .nav-logo { font-family: var(--fs); font-size: 18px; font-weight: 700; color: var(--t1); text-decoration: none; letter-spacing: -0.4px; }
        .nav-logo span { color: var(--indigo); }
        .nav-links { display: flex; align-items: center; gap: 32px; list-style: none; }
        .nav-links a { font-size: 14px; font-weight: 500; color: var(--t2); text-decoration: none; transition: color 0.15s; }
        .nav-links a:hover { color: var(--t1); }
        .nav-right { display: flex; align-items: center; gap: 10px; }
        .btn-ghost-sm {
          font-family: var(--fs); font-size: 14px; font-weight: 500;
          color: var(--t2); background: none; border: 1px solid var(--border);
          border-radius: 9px; padding: 8px 16px; cursor: pointer;
          text-decoration: none; transition: all 0.15s;
        }
        .btn-ghost-sm:hover { color: var(--t1); border-color: var(--border-s); background: var(--elevated); }
        .btn-nav-cta {
          font-family: var(--fs); font-size: 14px; font-weight: 600;
          color: #fff; background: var(--indigo); border: none;
          border-radius: 9px; padding: 9px 20px; cursor: pointer;
          text-decoration: none; transition: background 0.15s, transform 0.1s;
          white-space: nowrap;
        }
        .btn-nav-cta:hover { background: var(--indigo-dark); transform: translateY(-1px); }

        /* ── Hero ── */
        .hero {
          min-height: 100vh; display: flex; align-items: center;
          padding: 64px 0 0; position: relative; overflow: hidden;
        }
        .hero-glow {
          position: absolute; top: 0; right: 0;
          width: 600px; height: 600px;
          background: radial-gradient(ellipse at 100% 0%, rgba(99,102,241,0.10) 0%, transparent 65%);
          pointer-events: none;
        }
        .hero-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          align-items: center; gap: 40px;
          max-width: 1080px; margin: 0 auto; padding: 0 40px; width: 100%;
        }
        .hero-left { display: flex; flex-direction: column; align-items: flex-start; }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--indigo-light); border: 1px solid var(--indigo-mid);
          border-radius: 100px; padding: 6px 16px; margin-bottom: 24px;
          font-size: 13px; font-weight: 600; color: var(--indigo);
        }
        .hero-badge-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); animation: pulseDot 2s ease-in-out infinite; flex-shrink: 0; }
        @keyframes pulseDot { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(0.7); } }
        .hero-h1 {
          font-family: var(--serif); font-size: clamp(40px, 4.5vw, 66px);
          font-weight: 700; line-height: 1.05; letter-spacing: -2.5px;
          color: var(--t1); margin-bottom: 20px;
        }
        .hero-h1 em { font-style: italic; color: var(--indigo); }
        .hero-sub {
          font-size: clamp(15px, 1.5vw, 17px); color: var(--t2); line-height: 1.65;
          max-width: 460px; margin-bottom: 32px;
        }
        .hero-ctas { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 24px; }
        .btn-primary-lg {
          font-family: var(--fs); font-size: 15px; font-weight: 600;
          color: #fff; background: var(--indigo); border: none; border-radius: 13px;
          padding: 14px 28px; cursor: pointer; text-decoration: none;
          box-shadow: 0 4px 18px rgba(99,102,241,0.30);
          transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
          display: inline-flex; align-items: center; gap: 8px;
        }
        .btn-primary-lg:hover { background: var(--indigo-dark); transform: translateY(-2px); box-shadow: 0 6px 24px rgba(99,102,241,0.38); }
        .btn-ghost-lg {
          font-family: var(--fs); font-size: 15px; font-weight: 500;
          color: var(--t2); background: var(--card); border: 1px solid var(--border);
          border-radius: 13px; padding: 13px 24px; cursor: pointer;
          text-decoration: none; transition: all 0.15s;
          display: inline-flex; align-items: center; gap: 8px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        }
        .btn-ghost-lg:hover { color: var(--t1); border-color: var(--border-s); box-shadow: 0 2px 8px rgba(0,0,0,0.09); }
        .hero-trust { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; font-size: 13px; color: var(--t3); font-weight: 500; }
        .trust-item { display: flex; align-items: center; gap: 6px; }
        .trust-check { color: var(--green); font-size: 15px; }

        /* ── Phone mockups ── */
        .hero-right {
          position: relative; display: flex; justify-content: center;
          align-items: flex-end; height: 580px;
        }
        @keyframes floatCard { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-10px); } }
        @keyframes floatCard2 { 0%,100% { transform:translateY(0) rotate(4deg); } 50% { transform:translateY(-8px) rotate(4deg); } }

        .phone-wrap {
          position: absolute; top: 0;
          filter: drop-shadow(0 24px 48px rgba(0,0,0,0.16)) drop-shadow(0 4px 12px rgba(99,102,241,0.10));
        }
        .phone-wrap-1 { left: 10%; z-index: 2; animation: floatCard 4.5s ease-in-out infinite; }
        .phone-wrap-2 { right: 0%; z-index: 1; top: 28px; animation: floatCard2 4s ease-in-out infinite 0.8s; }

        .phone-shell {
          width: 220px; background: #1C1C1E; border-radius: 40px;
          border: 1px solid rgba(255,255,255,0.08);
          overflow: hidden; position: relative;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06);
        }
        .phone-shell-1 { height: 470px; }
        .phone-shell-2 { height: 430px; }

        .phone-notch {
          position: absolute; top: 10px; left: 50%; transform: translateX(-50%);
          width: 80px; height: 20px; background: #1C1C1E;
          border-radius: 0 0 14px 14px; z-index: 10;
        }
        .phone-screen { width: 100%; height: 100%; background: var(--bg); overflow: hidden; position: relative; }

        /* Screen 1 — My Card */
        .s1-statusbar { padding: 14px 16px 4px; display:flex; justify-content:space-between; align-items:center; background:var(--bg); }
        .s1-time { font-size:10px; font-weight:700; color:var(--t1); }
        .s1-header { display:flex; justify-content:space-between; align-items:center; padding:6px 14px 10px; }
        .s1-title { font-family:var(--serif); font-size:18px; font-weight:600; color:var(--t1); letter-spacing:-0.5px; }
        .s1-card {
          margin: 0 10px; border-radius: 18px; overflow: hidden;
          background: linear-gradient(145deg,#2D2F6B,#3D3080 50%,#252560);
          position: relative;
        }
        .s1-card-inner { padding:14px; }
        .s1-avatar { width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,rgba(99,102,241,0.8),rgba(168,85,247,0.7)); display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; color:#fff; margin-bottom:8px; }
        .s1-name { font-family:var(--serif); font-size:15px; font-weight:600; color:#fff; letter-spacing:-0.4px; }
        .s1-role { font-size:9px; color:rgba(255,255,255,0.55); margin-top:2px; }
        .s1-rows { margin: 8px 10px; }
        .s1-row { display:flex; align-items:center; gap:8px; padding:7px 0; border-bottom:1px solid var(--border); font-size:10px; color:var(--t2); }
        .s1-row:last-child { border-bottom:none; }
        .s1-row-icon { width:20px; height:20px; border-radius:5px; display:flex; align-items:center; justify-content:center; font-size:9px; flex-shrink:0; }
        .s1-share-btn { margin:8px 10px; background:var(--indigo); color:#fff; border:none; border-radius:10px; padding:9px; font-size:11px; font-weight:600; font-family:var(--fs); width:calc(100% - 20px); display:flex; align-items:center; justify-content:center; gap:5px; }

        /* Screen 2 — AI Followups */
        .s2-header { padding:14px 12px 8px; }
        .s2-title { font-family:var(--serif); font-size:16px; font-weight:600; color:var(--t1); letter-spacing:-0.4px; }
        .s2-sub { font-size:9px; color:var(--t3); margin-top:2px; }
        .s2-card { margin:6px 10px; background:var(--card); border:1px solid var(--border); border-radius:12px; padding:10px 12px; box-shadow:0 1px 4px rgba(0,0,0,0.05); }
        .s2-card-top { display:flex; align-items:center; gap:8px; margin-bottom:7px; }
        .s2-avatar { width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:700; color:#fff; flex-shrink:0; }
        .s2-contact { font-size:11px; font-weight:700; color:var(--t1); }
        .s2-company { font-size:9px; color:var(--t3); }
        .s2-msg { font-size:10px; color:var(--t2); line-height:1.5; margin-bottom:8px; }
        .s2-actions { display:flex; gap:6px; }
        .s2-btn-send { flex:1; background:var(--indigo); color:#fff; border:none; border-radius:7px; padding:5px 0; font-size:9px; font-weight:700; font-family:var(--fs); }
        .s2-btn-skip { flex:1; background:var(--elevated); color:var(--t3); border:1px solid var(--border); border-radius:7px; padding:5px 0; font-size:9px; font-weight:600; font-family:var(--fs); }
        .s2-priority { display:inline-flex; align-items:center; gap:3px; font-size:8px; font-weight:700; padding:2px 7px; border-radius:100px; margin-bottom:6px; }

        /* Float badges */
        .float-badge { position:absolute; border-radius:12px; padding:9px 13px; font-size:11px; font-weight:600; display:flex; align-items:center; gap:7px; white-space:nowrap; box-shadow:0 4px 20px rgba(0,0,0,0.10); border:1px solid var(--border); background: var(--card); z-index:10; }
        .float-badge-ai { bottom: 40px; right: -10px; color:var(--indigo); border-color:var(--indigo-mid); background:var(--indigo-light); animation:floatCard 4s ease-in-out infinite 1.2s; }

        /* Keep vcard styles for other uses */
        .vcard { background:var(--card); border-radius:24px; overflow:hidden; border:1px solid var(--border); box-shadow:0 2px 0 var(--border), 0 20px 60px rgba(0,0,0,0.10); }
        .vcard-header { background:linear-gradient(145deg,#2D2F6B,#3D3080 50%,#252560); padding:20px; position:relative; overflow:hidden; }
        .vcard-header::before { content:''; position:absolute; top:-40px; left:-30px; width:180px; height:180px; border-radius:50%; background:radial-gradient(circle,rgba(129,140,248,0.5) 0%,transparent 70%); filter:blur(28px); }
        .vcard-logo-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; position:relative; }
        .vcard-logo-tag { font-size:9px; font-weight:700; color:rgba(255,255,255,0.35); letter-spacing:1.2px; text-transform:uppercase; }
        .vcard-avatar { width:48px; height:48px; border-radius:50%; background:linear-gradient(135deg,rgba(99,102,241,0.7),rgba(168,85,247,0.6)); border:1.5px solid rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:700; color:#fff; font-family:var(--fs); margin-bottom:10px; position:relative; }
        .vcard-name { font-family:var(--serif); font-size:20px; font-weight:600; color:#fff; letter-spacing:-0.5px; line-height:1.1; }
        .vcard-role { font-size:11px; color:rgba(255,255,255,0.6); margin-top:3px; font-weight:500; }
        .vcard-body { padding:14px 18px; background:var(--card); }
        .vcard-row { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid var(--border); font-size:12px; color:var(--t2); }
        .vcard-row:last-child { border-bottom:none; }
        .vcard-icon { width:26px; height:26px; border-radius:7px; display:flex; align-items:center; justify-content:center; font-size:12px; flex-shrink:0; }
        .vcard-footer { border-top:1px solid var(--border); padding:12px 18px; display:flex; align-items:center; justify-content:space-between; background:var(--card); }
        .share-chip { display:inline-flex; align-items:center; gap:6px; background:var(--indigo-light); border:1px solid var(--indigo-mid); border-radius:100px; padding:6px 14px; font-size:11px; font-weight:600; color:var(--indigo); }
        .qr-url { font-size:10px; color:var(--t3); font-weight:500; }

        /* ── Problem bar ── */
        .problem-bar { padding:44px 24px; border-top:1px solid var(--border); border-bottom:1px solid var(--border); background:var(--elevated); }
        .problem-inner { max-width:900px; margin:0 auto; display:flex; align-items:center; gap:14px; flex-wrap:wrap; justify-content:center; }
        .problem-chip { display:flex; align-items:center; gap:9px; background:var(--card); border:1px solid var(--border); border-radius:100px; padding:9px 18px; font-size:13.5px; font-weight:500; color:var(--t2); box-shadow:0 1px 3px rgba(0,0,0,0.05); }
        .problem-arrow { color:var(--t3); font-size:18px; flex-shrink:0; }
        .problem-fix { display:flex; align-items:center; gap:8px; font-size:13.5px; font-weight:700; color:var(--indigo); background:var(--indigo-light); border:1px solid var(--indigo-mid); border-radius:100px; padding:9px 18px; }

        /* ── Sections ── */
        .section-label { font-size:11.5px; font-weight:700; color:var(--indigo); letter-spacing:1.5px; text-transform:uppercase; margin-bottom:14px; display:flex; align-items:center; gap:8px; }
        .section-label::before { content:''; display:block; width:18px; height:2px; background:var(--indigo); border-radius:1px; }
        .section-h2 { font-family:var(--serif); font-size:clamp(30px,4vw,46px); font-weight:700; letter-spacing:-1.2px; color:var(--t1); line-height:1.1; margin-bottom:14px; }
        .section-sub { font-size:16px; color:var(--t2); line-height:1.65; max-width:520px; }
        .py-section { padding:88px 24px; }
        .container { max-width:1080px; margin:0 auto; padding:0 24px; }
        .section-alt { background:var(--elevated); }

        /* ── How it works ── */
        .hiw-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-top:52px; }
        .hiw-card { background:var(--card); border:1px solid var(--border); border-radius:20px; padding:28px 24px; position:relative; box-shadow:0 1px 4px rgba(0,0,0,0.05); transition:box-shadow 0.2s, border-color 0.2s; }
        .hiw-card:hover { box-shadow:0 4px 20px rgba(99,102,241,0.10); border-color:var(--indigo-mid); }
        .hiw-num { font-family:var(--serif); font-size:52px; font-weight:800; color:rgba(99,102,241,0.10); line-height:1; margin-bottom:16px; letter-spacing:-2px; }
        .hiw-icon { font-size:26px; margin-bottom:12px; display:block; }
        .hiw-title { font-size:17px; font-weight:700; color:var(--t1); margin-bottom:8px; letter-spacing:-0.3px; }
        .hiw-body { font-size:14px; color:var(--t2); line-height:1.6; }
        .hiw-connector { position:absolute; top:50%; right:-10px; transform:translateY(-50%); width:20px; height:1.5px; background:var(--border-s); z-index:1; }

        /* ── Features ── */
        .features-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-top:52px; }
        .feat-card { background:var(--card); border:1px solid var(--border); border-radius:20px; padding:26px 22px; box-shadow:0 1px 4px rgba(0,0,0,0.04); transition:box-shadow 0.2s, border-color 0.2s, transform 0.2s; }
        .feat-card:hover { box-shadow:0 4px 20px rgba(99,102,241,0.09); border-color:var(--indigo-mid); transform:translateY(-2px); }
        .feat-icon-wrap { width:42px; height:42px; border-radius:11px; background:var(--indigo-light); border:1px solid var(--indigo-mid); display:flex; align-items:center; justify-content:center; font-size:19px; margin-bottom:14px; }
        .feat-title { font-size:15px; font-weight:700; color:var(--t1); margin-bottom:7px; letter-spacing:-0.2px; }
        .feat-body { font-size:13.5px; color:var(--t2); line-height:1.6; }

        /* ── Comparison ── */
        .comparison-wrap { overflow-x:auto; margin-top:52px; border-radius:16px; border:1px solid var(--border); box-shadow:0 1px 4px rgba(0,0,0,0.05); }
        .comparison-table { width:100%; border-collapse:collapse; min-width:540px; }
        .comparison-table th { padding:13px 20px; text-align:left; font-size:12.5px; font-weight:700; color:var(--t3); letter-spacing:0.4px; border-bottom:1px solid var(--border); background:var(--elevated); }
        .comparison-table th.col-pplai { color:var(--indigo); background:var(--indigo-light); }
        .comparison-table td { padding:13px 20px; font-size:14px; color:var(--t2); border-bottom:1px solid var(--border); background:var(--card); }
        .comparison-table td.col-pplai { background:#FAFAFF; font-weight:600; color:var(--t1); }
        .comparison-table tr:last-child td { border-bottom:none; }
        .comparison-table tr:hover td { background:var(--elevated); }
        .comparison-table tr:hover td.col-pplai { background:var(--indigo-light); }
        .check-yes { color:var(--green); font-size:15px; }
        .check-no { color:var(--t4); font-size:15px; }
        .feat-row-name { font-weight:500; color:var(--t1); }

        /* ── CTA ── */
        .cta-section { padding:96px 24px; background:var(--elevated); border-top:1px solid var(--border); }
        .cta-card { max-width:620px; margin:0 auto; background:var(--card); border:1px solid var(--border); border-radius:28px; padding:56px 44px; text-align:center; box-shadow:0 2px 0 var(--border), 0 16px 48px rgba(99,102,241,0.10); }
        .cta-h2 { font-family:var(--serif); font-size:clamp(34px,5vw,52px); font-weight:700; letter-spacing:-1.5px; color:var(--t1); line-height:1.05; margin-bottom:14px; }
        .cta-h2 em { font-style:italic; color:var(--indigo); }
        .cta-sub { font-size:16px; color:var(--t2); margin-bottom:32px; line-height:1.55; }
        .cta-benefits { display:flex; align-items:center; justify-content:center; gap:22px; flex-wrap:wrap; margin-top:26px; font-size:13px; color:var(--t3); font-weight:500; }
        .cta-benefits span { display:flex; align-items:center; gap:5px; }
        .chk { color:var(--green); }
        .signin-link { display:block; margin-top:16px; font-size:14px; color:var(--t3); text-decoration:none; transition:color 0.15s; }
        .signin-link:hover { color:var(--t2); }
        .signin-link strong { color:var(--indigo); font-weight:600; }

        /* ── Footer ── */
        .footer { border-top:1px solid var(--border); padding:36px 40px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:18px; background:var(--card); }
        .footer-logo { font-family:var(--fs); font-size:15px; font-weight:700; color:var(--t1); }
        .footer-logo span { color:var(--indigo); }
        .footer-tagline { font-size:12px; color:var(--t3); margin-top:3px; }
        .footer-links { display:flex; align-items:center; gap:22px; list-style:none; }
        .footer-links a { font-size:13px; color:var(--t3); text-decoration:none; transition:color 0.15s; }
        .footer-links a:hover { color:var(--t2); }
        .footer-copy { font-size:12px; color:var(--t4); }

        /* ── For Teams ── */
        .teams-grid { display:grid; grid-template-columns:1fr 1fr; gap:48px; align-items:center; margin-top:52px; }
        .teams-feat-list { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .teams-feat { background:var(--card); border:1px solid var(--border); border-radius:16px; padding:20px 18px; transition:box-shadow 0.2s,border-color 0.2s; }
        .teams-feat:hover { box-shadow:0 4px 16px rgba(99,102,241,0.09); border-color:var(--indigo-mid); }
        .teams-feat-icon { font-size:22px; margin-bottom:10px; }
        .teams-feat-title { font-size:14px; font-weight:700; color:var(--t1); margin-bottom:5px; letter-spacing:-0.2px; }
        .teams-feat-body { font-size:13px; color:var(--t2); line-height:1.6; }
        .teams-visual { background:var(--card); border:1px solid var(--border); border-radius:24px; overflow:hidden; box-shadow:0 2px 20px rgba(99,102,241,0.08); }
        .tv-header { background:linear-gradient(135deg,#2D2F6B,#4338CA); padding:18px 20px; display:flex; align-items:center; justify-content:space-between; }
        .tv-title { font-family:var(--serif); font-size:15px; color:#fff; font-weight:600; }
        .tv-badge { background:rgba(255,255,255,0.15); color:rgba(255,255,255,0.85); font-size:11px; font-weight:600; border-radius:100px; padding:4px 12px; }
        .tv-row { display:flex; align-items:center; gap:12px; padding:13px 20px; border-bottom:1px solid var(--border); }
        .tv-row:last-child { border-bottom:none; }
        .tv-avatar { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; color:#fff; flex-shrink:0; }
        .tv-name { font-size:13px; font-weight:600; color:var(--t1); }
        .tv-role { font-size:11px; color:var(--t3); }
        .tv-stat { margin-left:auto; font-size:11px; font-weight:700; color:var(--indigo); background:var(--indigo-light); border-radius:100px; padding:3px 10px; }

        /* ── FAQ ── */
        .faq-list { margin-top:48px; max-width:740px; }
        details.faq-item { border-bottom:1px solid var(--border); }
        details.faq-item summary { list-style:none; padding:20px 0; cursor:pointer; font-size:15px; font-weight:600; color:var(--t1); display:flex; justify-content:space-between; align-items:center; gap:12px; user-select:none; }
        details.faq-item summary::-webkit-details-marker { display:none; }
        details.faq-item summary::after { content:'+'; font-size:22px; font-weight:300; color:var(--t3); flex-shrink:0; transition:transform 0.2s; line-height:1; }
        details.faq-item[open] summary::after { transform:rotate(45deg); }
        .faq-body { padding:0 0 22px; font-size:14.5px; color:var(--t2); line-height:1.75; }

        /* ── Contact ── */
        .contact-grid { display:grid; grid-template-columns:1fr 1.7fr; gap:40px; margin-top:52px; align-items:start; }
        .contact-info { display:flex; flex-direction:column; gap:14px; }
        .contact-card { background:var(--card); border:1px solid var(--border); border-radius:16px; padding:20px 18px; }
        .contact-card-icon { font-size:22px; margin-bottom:8px; }
        .contact-card-title { font-size:13px; font-weight:700; color:var(--t1); margin-bottom:4px; }
        .contact-card-body { font-size:12.5px; color:var(--t3); line-height:1.55; }

        /* ── Jobs ── */
        .jobs-grid { display:grid; grid-template-columns:1fr 1.4fr; gap:48px; align-items:start; margin-top:52px; }
        .jobs-roles-title { font-size:14px; font-weight:700; color:var(--t1); margin-bottom:14px; letter-spacing:-0.2px; }
        .jobs-role-tag { display:inline-flex; align-items:center; gap:6px; background:var(--card); border:1px solid var(--border); border-radius:100px; padding:7px 16px; font-size:13px; color:var(--t2); margin:4px 4px 4px 0; }

        /* ── Shared form styles ── */
        .form-card { background:var(--card); border:1px solid var(--border); border-radius:22px; padding:36px; box-shadow:0 2px 12px rgba(0,0,0,0.05); }
        .form-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:0; }
        .form-group { display:flex; flex-direction:column; gap:6px; margin-bottom:14px; }
        .form-label { font-size:13px; font-weight:600; color:var(--t1); }
        .form-input { font-family:var(--fs); font-size:14px; color:var(--t1); background:var(--bg); border:1.5px solid var(--border); border-radius:10px; padding:10px 14px; width:100%; outline:none; transition:border-color 0.15s,box-shadow 0.15s; }
        .form-input:focus { border-color:var(--indigo); box-shadow:0 0 0 3px rgba(99,102,241,0.1); }
        .form-input::placeholder { color:var(--t4); }
        .form-textarea { font-family:var(--fs); font-size:14px; color:var(--t1); background:var(--bg); border:1.5px solid var(--border); border-radius:10px; padding:10px 14px; width:100%; outline:none; resize:vertical; min-height:130px; transition:border-color 0.15s,box-shadow 0.15s; }
        .form-textarea:focus { border-color:var(--indigo); box-shadow:0 0 0 3px rgba(99,102,241,0.1); }
        .form-textarea::placeholder { color:var(--t4); }
        .form-select { font-family:var(--fs); font-size:14px; color:var(--t1); background:var(--bg); border:1.5px solid var(--border); border-radius:10px; padding:10px 14px; width:100%; outline:none; appearance:none; cursor:pointer; transition:border-color 0.15s,box-shadow 0.15s; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239898A2' strokeWidth='1.5' fill='none' strokeLinecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 14px center; padding-right:36px; }
        .form-select:focus { border-color:var(--indigo); box-shadow:0 0 0 3px rgba(99,102,241,0.1); }
        .form-file { font-family:var(--fs); font-size:13px; color:var(--t2); background:var(--bg); border:1.5px dashed var(--border); border-radius:10px; padding:20px; width:100%; cursor:pointer; text-align:center; transition:border-color 0.15s,background 0.15s; display:block; }
        .form-file:hover { border-color:var(--indigo); background:var(--indigo-light); }
        .form-submit { font-family:var(--fs); font-size:15px; font-weight:600; color:#fff; background:var(--indigo); border:none; border-radius:11px; padding:13px 28px; cursor:pointer; width:100%; transition:background 0.15s,transform 0.1s; margin-top:4px; }
        .form-submit:hover:not(:disabled) { background:var(--indigo-dark); transform:translateY(-1px); }
        .form-submit:disabled { opacity:0.6; cursor:not-allowed; }
        .form-success { background:var(--green-bg); border:1px solid var(--green-border); border-radius:12px; padding:14px 18px; font-size:14px; color:#16A34A; font-weight:500; margin-bottom:16px; }
        .form-error { background:#FFF1F0; border:1px solid #FECACA; border-radius:12px; padding:14px 18px; font-size:14px; color:var(--coral); font-weight:500; margin-bottom:16px; }

        /* ── Responsive ── */
        @media (max-width:900px) {
          .hiw-grid, .features-grid { grid-template-columns:1fr 1fr; }
          .hiw-connector { display:none; }
          .phone-shell { width:180px; }
          .phone-shell-1 { height:390px; }
          .phone-shell-2 { height:360px; }
          .teams-grid, .contact-grid, .jobs-grid { grid-template-columns:1fr; }
          .teams-visual { display:none; }
        }
        @media (max-width:640px) {
          .nav { padding:0 18px; }
          .nav-links { display:none; }
          .hiw-grid, .features-grid { grid-template-columns:1fr; }
          .hero-grid { grid-template-columns:1fr; }
          .hero-left { align-items:center; text-align:center; }
          .hero-h1, .hero-sub { text-align:center; }
          .hero-right { display:none; }
          .cta-card { padding:36px 22px; }
          .footer { flex-direction:column; align-items:flex-start; }
          .footer-links { flex-wrap:wrap; gap:14px; }
          .problem-arrow { display:none; }
          .form-row { grid-template-columns:1fr; }
          .teams-feat-list { grid-template-columns:1fr; }
          .form-card { padding:24px 18px; }
        }
      `}</style>

      {/* Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,700;0,9..144,800;1,9..144,500;1,9..144,600&display=swap" rel="stylesheet" />

      {/* ── Nav ── */}
      <nav className="nav">
        <a href="/" className="nav-logo" style={{ display:'flex', alignItems:'center' }}>
          <svg height="26" viewBox="0 0 112 38" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display:'block' }}>
            <path d="M18.7357 37.1127C20.8454 37.1127 22.7768 36.3187 24.1736 34.8766C25.5627 33.442 26.3286 31.4565 26.3286 29.2852H23.0879C23.0879 30.6096 22.6472 31.7946 21.8457 32.6221C21.0539 33.4398 19.978 33.8719 18.7357 33.8719C16.2469 33.8719 14.3695 31.9923 14.3695 29.5012H11.1288C11.1288 31.585 11.9109 33.5122 13.3314 34.9274C14.7454 36.336 16.6649 37.1127 18.7347 37.1127H18.7357Z" fill="#111111"/>
            <path d="M23.0876 29.2889L26.3286 29.2792C26.3178 25.5987 24.8378 22.1614 22.1629 19.6011C19.5766 17.1252 16.098 15.7867 12.6193 15.9304C9.25736 16.0676 6.09634 17.5216 3.71639 20.0235C1.32455 22.5384 0.00440025 25.8267 7.82013e-05 29.2824L3.24104 29.2868C3.24753 23.9222 7.5148 19.3829 12.7522 19.169C15.3536 19.061 17.9691 20.0732 19.9223 21.9431C21.9555 23.8887 23.0801 26.4986 23.0887 29.2889H23.0876Z" fill="#111111"/>
            <path d="M34.2144 29.5056L37.4553 29.4959C37.4445 25.8154 35.9645 22.378 33.2896 19.8178C30.7033 17.3418 27.2247 16.0045 23.746 16.1471C20.3841 16.2843 17.223 17.7383 14.8431 20.2402C12.4513 22.755 11.1311 26.0433 11.1268 29.4991L14.3678 29.5034C14.3742 24.1388 18.6415 19.5996 23.8789 19.3857C26.4825 19.2777 29.0958 20.2899 31.049 22.1598C33.0822 24.1054 34.2068 26.7153 34.2154 29.5056H34.2144Z" fill="#111111"/>
            <path d="M25.896 3.25586C24.4927 3.30123 23.2429 3.87917 22.3237 5.10094C21.8127 5.78043 21.507 6.55065 21.4174 7.39866C21.2283 9.19837 21.8268 10.7043 23.1965 11.872C24.6753 13.1327 26.7774 13.2569 28.4237 12.2328C29.5698 11.5188 30.2709 10.4817 30.5517 9.17461C30.892 7.59527 30.5701 6.14663 29.5428 4.89137C28.6354 3.78194 27.4256 3.27963 25.896 3.25586Z" fill="#111111"/>
            <path d="M5.46739 6.78738C5.48684 7.82983 5.86275 9.09266 6.64159 10.2248C7.38587 11.3072 8.3397 12.1412 9.58412 12.6003C11.2574 13.2171 12.9004 13.122 14.4764 12.2902C15.8278 11.5773 16.7968 10.4916 17.4082 9.09266C17.8899 7.98971 18.0541 6.83707 17.9191 5.6423C17.7841 4.44321 17.3714 3.34999 16.6444 2.38532C15.8451 1.32342 14.8016 0.613685 13.5172 0.255038C12.0157 -0.165183 10.5498 -0.0711981 9.13474 0.574798C7.82876 1.1711 6.8652 2.1401 6.20087 3.4094C5.70072 4.36435 5.46091 5.38412 5.46631 6.78846L5.46739 6.78738Z" fill="#111111"/>
            <path fillRule="evenodd" clipRule="evenodd" d="M36.2342 10.0078C36.4855 10.0078 36.7034 10.1817 36.7591 10.4267L37.057 11.7365C37.1947 12.3423 37.6678 12.8153 38.2736 12.9531L39.5834 13.2509C39.8285 13.3066 40.0024 13.5245 40.0024 13.7758C40.0024 14.0271 39.8285 14.2449 39.5834 14.3007L38.2736 14.5985C37.6678 14.7362 37.1947 15.2093 37.057 15.8151L36.7591 17.1248C36.7034 17.3699 36.4855 17.5437 36.2342 17.5437C35.9829 17.5437 35.765 17.3699 35.7093 17.1248L35.4115 15.8151C35.2737 15.2093 34.8006 14.7362 34.1948 14.5985L32.885 14.3007C32.64 14.2449 32.4661 14.0271 32.4661 13.7758C32.4661 13.5245 32.64 13.3066 32.885 13.2509L34.1948 12.9531C34.8006 12.8153 35.2737 12.3423 35.4115 11.7365L35.7093 10.4267C35.765 10.1817 35.9829 10.0078 36.2342 10.0078Z" fill="#111111"/>
            <path d="M49.6104 32.0966V13.7606H52.8264L53.2104 15.8006C54.0744 14.4326 55.6344 13.4246 57.5544 13.4246C60.6504 13.4246 63.5064 16.1606 63.5064 20.4086C63.5064 24.6806 60.7464 27.3926 57.6264 27.3926C55.8984 27.3926 54.2664 26.4806 53.4504 25.1126V32.0966H49.6104ZM53.4024 20.4086C53.4024 22.4726 54.6984 23.9366 56.4744 23.9366C58.2984 23.9366 59.6184 22.4246 59.6184 20.3846C59.6184 18.3446 58.2984 16.8806 56.4984 16.8806C54.6984 16.8806 53.4024 18.3446 53.4024 20.4086ZM64.7933 32.0966V13.7606H68.0093L68.3933 15.8006C69.2573 14.4326 70.8173 13.4246 72.7373 13.4246C75.8333 13.4246 78.6893 16.1606 78.6893 20.4086C78.6893 24.6806 75.9293 27.3926 72.8093 27.3926C71.0813 27.3926 69.4493 26.4806 68.6333 25.1126V32.0966H64.7933ZM68.5853 20.4086C68.5853 22.4726 69.8813 23.9366 71.6573 23.9366C73.4813 23.9366 74.8013 22.4246 74.8013 20.3846C74.8013 18.3446 73.4813 16.8806 71.6813 16.8806C69.8813 16.8806 68.5853 18.3446 68.5853 20.4086ZM80.0001 27.0566V7.78464H83.8401V27.0566H80.0001ZM95.8148 27.3926C92.8148 27.3926 89.9108 24.6086 89.9108 20.4566C89.9108 16.2086 92.8148 13.4246 95.8148 13.4246C97.8068 13.4246 99.3188 14.4326 100.183 15.8006L100.567 13.7606H103.807V27.0566H100.567L100.183 25.0166C99.3188 26.4086 97.8068 27.3926 95.8148 27.3926ZM93.7748 20.4086C93.7748 22.4486 95.1188 23.9366 96.9428 23.9366C98.7188 23.9366 100.039 22.4726 100.039 20.4086C100.039 18.3446 98.7188 16.8806 96.9428 16.8806C95.1188 16.8806 93.7748 18.3926 93.7748 20.4086ZM105.814 27.0566V13.7606H109.654V27.0566H105.814ZM105.622 9.84864C105.622 8.69664 106.534 7.78464 107.734 7.78464C108.886 7.78464 109.822 8.69664 109.822 9.84864C109.822 11.0246 108.886 11.9366 107.734 11.9366C106.534 11.9366 105.622 11.0246 105.622 9.84864Z" fill="#111111"/>
          </svg>
        </a>
        <ul className="nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#how-it-works">How it Works</a></li>
          <li><a href="#compare">Comparison</a></li>
          <li><a href="#for-teams">For Teams</a></li>
          <li><a href="#faq">FAQs</a></li>
          <li><a href="#contact">Contact</a></li>
          <li><a href="#jobs">Jobs</a></li>
        </ul>
        <div className="nav-right">
          {userId ? (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, padding:'6px 12px' }}>
                <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,#6366F1,#7C3AED)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff', flexShrink:0 }}>
                  {initials || firstName[0]?.toUpperCase()}
                </div>
                <span style={{ fontSize:13, fontWeight:500, color:'var(--t1)' }}>Hi, {firstName}</span>
              </div>
              <a href={FRONTEND_URL} className="btn-nav-cta">Open App →</a>
            </>
          ) : (
            <>
              <a href="/sign-in" className="btn-ghost-sm">Sign in</a>
              <a href="/sign-up" className="btn-nav-cta">Create Free Card →</a>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-grid">

          {/* LEFT — text */}
          <div className="hero-left">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              AI-powered networking — now available
            </div>
            <h1 className="hero-h1">
              Your Network,<br /><em>Supercharged.</em>
            </h1>
            <p className="hero-sub">
              Create a digital V.Card in seconds. Share via QR or link.
              AI drafts your follow-ups so{' '}
              <strong style={{ color: 'var(--t1)', fontWeight: 600 }}>no connection goes cold.</strong>
            </p>
            {userId ? (
              <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:20, padding:'24px 28px', maxWidth:440, boxShadow:'0 4px 24px rgba(99,102,241,0.10)', marginBottom:24 }}>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--indigo)', letterSpacing:0.8, textTransform:'uppercase', marginBottom:6 }}>Welcome back 👋</div>
                <div style={{ fontFamily:'var(--serif)', fontSize:24, fontWeight:700, color:'var(--t1)', letterSpacing:-0.6, marginBottom:18, lineHeight:1.15 }}>
                  {profile?.name ?? firstName}
                </div>
                <div style={{ marginBottom:18 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <span style={{ fontSize:13, fontWeight:600, color:'var(--t2)' }}>Digital Card completion</span>
                    <span style={{ fontSize:14, fontWeight:800, color: pct === 100 ? '#059669' : 'var(--indigo)' }}>{pct}%</span>
                  </div>
                  <div style={{ height:8, background:'var(--bg2)', borderRadius:4, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background: pct === 100 ? 'linear-gradient(90deg,#059669,#34d399)' : 'linear-gradient(90deg,#6366F1,#7C3AED)', borderRadius:4, transition:'width 0.6s ease' }} />
                  </div>
                  {pct < 100 && (
                    <div style={{ fontSize:12, color:'var(--t3)', marginTop:6 }}>
                      {Math.round((1 - pct / 100) * PROFILE_FIELDS.length)} field{Math.round((1 - pct / 100) * PROFILE_FIELDS.length) !== 1 ? 's' : ''} left to complete
                    </div>
                  )}
                </div>
                <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                  <a href={FRONTEND_URL} className="btn-primary-lg" style={{ flex:1, justifyContent:'center', minWidth:160 }}>
                    {pct === 100 ? 'Open My App →' : 'Complete My Card →'}
                  </a>
                  <a href="#how-it-works" className="btn-ghost-lg" style={{ whiteSpace:'nowrap' }}>See features ↓</a>
                </div>
              </div>
            ) : (
              <div className="hero-ctas">
                <a href="/sign-up" className="btn-primary-lg">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                  </svg>
                  Create Your Free V.Card
                </a>
                <a href="#how-it-works" className="btn-ghost-lg">See how it works ↓</a>
              </div>
            )}
            <div className="hero-trust">
              <span className="trust-item"><span className="trust-check">✓</span> Free forever</span>
              <span style={{ color: 'var(--t4)' }}>·</span>
              <span className="trust-item"><span className="trust-check">✓</span> No app download needed</span>
              <span style={{ color: 'var(--t4)' }}>·</span>
              <span className="trust-item"><span className="trust-check">✓</span> Works on every device</span>
            </div>
          </div>

          {/* RIGHT — phone mockups */}
          <div className="hero-right">
            <div className="float-badge float-badge-ai"><span>🤖</span> AI follow-up drafted</div>

            {/* Phone 1 — My Card screen */}
            <div className="phone-wrap phone-wrap-1">
              <div className="phone-shell phone-shell-1">
                <div className="phone-notch" />
                <div className="phone-screen">
                  <div className="s1-statusbar">
                    <span className="s1-time">9:41</span>
                    <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                      <svg width="13" height="10" viewBox="0 0 13 10" fill="none"><rect x="0" y="5" width="2" height="5" rx="0.5" fill="var(--t1)"/><rect x="3.5" y="3.5" width="2" height="6.5" rx="0.5" fill="var(--t1)"/><rect x="7" y="1.5" width="2" height="8.5" rx="0.5" fill="var(--t1)"/><rect x="10.5" y="0" width="2" height="10" rx="0.5" fill="var(--t1)" opacity="0.3"/></svg>
                      <svg width="16" height="10" viewBox="0 0 16 10" fill="none"><rect x="0.5" y="0.5" width="13" height="9" rx="1.5" stroke="var(--t1)" strokeWidth="1" fill="none"/><rect x="14" y="3" width="2" height="4" rx="1" fill="var(--t1)"/><rect x="2" y="2" width="9" height="6" rx="0.5" fill="var(--t1)"/></svg>
                    </div>
                  </div>
                  <div className="s1-header">
                    <span className="s1-title">My Card</span>
                    <span style={{ fontSize:13 }}>⚙️</span>
                  </div>
                  <div className="s1-card">
                    <div className="s1-card-inner">
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                        <div>
                          <div className="s1-avatar">PG</div>
                          <div className="s1-name">Paras Gupta</div>
                          <div className="s1-role">Founder &amp; CEO · PPL AI</div>
                        </div>
                        <svg width="38" height="38" viewBox="0 0 52 52" fill="none" style={{ background:'rgba(255,255,255,0.95)', borderRadius:4, padding:3, flexShrink:0 }}>
                          <rect x="2" y="2" width="18" height="18" rx="2" fill="#2D2F6B"/><rect x="5" y="5" width="12" height="12" rx="1" fill="white"/><rect x="8" y="8" width="6" height="6" fill="#2D2F6B"/>
                          <rect x="32" y="2" width="18" height="18" rx="2" fill="#2D2F6B"/><rect x="35" y="5" width="12" height="12" rx="1" fill="white"/><rect x="38" y="8" width="6" height="6" fill="#2D2F6B"/>
                          <rect x="2" y="32" width="18" height="18" rx="2" fill="#2D2F6B"/><rect x="5" y="35" width="12" height="12" rx="1" fill="white"/><rect x="8" y="38" width="6" height="6" fill="#2D2F6B"/>
                          {[24,28,32,36,40,44,48].flatMap((x, xi) =>
                            [24,28,32,36,40,44,48].map((y, yi) =>
                              (xi + yi) % 2 === 0
                                ? <rect key={`q${x}-${y}`} x={x} y={y} width="3" height="3" rx="0.5" fill="#2D2F6B" opacity="0.8" />
                                : null
                            )
                          )}
                        </svg>
                      </div>
                      <div style={{ marginTop:8, borderTop:'1px solid rgba(255,255,255,0.12)', paddingTop:6, fontSize:8, color:'rgba(255,255,255,0.35)', letterSpacing:'0.8px', textTransform:'uppercase' }}>pplai.app/u/paras</div>
                    </div>
                  </div>
                  <div className="s1-rows">
                    <div className="s1-row"><span className="s1-row-icon" style={{ background:'var(--indigo-light)' }}>✉️</span>paras@pplai.co</div>
                    <div className="s1-row"><span className="s1-row-icon" style={{ background:'var(--green-bg)' }}>📞</span>+1 (415) 555-0192</div>
                    <div className="s1-row"><span className="s1-row-icon" style={{ background:'#EFF6FF' }}>🔗</span>linkedin.com/in/paras</div>
                  </div>
                  <button className="s1-share-btn">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                    Share My Card
                  </button>
                </div>
              </div>
            </div>

            {/* Phone 2 — AI Follow-ups screen */}
            <div className="phone-wrap phone-wrap-2">
              <div className="phone-shell phone-shell-2">
                <div className="phone-notch" />
                <div className="phone-screen">
                  <div className="s1-statusbar">
                    <span className="s1-time">9:41</span>
                    <div style={{ display:'flex', gap:5, alignItems:'center' }}>
                      <svg width="13" height="10" viewBox="0 0 13 10" fill="none"><rect x="0" y="5" width="2" height="5" rx="0.5" fill="var(--t1)"/><rect x="3.5" y="3.5" width="2" height="6.5" rx="0.5" fill="var(--t1)"/><rect x="7" y="1.5" width="2" height="8.5" rx="0.5" fill="var(--t1)"/><rect x="10.5" y="0" width="2" height="10" rx="0.5" fill="var(--t1)" opacity="0.3"/></svg>
                      <svg width="16" height="10" viewBox="0 0 16 10" fill="none"><rect x="0.5" y="0.5" width="13" height="9" rx="1.5" stroke="var(--t1)" strokeWidth="1" fill="none"/><rect x="14" y="3" width="2" height="4" rx="1" fill="var(--t1)"/><rect x="2" y="2" width="9" height="6" rx="0.5" fill="var(--t1)"/></svg>
                    </div>
                  </div>
                  <div className="s2-header">
                    <div className="s2-title">AI Follow-ups</div>
                    <div className="s2-sub">3 suggestions ready</div>
                  </div>
                  {/* Card 1 */}
                  <div className="s2-card">
                    <div style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:8, fontWeight:700, padding:'2px 7px', borderRadius:100, background:'#FEF2F2', color:'#E85A4F', border:'1px solid #FECACA', marginBottom:6 }}>● High priority</div>
                    <div className="s2-card-top">
                      <div className="s2-avatar" style={{ background:'linear-gradient(135deg,#8B5CF6,#7C3AED)' }}>SJ</div>
                      <div>
                        <div className="s2-contact">Sarah Jones</div>
                        <div className="s2-company">VP Sales · Acme Corp</div>
                      </div>
                    </div>
                    <div className="s2-msg">&ldquo;Hi Sarah, great connecting at TechCrunch! I&apos;d love to explore how PPL AI could help your sales team...&rdquo;</div>
                    <div className="s2-actions">
                      <button className="s2-btn-send">Send ✓</button>
                      <button className="s2-btn-skip">Skip</button>
                    </div>
                  </div>
                  {/* Card 2 (partial) */}
                  <div className="s2-card" style={{ opacity:0.65 }}>
                    <div className="s2-card-top">
                      <div className="s2-avatar" style={{ background:'linear-gradient(135deg,#059669,#10B981)' }}>MR</div>
                      <div>
                        <div className="s2-contact">Mike Ramirez</div>
                        <div className="s2-company">Designer · Figma</div>
                      </div>
                    </div>
                    <div className="s2-msg">&ldquo;Hey Mike, loved your talk on design systems...&rdquo;</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Problem Bar ── */}
      <div className="problem-bar">
        <div className="problem-inner">
          <div className="problem-chip"><span>📦</span> Cards get lost in pockets</div>
          <div className="problem-chip"><span>🔇</span> No follow-up = no relationship</div>
          <div className="problem-chip"><span>📊</span> Zero data on who viewed your card</div>
          <span className="problem-arrow">→</span>
          <div className="problem-fix">✦ PPL AI fixes all three</div>
        </div>
      </div>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-section">
        <div className="container">
          <div className="section-label">How it works</div>
          <h2 className="section-h2">From zero to connected<br />in three steps.</h2>
          <p className="section-sub">No printing. No chasing replies. Just seamless networking from your first hello.</p>

          <div className="hiw-grid">
            <div className="hiw-card">
              <div className="hiw-num">01</div>
              <span className="hiw-icon">✍️</span>
              <div className="hiw-title">Build your V.Card</div>
              <div className="hiw-body">Add your name, role, company, links, and what you&apos;re seeking or offering. Takes 60 seconds.</div>
              <div className="hiw-connector" />
            </div>
            <div className="hiw-card">
              <div className="hiw-num">02</div>
              <span className="hiw-icon">🪪</span>
              <div className="hiw-title">Share anywhere</div>
              <div className="hiw-body">Your card is live at pplai.app/u/you. Share via QR code, link, or NFC tap. No app on their end — ever.</div>
              <div className="hiw-connector" />
            </div>
            <div className="hiw-card">
              <div className="hiw-num">03</div>
              <span className="hiw-icon">🤖</span>
              <div className="hiw-title">AI handles follow-up</div>
              <div className="hiw-body">After every event, AI drafts personalized follow-up messages. You review, edit, and send. Done.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-section section-alt" style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="section-label">Features</div>
          <h2 className="section-h2">Everything after<br />the handshake.</h2>
          <p className="section-sub">blinq.me gives you a digital card. PPL AI gives you the full networking stack — plus AI that works while you sleep.</p>

          <div className="features-grid">
            <div className="feat-card">
              <div className="feat-icon-wrap">🪪</div>
              <div className="feat-title">Digital V.Card</div>
              <div className="feat-body">Live at pplai.app/u/yourname. Downloads as a .vcf contact file. Edit once — updated everywhere instantly.</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon-wrap">📷</div>
              <div className="feat-title">Scan &amp; Save</div>
              <div className="feat-body">Scan any printed card or QR code. Contact auto-saved with event, date, and location context attached.</div>
            </div>
            <div className="feat-card" style={{ borderColor: 'var(--indigo-mid)', background: 'var(--indigo-light)' }}>
              <div className="feat-icon-wrap" style={{ background: '#fff', borderColor: 'var(--indigo-mid)' }}>🤖</div>
              <div className="feat-title">
                AI Follow-ups{' '}
                <span style={{ fontSize: 10, background: 'var(--indigo)', color: '#fff', borderRadius: 6, padding: '2px 7px', fontWeight: 700, letterSpacing: 0.3, marginLeft: 6 }}>UNIQUE</span>
              </div>
              <div className="feat-body">AI reads your contact history and drafts a personalized follow-up. You review and send in one tap — no cold emails ever again.</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon-wrap">📅</div>
              <div className="feat-title">Event Tracking</div>
              <div className="feat-body">Tag every contact with the event you met at. Filter your entire network by event, location, or date.</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon-wrap">📊</div>
              <div className="feat-title">Networking Analytics</div>
              <div className="feat-body">Pipeline stages, follow-up rates, seniority mix, top events. Know exactly how your network is growing.</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon-wrap">🔒</div>
              <div className="feat-title">Privacy First</div>
              <div className="feat-body">Your data, your control. We never sell contact information. Delete your account and all data instantly.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Comparison ── */}
      <section id="compare" className="py-section">
        <div className="container">
          <div className="section-label">Comparison</div>
          <h2 className="section-h2">Why professionals<br />choose PPL AI.</h2>
          <p className="section-sub">A digital card is just the start. The real value is what happens after you exchange it.</p>

          <div className="comparison-wrap">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th style={{ width: '32%' }}>Feature</th>
                  <th>Paper Cards</th>
                  <th>POPL</th>
                  <th>blinq.me</th>
                  <th className="col-pplai">✦ PPL AI</th>
                </tr>
              </thead>
              <tbody>
                {([
                  ['Digital business card', false, true, true, true],
                  ['QR code sharing', false, true, true, true],
                  ['Scan & save paper cards', false, false, true, true],
                  ['AI follow-up drafts', false, false, false, true],
                  ['Event-based contact tagging', false, false, false, true],
                  ['Networking analytics', false, false, false, true],
                ] as [string, boolean, boolean, boolean, boolean][]).map(([label, paper, popl, blinq, ppl]) => (
                  <tr key={label}>
                    <td className="feat-row-name">{label}</td>
                    <td><span className={paper ? 'check-yes' : 'check-no'}>{paper ? '✓' : '✕'}</span></td>
                    <td><span className={popl ? 'check-yes' : 'check-no'}>{popl ? '✓' : '✕'}</span></td>
                    <td><span className={blinq ? 'check-yes' : 'check-no'}>{blinq ? '✓' : '✕'}</span></td>
                    <td className="col-pplai"><span className={ppl ? 'check-yes' : 'check-no'}>{ppl ? '✓' : '✕'}</span></td>
                  </tr>
                ))}
                <tr>
                  <td className="feat-row-name">Free tier</td>
                  <td><span style={{ color: 'var(--t4)', fontSize: 13 }}>—</span></td>
                  <td><span style={{ color: 'var(--amber)', fontSize: 13, fontWeight: 600 }}>Limited</span></td>
                  <td><span style={{ color: 'var(--amber)', fontSize: 13, fontWeight: 600 }}>Limited</span></td>
                  <td className="col-pplai"><span style={{ color: 'var(--green)', fontWeight: 700 }}>✓ Free</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── For Teams ── */}
      <section id="for-teams" className="py-section section-alt" style={{ borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)' }}>
        <div className="container">
          <div className="section-label">For Teams</div>
          <h2 className="section-h2">Networking,<br />at company scale.</h2>
          <p className="section-sub">Give every rep, recruiter, or founder on your team their own AI-powered card — all managed from one admin dashboard.</p>
          <div className="teams-grid">
            <div className="teams-feat-list">
              <div className="teams-feat">
                <div className="teams-feat-icon">👥</div>
                <div className="teams-feat-title">Team accounts</div>
                <div className="teams-feat-body">One plan covers your whole team. Invite members and manage access levels from a single dashboard.</div>
              </div>
              <div className="teams-feat">
                <div className="teams-feat-icon">📊</div>
                <div className="teams-feat-title">Shared analytics</div>
                <div className="teams-feat-body">See who&apos;s networking most, what events drive pipeline, and which follow-ups convert — across your entire team.</div>
              </div>
              <div className="teams-feat">
                <div className="teams-feat-icon">🔐</div>
                <div className="teams-feat-title">Role-based access</div>
                <div className="teams-feat-body">Admins control who can view, edit, or export contact data. SSO and SAML available for enterprise.</div>
              </div>
              <div className="teams-feat">
                <div className="teams-feat-icon">🎯</div>
                <div className="teams-feat-title">Shared event contacts</div>
                <div className="teams-feat-body">When your whole team is at a conference, contacts are pooled. No duplicates, no missed connections.</div>
              </div>
            </div>
            <div className="teams-visual">
              <div className="tv-header">
                <div className="tv-title">Team Dashboard</div>
                <div className="tv-badge">4 members</div>
              </div>
              {[
                { initials:'PG', color:'linear-gradient(135deg,#6366F1,#4338CA)', name:'Paras Gupta', role:'Founder & CEO', stat:'42 contacts' },
                { initials:'SJ', color:'linear-gradient(135deg,#8B5CF6,#7C3AED)', name:'Sarah Jones', role:'VP Sales', stat:'38 contacts' },
                { initials:'MR', color:'linear-gradient(135deg,#059669,#10B981)', name:'Mike Ramirez', role:'Designer', stat:'21 contacts' },
                { initials:'AL', color:'linear-gradient(135deg,#F59E0B,#D97706)', name:'Amy Lin', role:'Growth', stat:'29 contacts' },
              ].map(m => (
                <div key={m.name} className="tv-row">
                  <div className="tv-avatar" style={{ background:m.color }}>{m.initials}</div>
                  <div>
                    <div className="tv-name">{m.name}</div>
                    <div className="tv-role">{m.role}</div>
                  </div>
                  <div className="tv-stat">{m.stat}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop:40, display:'flex', gap:12, flexWrap:'wrap' }}>
            <a href="#contact" className="btn-primary-lg">Talk to our team →</a>
            <a href="/sign-up" className="btn-ghost-lg">Try free first</a>
          </div>
        </div>
      </section>

      {/* ── FAQs ── */}
      <section id="faq" className="py-section">
        <div className="container">
          <div className="section-label">FAQ</div>
          <h2 className="section-h2">Questions?<br />We have answers.</h2>
          <div className="faq-list">
            {([
              ['Is PPL AI really free?', 'Yes — PPL AI is free to use with no credit card required. You can create your digital V.Card, share it via QR and link, and get basic AI follow-up drafts at no cost. Premium team features and advanced analytics are available on paid plans.'],
              ['Do my contacts need to download an app?', 'Never. When someone scans your QR code or opens your link, your card opens instantly in their browser. They can save it as a contact with one tap — no app, no sign-up required on their end.'],
              ['How does the AI follow-up work?', 'After you meet someone and add them as a contact, PPL AI reads the context — where you met, their role, what you chatted about — and drafts a short, personalized follow-up message. You review it, tweak if needed, and send. No cold-starting from a blank page.'],
              ['Is my contact data private?', 'Absolutely. Your contacts are private and only visible to you (and your team, if you\'re on a team plan). We never sell or share your data with third parties. You can delete your account and all associated data at any time.'],
              ['What is a V.Card?', 'A V.Card (virtual card / vCard) is a digital business card that lives at a permanent URL — like pplai.app/u/yourname. It can also be exported as a .vcf file that works with every phone\'s contacts app, Apple Wallet-style saves, and any CRM.'],
              ['Can I use PPL AI at events?', 'Yes — events are a core feature. You can create an Event in the app, and every contact you scan or add while the event is active gets tagged with that event automatically. After the event, AI generates follow-up suggestions for everyone you met.'],
              ['What happens to my data if I cancel?', 'You can export all your contacts as a CSV or vCard at any time. If you cancel, your data is retained for 30 days before being permanently deleted. No lock-in.'],
            ] as [string, string][]).map(([q, a]) => (
              <details key={q} className="faq-item">
                <summary>{q}</summary>
                <div className="faq-body">{a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <ContactSection />

      {/* ── Jobs ── */}
      <JobsSection />

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="cta-card">
          <div style={{ fontSize: 38, marginBottom: 18 }}>🪪</div>
          <h2 className="cta-h2">One card.<br /><em>Every connection.</em></h2>
          <p className="cta-sub">
            Start free. No credit card. No app download.<br />
            Your digital V.Card is live in 60 seconds.
          </p>
          {userId ? (
            <>
              <div style={{ display:'inline-flex', alignItems:'center', gap:10, background:'var(--indigo-light)', border:'1px solid var(--indigo-mid)', borderRadius:100, padding:'8px 20px', marginBottom:20, fontSize:14, fontWeight:600, color:'var(--indigo)' }}>
                <span style={{ fontSize:18 }}>👋</span> Welcome back, {firstName}!
              </div>
              <div style={{ margin:'0 auto 20px', maxWidth:320 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <span style={{ fontSize:14, color:'var(--t2)', fontWeight:500 }}>Card completion</span>
                  <span style={{ fontSize:15, fontWeight:800, color: pct === 100 ? '#059669' : 'var(--indigo)' }}>{pct}%</span>
                </div>
                <div style={{ height:8, background:'var(--bg2)', borderRadius:4, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`, background: pct === 100 ? 'linear-gradient(90deg,#059669,#34d399)' : 'linear-gradient(90deg,#6366F1,#7C3AED)', borderRadius:4 }} />
                </div>
              </div>
              <a href={FRONTEND_URL} className="btn-primary-lg" style={{ fontSize:16, padding:'15px 36px' }}>
                {pct === 100 ? 'Open My App →' : 'Complete My Card →'}
              </a>
            </>
          ) : (
            <>
              <a href="/sign-up" className="btn-primary-lg" style={{ fontSize: 16, padding: '15px 36px' }}>
                Create My Free V.Card
              </a>
              <a href="/sign-in" className="signin-link">
                Already have an account? <strong>Sign in →</strong>
              </a>
            </>
          )}
          <div className="cta-benefits">
            <span><span className="chk">✓</span> Free forever</span>
            <span><span className="chk">✓</span> No app download</span>
            <span><span className="chk">✓</span> Works on every phone</span>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <div>
          <div className="footer-logo">
            <svg height="20" viewBox="0 0 112 38" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display:'block' }}>
              <path d="M18.7357 37.1127C20.8454 37.1127 22.7768 36.3187 24.1736 34.8766C25.5627 33.442 26.3286 31.4565 26.3286 29.2852H23.0879C23.0879 30.6096 22.6472 31.7946 21.8457 32.6221C21.0539 33.4398 19.978 33.8719 18.7357 33.8719C16.2469 33.8719 14.3695 31.9923 14.3695 29.5012H11.1288C11.1288 31.585 11.9109 33.5122 13.3314 34.9274C14.7454 36.336 16.6649 37.1127 18.7347 37.1127H18.7357Z" fill="#111111"/>
              <path d="M23.0876 29.2889L26.3286 29.2792C26.3178 25.5987 24.8378 22.1614 22.1629 19.6011C19.5766 17.1252 16.098 15.7867 12.6193 15.9304C9.25736 16.0676 6.09634 17.5216 3.71639 20.0235C1.32455 22.5384 0.00440025 25.8267 7.82013e-05 29.2824L3.24104 29.2868C3.24753 23.9222 7.5148 19.3829 12.7522 19.169C15.3536 19.061 17.9691 20.0732 19.9223 21.9431C21.9555 23.8887 23.0801 26.4986 23.0887 29.2889H23.0876Z" fill="#111111"/>
              <path d="M34.2144 29.5056L37.4553 29.4959C37.4445 25.8154 35.9645 22.378 33.2896 19.8178C30.7033 17.3418 27.2247 16.0045 23.746 16.1471C20.3841 16.2843 17.223 17.7383 14.8431 20.2402C12.4513 22.755 11.1311 26.0433 11.1268 29.4991L14.3678 29.5034C14.3742 24.1388 18.6415 19.5996 23.8789 19.3857C26.4825 19.2777 29.0958 20.2899 31.049 22.1598C33.0822 24.1054 34.2068 26.7153 34.2154 29.5056H34.2144Z" fill="#111111"/>
              <path d="M25.896 3.25586C24.4927 3.30123 23.2429 3.87917 22.3237 5.10094C21.8127 5.78043 21.507 6.55065 21.4174 7.39866C21.2283 9.19837 21.8268 10.7043 23.1965 11.872C24.6753 13.1327 26.7774 13.2569 28.4237 12.2328C29.5698 11.5188 30.2709 10.4817 30.5517 9.17461C30.892 7.59527 30.5701 6.14663 29.5428 4.89137C28.6354 3.78194 27.4256 3.27963 25.896 3.25586Z" fill="#111111"/>
              <path d="M5.46739 6.78738C5.48684 7.82983 5.86275 9.09266 6.64159 10.2248C7.38587 11.3072 8.3397 12.1412 9.58412 12.6003C11.2574 13.2171 12.9004 13.122 14.4764 12.2902C15.8278 11.5773 16.7968 10.4916 17.4082 9.09266C17.8899 7.98971 18.0541 6.83707 17.9191 5.6423C17.7841 4.44321 17.3714 3.34999 16.6444 2.38532C15.8451 1.32342 14.8016 0.613685 13.5172 0.255038C12.0157 -0.165183 10.5498 -0.0711981 9.13474 0.574798C7.82876 1.1711 6.8652 2.1401 6.20087 3.4094C5.70072 4.36435 5.46091 5.38412 5.46631 6.78846L5.46739 6.78738Z" fill="#111111"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M36.2342 10.0078C36.4855 10.0078 36.7034 10.1817 36.7591 10.4267L37.057 11.7365C37.1947 12.3423 37.6678 12.8153 38.2736 12.9531L39.5834 13.2509C39.8285 13.3066 40.0024 13.5245 40.0024 13.7758C40.0024 14.0271 39.8285 14.2449 39.5834 14.3007L38.2736 14.5985C37.6678 14.7362 37.1947 15.2093 37.057 15.8151L36.7591 17.1248C36.7034 17.3699 36.4855 17.5437 36.2342 17.5437C35.9829 17.5437 35.765 17.3699 35.7093 17.1248L35.4115 15.8151C35.2737 15.2093 34.8006 14.7362 34.1948 14.5985L32.885 14.3007C32.64 14.2449 32.4661 14.0271 32.4661 13.7758C32.4661 13.5245 32.64 13.3066 32.885 13.2509L34.1948 12.9531C34.8006 12.8153 35.2737 12.3423 35.4115 11.7365L35.7093 10.4267C35.765 10.1817 35.9829 10.0078 36.2342 10.0078Z" fill="#111111"/>
              <path d="M49.6104 32.0966V13.7606H52.8264L53.2104 15.8006C54.0744 14.4326 55.6344 13.4246 57.5544 13.4246C60.6504 13.4246 63.5064 16.1606 63.5064 20.4086C63.5064 24.6806 60.7464 27.3926 57.6264 27.3926C55.8984 27.3926 54.2664 26.4806 53.4504 25.1126V32.0966H49.6104ZM53.4024 20.4086C53.4024 22.4726 54.6984 23.9366 56.4744 23.9366C58.2984 23.9366 59.6184 22.4246 59.6184 20.3846C59.6184 18.3446 58.2984 16.8806 56.4984 16.8806C54.6984 16.8806 53.4024 18.3446 53.4024 20.4086ZM64.7933 32.0966V13.7606H68.0093L68.3933 15.8006C69.2573 14.4326 70.8173 13.4246 72.7373 13.4246C75.8333 13.4246 78.6893 16.1606 78.6893 20.4086C78.6893 24.6806 75.9293 27.3926 72.8093 27.3926C71.0813 27.3926 69.4493 26.4806 68.6333 25.1126V32.0966H64.7933ZM68.5853 20.4086C68.5853 22.4726 69.8813 23.9366 71.6573 23.9366C73.4813 23.9366 74.8013 22.4246 74.8013 20.3846C74.8013 18.3446 73.4813 16.8806 71.6813 16.8806C69.8813 16.8806 68.5853 18.3446 68.5853 20.4086ZM80.0001 27.0566V7.78464H83.8401V27.0566H80.0001ZM95.8148 27.3926C92.8148 27.3926 89.9108 24.6086 89.9108 20.4566C89.9108 16.2086 92.8148 13.4246 95.8148 13.4246C97.8068 13.4246 99.3188 14.4326 100.183 15.8006L100.567 13.7606H103.807V27.0566H100.567L100.183 25.0166C99.3188 26.4086 97.8068 27.3926 95.8148 27.3926ZM93.7748 20.4086C93.7748 22.4486 95.1188 23.9366 96.9428 23.9366C98.7188 23.9366 100.039 22.4726 100.039 20.4086C100.039 18.3446 98.7188 16.8806 96.9428 16.8806C95.1188 16.8806 93.7748 18.3926 93.7748 20.4086ZM105.814 27.0566V13.7606H109.654V27.0566H105.814ZM105.622 9.84864C105.622 8.69664 106.534 7.78464 107.734 7.78464C108.886 7.78464 109.822 8.69664 109.822 9.84864C109.822 11.0246 108.886 11.9366 107.734 11.9366C106.534 11.9366 105.622 11.0246 105.622 9.84864Z" fill="#111111"/>
            </svg>
          </div>
          <div className="footer-tagline">AI-powered networking for professionals</div>
        </div>
        <ul className="footer-links">
          <li><a href="/privacy">Privacy</a></li>
          <li><a href="/terms">Terms</a></li>
          <li><a href="/support">Support</a></li>
          <li><a href="/admin" style={{ color: 'var(--t4)' }}>Admin</a></li>
        </ul>
        <div className="footer-copy">© {new Date().getFullYear()} PPL AI. All rights reserved.</div>
      </footer>
    </>
  )
}
