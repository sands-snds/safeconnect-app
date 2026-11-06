import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { signinUser, setAuthToken, rememberLogin } from '../../Services/api';
import AuthModal, { AuthAlert, AuthField, AuthFieldError } from './AuthModal';
import { useLanguage } from '../../i18n/LanguageContext';
import useSiteContent, { useSiteMedia, mediaSrc } from '../shared/useSiteContent';
import { Carousel } from 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { showAccountStatusPopup } from '../shared/accountStatusPopup';
import { markAdminJustSignedIn } from '../admin/AdminModals/AdminDemoPopup';
import { hasViewedTerms, openTerms, TERMS_VIEWED_EVENT } from '../shared/termsConsent';
import { NO_CLIPBOARD } from '../shared/noClipboard';

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
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The valid ID asked for at sign-up; the values match ID_TYPES in
// backend/utils/idDocument.js, which checks the file again.
const ID_TYPES = [
    { value: 'Barangay ID', key: 'barangayId' },
    { value: 'Barangay Certificate of Residency', key: 'residency' },
    { value: 'PhilSys National ID', key: 'philsys' },
    { value: "Voter's ID or Certification", key: 'voters' },
    { value: "Driver's License", key: 'drivers' },
    { value: 'Postal ID', key: 'postal' },
    { value: 'UMID', key: 'umid' },
    { value: 'School ID', key: 'school' },
    { value: 'Other government-issued ID', key: 'other' },
];
// Sign Up in three steps; Next checks only the fields on the current one.
const SIGNUP_PARTS = ['details', 'address', 'account'];
const SIGNUP_FIELD_PART = {
    suFirst: 1, suMiddle: 1, suLast: 1, suContact: 1, suEmail: 1,
    suAddrHouse: 2, suAddrStreet: 2, suAddrArea: 2, suIdType: 2, suIdFile: 2,
    suUsername: 3, suPassword: 3, suConfirm: 3, suAgree: 3,
};
const SIGNUP_PART_FIRST_FIELD = ['suFirst', 'suAddrHouse', 'suUsername'];
const ID_ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf';
const ID_EXTENSIONS = /\.(jpe?g|png|webp|pdf)$/i;
const ID_MAX_BYTES = 5 * 1024 * 1024;
const isPdfFile = (file) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
const formatFileSize = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);
const readAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
});




const fieldForMessage = (message, pairs) => {
    const text = String(message || '');
    const hit = pairs.find(([re]) => re.test(text));
    return hit ? hit[1] : null;
};
const SIGNUP_SERVER_FIELDS = [
    [/username/i, 'suUsername'],
    [/account with this email|email address does not appear/i, 'suEmail'],
    [/^password|password must/i, 'suPassword'],
    [/mobile|contact number/i, 'suContact'],
];
const RESET_SERVER_FIELDS = [
    [/^password|password must|new password/i, 'fpNewPw'],
];

