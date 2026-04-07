const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'HeroSection.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The new CSS block to replace everything inside <style>{` ... `}</style>
const newCss = `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=Montserrat:wght@300;400;500;600;700&family=Cinzel:wght@400;500;700&display=swap');

        /* ── Core Keyframes ── */
        @keyframes hs-fadeUp   { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes hs-scaleIn  { from{opacity:0;transform:scale(.95) translateY(15px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes hs-smoothFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes hs-pulseGlow { 0%,100%{opacity:.4; transform:scale(1)} 50%{opacity:.7; transform:scale(1.05)} }

        * { box-sizing:border-box; }
        html, body, #root { margin:0; padding:0; width:100%; min-height:100%; overflow-x:hidden; }

        .hs-root {
          min-height:100vh;
          position:relative;
          overflow-x:hidden;
          font-family:'Montserrat',sans-serif;
          background:#08040f; 
          color:#f7efff;
        }

        /* ── Soft Ambient Background ── */
        .hs-bg-grid { display: none; /* Removed for cleaner look */ }
        .hs-vignette {
          position:absolute; inset:0;
          background:radial-gradient(circle at 50% 0%, rgba(30,20,45,.4) 0%, transparent 60%),
                     radial-gradient(ellipse at 50% 30%, rgba(10,5,20,.6) 0%, rgba(8,4,15,.95) 80%, #08040f 100%);
          pointer-events:none; z-index:1;
        }
        
        .hs-orb {
          position:absolute; border-radius:999px;
          filter:blur(120px); pointer-events:none; z-index:0;
          animation:hs-pulseGlow 12s ease-in-out infinite;
        }
        .hs-orb.one   { width:600px;height:600px;top:-200px;left:-100px;background:radial-gradient(circle,rgba(212,175,55,.08),transparent 70%); }
        .hs-orb.two   { width:500px;height:500px;right:-150px;top:100px;background:radial-gradient(circle,rgba(110,90,160,.12),transparent 70%);animation-delay:-4s; }
        .hs-orb.three { width:700px;height:700px;left:50%;transform:translateX(-50%);bottom:-100px;background:radial-gradient(circle,rgba(140,110,190,.06),transparent 70%);animation-delay:-8s; }

        .hs-shell { position:relative; z-index:2; width:100%; }

        .hs-navbar-wrap {
          position:sticky; top:0; z-index:120;
          backdrop-filter:blur(24px);
          background:rgba(8,4,15,.75);
          border-bottom:1px solid rgba(255,255,255,.04);
        }

        /* ── Hero Section ── */
        .hs-hero {
          position:relative; z-index:5;
          padding:80px 20px 60px;
          transition:padding .4s ease;
        }
        .hs-hero.compact { padding-top:40px; padding-bottom:30px; }
        .hs-center { width:min(1200px,calc(100% - 32px)); margin:0 auto; display:flex; flex-direction:column; align-items:center; }

        /* Elegant Floating Badges (Glassmorphism) */
        .hs-floating-badge {
          position:absolute; z-index:9;
          padding:12px 18px; border-radius:12px;
          background:rgba(255,255,255,.02);
          border:1px solid rgba(255,255,255,.06);
          box-shadow:0 10px 30px rgba(0,0,0,.3);
          backdrop-filter:blur(12px);
          animation:hs-smoothFloat 6s ease-in-out infinite;
        }
        .hs-floating-badge.left  { left:5%;top:50%; }
        .hs-floating-badge.right { right:5%;top:60%;animation-delay:-3s; }
        .hs-floating-badge .mini { font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;color:rgba(212,175,55,.8);font-weight:600;display:block;margin-bottom:4px; }
        .hs-floating-badge .txt  { font-size:12.5px;color:rgba(255,255,255,.85);letter-spacing:.03em; }

        /* Minimal Crown/Logo Line */
        .hs-crown-wrap {
          display:flex; align-items:center; justify-content:center;
          margin-bottom:24px;
          animation:hs-fadeUp .8s cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        .hs-crown-icon { width:24px;height:24px;color:rgba(212,175,55,.9); }

        /* Eyebrow */
        .hs-eyebrow {
          display:flex; align-items:center; justify-content:center;
          gap:16px; margin-bottom:20px;
          animation:hs-fadeUp .8s cubic-bezier(0.2, 0.8, 0.2, 1) .1s both;
        }
        .hs-eyeline   { width:60px;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.15)); }
        .hs-eyeline.r { background:linear-gradient(270deg,transparent,rgba(255,255,255,.15)); }
        .hs-eyetext   { font-size:11.5px;letter-spacing:.25em;text-transform:uppercase;color:rgba(255,255,255,.5);font-weight:500; }

        /* Hero Title */
        .hs-title {
          margin:0; text-align:center;
          font-family:'Cinzel',serif;
          font-size:clamp(3.5rem,8vw,6.5rem);
          font-weight:400; line-height:1; letter-spacing:.12em;
          background:linear-gradient(180deg,#ffffff 0%,#e0d8f0 50%,#cba27b 100%);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
          animation:hs-fadeUp .9s cubic-bezier(0.2, 0.8, 0.2, 1) .2s both;
          text-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .hs-title-sub {
          display:block; margin-top:20px;
          font-size:clamp(.8rem,1.2vw,.95rem);
          letter-spacing:.35em; color:rgba(255,255,255,.4);
          text-transform:uppercase; font-family:'Montserrat',sans-serif; font-weight:400;
        }
        
        .hs-ornate { display: none; /* Removed for cleaner look */ }

        /* Description */
        .hs-desc {
          max-width:580px; margin:32px auto 40px; text-align:center;
          color:rgba(255,255,255,.55);
          font-size:clamp(.95rem,1.4vw,1.1rem); line-height:1.9; font-weight:300;
          animation:hs-fadeUp .8s cubic-bezier(0.2, 0.8, 0.2, 1) .3s both;
        }

        /* CTA buttons */
        .hs-cta {
          display:flex; align-items:center; justify-content:center;
          gap:16px; flex-wrap:wrap; margin-bottom:40px;
          animation:hs-fadeUp .8s cubic-bezier(0.2, 0.8, 0.2, 1) .4s both;
        }
        .hs-btn-main, .hs-btn-sub {
          border:none; border-radius:8px; padding:15px 32px;
          cursor:pointer; font-family:'Montserrat',sans-serif;
          font-size:12px; font-weight:600; letter-spacing:.15em;
          text-transform:uppercase;
          transition:all .3s ease;
        }
        .hs-btn-main {
          background:rgba(212,175,55,.9);
          color:#08040f;
          box-shadow:0 8px 24px rgba(212,175,55,.2);
        }
        .hs-btn-sub {
          background:rgba(255,255,255,.03);
          border:1px solid rgba(255,255,255,.1);
          color:rgba(255,255,255,.8);
        }
        .hs-btn-main:hover { transform:translateY(-2px); background:#d4af37; box-shadow:0 12px 30px rgba(212,175,55,.3); }
        .hs-btn-sub:hover  { transform:translateY(-2px); background:rgba(255,255,255,.06); border-color:rgba(255,255,255,.2); color:#fff; }

        /* Sleek Search Block */
        .hs-search-block {
          width:min(720px,100%); margin:0 auto 30px;
          animation:hs-fadeUp .8s cubic-bezier(0.2, 0.8, 0.2, 1) .5s both;
        }
        .hs-search-wrap {
          display:grid;
          grid-template-columns:auto 1px 1fr auto;
          align-items:center; min-height:64px; border-radius:32px;
          overflow:hidden;
          background:rgba(255,255,255,.04);
          border:1px solid rgba(255,255,255,.08);
          box-shadow:0 15px 40px rgba(0,0,0,.4);
          backdrop-filter:blur(16px);
          transition:border-color .3s;
        }
        .hs-search-wrap:focus-within { border-color:rgba(212,175,55,.4); }
        
        .hs-loc-btn {
          height:100%; display:flex; align-items:center; gap:10px;
          padding:0 24px; background:transparent; border:none;
          color:rgba(255,255,255,.6); font-size:13px; font-weight:500;
          cursor:pointer; max-width:240px; letter-spacing:.02em;
          transition:color .2s;
        }
        .hs-loc-btn:hover { color:rgba(255,255,255,.9); }
        .hs-loc-btn.detected { color:#d4af37; }
        .hs-loc-icon { flex-shrink:0; color:inherit; }
        @keyframes hs-spin { to{transform:rotate(360deg)} }
        .hs-loc-icon.spinning{ animation:hs-spin .95s linear infinite; }
        .hs-loc-text { overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
        .hs-divider  { width:1px;height:24px;background:rgba(255,255,255,.1); }
        .hs-search-input {
          width:100%; height:100%; border:none; outline:none;
          background:transparent; color:#fff; font-size:14px; padding:0 20px; font-family:'Montserrat';
        }
        .hs-search-input::placeholder { color:rgba(255,255,255,.3); font-weight:300; }
        .hs-search-btn {
          height:100%; min-width:110px; border:none; border-radius:32px;
          background:rgba(212,175,55,.9); margin:4px;
          color:#08040f; font-weight:600; font-size:12px; letter-spacing:.08em; text-transform:uppercase;
          cursor:pointer; transition:all .3s ease;
        }
        .hs-search-btn:hover { background:#d4af37; box-shadow:0 4px 15px rgba(212,175,55,.3); }
        .hs-loc-error { margin-top:10px;font-size:12px;color:#e87c7c;text-align:center; }

        /* Minimal Tabs */
        .hs-tabs-shell {
          display:flex; justify-content:center;
          animation:hs-fadeUp .8s cubic-bezier(0.2, 0.8, 0.2, 1) .6s both;
        }
        .hs-tabs {
          display:flex; align-items:center; gap:24px;
          border-bottom:1px solid rgba(255,255,255,.06);
          padding-bottom:1px;
        }
        .hs-tab {
          border:none; background:transparent;
          color:rgba(255,255,255,.4); 
          padding:12px 0; font-weight:500; font-size:13px; letter-spacing:.05em; text-transform:uppercase;
          cursor:pointer; transition:color .3s;
          position:relative;
        }
        .hs-tab:hover { color:rgba(255,255,255,.8); }
        .hs-tab.active { color:#d4af37; }
        .hs-tab::after {
          content:''; position:absolute; bottom:-1px; left:0; width:100%; height:1px;
          background:#d4af37;
          transform:scaleX(0); transition:transform .3s ease;
        }
        .hs-tab.active::after { transform:scaleX(1); }

        /* ── Menu Section ── */
        .hs-menu-zone { position:relative;z-index:5;padding:20px 14px 80px; }
        .hs-menu-center { width:min(1520px,100%);margin:0 auto; }

        /* Docked sticky bar */
        .hs-docked-bar {
          position:sticky; top:74px; z-index:110;
          display:flex; flex-direction:column; gap:16px;
          margin-bottom:30px; padding:20px 24px;
          border-radius:16px;
          background:rgba(8,4,15,.85);
          border:1px solid rgba(255,255,255,.04);
          backdrop-filter:blur(24px);
          box-shadow:0 15px 40px rgba(0,0,0,.4);
        }
        .hs-docked-top {
          display:flex; align-items:center;
          justify-content:space-between; gap:20px; flex-wrap:wrap;
        }
        .hs-title-left { display:flex;flex-direction:column;gap:6px; }
        .hs-mini-label {
          font-size:10px; letter-spacing:.25em; text-transform:uppercase;
          color:rgba(212,175,55,.8); font-weight:600;
        }
        .hs-section-title {
          font-family:'Cinzel',serif; font-size:2rem;
          color:#fff; letter-spacing:.05em; font-weight:400;
        }

        /* Match info */
        .hs-match-info {
          display:inline-flex; align-items:center; gap:8px;
          padding:8px 16px; border-radius:8px;
          background:rgba(255,255,255,.03);
          border:1px solid rgba(255,255,255,.06);
          color:rgba(255,255,255,.6); font-size:12px; font-weight:300;
          margin:0 0 20px;
        }

        /* ── Food Grid ── */
        .hs-grid-food { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; }

        /* ── Elegant Food Card ── */
        .hs-food-card {
           position:relative; overflow:hidden;
           border-radius:12px;
           background:rgba(255,255,255,.02);
           border:1px solid rgba(255,255,255,.05);
           cursor:pointer;
           transition:all .4s ease;
        }
        .hs-food-card:hover {
           transform:translateY(-6px);
           background:rgba(255,255,255,.03);
           border-color:rgba(255,255,255,.1);
           box-shadow:0 20px 40px rgba(0,0,0,.5);
        }

        /* Image area */
        .hs-card-media {
          height:200px; position:relative;
          background:linear-gradient(135deg,rgba(255,255,255,.02),rgba(255,255,255,.05));
          overflow:hidden;
        }
        .hs-card-media img {
          width:100%; height:100%; object-fit:cover; display:block;
          transition:transform .7s ease;
        }
        .hs-food-card:hover .hs-card-media img { transform:scale(1.05); }

        .hs-fallback { width:100%;height:100%;display:grid;place-items:center;font-size:3rem; opacity:.5; }
        .hs-card-overlay {
          position:absolute; inset:0;
          background:linear-gradient(to bottom,transparent 40%,rgba(8,4,15,.8) 100%);
        }
        .hs-rest-chip {
          position:absolute; left:16px; bottom:16px;
          color:rgba(255,255,255,.9); font-size:12px; font-weight:500; letter-spacing:.02em;
          max-width:calc(100% - 32px);
          overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
        }
        .hs-discount {
          position:absolute; top:12px; right:12px;
          padding:6px 10px; border-radius:4px;
          background:rgba(212,175,55,.9);
          color:#08040f; font-size:10px; font-weight:700; letter-spacing:.05em; text-transform:uppercase;
        }

        /* Card body */
        .hs-card-body { padding:20px; }
        .hs-card-top {
          display:flex; align-items:flex-start;
          justify-content:space-between; gap:12px; margin-bottom:10px;
        }
        .hs-card-name { font-size:16px;font-weight:600;color:#fff;line-height:1.4; font-family:'Cinzel', serif; letter-spacing:0.02em; }
        .hs-chip-veg {
          flex-shrink:0; font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em;
        }
        .hs-chip-veg.veg    { color:#74b886; }
        .hs-chip-veg.nonveg { color:#d97777; }
        
        .hs-card-desc {
          font-size:12px; line-height:1.6; font-weight:300;
          color:rgba(255,255,255,.5); min-height:40px; margin-bottom:16px;
          display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
        }
        .hs-card-meta {
          display:flex; align-items:center; justify-content:space-between;
          gap:12px; margin-bottom:16px; flex-wrap:wrap;
        }
        .hs-card-tags { display:flex;align-items:center;gap:8px;flex-wrap:wrap; }
        .hs-tag {
          font-size:10px; font-weight:500; color:rgba(255,255,255,.4); text-transform:uppercase; letter-spacing:0.04em;
        }
        .hs-tag.dot { display:none; }
        .hs-price { display:flex;align-items:baseline;gap:8px; }
        .hs-price-now { font-size:16px;font-weight:600;color:#d4af37; }
        .hs-price-old { font-size:12px;color:rgba(255,255,255,.3);text-decoration:line-through; }

        /* CTA row */
        .hs-card-cta {
          display:flex; align-items:center; justify-content:space-between;
          border-top:1px solid rgba(255,255,255,.06);
          padding-top:16px;
        }
        .hs-card-cta-left { color:rgba(255,255,255,.4);font-size:11px; font-weight:300; }

        /* Minimal Add to Cart */
        .hs-cart-btn {
          display:flex; align-items:center; gap:6px;
          border:1px solid rgba(212,175,55,.4); border-radius:6px; padding:8px 14px;
          background:transparent;
          color:rgba(212,175,55,.9); font-weight:500; font-size:11px;
          text-transform:uppercase; letter-spacing:.05em; cursor:pointer;
          font-family:'Montserrat',sans-serif;
          transition:all .3s ease;
        }
        .hs-cart-btn:hover {
          background:rgba(212,175,55,.9); color:#08040f;
        }
        .hs-cart-btn.added {
          border-color:#74b886; color:#74b886;
        }
        @keyframes hs-cartPop {
          0%   { transform:scale(1); }
          50%  { transform:scale(1.1); }
          100% { transform:scale(1); }
        }
        .hs-cart-btn.added { animation:hs-cartPop .3s ease; }
        .hs-cart-btn svg { width:12px;height:12px; }

        /* ── Skeleton ── */
        .hs-skeleton-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:20px; }
        .hs-skeleton {
          height:340px; border-radius:12px;
          background:linear-gradient(90deg,rgba(255,255,255,.02),rgba(255,255,255,.05),rgba(255,255,255,.02));
          background-size:200% 100%;
          animation:hs-pulseGlow 1.5s infinite;
          border:1px solid rgba(255,255,255,.04);
        }

        /* Empty state */
        .hs-empty {
          padding:60px 20px; text-align:center;
          color:rgba(255,255,255,.4); font-weight:300; font-size:14px;
          border-radius:12px;
          background:rgba(255,255,255,.01);
          border:1px dashed rgba(255,255,255,.1);
        }

        /* Pagination */
        .hs-pagination {
          display:flex; justify-content:center; gap:8px;
          margin-top:40px; flex-wrap:wrap;
        }
        .hs-page-btn {
          min-width:36px; height:36px; border-radius:6px;
          border:1px solid rgba(255,255,255,.1);
          background:transparent;
          color:rgba(255,255,255,.6); cursor:pointer; font-weight:500; font-size:13px;
          transition:all .3s ease;
        }
        .hs-page-btn:hover { border-color:rgba(255,255,255,.3); color:#fff; }
        .hs-page-btn.active {
          border-color:#d4af37; color:#d4af37;
        }

        /* ── Stats Section ── */
        .hs-stats-section { padding:0 20px 80px; position:relative; z-index:5; }
        .hs-stats-inner { width:min(1200px,calc(100% - 32px));margin:0 auto; }
        .hs-stats-heading {
          text-align:center; margin-bottom:40px;
          font-family:'Cinzel',serif; font-size:1.8rem; font-weight:400;
          color:#fff; letter-spacing:.05em;
        }
        .hs-stats { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:24px; }
        .hs-stat {
          padding:32px 24px; border-radius:12px;
          background:rgba(255,255,255,.02);
          border:1px solid rgba(255,255,255,.05);
          text-align:center; transition:transform .3s ease;
        }
        .hs-stat:hover { transform:translateY(-4px); border-color:rgba(255,255,255,.1); }
        .hs-stat-num {
          display:block; font-family:'Cinzel',serif; font-size:2.2rem;
          color:#d4af37; margin-bottom:8px; font-weight:400;
        }
        .hs-stat-lbl {
          display:block; font-size:12px; font-weight:300;
          color:rgba(255,255,255,.5); letter-spacing:.08em; text-transform:uppercase;
        }

        /* ── Stats divider ── */
        .hs-section-divider {
          width:min(1200px,calc(100% - 32px)); margin:0 auto 60px;
          height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,.1),transparent);
        }

        /* ── Responsive ── */
        @media (max-width:1280px) {
          .hs-grid-food       { grid-template-columns:repeat(3,1fr); }
          .hs-skeleton-grid   { grid-template-columns:repeat(3,1fr); }
        }
        @media (max-width:1080px) {
          .hs-floating-badge  { display:none; }
          .hs-grid-food       { grid-template-columns:repeat(2,1fr); }
          .hs-skeleton-grid   { grid-template-columns:repeat(2,1fr); }
          .hs-stats           { grid-template-columns:repeat(2,minmax(0,1fr)); }
        }
        @media (max-width:760px) {
          .hs-hero            { padding-top:40px; padding-bottom:30px; }
          .hs-title           { font-size:2.8rem; }
          .hs-search-wrap     { grid-template-columns:1fr;height:auto; border-radius:16px; }
          .hs-divider         { display:none; }
          .hs-loc-btn,
          .hs-search-input,
          .hs-search-btn      { min-height:56px; }
          .hs-search-input    { border-top:1px solid rgba(255,255,255,.05); border-bottom:1px solid rgba(255,255,255,.05); }
          .hs-search-btn      { width:calc(100% - 8px); margin:4px; border-radius:12px; }
          .hs-tabs            { flex-wrap:wrap; gap:16px; justify-content:center; }
          .hs-docked-bar      { top:66px;padding:16px; }
          .hs-grid-food       { grid-template-columns:1fr; }
          .hs-skeleton-grid   { grid-template-columns:1fr; }
          .hs-stats           { grid-template-columns:1fr; }
        }
`

// Regex to replace the entire <style>{` ... `}</style>
content = content.replace(/<style>\{`[\s\S]*?`\}<\/style>/, '<style>{`' + newCss + '`}</style>');

// Also update the Title "THE RESERVE" to "TABLE TIME"
content = content.replace(
  /<h1 className="hs-title">\s*THE RESERVE\s*<span className="hs-title-sub">An extraordinary experience<\/span>\s*<\/h1>/,
  '<h1 className="hs-title">\n                TABLE TIME\n                <span className="hs-title-sub">An extraordinary experience</span>\n              </h1>'
);

// Write it back
fs.writeFileSync(filePath, content, 'utf8');

console.log("Updated HeroSection successfully!");
