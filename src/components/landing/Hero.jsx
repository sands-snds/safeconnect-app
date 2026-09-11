import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { signinUser, setAuthToken } from '../../Services/api';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

const NAME_ALLOWED_REGEX = /[^a-zA-Z\s]/g;
const DIGITS_ONLY_REGEX  = /[^0-9]/g;
const PASSWORD_REQUIREMENTS = [
    { label: 'at least 8 characters',        test: (pw) => pw.length >= 8 },
    { label: 'an uppercase letter',           test: (pw) => /[A-Z]/.test(pw) },
    { label: 'a number',                      test: (pw) => /[0-9]/.test(pw) },
    { label: 'a symbol (e.g. ! @ # $ %)',     test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];
const getMissingPasswordRequirements = (pw) =>
    PASSWORD_REQUIREMENTS.filter((r) => !r.test(pw)).map((r) => r.label);

const EMERGENCY_CONTACTS = [
    { id:'police',    label:'911 Emergency',    sublabel:'National Emergency Hotline',       number:'911',            icon:'bi-shield-fill-exclamation', color:'#dc2626' },
    { id:'dasma',     label:'Dasmariñas Police',sublabel:'Dasmariñas City PNP',              number:'+63462420002',   icon:'bi-shield-fill',             color:'#1d4ed8' },
    { id:'cdrmc',     label:'CDRMC',             sublabel:'Cavite Disaster Risk Management', number:'+63462300345',   icon:'bi-heart-pulse-fill',        color:'#059669' },
    { id:'barangay',  label:'Barangay Santa Fe', sublabel:'Barangay Emergency Line',         number:'+639929474309',  icon:'bi-house-fill',              color:'#7c3aed' },
];

// ── API helpers ───────────────────────────────────────────────────────────────
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
    const [showContacts, setShowContacts] = useState(false);
    const handleCall = (number) => { window.location.href = `tel:${number}`; setShowContacts(false); };

    return (
        <>
            {showContacts && <div onClick={() => setShowContacts(false)} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:1050,backdropFilter:'blur(2px)' }} />}
            {showContacts && (
                <div style={{ position:'fixed',bottom:'96px',right:'24px',zIndex:1051,background:'#fff',borderRadius:'16px',boxShadow:'0 8px 32px rgba(0,0,0,0.22)',padding:'16px',width:'280px',animation:'slideUpFade 0.22s ease' }}>
                    <p style={{ margin:'0 0 2px',fontWeight:700,fontSize:'14px',color:'#111' }}>Emergency Contacts</p>
                    <p style={{ margin:'0 0 12px',fontSize:'12px',color:'#6b7280' }}>Tap a contact to call immediately</p>
                    <div style={{ display:'flex',flexDirection:'column',gap:'8px' }}>
                        {EMERGENCY_CONTACTS.map(c => (
                            <button key={c.id} onClick={() => handleCall(c.number)} style={{ display:'flex',alignItems:'center',gap:'12px',padding:'10px 12px',borderRadius:'10px',border:`1.5px solid ${c.color}22`,background:`${c.color}0d`,cursor:'pointer',textAlign:'left',width:'100%' }}
                                onMouseEnter={e => e.currentTarget.style.background=`${c.color}22`}
                                onMouseLeave={e => e.currentTarget.style.background=`${c.color}0d`}>
                                <div style={{ width:'38px',height:'38px',borderRadius:'50%',background:c.color,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                                    <i className={`bi ${c.icon}`} style={{ color:'#fff',fontSize:'16px' }} />
                                </div>
                                <div style={{ flex:1 }}>
                                    <p style={{ margin:0,fontWeight:600,fontSize:'13px',color:'#111' }}>{c.label}</p>
                                    <p style={{ margin:0,fontSize:'11px',color:'#6b7280' }}>{c.sublabel}</p>
                                </div>
                                <div style={{ display:'flex',alignItems:'center',gap:'4px',background:c.color,color:'#fff',borderRadius:'20px',padding:'4px 10px',fontSize:'11px',fontWeight:600 }}>
                                    <i className="bi bi-telephone-fill" style={{ fontSize:'10px' }} />Call
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
            <button onClick={() => setShowContacts(v => !v)} aria-label="Emergency Contacts" style={{ position:'fixed',bottom:'24px',right:'24px',zIndex:1052,width:'60px',height:'60px',borderRadius:'50%',background:showContacts?'linear-gradient(135deg,#7f1d1d,#dc2626)':'linear-gradient(135deg,#dc2626,#ef4444)',border:'none',boxShadow:showContacts?'0 4px 24px rgba(220,38,38,0.5)':'0 4px 20px rgba(220,38,38,0.45)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',transition:'transform 0.2s,box-shadow 0.2s,background 0.2s',transform:showContacts?'scale(1.08) rotate(15deg)':'scale(1)',animation:showContacts?'none':'pulse-ring 2s infinite' }}
                onMouseEnter={e => { if(!showContacts) e.currentTarget.style.transform='scale(1.1)'; }}
                onMouseLeave={e => { if(!showContacts) e.currentTarget.style.transform='scale(1)'; }}>
                <i className={showContacts?'bi bi-x-lg':'bi bi-telephone-fill'} style={{ color:'#fff',fontSize:showContacts?'20px':'22px' }} />
            </button>
            <style>{`
                @keyframes pulse-ring { 0%{box-shadow:0 0 0 0 rgba(220,38,38,0.55),0 4px 20px rgba(220,38,38,0.45)} 60%{box-shadow:0 0 0 14px rgba(220,38,38,0),0 4px 20px rgba(220,38,38,0.45)} 100%{box-shadow:0 0 0 0 rgba(220,38,38,0),0 4px 20px rgba(220,38,38,0.45)} }
                @keyframes slideUpFade { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
            `}</style>
        </>
    );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
    const [showSignInModal,  setShowSignInModal]  = useState(false);
    const [showSignUpModal,  setShowSignUpModal]  = useState(false);
    // 'form' | 'otp'
    const [signUpStep,       setSignUpStep]       = useState('form');

    const [signInEmail,      setSignInEmail]      = useState('');
    const [signInPassword,   setSignInPassword]   = useState('');
    const [showSignInPw,     setShowSignInPw]      = useState(false);

    const [signUpFirstName,  setSignUpFirstName]  = useState('');
    const [signUpMiddleName, setSignUpMiddleName] = useState('');
    const [signUpLastName,   setSignUpLastName]   = useState('');
    const [signUpUsername,   setSignUpUsername]   = useState('');
    const [signUpContact,    setSignUpContact]    = useState('');
    const [signUpEmail,      setSignUpEmail]      = useState('');
    const [signUpPassword,   setSignUpPassword]   = useState('');
    const [signUpConfirm,    setSignUpConfirm]    = useState('');
    const [showSignUpPw,     setShowSignUpPw]      = useState(false);
    const [showSignUpConfPw, setShowSignUpConfPw]  = useState(false);

    // OTP step
    const [otp,              setOtp]              = useState(['','','','','','']);
    const [otpEmail,         setOtpEmail]         = useState('');   // email used when OTP was sent
    const [resendCooldown,   setResendCooldown]   = useState(0);
    const otpRefs = useRef([]);

    const [isSubmitting,     setIsSubmitting]     = useState(false);
    const [error,            setError]            = useState('');
    const [successMessage,   setSuccessMessage]   = useState('');

    // ── Resend countdown ──
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const t = setTimeout(() => setResendCooldown(v => v - 1), 1000);
        return () => clearTimeout(t);
    }, [resendCooldown]);

    const handleNameChange = (setter) => (e) =>
        setter(e.target.value.replace(NAME_ALLOWED_REGEX, ''));

    const handleContactChange = (e) =>
        setSignUpContact(e.target.value.replace(DIGITS_ONLY_REGEX, '').slice(0, 10));

    const handleSignInButtonClick = () => {
        setShowSignInModal(true);
        setShowSignUpModal(false);
        setError('');
        setSuccessMessage('');
    };

    // ── Sign in ───────────────────────────────────────────────────────────────
    const handleSignIn = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        const email    = signInEmail.trim();
        const password = signInPassword;
        if (!email || !password) { setError('Please enter both email and password'); return; }

        setIsSubmitting(true);
        try {
            const result = await signinUser(email, password);
            if (!result.success) { setError(result.message || 'Invalid email or password.'); return; }

            setAuthToken(result.token, result.isAdmin);
            if (result.isAdmin) {
                sessionStorage.setItem('adminAuthenticated', 'true');
                window.location.href = '/admin';
                return;
            }
            sessionStorage.setItem('userAuthenticated', 'true');
            sessionStorage.setItem('currentUser', JSON.stringify(result.user));
            localStorage.setItem('residentName', result.user.fullName);
            window.location.href = '/resident';
        } catch {
            setError('Could not reach the server. Please check your connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Sign up step 1: send OTP ──────────────────────────────────────────────
    const handleSignUpSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!signUpFirstName || !signUpLastName || !signUpUsername ||
            !signUpContact || !signUpEmail || !signUpPassword || !signUpConfirm) {
            setError('Please fill in all required fields'); return;
        }
        if (signUpContact.length !== 10) { setError('Contact number must be exactly 10 digits'); return; }
        if (signUpPassword !== signUpConfirm) { setError('Passwords do not match'); return; }
        const missing = getMissingPasswordRequirements(signUpPassword);
        if (missing.length > 0) { setError(`Password is missing: ${missing.join(', ')}`); return; }

        const fullName = [signUpFirstName, signUpMiddleName, signUpLastName].filter(Boolean).join(' ');
        setIsSubmitting(true);
        try {
            const result = await apiPost('request-otp', {
                fullName,
                username: signUpUsername,
                contact: `+63${signUpContact}`,
                email: signUpEmail,
                password: signUpPassword,
            });
            if (!result.success) { setError(result.message || 'Failed to send verification code.'); return; }

            setOtpEmail(signUpEmail);
            setOtp(['','','','','','']);
            setSignUpStep('otp');
            setResendCooldown(60);
        } catch {
            setError('Could not reach the server. Please check your connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── OTP input handling ────────────────────────────────────────────────────
    const handleOtpChange = (index, value) => {
        const cleaned = value.replace(/\D/g, '').slice(-1);
        const next = [...otp];
        next[index] = cleaned;
        setOtp(next);
        if (cleaned && index < 5) otpRefs.current[index + 1]?.focus();
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0)
            otpRefs.current[index - 1]?.focus();
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

    // ── Sign up step 2: verify OTP ────────────────────────────────────────────
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        const code = otp.join('');
        if (code.length < 6) { setError('Please enter the complete 6-digit code.'); return; }

        setIsSubmitting(true);
        try {
            const result = await apiPost('verify-otp', { email: otpEmail, otp: code });
            if (!result.success) { setError(result.message || 'Incorrect or expired code.'); return; }

            // Reset form state
            setSignUpFirstName(''); setSignUpMiddleName(''); setSignUpLastName('');
            setSignUpUsername(''); setSignUpContact(''); setSignUpEmail('');
            setSignUpPassword(''); setSignUpConfirm('');
            setOtp(['','','','','','']); setSignUpStep('form');
            setShowSignUpModal(false);
            setShowSignInModal(true);
            setSuccessMessage('Account created successfully! Please sign in.');
        } catch {
            setError('Could not reach the server. Please check your connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Resend OTP ────────────────────────────────────────────────────────────
    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;
        setError(''); setIsSubmitting(true);
        try {
            const result = await apiPost('resend-otp', { email: otpEmail });
            if (!result.success) { setError(result.message || 'Could not resend code.'); return; }
            setOtp(['','','','','','']);
            setResendCooldown(60);
        } catch {
            setError('Could not reach the server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const switchToSignUp = () => { setShowSignInModal(false); setError(''); setSuccessMessage(''); setShowSignUpModal(true); };
    const switchToSignIn = () => { setShowSignUpModal(false); setError(''); setSuccessMessage(''); setShowSignInModal(true); setSignUpStep('form'); };

    const closeAllModals = () => {
        setShowSignInModal(false); setShowSignUpModal(false); setSignUpStep('form');
        setSignInEmail(''); setSignInPassword(''); setShowSignInPw(false);
        setSignUpFirstName(''); setSignUpMiddleName(''); setSignUpLastName('');
        setSignUpUsername(''); setSignUpContact(''); setSignUpEmail('');
        setSignUpPassword(''); setSignUpConfirm('');
        setShowSignUpPw(false); setShowSignUpConfPw(false);
        setOtp(['','','','','','']); setError(''); setSuccessMessage('');
    };

    const PasswordToggleButton = ({ visible, onToggle }) => (
        <button type="button" onClick={onToggle} aria-label={visible ? 'Hide password' : 'Show password'}
            style={{ position:'absolute',right:'10px',top:'50%',transform:'translateY(-50%)',background:'none',border:'none',padding:0,display:'flex',alignItems:'center',color:'#6B2C3E',cursor:'pointer' }}>
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
    );

    return (
        <>
            {/* ── Hero section ── */}
            <div id="home" style={{ minHeight:'100vh',position:'relative',display:'flex',alignItems:'center' }}>
                <div id="homeCarousel" className="carousel slide" data-bs-ride="carousel" data-bs-interval="4000" data-bs-pause="hover"
                    style={{ position:'absolute',top:0,left:0,width:'100%',height:'100%' }}>
                    <div className="carousel-indicators">
                        <button type="button" data-bs-target="#homeCarousel" data-bs-slide-to="0" className="active" aria-current="true" aria-label="Slide 1"></button>
                        <button type="button" data-bs-target="#homeCarousel" data-bs-slide-to="1" aria-label="Slide 2"></button>
                        <button type="button" data-bs-target="#homeCarousel" data-bs-slide-to="2" aria-label="Slide 3"></button>
                    </div>
                    <div className="carousel-inner" style={{ height:'100%' }}>
                        <div className="carousel-item active" style={{ height:'100%' }}><img src="/images/0c38766bd32b9d2652dd32d72a8739d8.jpg" style={{ width:'100%',height:'100%',objectFit:'cover' }} alt="Rescue Team" /></div>
                        <div className="carousel-item" style={{ height:'100%' }}><img src="/images/istockphoto-1431608809-612x612.jpg" style={{ width:'100%',height:'100%',objectFit:'cover' }} alt="Community rescue" /></div>
                        <div className="carousel-item" style={{ height:'100%' }}><img src="/images/Resized-p-MMR0389-resized-50-percent-1024x682.jpg" style={{ width:'100%',height:'100%',objectFit:'cover' }} alt="Evacuation" /></div>
                    </div>
                    <button className="carousel-control-prev" type="button" data-bs-target="#homeCarousel" data-bs-slide="prev"><span className="carousel-control-prev-icon" aria-hidden="true"></span><span className="visually-hidden">Previous</span></button>
                    <button className="carousel-control-next" type="button" data-bs-target="#homeCarousel" data-bs-slide="next"><span className="carousel-control-next-icon" aria-hidden="true"></span><span className="visually-hidden">Next</span></button>
                </div>
                <div style={{ position:'absolute',top:0,left:0,width:'100%',height:'100%',background:'linear-gradient(rgba(0,0,0,0.6),rgba(0,0,0,0.6))',zIndex:1 }} />
                <div className="container" style={{ position:'relative',zIndex:2,color:'white' }}>
                    <div className="row align-items-center">
                        <div className="col-lg-8 mb-4 mb-lg-0 text-center text-lg-start" style={{ paddingLeft:'clamp(20px,5vw,60px)',paddingRight:'clamp(20px,5vw,60px)' }}>
                            <p style={{ fontSize:'clamp(0.85rem,1.5vw,1rem)',fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',color:'#FFC107',marginBottom:'8px' }}>
                                Barangay Santa Fe Safe Connect
                            </p>
                            <h1 className="fw-bold" style={{ fontSize:'clamp(2rem,5vw,3.5rem)',lineHeight:'1.2' }}>
                                STAY <span style={{ color:'#FFC107' }}>SAFE</span> STAY INFORMED
                            </h1>
                            <p className="mt-3" style={{ fontSize:'clamp(1rem,2vw,1.25rem)',lineHeight:'1.6' }}>
                                Be prepared when it matters most. Get real-time updates, request help instantly,
                                and find safe evacuation centers — all in one place.
                            </p>
                            <div className="d-flex gap-3 flex-wrap mt-4 justify-content-center justify-content-lg-start">
                                <button className="btn btn-danger btn-lg fw-bold shadow" onClick={handleSignInButtonClick} style={{ fontSize:'1.1rem',minWidth:'150px',padding:'0.75rem 2rem' }}>Sign In</button>
                                <button className="btn btn-outline-light btn-lg fw-bold" onClick={() => setShowSignUpModal(true)} style={{ fontSize:'1.1rem',minWidth:'150px',padding:'0.75rem 2rem' }}>Sign Up</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Sign In Modal ── */}
            {showSignInModal && (
                <div className="modal fade show d-block" style={{ backgroundColor:'rgba(0,0,0,0.5)',zIndex:1060 }} onClick={closeAllModals}>
                    <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header" style={{ backgroundColor:'#6B2C3E',color:'white' }}>
                                <h5 className="modal-title fw-bold" style={{ color:'white' }}>Sign In</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={closeAllModals} />
                            </div>
                            <div className="modal-body p-4">
                                {error       && <div className="alert alert-danger"   role="alert">{error}</div>}
                                {successMessage && <div className="alert alert-success" role="alert">{successMessage}</div>}
                                <div className="mb-3">
                                    <label htmlFor="loginEmail" className="form-label fw-bold">Email Address</label>
                                    <input type="email" className="form-control" id="loginEmail" placeholder="Enter your email" value={signInEmail} onChange={e => setSignInEmail(e.target.value)} />
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="loginPassword" className="form-label fw-bold">Password</label>
                                    <div style={{ position:'relative' }}>
                                        <input type={showSignInPw?'text':'password'} className="form-control" id="loginPassword" placeholder="Enter your password" value={signInPassword} onChange={e => setSignInPassword(e.target.value)} style={{ paddingRight:'36px' }} />
                                        <PasswordToggleButton visible={showSignInPw} onToggle={() => setShowSignInPw(v=>!v)} />
                                    </div>
                                </div>
                                <button onClick={handleSignIn} className="btn w-100 fw-bold mb-3" style={{ backgroundColor:'#6B2C3E',color:'white' }} disabled={isSubmitting}>
                                    {isSubmitting ? 'Signing In...' : 'Sign In'}
                                </button>
                                <div className="text-center">
                                    <p className="mb-0">Don't have an account?{' '}
                                        <button type="button" className="btn btn-link p-0 text-decoration-none" onClick={switchToSignUp} style={{ color:'#6B2C3E',fontWeight:'bold' }}>Sign Up</button>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Sign Up Modal ── */}
            {showSignUpModal && (
                <div className="modal fade show d-block" style={{ backgroundColor:'rgba(0,0,0,0.5)',zIndex:1060 }} onClick={closeAllModals}>
                    <div className="modal-dialog modal-dialog-centered modal-lg" style={{ display:'flex',justifyContent:'center',alignItems:'center',margin:'auto',minHeight:'100vh' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-content" style={{ width:'100%',maxWidth:'900px' }}>
                            <div className="modal-header" style={{ backgroundColor:'#6B2C3E',color:'white' }}>
                                <h5 className="modal-title fw-bold" style={{ color:'white' }}>
                                    {signUpStep === 'otp' ? 'Verify Your Email' : 'Create Account'}
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={closeAllModals} />
                            </div>

                            <div className="modal-body p-4">
                                {error && <div className="alert alert-danger" role="alert">{error}</div>}

                                {/* ── Step 1: Registration form ── */}
                                {signUpStep === 'form' && (
                                    <>
                                        <div className="row">
                                            <div className="col-md-4 mb-3">
                                                <label htmlFor="registerFirstName" className="form-label fw-bold">First Name</label>
                                                <input type="text" className="form-control" id="registerFirstName" placeholder="First name" value={signUpFirstName} onChange={handleNameChange(setSignUpFirstName)} />
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <label htmlFor="registerMiddleName" className="form-label fw-bold">Middle Name</label>
                                                <input type="text" className="form-control" id="registerMiddleName" placeholder="(Optional)" value={signUpMiddleName} onChange={handleNameChange(setSignUpMiddleName)} />
                                            </div>
                                            <div className="col-md-4 mb-3">
                                                <label htmlFor="registerLastName" className="form-label fw-bold">Last Name</label>
                                                <input type="text" className="form-control" id="registerLastName" placeholder="Last name" value={signUpLastName} onChange={handleNameChange(setSignUpLastName)} />
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <label htmlFor="registerUsername" className="form-label fw-bold">Username</label>
                                            <input type="text" className="form-control" id="registerUsername" placeholder="Choose a username" value={signUpUsername} onChange={e => setSignUpUsername(e.target.value)} />
                                        </div>
                                        <div className="mb-3">
                                            <label htmlFor="registerContact" className="form-label fw-bold">Contact Number</label>
                                            <div className="input-group">
                                                <span className="input-group-text">+63</span>
                                                <input type="tel" className="form-control" id="registerContact" placeholder="9XXXXXXXXX" value={signUpContact} onChange={handleContactChange} maxLength={10} inputMode="numeric" />
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <label htmlFor="registerEmail" className="form-label fw-bold">Email Address</label>
                                            <input type="email" className="form-control" id="registerEmail" placeholder="Enter your email" value={signUpEmail} onChange={e => setSignUpEmail(e.target.value)} />
                                        </div>
                                        <div className="mb-3">
                                            <label htmlFor="registerPassword" className="form-label fw-bold">Password</label>
                                            <div style={{ position:'relative' }}>
                                                <input type={showSignUpPw?'text':'password'} className="form-control" id="registerPassword" placeholder="Min. 8 characters" value={signUpPassword} onChange={e => setSignUpPassword(e.target.value)} style={{ paddingRight:'36px' }} />
                                                <PasswordToggleButton visible={showSignUpPw} onToggle={() => setShowSignUpPw(v=>!v)} />
                                            </div>
                                            {signUpPassword && (
                                                <ul className="list-unstyled mb-0 mt-2" style={{ fontSize:'0.85rem' }}>
                                                    {PASSWORD_REQUIREMENTS.map(req => {
                                                        const met = req.test(signUpPassword);
                                                        return <li key={req.label} style={{ color:met?'#198754':'#dc3545' }}>{met?'✓':'✗'} {req.label}</li>;
                                                    })}
                                                </ul>
                                            )}
                                        </div>
                                        <div className="mb-4">
                                            <label htmlFor="registerConfirmPassword" className="form-label fw-bold">Confirm Password</label>
                                            <div style={{ position:'relative' }}>
                                                <input type={showSignUpConfPw?'text':'password'} className="form-control" id="registerConfirmPassword" placeholder="Confirm your password" value={signUpConfirm} onChange={e => setSignUpConfirm(e.target.value)}
                                                    style={{ paddingRight:'36px', borderColor:signUpConfirm?(signUpPassword===signUpConfirm?'#198754':'#dc3545'):undefined }} />
                                                <PasswordToggleButton visible={showSignUpConfPw} onToggle={() => setShowSignUpConfPw(v=>!v)} />
                                            </div>
                                            {signUpConfirm && (
                                                <p style={{ margin:'6px 0 0',fontSize:'0.85rem',fontWeight:600,color:signUpPassword===signUpConfirm?'#198754':'#dc3545' }}>
                                                    {signUpPassword===signUpConfirm ? '✓ Passwords match' : '✗ Passwords do not match'}
                                                </p>
                                            )}
                                        </div>
                                        <button onClick={handleSignUpSubmit} className="btn w-100 fw-bold mb-3" style={{ backgroundColor:'#6B2C3E',color:'white' }} disabled={isSubmitting}>
                                            {isSubmitting ? 'Sending verification code...' : 'Continue'}
                                        </button>
                                        <div className="text-center">
                                            <p className="mb-0">Already have an account?{' '}
                                                <button type="button" className="btn btn-link p-0 text-decoration-none" onClick={switchToSignIn} style={{ color:'#6B2C3E',fontWeight:'bold' }}>Sign In</button>
                                            </p>
                                        </div>
                                    </>
                                )}

                                {/* ── Step 2: OTP entry ── */}
                                {signUpStep === 'otp' && (
                                    <div style={{ maxWidth:'420px',margin:'0 auto' }}>
                                        <div style={{ textAlign:'center',marginBottom:'24px' }}>
                                            <div style={{ width:'64px',height:'64px',borderRadius:'50%',background:'#fdf0f3',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px' }}>
                                                <i className="bi bi-envelope-fill" style={{ fontSize:'28px',color:'#6B2C3E' }} />
                                            </div>
                                            <h6 className="fw-bold" style={{ color:'#111',marginBottom:'8px' }}>Check your email</h6>
                                            <p style={{ color:'#666',fontSize:'0.9rem',marginBottom:0 }}>
                                                We sent a 6-digit code to <strong>{otpEmail}</strong>.
                                                Enter it below to verify your email and create your account.
                                            </p>
                                        </div>

                                        {/* 6-box OTP input */}
                                        <div style={{ display:'flex',gap:'10px',justifyContent:'center',marginBottom:'24px' }} onPaste={handleOtpPaste}>
                                            {otp.map((digit, i) => (
                                                <input
                                                    key={i}
                                                    ref={el => otpRefs.current[i] = el}
                                                    type="text"
                                                    inputMode="numeric"
                                                    maxLength={1}
                                                    value={digit}
                                                    onChange={e => handleOtpChange(i, e.target.value)}
                                                    onKeyDown={e => handleOtpKeyDown(i, e)}
                                                    style={{
                                                        width:'48px',height:'56px',textAlign:'center',
                                                        fontSize:'1.4rem',fontWeight:800,
                                                        border:`2px solid ${digit?'#6B2C3E':'#dee2e6'}`,
                                                        borderRadius:'10px',outline:'none',
                                                        color:'#6B2C3E',transition:'border-color 0.15s',
                                                    }}
                                                    onFocus={e => e.target.style.borderColor='#6B2C3E'}
                                                    onBlur={e => e.target.style.borderColor=digit?'#6B2C3E':'#dee2e6'}
                                                />
                                            ))}
                                        </div>

                                        <button onClick={handleVerifyOtp} className="btn w-100 fw-bold mb-3" style={{ backgroundColor:'#6B2C3E',color:'white' }} disabled={isSubmitting || otp.join('').length < 6}>
                                            {isSubmitting ? 'Verifying...' : 'Verify & Create Account'}
                                        </button>

                                        <div className="text-center">
                                            <p style={{ fontSize:'0.875rem',color:'#666',marginBottom:'8px' }}>
                                                Didn't receive the code?
                                            </p>
                                            <button type="button" className="btn btn-link p-0 text-decoration-none fw-bold" onClick={handleResendOtp} disabled={resendCooldown > 0 || isSubmitting}
                                                style={{ color: resendCooldown > 0 ? '#aaa' : '#6B2C3E', fontSize:'0.875rem' }}>
                                                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                                            </button>
                                        </div>

                                        <div className="text-center mt-3">
                                            <button type="button" className="btn btn-link p-0 text-decoration-none" onClick={() => { setSignUpStep('form'); setError(''); }}
                                                style={{ color:'#888',fontSize:'0.85rem' }}>
                                                ← Back to registration
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <EmergencyCallButton />
        </>
    );
}

export default Hero;