const apiPost = async (path, body) => {
    const res = await fetch(`${API_BASE}/auth/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    return res.json();
};

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
    const siteContent = useSiteContent(); 
    
    const { carousel: slides = [] } = useSiteMedia();
    const slidesKey = slides.map((s) => s.src).join('|');
    const carouselRef = useRef(null);
    
    
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

    
    
    const [signInStep,    setSignInStep]    = useState('form');
    const [pendingSignIn, setPendingSignIn] = useState(null);

    // Sign-up step: 'form' | 'otp'
    const [signUpStep,    setSignUpStep]    = useState('form');
    // Which of the form's three steps is showing (1-3)
    const [signUpPart,    setSignUpPart]    = useState(1);
    
    const [forgotStep,    setForgotStep]    = useState('email');

    // Sign-in fields
    const [siEmail,       setSiEmail]       = useState('');
    const [siPassword,    setSiPassword]    = useState('');
    
    
    const [suAgree,       setSuAgree]       = useState(false);
    const [termsViewed,   setTermsViewed]   = useState(hasViewedTerms);
    useEffect(() => {
        const onViewed = () => setTermsViewed(true);
        window.addEventListener(TERMS_VIEWED_EVENT, onViewed);
        return () => window.removeEventListener(TERMS_VIEWED_EVENT, onViewed);
    }, []);
    
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
    // Home address in Barangay Santa Fe
    const [suAddrHouse,   setSuAddrHouse]   = useState('');
    const [suAddrStreet,  setSuAddrStreet]  = useState('');
    const [suAddrArea,    setSuAddrArea]    = useState('');
    // Proof of residency
    const [suIdType,      setSuIdType]      = useState('');
    const [suIdFile,      setSuIdFile]      = useState(null);
    const [suIdPreview,   setSuIdPreview]   = useState(null);
    const idInputRef = useRef(null);
    useEffect(() => () => { if (suIdPreview) URL.revokeObjectURL(suIdPreview); }, [suIdPreview]);

    // Forgot password fields
    const [fpEmail,       setFpEmail]       = useState('');
    const [fpNewPw,       setFpNewPw]       = useState('');
    const [fpConfirmPw,   setFpConfirmPw]   = useState('');
    const [showFpNewPw,   setShowFpNewPw]   = useState(false);
    const [showFpConfPw,  setShowFpConfPw]  = useState(false);

    
    const [otp,           setOtp]           = useState(['','','','','','']);
    const [otpEmail,      setOtpEmail]      = useState('');
    const [resendCooldown,setResendCooldown]= useState(0);
    const otpRefs = useRef([]);

    const [isSubmitting,  setIsSubmitting]  = useState(false);
    const [error,         setError]         = useState('');
    const [successMsg,    setSuccessMsg]    = useState('');
    
    
    const [signInNotice,  setSignInNotice]  = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('signin') !== 'required') return;
        setShowSignIn(true);
        setSignInNotice(t('signIn.signInRequired'));
        
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

    
    
    
    
    const [fieldErrors,   setFieldErrors]   = useState({});

    const focusField = (id) => requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (!el) return;
        el.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
        el.focus({ preventScroll: true });
    });

    
    const showFieldErrors = (errors) => {
        setFieldErrors(errors);
        const first = Object.keys(errors)[0];
        if (first) focusField(first);
        return Boolean(first);
    };

    
    
    const LINKED_FIELDS = { suPassword: 'suConfirm', fpNewPw: 'fpConfirmPw' };
    const clearFieldError = (e) => {
        const ids = [e.target.id, LINKED_FIELDS[e.target.id]];
        setFieldErrors((prev) => {
            if (!ids.some((id) => id && prev[id])) return prev;
            const next = { ...prev };
            ids.forEach((id) => { delete next[id]; });
            return next;
        });
    };

    
    const fieldProps = (id) => (fieldErrors[id] ? { 'aria-invalid': true, 'aria-describedby': `${id}-error` } : {});

    const serverMessage = (result, fallbackKey) =>
        result?.code === 'DATABASE_UNAVAILABLE' ? t('auth.databaseUnavailable') : (result?.message || t(fallbackKey));

    const clearErr = () => { setError(''); setSuccessMsg(''); setFieldErrors({}); };

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

    // ── Proof of residency: the uploaded ID ──────────────────────────────────
    const clearIdFile = () => {
        setSuIdFile(null);
        setSuIdPreview(null);
        if (idInputRef.current) idInputRef.current.value = '';
    };
    const setIdError = (message) => setFieldErrors((prev) => ({ ...prev, suIdFile: message }));
    const handleIdFile = (e) => {
        // The form's onChange clears field errors; this one sets its own.
        e.stopPropagation();
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const typeOk = ID_ACCEPT.split(',').includes(file.type) || ID_EXTENSIONS.test(file.name);
        if (!typeOk) { clearIdFile(); setIdError(t('signUp.idBadType')); return; }
        if (file.size > ID_MAX_BYTES) { clearIdFile(); setIdError(t('signUp.idTooLarge')); return; }
        setFieldErrors((prev) => {
            if (!prev.suIdFile) return prev;
            const next = { ...prev };
            delete next.suIdFile;
            return next;
        });
        setSuIdFile(file);
        setSuIdPreview(!isPdfFile(file) && typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : null);
    };

    // ── Close everything ──────────────────────────────────────────────────────
    const closeAll = () => {
        setShowSignIn(false); setShowSignUp(false); setShowForgot(false);
        setSignInStep('form'); setPendingSignIn(null);
        setSignUpStep('form'); setSignUpPart(1); setForgotStep('email');
        setSiEmail(''); setSiPassword(''); setShowSiPw(false);
        setSuFirst(''); setSuMiddle(''); setSuLast('');
        setSuUsername(''); setSuContact(''); setSuEmail('');
        setSuPassword(''); setSuConfirm(''); setSuAgree(false);
        setShowSuPw(false); setShowSuConfPw(false);
        clearIdFile(); setSuIdType('');
        setSuAddrHouse(''); setSuAddrStreet(''); setSuAddrArea('');
        setFpEmail(''); setFpNewPw(''); setFpConfirmPw('');
        setShowFpNewPw(false); setShowFpConfPw(false);
        resetOtp(); setOtpEmail(''); setResendCooldown(0);
        setError(''); setSuccessMsg(''); setSignInNotice(''); setFieldErrors({});
    };

    // ── Sign in ───────────────────────────────────────────────────────────────
    const handleSignIn = async (e) => {
        e.preventDefault(); clearErr();
        const problems = {};
        if (!siEmail.trim()) problems.siEmail = t('auth.emailRequired');
        else if (!EMAIL_REGEX.test(siEmail.trim())) problems.siEmail = t('auth.emailInvalid');
        if (!siPassword) problems.siPassword = t('auth.passwordRequired');
        if (showFieldErrors(problems)) return;
        setIsSubmitting(true);
        try {
            const result = await signinUser(siEmail.trim(), siPassword);
            
            if (!result.success && result.code?.startsWith('ACCOUNT_')) {
                closeAll();
                if (showAccountStatusPopup(result.code, t, siteContent.socials?.email, result.reason)) return;
            }
            if (!result.success) {
                setError(serverMessage(result, 'auth.invalidCredentials'));
                if (!result.code) focusField('siPassword');
                return;
            }
            
            
            if (result.isAdmin) {
                setAuthToken(result.token, true, false);
                finishSignIn(result);
                return;
            }
            
            setPendingSignIn(result);
            setSignInStep('remember');
        } catch { setError(t('auth.serverError')); }
        finally { setIsSubmitting(false); }
    };

    
    
    
    const answerSaveLogin = async (save) => {
        const result = pendingSignIn;
        if (!result || isSubmitting) return;
        setIsSubmitting(true);
        let token = result.token;
        let saved = false;
        if (save) {
            const remembered = await rememberLogin(result.token);
            if (remembered.success && remembered.token) { token = remembered.token; saved = true; }
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
        
        
        sessionStorage.setItem('currentUser', JSON.stringify({
            id:       result.user.id,
            fullName: result.user.fullName,
            username: result.user.username,
            contact:  result.user.contact,
            email:    result.user.email,
            role:     result.user.role,
            photoUrl: result.user.photoUrl || null,
            address:  result.user.address || null,
        }));
        localStorage.setItem('residentName', result.user.fullName);
        window.location.href = '/resident';
    };

    // ── Sign up: step 1 — send OTP ────────────────────────────────────────────
    const goToSignUpPart = (part) => {
        setSignUpPart(part);
        requestAnimationFrame(() => {
            document.querySelector('.auth-overlay')?.scrollTo?.({ top: 0 });
            document.getElementById(SIGNUP_PART_FIRST_FIELD[part - 1])?.focus({ preventScroll: true });
        });
    };
    // Shows the step with the first problem, then the problems.
    const showSignUpErrors = (errors) => {
        const first = Object.keys(errors)[0];
        if (first && SIGNUP_FIELD_PART[first]) setSignUpPart(SIGNUP_FIELD_PART[first]);
        return showFieldErrors(errors);
    };

    const signUpProblems = () => {
        const problems = {};
        if (!suFirst.trim()) problems.suFirst = t('auth.firstNameRequired');
        if (!suLast.trim()) problems.suLast = t('auth.lastNameRequired');
        if (!suContact) problems.suContact = t('auth.contactRequired');
        else if (suContact.length !== 10) problems.suContact = t('auth.contactDigits');
        if (!suEmail.trim()) problems.suEmail = t('auth.emailRequired');
        else if (!EMAIL_REGEX.test(suEmail.trim())) problems.suEmail = t('auth.emailInvalid');
        if (!suAddrHouse.trim()) problems.suAddrHouse = t('signUp.addressHouseRequired');
        if (!suAddrStreet.trim()) problems.suAddrStreet = t('signUp.addressStreetRequired');
        if (!suIdType) problems.suIdType = t('signUp.idTypeRequired');
        if (!suIdFile) problems.suIdFile = t('signUp.idRequired');
        if (!suUsername.trim()) problems.suUsername = t('auth.usernameRequired');
        const missing = getMissingRequirements(suPassword);
        if (!suPassword) problems.suPassword = t('auth.passwordRequired');
        else if (missing.length > 0) problems.suPassword = t('auth.passwordMissing', { list: missing.map(k => t(`pwReq.${k}`)).join(', ') });
        if (!suConfirm) problems.suConfirm = t('auth.confirmPasswordRequired');
        else if (suPassword !== suConfirm) problems.suConfirm = t('auth.passwordMismatch');
        if (!termsViewed) problems.suAgree = t('signUp.viewTermsFirst');
        else if (!suAgree) problems.suAgree = t('signUp.mustAgree');
        return problems;
    };

    const handleSignUpSubmit = async (e) => {
        e.preventDefault(); clearErr();
        const problems = signUpProblems();
        if (signUpPart < SIGNUP_PARTS.length) {
            const here = Object.fromEntries(Object.entries(problems).filter(([field]) => SIGNUP_FIELD_PART[field] === signUpPart));
            if (showFieldErrors(here)) return;
            goToSignUpPart(signUpPart + 1);
            return;
        }
        if (showSignUpErrors(problems)) return;

        const fullName = [suFirst, suMiddle, suLast].filter(Boolean).join(' ');
        setIsSubmitting(true);
        try {
            let dataUrl;
            try {
                dataUrl = await readAsDataUrl(suIdFile);
            } catch {
                clearIdFile(); showSignUpErrors({ suIdFile: t('signUp.idReadFailed') });
                return;
            }
            const result = await apiPost('request-otp', {
                fullName, username: suUsername,
                contact: `+63${suContact}`, email: suEmail, password: suPassword,
                address: { houseNumber: suAddrHouse.trim(), street: suAddrStreet.trim(), area: suAddrArea.trim() },
                validId: { idType: suIdType, fileName: suIdFile.name, dataUrl },
            });
            if (!result.success) {
                if (result.code === 'INVALID_ADDRESS') {
                    showSignUpErrors({ [/street/i.test(result.message) ? 'suAddrStreet' : 'suAddrHouse']: result.message });
                    return;
                }
                if (result.code === 'INVALID_ID') {
                    showSignUpErrors({ [/type of ID/i.test(result.message) ? 'suIdType' : 'suIdFile']: result.message });
                    return;
                }
                const field = fieldForMessage(result.message, SIGNUP_SERVER_FIELDS);
                if (field) showSignUpErrors({ [field]: result.message });
                else setError(serverMessage(result, 'auth.otpSendFailed'));
                return;
            }
            setOtpEmail(suEmail); resetOtp(); setSignUpStep('otp'); setResendCooldown(60);
        } catch { setError(t('auth.serverError')); }
        finally { setIsSubmitting(false); }
    };

    // ── Sign up: step 2 — verify OTP ─────────────────────────────────────────
    const handleVerifySignupOtp = async (e) => {
        e.preventDefault(); clearErr();
        const code = otp.join('');
        if (code.length < 6) { setError(t('auth.otpIncomplete')); otpRefs.current[Math.max(0, otp.findIndex((d) => !d))]?.focus(); return; }
        setIsSubmitting(true);
        try {
            const result = await apiPost('verify-otp', { email: otpEmail, otp: code });
            if (!result.success) { setError(serverMessage(result, 'auth.otpInvalid')); return; }
            setSuFirst(''); setSuMiddle(''); setSuLast('');
            setSuUsername(''); setSuContact(''); setSuEmail('');
            setSuPassword(''); setSuConfirm('');
            clearIdFile(); setSuIdType('');
            setSuAddrHouse(''); setSuAddrStreet(''); setSuAddrArea('');
            resetOtp(); setSignUpStep('form'); setSignUpPart(1);
            setShowSignUp(false); setShowSignIn(true);
            setSuccessMsg(t(result.pendingVerification ? 'signUp.accountPendingReview' : 'signUp.accountCreated'));
        } catch { setError(t('auth.serverError')); }
        finally { setIsSubmitting(false); }
    };

    const handleResendSignupOtp = async () => {
        if (resendCooldown > 0) return;
        clearErr(); setIsSubmitting(true);
        try {
            const result = await apiPost('resend-otp', { email: otpEmail });
            if (!result.success) { setError(serverMessage(result, 'auth.resendFailed')); return; }
            resetOtp(); setResendCooldown(60);
        } catch { setError(t('auth.serverErrorShort')); }
        finally { setIsSubmitting(false); }
    };

    // ── Forgot password: step 1 — enter email ────────────────────────────────
    const handleForgotEmail = async (e) => {
        e.preventDefault(); clearErr();
        if (!fpEmail.trim()) { showFieldErrors({ fpEmail: t('auth.emailRequired') }); return; }
        if (!EMAIL_REGEX.test(fpEmail.trim())) { showFieldErrors({ fpEmail: t('auth.emailInvalid') }); return; }
        setIsSubmitting(true);
        try {
            const result = await apiPost('forgot-password', { email: fpEmail.trim() });
            if (!result.success) { setError(serverMessage(result, 'auth.genericError')); return; }
            setOtpEmail(fpEmail.trim()); resetOtp(); setForgotStep('otp'); setResendCooldown(60);
        } catch { setError(t('auth.serverError')); }
        finally { setIsSubmitting(false); }
    };

    // ── Forgot password: step 2 — verify OTP ─────────────────────────────────
    const handleVerifyResetOtp = async (e) => {
        e.preventDefault(); clearErr();
        const code = otp.join('');
        if (code.length < 6) { setError(t('auth.otpIncomplete')); otpRefs.current[Math.max(0, otp.findIndex((d) => !d))]?.focus(); return; }
        setIsSubmitting(true);
        try {
            const result = await apiPost('verify-reset-otp', { email: otpEmail, otp: code });
            if (!result.success) { setError(serverMessage(result, 'auth.otpInvalid')); return; }
            resetOtp(); setForgotStep('reset');
        } catch { setError(t('auth.serverError')); }
        finally { setIsSubmitting(false); }
    };

    const handleResendResetOtp = async () => {
        if (resendCooldown > 0) return;
        clearErr(); setIsSubmitting(true);
        try {
            const result = await apiPost('resend-reset-otp', { email: otpEmail });
            if (!result.success) { setError(serverMessage(result, 'auth.resendFailed')); return; }
            resetOtp(); setResendCooldown(60);
        } catch { setError(t('auth.serverErrorShort')); }
        finally { setIsSubmitting(false); }
    };

    // ── Forgot password: step 3 — set new password ───────────────────────────
    const handleResetPassword = async (e) => {
        e.preventDefault(); clearErr();
        const problems = {};
        const missing = getMissingRequirements(fpNewPw);
        if (!fpNewPw) problems.fpNewPw = t('auth.newPasswordRequired');
        else if (missing.length > 0) problems.fpNewPw = t('auth.passwordMissing', { list: missing.map(k => t(`pwReq.${k}`)).join(', ') });
        if (!fpConfirmPw) problems.fpConfirmPw = t('auth.confirmPasswordRequired');
        else if (fpNewPw !== fpConfirmPw) problems.fpConfirmPw = t('auth.passwordMismatchPeriod');
        if (showFieldErrors(problems)) return;
        setIsSubmitting(true);
        try {
            const result = await apiPost('reset-password', { email: otpEmail, newPassword: fpNewPw });
            if (!result.success) {
                const field = fieldForMessage(result.message, RESET_SERVER_FIELDS);
                if (field) showFieldErrors({ [field]: result.message });
                else setError(serverMessage(result, 'auth.couldNotResetPassword'));
                return;
            }
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

                    <form onSubmit={handleSignIn} onChange={clearFieldError} noValidate>
                        <AuthField id="siEmail" error={fieldErrors.siEmail} label={t('signIn.email')} icon="bi-envelope">
                            <input type="email" className="auth-input" id="siEmail" {...fieldProps('siEmail')} autoComplete="email" placeholder={t('signIn.emailPlaceholder')} value={siEmail} onChange={e => setSiEmail(e.target.value)} />
                        </AuthField>
                        <AuthField id="siPassword" error={fieldErrors.siPassword} label={t('signIn.password')} icon="bi-lock"
                            toggle={<PasswordToggleButton visible={showSiPw} onToggle={() => setShowSiPw(v=>!v)} />}>
                            <input type={showSiPw?'text':'password'} className="auth-input has-toggle" id="siPassword" {...NO_CLIPBOARD} {...fieldProps('siPassword')} autoComplete="current-password" placeholder={t('signIn.passwordPlaceholder')} value={siPassword} onChange={e => setSiPassword(e.target.value)} />
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

                    <form onSubmit={handleSignUpSubmit} onChange={clearFieldError} noValidate>
                        <ol className="auth-steps" aria-label={t('signUp.stepsLabel')}>
                            {SIGNUP_PARTS.map((key, i) => {
                                const n = i + 1;
                                const state = n === signUpPart ? 'current' : n < signUpPart ? 'done' : 'todo';
                                return (
                                    <li key={key} className={`auth-step ${state}`} aria-current={state === 'current' ? 'step' : undefined}>
                                        <button type="button" disabled={state !== 'done' || isSubmitting} onClick={() => goToSignUpPart(n)}>
                                            <span className="auth-step-n" aria-hidden="true">{state === 'done' ? <i className="bi bi-check-lg"></i> : n}</span>
                                            <span className="auth-step-l">{t(`signUp.steps.${key}`)}</span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ol>
                        <p className="auth-step-count">{t('signUp.stepOf', { n: signUpPart, total: SIGNUP_PARTS.length })}</p>

                        <div className="auth-part" hidden={signUpPart !== 1}>
                        <h3 className="auth-section">{t('signUp.sectionPersonal')}</h3>
                        <div className="auth-grid cols-3">
                            <AuthField id="suFirst" error={fieldErrors.suFirst} label={t('signUp.firstName')} icon="bi-person">
                                <input type="text" className="auth-input" id="suFirst" {...fieldProps('suFirst')} autoComplete="given-name" placeholder={t('signUp.firstNamePlaceholder')} value={suFirst} onChange={e => setSuFirst(e.target.value.replace(NAME_ALLOWED_REGEX,''))} />
                            </AuthField>
                            <AuthField id="suMiddle" label={t('signUp.middleName')} optional={t('signUp.optional')} icon="bi-person">
                                <input type="text" className="auth-input" id="suMiddle" autoComplete="additional-name" placeholder={t('signUp.middlePlaceholder')} value={suMiddle} onChange={e => setSuMiddle(e.target.value.replace(NAME_ALLOWED_REGEX,''))} />
                            </AuthField>
                            <AuthField id="suLast" error={fieldErrors.suLast} label={t('signUp.lastName')} icon="bi-person">
                                <input type="text" className="auth-input" id="suLast" {...fieldProps('suLast')} autoComplete="family-name" placeholder={t('signUp.lastNamePlaceholder')} value={suLast} onChange={e => setSuLast(e.target.value.replace(NAME_ALLOWED_REGEX,''))} />
                            </AuthField>
                        </div>

                        <h3 className="auth-section">{t('signUp.sectionContact')}</h3>
                        <div className="auth-grid cols-2">
                            <AuthField id="suContact" error={fieldErrors.suContact} label={t('signUp.contactNumber')} icon="bi-phone" prefix="+63">
                                <input type="tel" className="auth-input has-prefix" id="suContact" {...fieldProps('suContact')} autoComplete="tel-national" placeholder="9XXXXXXXXX" value={suContact} onChange={e => setSuContact(e.target.value.replace(DIGITS_ONLY_REGEX,'').slice(0,10))} maxLength={10} inputMode="numeric" />
                            </AuthField>
                            <AuthField id="suEmail" error={fieldErrors.suEmail} label={t('signUp.email')} icon="bi-envelope">
                                <input type="email" className="auth-input" id="suEmail" {...fieldProps('suEmail')} autoComplete="email" placeholder={t('signUp.emailPlaceholder')} value={suEmail} onChange={e => setSuEmail(e.target.value)} />
                            </AuthField>
                        </div>

                        </div>

                        <div className="auth-part" hidden={signUpPart !== 2}>
                        <h3 className="auth-section">{t('signUp.sectionAddress')}</h3>
                        <p className="auth-id-intro">{t('signUp.addressIntro')}</p>
                        <div className="auth-grid cols-2">
                            <AuthField id="suAddrHouse" error={fieldErrors.suAddrHouse} label={t('signUp.addressHouse')} icon="bi-house-door">
                                <input type="text" className="auth-input" id="suAddrHouse" {...fieldProps('suAddrHouse')} autoComplete="address-line1" maxLength={60}
                                    placeholder={t('signUp.addressHousePlaceholder')} value={suAddrHouse} onChange={e => setSuAddrHouse(e.target.value)} />
                            </AuthField>
                            <AuthField id="suAddrStreet" error={fieldErrors.suAddrStreet} label={t('signUp.addressStreet')} icon="bi-signpost-2">
                                <input type="text" className="auth-input" id="suAddrStreet" {...fieldProps('suAddrStreet')} autoComplete="address-line2" maxLength={120}
                                    placeholder={t('signUp.addressStreetPlaceholder')} value={suAddrStreet} onChange={e => setSuAddrStreet(e.target.value)} />
                            </AuthField>
                            <AuthField id="suAddrArea" label={t('signUp.addressArea')} optional={t('signUp.optional')} icon="bi-houses">
                                <input type="text" className="auth-input" id="suAddrArea" maxLength={120}
                                    placeholder={t('signUp.addressAreaPlaceholder')} value={suAddrArea} onChange={e => setSuAddrArea(e.target.value)} />
                            </AuthField>
                            <AuthField id="suAddrFixed" label={t('signUp.addressBarangay')} icon="bi-geo-alt">
                                <input type="text" className="auth-input" id="suAddrFixed" value={t('signUp.addressBarangayValue')} readOnly tabIndex={-1} aria-readonly="true" />
                            </AuthField>
                        </div>

                        <h3 className="auth-section">{t('signUp.sectionResidency')}</h3>
                        <p className="auth-id-intro">{t('signUp.residencyIntro')}</p>
                        <div className="auth-id-info">
                            <p className="auth-id-info-title"><i className="bi bi-patch-check-fill" aria-hidden="true"></i> {t('signUp.acceptedTitle')}</p>
                            <ul className="auth-id-list">
                                {ID_TYPES.map((o) => <li key={o.key}>{t(`signUp.idTypes.${o.key}`)}</li>)}
                            </ul>
                            <p className="auth-id-info-hint">{t('signUp.acceptedHint')} {t('signUp.tips')}</p>
                        </div>
                        <AuthField id="suIdType" error={fieldErrors.suIdType} label={t('signUp.idType')} icon="bi-person-vcard">
                            <select className="auth-input auth-select" id="suIdType" {...fieldProps('suIdType')} value={suIdType} onChange={e => setSuIdType(e.target.value)}>
                                <option value="">{t('signUp.idTypePlaceholder')}</option>
                                {ID_TYPES.map((o) => <option key={o.key} value={o.value}>{t(`signUp.idTypes.${o.key}`)}</option>)}
                            </select>
                        </AuthField>
                        <div className={`auth-field${fieldErrors.suIdFile ? ' has-error' : ''}`}>
                            <span className="auth-label" id="suIdFile-label">{t('signUp.idUpload')}</span>
                            <input type="file" id="suIdFile" ref={idInputRef} className="auth-upload-input" accept={ID_ACCEPT}
                                aria-labelledby="suIdFile-label" {...fieldProps('suIdFile')} onChange={handleIdFile} />
                            {suIdFile ? (
                                <div className="auth-upload has-file">
                                    {suIdPreview
                                        ? <img className="auth-upload-thumb" src={suIdPreview} alt="" />
                                        : <span className="auth-upload-thumb pdf" aria-hidden="true"><i className={`bi ${isPdfFile(suIdFile) ? 'bi-file-earmark-pdf-fill' : 'bi-file-earmark-image-fill'}`}></i></span>}
                                    <span className="auth-upload-text">
                                        <strong>{suIdFile.name}</strong>
                                        <span>{isPdfFile(suIdFile) ? `${t('signUp.idPdf')} · ` : ''}{formatFileSize(suIdFile.size)}</span>
                                    </span>
                                    <span className="auth-upload-actions">
                                        <label htmlFor="suIdFile" className="auth-link">{t('signUp.idReplace')}</label>
                                        <button type="button" className="auth-link muted" onClick={clearIdFile}>{t('signUp.idRemove')}</button>
                                    </span>
                                </div>
                            ) : (
                                <label htmlFor="suIdFile" className="auth-upload">
                                    <i className="bi bi-cloud-arrow-up-fill" aria-hidden="true"></i>
                                    <span className="auth-upload-text">
                                        <strong>{t('signUp.idChoose')}</strong>
                                        <span>{t('signUp.idChooseHint')}</span>
                                        <span className="auth-upload-formats">{t('signUp.idFormats')}</span>
                                    </span>
                                </label>
                            )}
                            {fieldErrors.suIdFile
                                ? <AuthFieldError id="suIdFile">{fieldErrors.suIdFile}</AuthFieldError>
                                : <p className="auth-upload-privacy"><i className="bi bi-shield-lock-fill" aria-hidden="true"></i> {t('signUp.idPrivacy')}</p>}
                        </div>

                        </div>

                        <div className="auth-part" hidden={signUpPart !== 3}>
                        <h3 className="auth-section">{t('signUp.sectionSecurity')}</h3>
                        <AuthField id="suUsername" error={fieldErrors.suUsername} label={t('signUp.username')} icon="bi-at">
                            <input type="text" className="auth-input" id="suUsername" {...fieldProps('suUsername')} autoComplete="username" placeholder={t('signUp.usernamePlaceholder')} value={suUsername} onChange={e => setSuUsername(e.target.value)} />
                        </AuthField>
                        <div className="auth-grid cols-2">
                            <AuthField id="suPassword" error={fieldErrors.suPassword} label={t('signUp.password')} icon="bi-lock"
                                toggle={<PasswordToggleButton visible={showSuPw} onToggle={() => setShowSuPw(v=>!v)} />}>
                                <input type={showSuPw?'text':'password'} className="auth-input has-toggle" id="suPassword" {...NO_CLIPBOARD} {...fieldProps('suPassword')} autoComplete="new-password" placeholder={t('signUp.passwordPlaceholder')} value={suPassword} onChange={e => setSuPassword(e.target.value)} />
                            </AuthField>
                            <AuthField id="suConfirm" error={fieldErrors.suConfirm} label={t('signUp.confirmPassword')} icon="bi-lock"
                                toggle={<PasswordToggleButton visible={showSuConfPw} onToggle={() => setShowSuConfPw(v=>!v)} />}
                                hint={suConfirm ? (suPassword===suConfirm ? t('signUp.passwordsMatch') : t('signUp.passwordsNoMatch')) : null}
                                hintTone={suPassword===suConfirm ? 'ok' : 'bad'}>
                                <input type={showSuConfPw?'text':'password'} id="suConfirm" {...NO_CLIPBOARD} {...fieldProps('suConfirm')} autoComplete="new-password"
                                    className={`auth-input has-toggle${suConfirm ? (suPassword===suConfirm ? ' ok' : ' bad') : ''}`}
                                    placeholder={t('signUp.confirmPasswordPlaceholder')} value={suConfirm} onChange={e => setSuConfirm(e.target.value)} />
                            </AuthField>
                        </div>
                        
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

                        <label className={`auth-check${fieldErrors.suAgree ? ' has-error' : ''}`} htmlFor="suAgree">
                            <input type="checkbox" id="suAgree" {...fieldProps('suAgree')} checked={suAgree} onChange={handleAgreeChange} />
                            <span>
                                {t('signUp.agreePrefix')}{' '}
                                <a href="#terms">{t('signUp.agreeLink')}</a>.
                            </span>
                        </label>
                        {fieldErrors.suAgree
                            ? <AuthFieldError id="suAgree" className="auth-check-error">{fieldErrors.suAgree}</AuthFieldError>
                            : !termsViewed && <p className="auth-check-hint">{t('signUp.viewTermsHint')}</p>}
                        </div>

                        <div className={`auth-part-actions${signUpPart > 1 ? ' two' : ''}`}>
                            {signUpPart > 1 && (
                                <button type="button" className="auth-btn secondary" onClick={() => goToSignUpPart(signUpPart - 1)} disabled={isSubmitting}>
                                    <i className="bi bi-arrow-left" aria-hidden="true"></i> {t('signUp.back')}
                                </button>
                            )}
                            <button type="submit" className="auth-btn" disabled={isSubmitting}>
                                {signUpPart < SIGNUP_PARTS.length
                                    ? <>{t('signUp.next')} <i className="bi bi-arrow-right" aria-hidden="true"></i></>
                                    : (isSubmitting ? t('signUp.submitting') : t('signUp.submit'))}
                            </button>
                        </div>
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
                        <form onSubmit={handleForgotEmail} onChange={clearFieldError} noValidate>
                            <AuthField id="fpEmail" error={fieldErrors.fpEmail} label={t('forgotPassword.email')} icon="bi-envelope">
                                <input type="email" className="auth-input" id="fpEmail" {...fieldProps('fpEmail')} autoComplete="email" placeholder={t('forgotPassword.emailPlaceholder')} value={fpEmail} onChange={e => setFpEmail(e.target.value)} />
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
                        <form onSubmit={handleResetPassword} onChange={clearFieldError} noValidate>
                            <AuthField id="fpNewPw" error={fieldErrors.fpNewPw} label={t('forgotPassword.newPassword')} icon="bi-lock"
                                toggle={<PasswordToggleButton visible={showFpNewPw} onToggle={() => setShowFpNewPw(v=>!v)} />}>
                                <input type={showFpNewPw?'text':'password'} className="auth-input has-toggle" id="fpNewPw" {...NO_CLIPBOARD} {...fieldProps('fpNewPw')} autoComplete="new-password" placeholder={t('forgotPassword.newPasswordPlaceholder')} value={fpNewPw} onChange={e => setFpNewPw(e.target.value)} />
                            </AuthField>
                            
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
                            <AuthField id="fpConfirmPw" error={fieldErrors.fpConfirmPw} label={t('forgotPassword.confirmNewPassword')} icon="bi-lock"
                                toggle={<PasswordToggleButton visible={showFpConfPw} onToggle={() => setShowFpConfPw(v=>!v)} />}
                                hint={fpConfirmPw ? (fpNewPw===fpConfirmPw ? t('signUp.passwordsMatch') : t('signUp.passwordsNoMatch')) : null}
                                hintTone={fpNewPw===fpConfirmPw ? 'ok' : 'bad'}>
                                <input type={showFpConfPw?'text':'password'} id="fpConfirmPw" {...NO_CLIPBOARD} {...fieldProps('fpConfirmPw')} autoComplete="new-password"
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
        </>
    );
}

export default Hero;