import React from 'react'
import {
  Zap, Monitor, ShieldCheck, Cpu, ArrowRight, CheckCircle2,
  Server, Database, Lock, Clock, Layers, Activity,
  Terminal, RefreshCw, Sparkles, HardDrive,
  ExternalLink, ChevronRight
} from 'lucide-react'

interface LandingPageProps {
  onSignIn?: () => void
  onGetStarted: () => void
  onExploreDemo: () => void
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSignIn,
  onGetStarted,
  onExploreDemo,
}) => {

  return (
    <div className="landing-page-container" style={{ display: 'flex', flexDirection: 'column', gap: '72px', padding: '16px 0 80px' }}>
      {/* 1. HERO SECTION */}
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '24px',
          padding: '40px 16px 20px',
          position: 'relative',
        }}
      >
        {/* Live Status Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '999px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.1), 0 4px 16px rgba(0,0,0,0.4)',
            fontSize: '0.8rem',
            color: '#E4E4E7',
            letterSpacing: '0.02em',
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B981' }} />
          <span style={{ fontWeight: 600, color: '#FAFAFA' }}>CAMPUS CLUSTER ONLINE:</span>
          <span style={{ color: '#A1A1AA', fontFamily: 'var(--font-mono)' }}>34 / 50 Nodes Available</span>
          <span style={{ color: '#38BDF8', fontSize: '0.75rem', marginLeft: '4px' }}>• Demo Active</span>
        </div>

        {/* Hero Headline */}
        <h1
          style={{
            fontSize: 'clamp(2.6rem, 6vw, 4.5rem)',
            fontWeight: 700,
            lineHeight: '1.08',
            letterSpacing: '-0.035em',
            color: '#FAFAFA',
            maxWidth: '920px',
            textShadow: '0 2px 20px rgba(0, 0, 0, 0.8)',
          }}
        >
          Your campus hardware.<br />
          <span style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #A1A1AA 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Your browser. Your workspace.
          </span>
        </h1>

        {/* Supporting Message */}
        <p
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            color: '#A1A1AA',
            maxWidth: '720px',
            lineHeight: '1.65',
            fontWeight: 400,
          }}
        >
          IdleNode connects authorized college students to powerful, idle laboratory computers through an encrypted browser remote desktop. Run demanding software engineering, AI/ML, and simulation workloads without needing an expensive laptop.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '12px' }}>
          <button
            className="glass-btn primary"
            style={{
              minHeight: '48px',
              padding: '0 28px',
              fontSize: '0.96rem',
              fontWeight: 600,
              gap: '10px',
            }}
            onClick={onGetStarted}
          >
            <span>Start Computing</span>
            <ArrowRight size={17} />
          </button>

          <button
            className="glass-btn"
            style={{
              minHeight: '48px',
              padding: '0 26px',
              fontSize: '0.96rem',
              gap: '10px',
            }}
            onClick={onExploreDemo}
          >
            <Sparkles size={16} color="#38BDF8" />
            <span>Explore Demo Roles</span>
          </button>

          {onSignIn && (
            <button
              className="glass-btn"
              style={{
                minHeight: '48px',
                padding: '0 22px',
                fontSize: '0.96rem',
                color: '#A1A1AA',
              }}
              onClick={onSignIn}
            >
              <span>Sign In</span>
            </button>
          )}
        </div>

        {/* Small Notice */}
        <p style={{ fontSize: '0.78rem', color: '#71717A', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
          Zero client software installation required • Fully secured institutional single-sign-on
        </p>
      </section>

      {/* 2. LIVE CLUSTER METRICS DEMONSTRATION BAR */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} color="#10B981" />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#FAFAFA', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Campus Lab Cluster Telemetry
            </span>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#71717A', fontFamily: 'var(--font-mono)' }}>
            [DEMONSTRATION FEED · ACTIVE LOCAL GRID]
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          {[
            { label: 'Available Computers', val: '34 / 50', sub: '68% Lab Capacity Free', icon: Server, color: '#10B981' },
            { label: 'Total Compute Cores', val: '1,480 Cores', sub: 'AMD EPYC & Threadripper', icon: Cpu, color: '#38BDF8' },
            { label: 'Cluster Accelerator', val: '18 Dedicated GPUs', sub: 'RTX 4090 / 4080 / A5000', icon: Zap, color: '#F59E0B' },
            { label: 'Total Cluster Memory', val: '4.8 TB DDR5', sub: 'ECC Registered Memory', icon: HardDrive, color: '#A78BFA' },
            { label: 'Fair Waiting Queue', val: '2 Tasks', sub: 'Avg Wait 1.4 Minutes', icon: Clock, color: '#60A5FA' },
            { label: 'Daily Student Credit', val: '100 Credits', sub: 'Resets Midnight IST', icon: ShieldCheck, color: '#34D399' },
          ].map((item, idx) => {
            const IconComponent = item.icon
            return (
              <div
                key={idx}
                className="glass-metric-card"
                style={{ padding: '18px 20px', gap: '10px' }}
              >
                <div className="metric-card-top">
                  <span>{item.label}</span>
                  <IconComponent size={16} color={item.color} />
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#FAFAFA', letterSpacing: '-0.02em' }}>
                  {item.val}
                </div>
                <div className="metric-subtitle" style={{ fontSize: '0.76rem', color: '#71717A' }}>
                  {item.sub}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 3. FEATURED REMOTE DESKTOP INTERACTIVE PREVIEW */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.85rem', color: '#FAFAFA', fontWeight: 600, letterSpacing: '-0.02em' }}>
            Full In-Browser Remote Desktop Workspace
          </h2>
          <p style={{ color: '#A1A1AA', fontSize: '0.88rem', marginTop: '6px' }}>
            Your student laptop handles display and inputs. Demanding compilation, neural network training, and simulations run natively on lab hardware.
          </p>
        </div>

        <div
          className="remote-desktop-shell"
          style={{
            height: 'auto',
            minHeight: '480px',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Top Session Bar */}
          <div className="remote-desktop-toolbar" style={{ background: 'rgba(255, 255, 255, 0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
              <span style={{ color: '#FAFAFA', fontWeight: 600 }}>SESSION ACTIVE:</span>
              <span style={{ color: '#38BDF8', fontFamily: 'var(--font-mono)' }}>NODE-CSE-AI-01</span>
              <span style={{ color: '#71717A' }}>|</span>
              <span style={{ color: '#A1A1AA' }}>Ubuntu 24.04 LTS (NVIDIA RTX 4090 24GB)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
              <span style={{ color: '#A1A1AA' }}>LATENCY: <strong style={{ color: '#10B981' }}>18ms</strong></span>
              <span style={{ color: '#A1A1AA' }}>FPS: <strong style={{ color: '#FAFAFA' }}>60</strong></span>
              <span style={{ color: '#A1A1AA' }}>STREAM: <strong style={{ color: '#60A5FA' }}>ENCRYPTED</strong></span>
              <button
                className="glass-btn"
                style={{ minHeight: '28px', padding: '0 10px', fontSize: '0.72rem' }}
                onClick={onExploreDemo}
              >
                <span>Launch Demo Desktop</span>
                <ExternalLink size={12} />
              </button>
            </div>
          </div>

          {/* Desktop Canvas Mockup with Interactive Details */}
          <div
            style={{
              padding: '28px',
              background: 'radial-gradient(ellipse at 50% 20%, rgba(16, 24, 38, 0.9) 0%, rgba(3, 4, 8, 0.98) 100%)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* Split View: Terminal / Editor simulation */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {/* Left: Code & ML Workload Output */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '16px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  lineHeight: '1.6',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', color: '#71717A' }}>
                  <span>train_diffusion_model.py — PyTorch 2.4.0+cu124</span>
                  <span style={{ color: '#10B981' }}>CUDA Device: 0</span>
                </div>
                <div style={{ color: '#38BDF8', marginTop: '10px' }}>
                  $ python -m torch.distributed.launch train.py --epochs 100 --batch-size 64
                </div>
                <div style={{ color: '#A1A1AA', marginTop: '6px' }}>
                  [INFO] Allocating TensorCore memory: 18.4 GB / 24.0 GB VRAM<br />
                  [EPOCH 42/100] Loss: 0.0214 | Step Time: 14.2ms | Throughput: 4,500 samples/sec<br />
                  [CHECKPOINT] Model weights saved to /workspace/checkpoints/ep42.pt (1.8 GB)<br />
                  <span style={{ color: '#34D399' }}>✓ Validation accuracy reached 98.4% on validation split</span>
                </div>
              </div>

              {/* Right: Live Remote GPU Telemetry */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '16px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  lineHeight: '1.6',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', color: '#71717A' }}>
                  <span>nvidia-smi Telemetry Stream</span>
                  <span style={{ color: '#34D399' }}>Driver 560.35.03</span>
                </div>
                <div style={{ color: '#FAFAFA', marginTop: '10px' }}>
                  NVIDIA GeForce RTX 4090 | Temp: 58°C | Pwr: 310W / 450W<br />
                  GPU Utilization: <strong style={{ color: '#10B981' }}>98%</strong> | Fan: 45%<br />
                  VRAM: <strong style={{ color: '#38BDF8' }}>18,842 MiB / 24,564 MiB</strong> (76% Occ.)<br />
                  Active Student Process: PID 8412 python (Aarav Sharma)
                </div>
                <div style={{ marginTop: '14px', padding: '8px 12px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', color: '#6EE7B7', fontSize: '0.74rem' }}>
                  ℹ️ Real hardware remote streaming requires Apache Guacamole or WebRTC gateway. In local development, native sandbox execution is active.
                </div>
              </div>
            </div>

            {/* Bottom Status Callout */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#A1A1AA' }}>
                <CheckCircle2 size={16} color="#10B981" />
                <span>5-Minute Network Disconnect Grace Period Active</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ fontSize: '0.75rem', color: '#71717A', fontFamily: 'var(--font-mono)' }}>
                  Rate: 25 Credits/Hr (GPU Profile)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. VISUAL ARCHITECTURE & COMPUTING PIPELINE */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#38BDF8', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
            Decentralized Grid Architecture
          </div>
          <h2 style={{ fontSize: '1.9rem', color: '#FAFAFA', fontWeight: 600, letterSpacing: '-0.02em' }}>
            How Student Laptops Connect to Campus Laboratories
          </h2>
          <p style={{ color: '#A1A1AA', fontSize: '0.88rem', maxWidth: '640px', margin: '8px auto 0' }}>
            IdleNode bridges client browsers and lab hardware through an atomic controller, isolated sandboxing, and secure gateway streaming.
          </p>
        </div>

        {/* 4-Node Pipeline Flow */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', position: 'relative' }}>
          {[
            {
              step: '01',
              title: 'Student Browser',
              sub: 'Zero Client Setup',
              desc: 'Operate from any low-specification laptop via Chrome, Edge, or Firefox. Only receives compressed video frames and sends encrypted input events.',
              icon: Monitor,
              accent: '#38BDF8',
            },
            {
              step: '02',
              title: 'Secure Controller & Scheduler',
              sub: 'Fair Queuing & RBAC',
              desc: 'Enforces institutional identity, evaluates CPU/RAM/GPU profiles, locks idle nodes atomically to prevent double-allocation, and manages credit balances.',
              icon: ShieldCheck,
              accent: '#10B981',
            },
            {
              step: '03',
              title: 'Remote Streaming Gateway',
              sub: 'Guacamole / WebRTC',
              desc: 'Translates laboratory desktop outputs into low-latency in-browser streams without ever exposing internal campus RDP or SSH ports to the public internet.',
              icon: Layers,
              accent: '#F59E0B',
            },
            {
              step: '04',
              title: 'Campus Laboratory Worker',
              sub: 'Native Compute Execution',
              desc: 'A background worker agent manages workload isolation, reports hardware telemetry, mounts private student project storage, and scrubs temporary data on teardown.',
              icon: Server,
              accent: '#A78BFA',
            },
          ].map((item, idx) => {
            const IconComp = item.icon
            return (
              <div
                key={idx}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.09)',
                  borderRadius: '20px',
                  padding: '24px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.08)',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      display: 'grid',
                      placeItems: 'center',
                      color: item.accent,
                    }}
                  >
                    <IconComp size={20} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600, color: '#71717A' }}>
                    {item.step}
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.05rem', color: '#FAFAFA', fontWeight: 600 }}>{item.title}</h3>
                  <div style={{ fontSize: '0.74rem', color: item.accent, fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                    {item.sub}
                  </div>
                </div>

                <p style={{ color: '#A1A1AA', fontSize: '0.82rem', lineHeight: '1.6' }}>
                  {item.desc}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* 5. HOW IT WORKS (4-STEP STUDENT JOURNEY) */}
      <section
        style={{
          background: 'rgba(255, 255, 255, 0.015)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '36px 30px',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.8rem', color: '#FAFAFA', fontWeight: 600, letterSpacing: '-0.02em' }}>
              The 4-Step Student Computing Journey
            </h2>
            <p style={{ color: '#A1A1AA', fontSize: '0.86rem', marginTop: '4px' }}>
              Transparent, fair, and designed around institutional academic policies.
            </p>
          </div>

          <button
            className="glass-btn primary"
            style={{ minHeight: '40px', padding: '0 20px', fontSize: '0.86rem' }}
            onClick={onGetStarted}
          >
            <span>Create Student Account</span>
            <ArrowRight size={15} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          {[
            {
              num: '1',
              title: 'Institutional Verification',
              desc: 'Register using your college institutional email and student roll number. Your account is verified and reviewed by authorized staff.',
            },
            {
              num: '2',
              title: 'Select Workload & Duration',
              desc: 'Choose from General Desktop, Dev CPU, Data Science, or ML GPU profiles. Preview estimated credit consumption before launch.',
            },
            {
              num: '3',
              title: 'Atomic Match or Fair Queue',
              desc: 'The scheduler matches an authorized idle computer or holds your position in a FIFO queue with estimated time-to-availability.',
            },
            {
              num: '4',
              title: 'Operate Desktop & Save Files',
              desc: 'Work directly through browser desktop streaming. Files saved to your private project directory persist across future sessions.',
            },
          ].map((step, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  display: 'grid',
                  placeItems: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#FAFAFA',
                }}
              >
                {step.num}
              </div>
              <h4 style={{ fontSize: '0.98rem', color: '#FAFAFA', fontWeight: 600, marginTop: '4px' }}>{step.title}</h4>
              <p style={{ color: '#A1A1AA', fontSize: '0.82rem', lineHeight: '1.6' }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. PLATFORM CAPABILITIES GRID (10 CARDS) */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.85rem', color: '#FAFAFA', fontWeight: 600, letterSpacing: '-0.02em' }}>
            Built for Academic Computing at Scale
          </h2>
          <p style={{ color: '#A1A1AA', fontSize: '0.88rem', marginTop: '6px' }}>
            Every capability required to run high-density university laboratory grids reliably.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '16px' }}>
          {[
            { title: 'Browser Remote Desktop', desc: 'No client app installation or configuration needed on student devices.', icon: Monitor },
            { title: 'High-Performance Grid', desc: 'Connects to AMD Threadripper, EPYC, and dedicated NVIDIA GeForce/RTX GPUs.', icon: Cpu },
            { title: 'Workload-Aware Matching', desc: 'Computers allocated based on memory, core count, and CUDA requirements.', icon: Zap },
            { title: 'Fair Waiting Queue', desc: 'Deterministic queue prevents compute monopolization during peak project deadlines.', icon: Clock },
            { title: 'Private Project Storage', desc: 'Student-owned isolated directories with strict ownership enforcement.', icon: Database },
            { title: 'Resource Credit Ledger', desc: 'Transparent daily allowances (100 credits) with session-level accounting.', icon: ShieldCheck },
            { title: '5-Minute Grace Period', desc: 'Reconnect smoothly if your Wi-Fi drops without losing running simulations.', icon: RefreshCw },
            { title: 'Auditable Supervision', desc: 'Lab assistants and HODs supervise health and occupancy without invading student privacy.', icon: Activity },
            { title: 'Automated Node Sanitization', desc: 'Worker agent scrubs temporary files and resets state upon session termination.', icon: Terminal },
            { title: 'Role-Based Access Control', desc: 'Strict server-side enforcement ensures students compute and staff supervise.', icon: Lock },
          ].map((feat, idx) => {
            const FeatIcon = feat.icon
            return (
              <div
                key={idx}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.05)',
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.06)', display: 'grid', placeItems: 'center', color: '#FAFAFA' }}>
                  <FeatIcon size={18} />
                </div>
                <h4 style={{ fontSize: '0.98rem', color: '#FAFAFA', fontWeight: 600 }}>{feat.title}</h4>
                <p style={{ color: '#A1A1AA', fontSize: '0.82rem', lineHeight: '1.55' }}>{feat.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* 7. ENTERPRISE CYBERSECURITY & PRIVACY SECTION */}
      <section
        style={{
          background: 'rgba(255, 255, 255, 0.015)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          borderRadius: '24px',
          padding: '36px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: '32px',
        }}
      >
        <div>
          <div style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', fontWeight: 600, letterSpacing: '0.04em' }}>
            <ShieldCheck size={18} />
            <span>CAMPUS CYBERSECURITY &amp; PRIVACY</span>
          </div>
          <h2 style={{ fontSize: '1.85rem', color: '#FAFAFA', fontWeight: 600, marginTop: '8px', letterSpacing: '-0.02em' }}>
            Academic Integrity by Architecture, Not Policy
          </h2>
          <p style={{ color: '#A1A1AA', fontSize: '0.88rem', marginTop: '12px', lineHeight: '1.65' }}>
            IdleNode is designed from the ground up for strict isolation. Raw RDP, SSH, and VNC ports are never exposed to campus Wi-Fi or public networks. All interactions flow through an authenticated gateway abstraction.
          </p>
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button
              className="glass-btn"
              style={{ minHeight: '38px', padding: '0 16px', fontSize: '0.84rem' }}
              onClick={onExploreDemo}
            >
              <span>Verify Security Controls</span>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            {
              title: 'Private Student Storage',
              desc: 'Storage paths are validated strictly on the server with user ownership checks, preventing directory traversal and unauthorized administrative reading.',
            },
            {
              title: 'Automated Worker Teardown',
              desc: 'Upon session end, temporary files and scratch spaces are purged automatically before the lab computer is returned to the available cluster pool.',
            },
            {
              title: 'Immutable Administrative Audit Logs',
              desc: 'Every privileged operation—including quota adjustments, approvals, and maintenance toggles—is recorded with timestamp, actor, IP, and reason.',
            },
            {
              title: 'One-Session Concurrency Lock',
              desc: 'Students may consume only one active machine at a time, preventing compute hoarding and guaranteeing fair access for classmates.',
            },
          ].map((item, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '12px' }}>
              <CheckCircle2 size={18} style={{ color: '#10B981', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: '#FAFAFA', fontSize: '0.88rem' }}>{item.title}</strong>
                <p style={{ color: '#71717A', fontSize: '0.8rem', marginTop: '2px', lineHeight: '1.5' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. FOR COLLEGES & LABS SECTION */}
      <section
        style={{
          border: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.015)',
          borderRadius: '20px',
          padding: '30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div style={{ maxWidth: '640px' }}>
          <div style={{ color: '#38BDF8', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            For Department Heads &amp; Lab Supervisors
          </div>
          <h3 style={{ fontSize: '1.45rem', color: '#FAFAFA', fontWeight: 600, marginTop: '6px' }}>
            Turn Idle Evening &amp; Weekend Labs into High-ROI Research Grids
          </h3>
          <p style={{ color: '#A1A1AA', fontSize: '0.86rem', marginTop: '6px', lineHeight: '1.6' }}>
            Universities invest heavily in laboratory hardware that sits idle 14+ hours per day. IdleNode activates these machines for student homework, senior capstone projects, and AI model training with complete institutional control.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            className="glass-btn primary"
            style={{ minHeight: '44px', padding: '0 24px', fontSize: '0.9rem' }}
            onClick={onExploreDemo}
          >
            <span>Explore Demo Roles</span>
          </button>
        </div>
      </section>

      {/* 9. FINAL CTA SECTION */}
      <section
        style={{
          textAlign: 'center',
          padding: '40px 20px',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '18px',
        }}
      >
        <h2 style={{ fontSize: '2.2rem', color: '#FAFAFA', fontWeight: 700, letterSpacing: '-0.02em' }}>
          Ready to experience campus-powered computing?
        </h2>
        <p style={{ color: '#A1A1AA', fontSize: '0.95rem', maxWidth: '580px', lineHeight: '1.6' }}>
          Log in with your college credentials or jump into the interactive multi-role demo environment immediately.
        </p>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' }}>
          <button
            className="glass-btn primary"
            style={{ minHeight: '46px', padding: '0 28px', fontSize: '0.95rem' }}
            onClick={onGetStarted}
          >
            <span>Get Started</span>
            <ArrowRight size={16} />
          </button>
          <button
            className="glass-btn"
            style={{ minHeight: '46px', padding: '0 24px', fontSize: '0.95rem' }}
            onClick={onExploreDemo}
          >
            <span>Explore Demo Roles</span>
          </button>
        </div>
      </section>

      {/* 10. PROFESSIONAL FOOTER */}
      <footer
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '28px',
          color: '#71717A',
          fontSize: '0.82rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="brand-dot" />
          <strong style={{ color: '#E4E4E7' }}>IdleNode Campus Platform</strong>
          <span>•</span>
          <span>Democratizing Student Compute with Decentralized Lab Grids</span>
        </div>

        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <span style={{ cursor: 'pointer', color: '#A1A1AA' }} onClick={onExploreDemo}>Demo Roles</span>
          <span style={{ cursor: 'pointer', color: '#A1A1AA' }} onClick={onGetStarted}>Student Register</span>
          <span style={{ cursor: 'pointer', color: '#A1A1AA' }} onClick={onSignIn}>Sign In</span>
          <span>Institutional Policies</span>
          <span>Security Architecture</span>
          <span>© 2026 IdleNode</span>
        </div>
      </footer>
    </div>
  )
}
