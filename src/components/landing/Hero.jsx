import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { signinUser, setAuthToken, rememberLogin } from '../../Services/api';
import AuthModal, { AuthAlert, AuthField } from './AuthModal';
import { useLanguage } from '../../i18n/LanguageContext';
import useSiteContent, { contactDescription, useSiteMedia, mediaSrc } from '../shared/useSiteContent';
import { Carousel } from 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { showAccountStatusPopup } from '../shared/accountStatusPopup';
import { markAdminJustSignedIn } from '../admin/AdminModals/AdminDemoPopup';
import { hasViewedTerms, openTerms, TERMS_VIEWED_EVENT } from '../shared/termsConsent';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

const NAME_ALLOWED_REGEX = /[^a-zA-Z\s]/g;
const DIGITS_ONLY_REGEX  = /[^0-9]/g;
const PASSWORD_REQUIREMENTS = [
    { key: 'length',    test: (pw) => pw.length >= 8 },
    { key: 'uppercase', test: (pw) => /[A-Z]/.test(pw) },
    { key: 'number',    test: (pw) => /[0-9]/.test(pw) },
    { key: 'symbol',    test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];
const getMissingRequirements = (pw) =>
    PASSWORD_REQUIREMENTS.filter(r => !r.test(pw)).map(r => r.key);

const apiPost = async (path, body) => {
    const res = await fetch(`${API_BASE}/auth/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    return res.json();
};

// ── EmergencyCallButton ───────────────────────────────────────────────────────
function EmergencyCallButton() {
    const { t } = useLanguage();
    // Editable by Admins under Content > Site Contacts; also the footer's hotlines.
    const { emergencyContacts } = useSiteContent();
    const [showContacts, setShowContacts] = useState(false);
    const handleCall = (n) => { window.location.href = `tel:${n}`; setShowContacts(false); };
    return (
        <>
            {showContacts && <div onClick={() => setShowContacts(false)} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:1050,backdropFilter:'blur(2px)' }} />}
            {showContacts && (
                <div style={{ position:'fixed',bottom:'96px',right:'24px',zIndex:1051,background:'#fff',borderRadius:'16px',boxShadow:'0 8px 32px rgba(0,0,0,0.22)',padding:'16px',width:'280px',animation:'slideUpFade 0.22s ease' }}>
                    <p style={{ margin:'0 0 2px',fontWeight:700,fontSize:'14px',color:'#111' }}>{t('emergencyContacts.title')}</p>
                    <p style={{ margin:'0 0 12px',fontSize:'12px',color:'#6b7280' }}>{t('emergencyContacts.subtitle')}</p>
                    <div style={{ display:'flex',flexDirection:'column',gap:'8px' }}>
                        {emergencyContacts.map(c => (
                            <button key={c.id} onClick={() => handleCall(c.number)}
                                style={{ display:'flex',alignItems:'center',gap:'12px',padding:'10px 12px',borderRadius:'10px',border:`1.5px solid ${c.color}22`,background:`${c.color}0d`,cursor:'pointer',textAlign:'left',width:'100%' }}
                                onMouseEnter={e => e.currentTarget.style.background=`${c.color}22`}
                                onMouseLeave={e => e.currentTarget.style.background=`${c.color}0d`}>
                                <div style={{ width:'38px',height:'38px',borderRadius:'50%',background:c.color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                                    <i className={`bi ${c.icon}`} style={{ color:'#fff',fontSize:'16px' }} />
                                </div>
                                <div style={{ flex:1 }}>
                                    <p style={{ margin:0,fontWeight:600,fontSize:'13px',color:'#111' }}>{c.label}</p>
                                    <p style={{ margin:0,fontSize:'11px',color:'#6b7280' }}>{contactDescription(c, t)}</p>
                                </div>
                                <div style={{ display:'flex',alignItems:'center',gap:'4px',background:c.color,color:'#fff',borderRadius:'20px',padding:'4px 10px',fontSize:'11px',fontWeight:600 }}>
                                    <i className="bi bi-telephone-fill" style={{ fontSize:'10px' }} />{t('emergencyContacts.call')}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
            <button onClick={() => setShowContacts(v => !v)} aria-label="Emergency Contacts"
                style={{ position:'fixed',bottom:'24px',right:'24px',zIndex:1052,width:'60px',height:'60px',borderRadius:'50%',background:showContacts?'linear-gradient(135deg,#7f1d1d,#dc2626)':'linear-gradient(135deg,#dc2626,#ef4444)',border:'none',boxShadow:showContacts?'0 4px 24px rgba(220,38,38,0.5)':'0 4px 20px rgba(220,38,38,0.45)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'transform 0.2s,box-shadow 0.2s,background 0.2s',transform:showContacts?'scale(1.08) rotate(15deg)':'scale(1)',animation:showContacts?'none':'pulse-ring 2s infinite' }}
                onMouseEnter={e => { if(!showContacts) e.currentTarget.style.transform='scale(1.1)'; }}
                onMouseLeave={e => { if(!showContacts) e.currentTarget.style.transform='scale(1)'; }}>
                <i className={showContacts?'bi bi-x-lg':'bi bi-telephone-fill'} style={{ color:'#fff',fontSize:showContacts?'20px':'22px' }} />
            </button>
            <style>{`
                @keyframes pulse-ring{0%{box-shadow:0 0 0 0 rgba(220,38,38,0.55),0 4px 20px rgba(220,38,38,0.45)}60%{box-shadow:0 0 0 14px rgba(220,38,38,0),0 4px 20px rgba(220,38,38,0.45)}100%{box-shadow:0 0 0 0 rgba(220,38,38,0),0 4px 20px rgba(220,38,38,0.45)}}
                @keyframes slideUpFade{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
            `}</style>
        </>
    );
}

// ── Shared OTP input box row ──────────────────────────────────────────────────
function OtpBoxes({ otp, onChange, onKeyDown, onPaste, refs }) {
    return (
        <div style={{ display:'flex',gap:'8px',justifyContent:'center',marginBottom:'24px' }} onPaste={onPaste}>
            {otp.map((digit, i) => (
                <input key={i} ref={el => refs.current[i] = el}
                    type="text" inputMode="numeric" maxLength={1} value={digit}
                    aria-label={`Digit ${i + 1} of 6`} autoComplete={i === 0 ? 'one-time-code' : 'off'}
                    onChange={e => onChange(i, e.target.value)}
                    onKeyDown={e => onKeyDown(i, e)}
                    style={{ width:'min(48px, 13vw)',height:'56px',textAlign:'center',fontSize:'1.4rem',fontWeight:800,border:`2px solid ${digit?'#6B2C3E':'#e5e7eb'}`,borderRadius:'12px',background:'#fafafa',outline:'none',color:'#6B2C3E',transition:'border-color 0.15s' }}
                    onFocus={e => e.target.style.borderColor='#6B2C3E'}
                    onBlur={e => e.target.style.borderColor=digit?'#6B2C3E':'#e5e7eb'}
                />
            ))}
        </div>
    );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
    const { t } = useLanguage();
    const siteContent = useSiteContent(); // support email for the account popups
    // Background photos: editable by Admins under Content > Site Contents.
    const { carousel: slides = [] } = useSiteMedia();
    const slidesKey = slides.map((s) => s.src).join('|');
    const carouselRef = useRef(null);
    // React remounts the carousel when the photos change (see key below), so
    // start Bootstrap's autoplay on the new element.
    useEffect(() => {
        if (!carouselRef.current) return undefined;
        const instance = Carousel.getOrCreateInstance(carouselRef.current, { interval: 4000, ride: 'carousel', pause: 'hover' });
        instance.cycle();
        return () => instance.dispose();
    }, [slidesKey]);
    // Modal visibility
    const [showSignIn,    setShowSignIn]    = useState(false);
    const [showSignUp,    setShowSignUp]    = useState(false);
    const [showForgot,    setShowForgot]    = useState(false);

    // Sign-in step: 'form' | 'remember' (the "Save Login Info" question after a
    // successful sign-in; pendingSignIn holds that sign-in until it's answered)
    const [signInStep,    setSignInStep]    = useState('form');
    const [pendingSignIn, setPendingSignIn] = useState(null);

    // Sign-up step: 'form' | 'otp'
    const [signUpStep,    setSignUpStep]    = useState('form');
    // Forgot password step: 'email' | 'otp' | 'reset' | 'done'
    const [forgotStep,    setForgotStep]    = useState('email');

    // Sign-in fields
    const [siEmail,       setSiEmail]       = useState('');
    const [siPassword,    setSiPassword]    = useState('');
    // Creating an account requires ticking "I agree", which unlocks only
    // after the Terms and Conditions have been opened (termsConsent.js).
    const [suAgree,       setSuAgree]       = useState(false);
    const [termsViewed,   setTermsViewed]   = useState(hasViewedTerms);
    useEffect(() => {
        const onViewed = () => setTermsViewed(true);
        window.addEventListener(TERMS_VIEWED_EVENT, onViewed);
        return () => window.removeEventListener(TERMS_VIEWED_EVENT, onViewed);
    }, []);
    // Before the Terms have been opened, the box opens them instead of ticking.
    const handleAgreeChange = (e) => {
        if (!termsViewed) { openTerms(); return; }
        setSuAgree(e.target.checked);
        if (e.target.checked) setError('');
    };
    const [showSiPw,      setShowSiPw]      = useState(false);

    // Sign-up fields
    const [suFirst,       setSuFirst]       = useState('');
    const [suMiddle,      setSuMiddle]      = useState('');
    const [suLast,        setSuLast]        = useState('');
    const [suUsername,    setSuUsername]    = useState('');
    const [suContact,     setSuContact]     = useState('');
    const [suEmail,       setSuEmail]       = useState('');
    const [suPassword,    setSuPassword]    = useState('');
    const [suConfirm,     setSuConfirm]     = useState('');
    const [showSuPw,      setShowSuPw]      = useState(false);
    const [showSuConfPw,  setShowSuConfPw]  = useState(false);

    // Forgot password fields
    const [fpEmail,       setFpEmail]       = useState('');
    const [fpNewPw,       setFpNewPw]       = useState('');
    const [fpConfirmPw,   setFpConfirmPw]   = useState('');
    const [showFpNewPw,   setShowFpNewPw]   = useState(false);
    const [showFpConfPw,  setShowFpConfPw]  = useState(false);

    // Shared OTP state (reused for both signup and reset)
    const [otp,           setOtp]           = useState(['','','','','','']);
    const [otpEmail,      setOtpEmail]      = useState('');
    const [resendCooldown,setResendCooldown]= useState(0);
    const otpRefs = useRef([]);

    const [isSubmitting,  setIsSubmitting]  = useState(false);
    const [error,         setError]         = useState('');
    const [successMsg,    setSuccessMsg]    = useState('');
    // Shown in Sign In when the Resident page sent the visitor here
    // (RequireResident.jsx redirects to /?signin=required).
    const [signInNotice,  setSignInNotice]  = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('signin') !== 'required') return;
        setShowSignIn(true);
        setSignInNotice(t('signIn.signInRequired'));
        // Drop the flag so refreshing doesn't reopen Sign In.
        params.delete('signin');
        const query = params.toString();
        window.history.replaceState(null, '', window.location.pathname + (query ? `?${query}` : '') + window.location.hash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Countdown timer for resend button
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const t = setTimeout(() => setResendCooldown(v => v - 1), 1000);
        return () => clearTimeout(t);
    }, [resendCooldown]);

    const clearErr = () => { setError(''); setSuccessMsg(''); };

    // ── OTP helpers ───────────────────────────────────────────────────────────
    const handleOtpChange = (i, value) => {
        const cleaned = value.replace(/\D/g, '').slice(-1);
        const next = [...otp]; next[i] = cleaned; setOtp(next);
        if (cleaned && i < 5) otpRefs.current[i + 1]?.focus();
    };
    const handleOtpKeyDown = (i, e) => {
        if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
    };
    const handleOtpPaste = (e) => {
        const text = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
        if (!text) return;
        const next = [...otp];
        text.split('').forEach((ch, i) => { if (i < 6) next[i] = ch; });
        setOtp(next);
        otpRefs.current[Math.min(text.length, 5)]?.focus();
        e.preventDefault();
    };
    const resetOtp = () => { setOtp(['','','','','','']); };

    const PasswordToggleButton = ({ visible, onToggle }) => (
        <button type="button" className="auth-toggle" onClick={onToggle} aria-label={visible?t('auth.hidePassword'):t('auth.showPassword')}>
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
    );

    // ── Close everything ──────────────────────────────────────────────────────
    const closeAll = () => {
        setShowSignIn(false); setShowSignUp(false); setShowForgot(false);
        setSignInStep('form'); setPendingSignIn(null);
        setSignUpStep('form'); setForgotStep('email');
        setSiEmail(''); setSiPassword(''); setShowSiPw(false);
        setSuFirst(''); setSuMiddle(''); setSuLast('');
        setSuUsername(''); setSuContact(''); setSuEmail('');
        setSuPassword(''); setSuConfirm(''); setSuAgree(false);
        setShowSuPw(false); setShowSuConfPw(false);
        setFpEmail(''); setFpNewPw(''); setFpConfirmPw('');
        setShowFpNewPw(false); setShowFpConfPw(false);
        resetOtp(); setOtpEmail(''); setResendCooldown(0);
        setError(''); setSuccessMsg(''); setSignInNotice('');
    };

    // ── Sign in ───────────────────────────────────────────────────────────────
    const handleSignIn = async (e) => {
        e.preventDefault(); clearErr();
        if (!siEmail.trim() || !siPassword) { setError(t('auth.bothEmailPassword')); return; }
        setIsSubmitting(true);
        try {
            const result = await signinUser(siEmail.trim(), siPassword);
            // Closed / suspended accounts: close the sign-in box and explain in a popup.
            if (!result.success && result.code) {
                closeAll();
                if (showAccountStatusPopup(result.code, t, siteContent.socials?.email)) return;
            }
            if (!result.success) { setError(result.message || t('auth.invalidCredentials')); return; }
            // Signed in: ask whether to save the login before going on.
            setPendingSignIn(result);
            setSignInStep('remember');
        } catch { setError(t('auth.serverError')); }
        finally { setIsSubmitting(false); }
    };

    // "Save Login Info": Yes swaps the session sign-in for a 30-day saved
    // login (kept after the browser closes, revocable on the server);
    // No keeps the session sign-in (gone when the browser closes).
    const answerSaveLogin = async (save) => {
        const result = pendingSignIn;
        if (!result || isSubmitting) return;
        setIsSubmitting(true);
        let token = result.token;
        let saved = false;
        if (save) {
            const remembered = await rememberLogin(result.token);
            if (remembered.success && remembered.token) { token = remembered.token; saved = true; }
            // If saving fails, the resident is still signed in for this session.
        }
        setAuthToken(token, result.isAdmin, saved);
        finishSignIn(result);
    };

    const finishSignIn = (result) => {
        if (result.isAdmin) {
            sessionStorage.setItem('adminAuthenticated', 'true');
            markAdminJustSignedIn(); // shows the admin demo video, if set
            window.location.href = '/admin'; return;
        }
        sessionStorage.setItem('userAuthenticated', 'true');
        // Store the full user object including photoUrl so the navbar
        // avatar persists across sessions without a separate profile fetch.
        sessionStorage.setItem('currentUser', JSON.stringify({
            id:       result.user.id,
            fullName: result.user.fullName,
            username: result.user.username,
            contact:  result.user.contact,
            email:    result.user.email,
            role:     result.user.role,
            photoUrl: result.user.photoUrl || null,
        }));
        localStorage.setItem('residentName', result.user.fullName);
        window.location.href = '/resident';
    };

    // ── Sign up: step 1 — send OTP ────────────────────────────────────────────
    const handleSignUpSubmit = async (e) => {
        e.preventDefault(); clearErr();
        if (!suFirst||!suLast||!suUsername||!suContact||!suEmail||!suPassword||!suConfirm) {
            setError(t('auth.fillRequired')); return;
        }
        if (suContact.length !== 10) { setError(t('auth.contactDigits')); return; }
        if (suPassword !== suConfirm) { setError(t('auth.passwordMismatch')); return; }
        const missing = getMissingRequirements(suPassword);
        if (missing.length > 0) { setError(t('auth.passwordMissing', { list: missing.map(k => t(`pwReq.${k}`)).join(', ') })); return; }
        if (!termsViewed) { setError(t('signUp.viewTermsFirst')); return; }
        if (!suAgree) { setError(t('signUp.mustAgree')); return; }

        const fullName = [suFirst, suMiddle, suLast].filter(Boolean).join(' ');
        setIsSubmitting(true);
        try {
            const result = await apiPost('request-otp', {
                fullName, username: suUsername,
                contact: `+63${suContact}`, email: suEmail, password: suPassword,
            });
            if (!result.success) { setError(result.message || t('auth.otpSendFailed')); return; }
            setOtpEmail(suEmail); resetOtp(); setSignUpStep('otp'); setResendCooldown(60);
        } catch { setError(t('auth.serverError')); }
        finally { setIsSubmitting(false); }
    };

    // ── Sign up: step 2 — verify OTP ─────────────────────────────────────────
    const handleVerifySignupOtp = async (e) => {
        e.preventDefault(); clearErr();
        const code = otp.join('');
        if (code.length < 6) { setError(t('auth.otpIncomplete')); return; }
        setIsSubmitting(true);
        try {
            const result = await apiPost('verify-otp', { email: otpEmail, otp: code });
            if (!result.success) { setError(result.message || t('auth.otpInvalid')); return; }
            setSuFirst(''); setSuMiddle(''); setSuLast('');
            setSuUsername(''); setSuContact(''); setSuEmail('');
            setSuPassword(''); setSuConfirm('');
            resetOtp(); setSignUpStep('form');
            setShowSignUp(false); setShowSignIn(true);
            setSuccessMsg(t('signUp.accountCreated'));
        } catch { setError(t('auth.serverError')); }
        finally { setIsSubmitting(false); }
    };

    const handleResendSignupOtp = async () => {
        if (resendCooldown > 0) return;
        clearErr(); setIsSubmitting(true);
        try {
            const result = await apiPost('resend-otp', { email: otpEmail });
            if (!result.success) { setError(result.message || t('auth.resendFailed')); return; }
            resetOtp(); setResendCooldown(60);
        } catch { setError(t('auth.serverErrorShort')); }
        finally { setIsSubmitting(false); }
    };

    // ── Forgot password: step 1 — enter email ────────────────────────────────
    const handleForgotEmail = async (e) => {
        e.preventDefault(); clearErr();
        if (!fpEmail.trim()) { setError(t('auth.emailRequired')); return; }
        setIsSubmitting(true);
        try {
            const result = await apiPost('forgot-password', { email: fpEmail.trim() });
            if (!result.success) { setError(result.message || t('auth.genericError')); return; }
            setOtpEmail(fpEmail.trim()); resetOtp(); setForgotStep('otp'); setResendCooldown(60);
        } catch { setError(t('auth.serverError')); }
        finally { setIsSubmitting(false); }
    };

    // ── Forgot password: step 2 — verify OTP ─────────────────────────────────
    const handleVerifyResetOtp = async (e) => {
        e.preventDefault(); clearErr();
        const code = otp.join('');
        if (code.length < 6) { setError(t('auth.otpIncomplete')); return; }
        setIsSubmitting(true);
        try {
            const result = await apiPost('verify-reset-otp', { email: otpEmail, otp: code });
            if (!result.success) { setError(result.message || t('auth.otpInvalid')); return; }
            resetOtp(); setForgotStep('reset');
        } catch { setError(t('auth.serverError')); }
        finally { setIsSubmitting(false); }
    };

    const handleResendResetOtp = async () => {
        if (resendCooldown > 0) return;
        clearErr(); setIsSubmitting(true);
        try {
            const result = await apiPost('resend-reset-otp', { email: otpEmail });
            if (!result.success) { setError(result.message || t('auth.resendFailed')); return; }
            resetOtp(); setResendCooldown(60);
        } catch { setError(t('auth.serverErrorShort')); }
        finally { setIsSubmitting(false); }
    };

    // ── Forgot password: step 3 — set new password ───────────────────────────
    const handleResetPassword = async (e) => {
        e.preventDefault(); clearErr();
        if (!fpNewPw || !fpConfirmPw) { setError(t('auth.fillBothPasswordFields')); return; }
        if (fpNewPw !== fpConfirmPw) { setError(t('auth.passwordMismatchPeriod')); return; }
        const missing = getMissingRequirements(fpNewPw);
        if (missing.length > 0) { setError(t('auth.passwordMissing', { list: missing.map(k => t(`pwReq.${k}`)).join(', ') })); return; }
        setIsSubmitting(true);
        try {
            const result = await apiPost('reset-password', { email: otpEmail, newPassword: fpNewPw });
            if (!result.success) { setError(result.message || t('auth.couldNotResetPassword')); return; }
            setForgotStep('done');
        } catch { setError(t('auth.serverError')); }
        finally { setIsSubmitting(false); }
    };

    // ── Modal header title helpers ────────────────────────────────────────────
    const forgotTitle = {
        email: t('forgotPassword.titleEmail'),
        otp:   t('forgotPassword.titleOtp'),
        reset: t('forgotPassword.titleReset'),
        done:  t('forgotPassword.titleDone'),
    }[forgotStep];

    return (
        <>
            {/* ── Hero carousel ── */}
            <div id="home" style={{ minHeight:'100vh',position:'relative',display:'flex',alignItems:'center' }}>
                <div id="homeCarousel" key={slidesKey} ref={carouselRef} className="carousel slide" data-bs-interval="4000" data-bs-pause="hover"
                    style={{ position:'absolute',top:0,left:0,width:'100%',height:'100%' }}>
                    <div className="carousel-indicators">
                        {slides.map((s, i) => (
                            <button key={s.src} type="button" data-bs-target="#homeCarousel" data-bs-slide-to={i}
                                className={i === 0 ? 'active' : undefined} aria-current={i === 0 ? 'true' : undefined} aria-label={`Slide ${i + 1}`} />
                        ))}
                    </div>
                    <div className="carousel-inner" style={{ height:'100%' }}>
                        {slides.map((s, i) => (
                            <div key={s.src} className={`carousel-item${i === 0 ? ' active' : ''}`} style={{ height:'100%' }}>
                                <img src={mediaSrc(s.src)} style={{ width:'100%',height:'100%',objectFit:'cover' }} alt={s.alt || 'Barangay Sta. Fe'} />
                            </div>
                        ))}
                    </div>
                    <button className="carousel-control-prev" type="button" data-bs-target="#homeCarousel" data-bs-slide="prev"><span className="carousel-control-prev-icon" aria-hidden="true" /><span className="visually-hidden">Previous</span></button>
                    <button className="carousel-control-next" type="button" data-bs-target="#homeCarousel" data-bs-slide="next"><span className="carousel-control-next-icon" aria-hidden="true" /><span className="visually-hidden">Next</span></button>
                </div>
                <div style={{ position:'absolute',top:0,left:0,width:'100%',height:'100%',background:'linear-gradient(rgba(0,0,0,0.6),rgba(0,0,0,0.6))',zIndex:1 }} />
                <div className="container" style={{ position:'relative',zIndex:2,color:'white' }}>
                    <div className="row align-items-center">
                        <div className="col-lg-8 mb-4 mb-lg-0 text-center text-lg-start" style={{ paddingLeft:'clamp(20px,5vw,60px)',paddingRight:'clamp(20px,5vw,60px)' }}>
                            <p style={{ fontSize:'clamp(0.85rem,1.5vw,1rem)',fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',color:'#FFC107',marginBottom:'8px' }}>
                                {t('hero.eyebrow')}
                            </p>
                            <h1 className="fw-bold" style={{ fontSize:'clamp(2rem,5vw,3.5rem)',lineHeight:'1.2' }}>
                                {t('hero.titleLine1')} <span style={{ color:'#FFC107' }}>{t('hero.titleHighlight')}</span><br />
                                {t('hero.titleLine2')}
                            </h1>
                            <p className="mt-3" style={{ fontSize:'clamp(1rem,2vw,1.25rem)',lineHeight:'1.6' }}>
                                {t('hero.subtitle')}
                            </p>
                            <div className="d-flex gap-3 flex-wrap mt-4 justify-content-center justify-content-lg-start">
                                <button className="btn btn-danger btn-lg fw-bold shadow" onClick={() => { clearErr(); setShowSignIn(true); }} style={{ fontSize:'1.1rem',minWidth:'150px',padding:'0.75rem 2rem' }}>{t('hero.signIn')}</button>
                                <button className="btn btn-outline-light btn-lg fw-bold" onClick={() => { clearErr(); setShowSignUp(true); }} style={{ fontSize:'1.1rem',minWidth:'150px',padding:'0.75rem 2rem' }}>{t('hero.signUp')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Sign In (and the "Save Login Info" question after it) ── */}
            {showSignIn && signInStep === 'form' && (
                <AuthModal title={t('signIn.title')} subtitle={t('signIn.subtitle')} onClose={closeAll} closeLabel={t('auth.close')}>
                    {!error && <AuthAlert type="notice">{signInNotice}</AuthAlert>}
                    <AuthAlert type="error">{error}</AuthAlert>
                    <AuthAlert type="success">{successMsg}</AuthAlert>

                    <form onSubmit={handleSignIn} noValidate>
                        <AuthField id="siEmail" label={t('signIn.email')} icon="bi-envelope">
                            <input type="email" className="auth-input" id="siEmail" autoComplete="email" placeholder={t('signIn.emailPlaceholder')} value={siEmail} onChange={e => setSiEmail(e.target.value)} />
                        </AuthField>
                        <AuthField id="siPassword" label={t('signIn.password')} icon="bi-lock"
                            toggle={<PasswordToggleButton visible={showSiPw} onToggle={() => setShowSiPw(v=>!v)} />}>
                            <input type={showSiPw?'text':'password'} className="auth-input has-toggle" id="siPassword" autoComplete="current-password" placeholder={t('signIn.passwordPlaceholder')} value={siPassword} onChange={e => setSiPassword(e.target.value)} />
                        </AuthField>

                        <div className="auth-row" style={{ justifyContent:'flex-end' }}>
                            <button type="button" className="auth-link"
                                onClick={() => { setShowSignIn(false); setShowForgot(true); clearErr(); setForgotStep('email'); setFpEmail(siEmail); }}>
                                {t('signIn.forgotPassword')}
                            </button>
                        </div>

                        <button type="submit" className="auth-btn" disabled={isSubmitting}>
                            {isSubmitting ? t('signIn.submitting') : t('signIn.submit')}
                        </button>
                        <p className="auth-switch">
                            {t('signIn.noAccount')}{' '}
                            <button type="button" className="auth-link" onClick={() => { setShowSignIn(false); setShowSignUp(true); clearErr(); }}>
                                {t('signIn.signUpLink')}
                            </button>
                        </p>
                    </form>
                </AuthModal>
            )}

            {showSignIn && signInStep === 'remember' && (
                <AuthModal title={t('rememberLogin.title')} subtitle={t('rememberLogin.body')} icon="bi-person-check-fill"
                    onClose={() => answerSaveLogin(false)} closeLabel={t('auth.close')}>
                    <div className="auth-note">
                        <i className="bi bi-shield-exclamation" aria-hidden="true"></i>
                        <span>{t('rememberLogin.warning')}</span>
                    </div>
                    <div className="auth-actions">
                        <button type="button" className="auth-btn secondary" onClick={() => answerSaveLogin(false)} disabled={isSubmitting}>
                            {t('rememberLogin.no')}
                        </button>
                        <button type="button" className="auth-btn" onClick={() => answerSaveLogin(true)} disabled={isSubmitting} autoFocus>
                            {isSubmitting ? t('rememberLogin.saving') : t('rememberLogin.yes')}
                        </button>
                    </div>
                    <p className="auth-fineprint">{t('rememberLogin.noExplains')} {t('rememberLogin.signOutHint')}</p>
                </AuthModal>
            )}

            {/* ── Sign Up ── */}
            {showSignUp && signUpStep === 'form' && (
                <AuthModal wide title={t('signUp.createTitle')} subtitle={t('signUp.subtitle')} onClose={closeAll} closeLabel={t('auth.close')}>
                    <AuthAlert type="error">{error}</AuthAlert>

                    <form onSubmit={handleSignUpSubmit} noValidate>
                        <h3 className="auth-section">{t('signUp.sectionPersonal')}</h3>
                        <div className="auth-grid cols-3">
                            <AuthField id="suFirst" label={t('signUp.firstName')} icon="bi-person">
                                <input type="text" className="auth-input" id="suFirst" autoComplete="given-name" placeholder={t('signUp.firstNamePlaceholder')} value={suFirst} onChange={e => setSuFirst(e.target.value.replace(NAME_ALLOWED_REGEX,''))} />
                            </AuthField>
                            <AuthField id="suMiddle" label={t('signUp.middleName')} optional={t('signUp.optional')} icon="bi-person">
                                <input type="text" className="auth-input" id="suMiddle" autoComplete="additional-name" placeholder={t('signUp.middlePlaceholder')} value={suMiddle} onChange={e => setSuMiddle(e.target.value.replace(NAME_ALLOWED_REGEX,''))} />
                            </AuthField>
                            <AuthField id="suLast" label={t('signUp.lastName')} icon="bi-person">
                                <input type="text" className="auth-input" id="suLast" autoComplete="family-name" placeholder={t('signUp.lastNamePlaceholder')} value={suLast} onChange={e => setSuLast(e.target.value.replace(NAME_ALLOWED_REGEX,''))} />
                            </AuthField>
                        </div>

                        <h3 className="auth-section">{t('signUp.sectionContact')}</h3>
                        <div className="auth-grid cols-2">
                            <AuthField id="suContact" label={t('signUp.contactNumber')} icon="bi-phone" prefix="+63">
                                <input type="tel" className="auth-input has-prefix" id="suContact" autoComplete="tel-national" placeholder="9XXXXXXXXX" value={suContact} onChange={e => setSuContact(e.target.value.replace(DIGITS_ONLY_REGEX,'').slice(0,10))} maxLength={10} inputMode="numeric" />
                            </AuthField>
                            <AuthField id="suEmail" label={t('signUp.email')} icon="bi-envelope">
                                <input type="email" className="auth-input" id="suEmail" autoComplete="email" placeholder={t('signUp.emailPlaceholder')} value={suEmail} onChange={e => setSuEmail(e.target.value)} />
                            </AuthField>
                        </div>

                        <h3 className="auth-section">{t('signUp.sectionSecurity')}</h3>
                        <AuthField id="suUsername" label={t('signUp.username')} icon="bi-at">
                            <input type="text" className="auth-input" id="suUsername" autoComplete="username" placeholder={t('signUp.usernamePlaceholder')} value={suUsername} onChange={e => setSuUsername(e.target.value)} />
                        </AuthField>
                        <div className="auth-grid cols-2">
                            <AuthField id="suPassword" label={t('signUp.password')} icon="bi-lock"
                                toggle={<PasswordToggleButton visible={showSuPw} onToggle={() => setShowSuPw(v=>!v)} />}>
                                <input type={showSuPw?'text':'password'} className="auth-input has-toggle" id="suPassword" autoComplete="new-password" placeholder={t('signUp.passwordPlaceholder')} value={suPassword} onChange={e => setSuPassword(e.target.value)} />
                            </AuthField>
                            <AuthField id="suConfirm" label={t('signUp.confirmPassword')} icon="bi-lock"
                                toggle={<PasswordToggleButton visible={showSuConfPw} onToggle={() => setShowSuConfPw(v=>!v)} />}
                                hint={suConfirm ? (suPassword===suConfirm ? t('signUp.passwordsMatch') : t('signUp.passwordsNoMatch')) : null}
                                hintTone={suPassword===suConfirm ? 'ok' : 'bad'}>
                                <input type={showSuConfPw?'text':'password'} id="suConfirm" autoComplete="new-password"
                                    className={`auth-input has-toggle${suConfirm ? (suPassword===suConfirm ? ' ok' : ' bad') : ''}`}
                                    placeholder={t('signUp.confirmPasswordPlaceholder')} value={suConfirm} onChange={e => setSuConfirm(e.target.value)} />
                            </AuthField>
                        </div>
                        {/* Requirements appear once a password is being typed. */}
                        {suPassword && (
                            <ul className="auth-checklist" aria-label={t('signUp.passwordRules')}>
                                {PASSWORD_REQUIREMENTS.map(req => {
                                    const met = req.test(suPassword);
                                    return (
                                        <li key={req.key} className={met ? 'met' : ''}>
                                            <i className={`bi ${met ? 'bi-check-circle-fill' : 'bi-circle'}`} aria-hidden="true"></i>
                                            {t(`pwReq.${req.key}`)}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}

                        <label className="auth-check" htmlFor="suAgree">
                            <input type="checkbox" id="suAgree" checked={suAgree} onChange={handleAgreeChange} />
                            <span>
                                {t('signUp.agreePrefix')}{' '}
                                <a href="#terms">{t('signUp.agreeLink')}</a>.
                            </span>
                        </label>
                        {!termsViewed && <p className="auth-check-hint">{t('signUp.viewTermsHint')}</p>}

                        <button type="submit" className="auth-btn" disabled={isSubmitting}>
                            {isSubmitting ? t('signUp.submitting') : t('signUp.submit')}
                        </button>
                        <p className="auth-switch">
                            {t('signUp.haveAccount')}{' '}
                            <button type="button" className="auth-link" onClick={() => { setShowSignUp(false); setShowSignIn(true); clearErr(); setSignUpStep('form'); }}>
                                {t('signUp.signInLink')}
                            </button>
                        </p>
                    </form>
                </AuthModal>
            )}

            {showSignUp && signUpStep === 'otp' && (
                <AuthModal title={t('signUp.verifyTitle')} subtitle={t('signUp.otpBody', { email: otpEmail })} icon="bi-envelope-paper-fill"
                    onClose={closeAll} closeLabel={t('auth.close')}>
                    <AuthAlert type="error">{error}</AuthAlert>
                    <form onSubmit={handleVerifySignupOtp}>
                        <OtpBoxes otp={otp} onChange={handleOtpChange} onKeyDown={handleOtpKeyDown} onPaste={handleOtpPaste} refs={otpRefs} />
                        <button type="submit" className="auth-btn" disabled={isSubmitting||otp.join('').length<6}>
                            {isSubmitting ? t('signUp.verifying') : t('signUp.verify')}
                        </button>
                        <p className="auth-switch">
                            {t('signUp.didntReceive')}{' '}
                            <button type="button" className="auth-link" onClick={handleResendSignupOtp} disabled={resendCooldown>0||isSubmitting}>
                                {resendCooldown>0 ? t('signUp.resendIn',{s:resendCooldown}) : t('signUp.resend')}
                            </button>
                        </p>
                        <p className="auth-switch" style={{ marginTop:'8px' }}>
                            <button type="button" className="auth-link muted" onClick={() => { setSignUpStep('form'); clearErr(); }}>
                                {t('signUp.backToRegistration')}
                            </button>
                        </p>
                    </form>
                </AuthModal>
            )}

            {/* ── Forgot Password ── */}
            {showForgot && (
                <AuthModal
                    title={forgotTitle}
                    subtitle={{
                        email: t('forgotPassword.step1Desc'),
                        otp:   t('forgotPassword.step2Desc', { email: otpEmail }),
                        reset: t('forgotPassword.step3Desc', { email: otpEmail }),
                        done:  t('forgotPassword.step4Desc'),
                    }[forgotStep]}
                    icon={{ email: 'bi-lock-fill', otp: 'bi-envelope-paper-fill', reset: 'bi-shield-lock-fill', done: 'bi-check-lg' }[forgotStep]}
                    onClose={closeAll} closeLabel={t('auth.close')}>
                    <AuthAlert type="error">{error}</AuthAlert>
                    <AuthAlert type="success">{successMsg}</AuthAlert>

                    {forgotStep === 'email' && (
                        <form onSubmit={handleForgotEmail} noValidate>
                            <AuthField id="fpEmail" label={t('forgotPassword.email')} icon="bi-envelope">
                                <input type="email" className="auth-input" id="fpEmail" autoComplete="email" placeholder={t('forgotPassword.emailPlaceholder')} value={fpEmail} onChange={e => setFpEmail(e.target.value)} />
                            </AuthField>
                            <button type="submit" className="auth-btn" disabled={isSubmitting}>
                                {isSubmitting ? t('forgotPassword.sendingCode') : t('forgotPassword.sendCode')}
                            </button>
                            <p className="auth-switch">
                                <button type="button" className="auth-link" onClick={() => { setShowForgot(false); setShowSignIn(true); clearErr(); }}>
                                    {t('forgotPassword.backToSignIn')}
                                </button>
                            </p>
                        </form>
                    )}

                    {forgotStep === 'otp' && (
                        <form onSubmit={handleVerifyResetOtp}>
                            <OtpBoxes otp={otp} onChange={handleOtpChange} onKeyDown={handleOtpKeyDown} onPaste={handleOtpPaste} refs={otpRefs} />
                            <button type="submit" className="auth-btn" disabled={isSubmitting||otp.join('').length<6}>
                                {isSubmitting ? t('forgotPassword.verifying') : t('forgotPassword.verifyCode')}
                            </button>
                            <p className="auth-switch">
                                {t('forgotPassword.didntReceive')}{' '}
                                <button type="button" className="auth-link" onClick={handleResendResetOtp} disabled={resendCooldown>0||isSubmitting}>
                                    {resendCooldown>0 ? t('forgotPassword.resendIn',{s:resendCooldown}) : t('forgotPassword.resend')}
                                </button>
                            </p>
                            <p className="auth-switch" style={{ marginTop:'8px' }}>
                                <button type="button" className="auth-link muted" onClick={() => { setForgotStep('email'); clearErr(); }}>
                                    {t('forgotPassword.useDifferentEmail')}
                                </button>
                            </p>
                        </form>
                    )}

                    {forgotStep === 'reset' && (
                        <form onSubmit={handleResetPassword} noValidate>
                            <AuthField id="fpNewPw" label={t('forgotPassword.newPassword')} icon="bi-lock"
                                toggle={<PasswordToggleButton visible={showFpNewPw} onToggle={() => setShowFpNewPw(v=>!v)} />}>
                                <input type={showFpNewPw?'text':'password'} className="auth-input has-toggle" id="fpNewPw" autoComplete="new-password" placeholder={t('forgotPassword.newPasswordPlaceholder')} value={fpNewPw} onChange={e => setFpNewPw(e.target.value)} />
                            </AuthField>
                            {/* Requirements appear once a password is being typed. */}
                            {fpNewPw && (
                                <ul className="auth-checklist" aria-label={t('signUp.passwordRules')}>
                                    {PASSWORD_REQUIREMENTS.map(req => {
                                        const met = req.test(fpNewPw);
                                        return (
                                            <li key={req.key} className={met ? 'met' : ''}>
                                                <i className={`bi ${met ? 'bi-check-circle-fill' : 'bi-circle'}`} aria-hidden="true"></i>
                                                {t(`pwReq.${req.key}`)}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                            <AuthField id="fpConfirmPw" label={t('forgotPassword.confirmNewPassword')} icon="bi-lock"
                                toggle={<PasswordToggleButton visible={showFpConfPw} onToggle={() => setShowFpConfPw(v=>!v)} />}
                                hint={fpConfirmPw ? (fpNewPw===fpConfirmPw ? t('signUp.passwordsMatch') : t('signUp.passwordsNoMatch')) : null}
                                hintTone={fpNewPw===fpConfirmPw ? 'ok' : 'bad'}>
                                <input type={showFpConfPw?'text':'password'} id="fpConfirmPw" autoComplete="new-password"
                                    className={`auth-input has-toggle${fpConfirmPw ? (fpNewPw===fpConfirmPw ? ' ok' : ' bad') : ''}`}
                                    placeholder={t('forgotPassword.confirmNewPasswordPlaceholder')} value={fpConfirmPw} onChange={e => setFpConfirmPw(e.target.value)} />
                            </AuthField>
                            <button type="submit" className="auth-btn" disabled={isSubmitting} style={{ marginTop:'6px' }}>
                                {isSubmitting ? t('forgotPassword.saving') : t('forgotPassword.save')}
                            </button>
                        </form>
                    )}

                    {forgotStep === 'done' && (
                        <button type="button" className="auth-btn"
                            onClick={() => { setShowForgot(false); setShowSignIn(true); clearErr(); setForgotStep('email'); setFpEmail(''); setFpNewPw(''); setFpConfirmPw(''); }}>
                            {t('forgotPassword.signInNow')}
                        </button>
                    )}
                </AuthModal>
            )}

            <EmergencyCallButton />
        </>
    );
}

export default Hero;