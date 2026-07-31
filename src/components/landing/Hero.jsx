import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const API_BASE =
    process.env.REACT_APP_API_BASE ||
    "http://localhost:5000/api";

// Only letters and spaces allowed in name fields
const NAME_ALLOWED_REGEX = /[^a-zA-Z\s]/g;
// Only digits allowed in contact field
const DIGITS_ONLY_REGEX = /[^0-9]/g;
// Individual password requirement checks, used to report exactly what's missing
const PASSWORD_REQUIREMENTS = [
    { label: 'at least 8 characters', test: (pw) => pw.length >= 8 },
    { label: 'an uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
    { label: 'a number', test: (pw) => /[0-9]/.test(pw) },
    { label: 'a symbol (e.g. ! @ # $ %)', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

// Returns an array of requirement labels that the password fails to meet
const getMissingPasswordRequirements = (password) =>
    PASSWORD_REQUIREMENTS.filter((req) => !req.test(password)).map((req) => req.label);

function Hero() {
    const [showSignInModal, setShowSignInModal] = useState(false);
    const [showSignUpModal, setShowSignUpModal] = useState(false);

    const [signInEmail, setSignInEmail] = useState('');
    const [signInPassword, setSignInPassword] = useState('');
    const [showSignInPassword, setShowSignInPassword] = useState(false);

    const [signUpFirstName, setSignUpFirstName] = useState('');
    const [signUpMiddleName, setSignUpMiddleName] = useState('');
    const [signUpLastName, setSignUpLastName] = useState('');
    const [signUpUsername, setSignUpUsername] = useState('');
    const [signUpContact, setSignUpContact] = useState('');
    const [signUpEmail, setSignUpEmail] = useState('');
    const [signUpPassword, setSignUpPassword] = useState('');
    const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
    const [showSignUpPassword, setShowSignUpPassword] = useState(false);
    const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSignInButtonClick = () => {
        setShowSignInModal(true);
        setShowSignUpModal(false);
        setError('');
        setSuccessMessage('');
    };

    // ---- Name field handlers: strip numbers/symbols as the user types ----
    const handleNameChange = (setter) => (e) => {
        const cleaned = e.target.value.replace(NAME_ALLOWED_REGEX, '');
        setter(cleaned);
    };

    // ---- Contact field handler: digits only, capped at 10 digits ----
    const handleContactChange = (e) => {
        const digitsOnly = e.target.value.replace(DIGITS_ONLY_REGEX, '').slice(0, 10);
        setSignUpContact(digitsOnly);
    };

    const handleSignIn = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        const email = signInEmail.trim();
        const password = signInPassword;

        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_URL}?action=signin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const result = await response.json();

            if (!result.success) {
                setError(result.message || 'Invalid email or password.');
                return;
            }

            // Backend already logs the login (admin_logs / signin_logs) — no separate log call needed.
            if (result.isAdmin) {
                sessionStorage.setItem('adminAuthenticated', 'true');
                window.location.href = '/admin';
                return;
            }

            sessionStorage.setItem('userAuthenticated', 'true');
            sessionStorage.setItem('currentUser', JSON.stringify(result.user));
            // Save the resident's name so other pages (like the navbar) can show it
            localStorage.setItem('residentName', result.user.fullName);

            window.location.href = '/resident';
            setShowSignInModal(false);
            setSignInEmail('');
            setSignInPassword('');
        } catch (err) {
            console.error('Sign in error:', err);
            setError('Could not reach the server. Please check your connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!signUpFirstName || !signUpLastName || !signUpUsername || !signUpContact ||
            !signUpEmail || !signUpPassword || !signUpConfirmPassword) {
            setError('Please fill in all required fields');
            return;
        }

        if (signUpContact.length !== 10) {
            setError('Contact number must be exactly 10 digits');
            return;
        }

        if (signUpPassword !== signUpConfirmPassword) {
            setError('Passwords do not match');
            return;
        }

        const missingRequirements = getMissingPasswordRequirements(signUpPassword);
        if (missingRequirements.length > 0) {
            setError(`Password is missing: ${missingRequirements.join(', ')}`);
            return;
        }

        const fullName = [signUpFirstName, signUpMiddleName, signUpLastName]
            .filter(Boolean)
            .join(' ');

        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_URL}?action=signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName,
                    username: signUpUsername,
                    contact: `+63${signUpContact}`,
                    email: signUpEmail,
                    password: signUpPassword
                })
            });
            const result = await response.json();

            if (!result.success) {
                setError(result.message || 'Failed to create account. Please try again.');
                return;
            }

            setSignUpFirstName('');
            setSignUpMiddleName('');
            setSignUpLastName('');
            setSignUpUsername('');
            setSignUpContact('');
            setSignUpEmail('');
            setSignUpPassword('');
            setSignUpConfirmPassword('');
            setError('');
            setSuccessMessage('Account created successfully! Please sign in.');

            setShowSignUpModal(false);
            setShowSignInModal(true);
        } catch (err) {
            console.error('Sign up error:', err);
            setError('Could not reach the server. Please check your connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const switchToSignUp = () => {
        setShowSignInModal(false);
        setError('');
        setSuccessMessage('');
        setShowSignUpModal(true);
    };

    const switchToSignIn = () => {
        setShowSignUpModal(false);
        setError('');
        setSuccessMessage('');
        setShowSignInModal(true);
    };

    const closeAllModals = () => {
        setShowSignInModal(false);
        setShowSignUpModal(false);
        setSignInEmail('');
        setSignInPassword('');
        setShowSignInPassword(false);
        setSignUpFirstName('');
        setSignUpMiddleName('');
        setSignUpLastName('');
        setSignUpUsername('');
        setSignUpContact('');
        setSignUpEmail('');
        setSignUpPassword('');
        setSignUpConfirmPassword('');
        setShowSignUpPassword(false);
        setShowSignUpConfirmPassword(false);
        setError('');
        setSuccessMessage('');
    };

    // Small reusable eye-toggle button for password fields
    const PasswordToggleButton = ({ visible, onToggle }) => (
        <button
            type="button"
            onClick={onToggle}
            aria-label={visible ? 'Hide password' : 'Show password'}
            style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                color: '#6B2C3E',
                cursor: 'pointer',
            }}
        >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
    );

    return (
        <>
            <div id="home" style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center' }}>
                <div 
                    id="homeCarousel" 
                    className="carousel slide"
                    data-bs-ride="carousel" 
                    data-bs-interval="4000" 
                    data-bs-pause="hover"
                    style={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%'
                    }}
                >
                    <div className="carousel-indicators">
                        <button type="button" data-bs-target="#homeCarousel" data-bs-slide-to="0" className="active" aria-current="true" aria-label="Slide 1"></button>
                        <button type="button" data-bs-target="#homeCarousel" data-bs-slide-to="1" aria-label="Slide 2"></button>
                        <button type="button" data-bs-target="#homeCarousel" data-bs-slide-to="2" aria-label="Slide 3"></button>
                    </div>

                    <div className="carousel-inner" style={{ height: '100%' }}> 
                        <div className="carousel-item active" style={{ height: '100%' }}>
                            <img src="/images/0c38766bd32b9d2652dd32d72a8739d8.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Rescue Team in action during emergency" />
                        </div>
                        <div className="carousel-item" style={{ height: '100%' }}>
                            <img src="/images/istockphoto-1431608809-612x612.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Community rescue coordination" />
                        </div>
                        <div className="carousel-item" style={{ height: '100%' }}>
                            <img src="/images/Resized-p-MMR0389-resized-50-percent-1024x682.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Safe evacuation support" />
                        </div>
                    </div>

                    <button className="carousel-control-prev" type="button" data-bs-target="#homeCarousel" data-bs-slide="prev">
                        <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                        <span className="visually-hidden">Previous</span>
                    </button>
                    <button className="carousel-control-next" type="button" data-bs-target="#homeCarousel" data-bs-slide="next">
                        <span className="carousel-control-next-icon" aria-hidden="true"></span>
                        <span className="visually-hidden">Next</span>
                    </button>
                </div>

                <div 
                    style={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6))',
                        zIndex: 1
                    }}
                ></div>

                <div className="container" style={{ position: 'relative', zIndex: 2, color: 'white' }}>
                    <div className="row align-items-center">
                        <div className="col-lg-8 mb-4 mb-lg-0 text-center text-lg-start" style={{ paddingLeft: 'clamp(20px, 5vw, 60px)', paddingRight: 'clamp(20px, 5vw, 60px)' }}>
                            <h1 className="fw-bold" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: '1.2' }}>
                                STAY <span style={{ color: '#FFC107' }}>SAFE</span> STAY INFORMED
                            </h1>
                            <p className="mt-3" style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', lineHeight: '1.6' }}>
                                Be prepared when it matters most. Get real-time updates, request help instantly, 
                                and find safe evacuation centers — all in one place.
                            </p>
                            <div className="d-flex gap-3 flex-wrap mt-4 justify-content-center justify-content-lg-start">
                                <button 
                                    className="btn btn-danger btn-lg fw-bold shadow"
                                    onClick={handleSignInButtonClick}
                                    style={{ fontSize: '1.1rem', minWidth: '150px', padding: '0.75rem 2rem',}}
                                >
                                    Sign In
                                </button>
                                <button 
                                    className="btn btn-outline-light btn-lg fw-bold"
                                    onClick={() => setShowSignUpModal(true)}
                                    style={{ fontSize: '1.1rem', minWidth: '150px', padding: '0.75rem 2rem' }}
                                >
                                    Sign Up
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showSignInModal && (
                <div 
                    className="modal fade show d-block" 
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
                    onClick={closeAllModals}
                >
                    <div 
                        className="modal-dialog modal-dialog-centered"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content">
                            <div className="modal-header" style={{ backgroundColor: '#6B2C3E', color: 'white' }}>
                                <h5 className="modal-title fw-bold" style={{ color: 'white' }}>Sign In </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={closeAllModals}></button>
                            </div>
                            <div className="modal-body p-4">
                                <div>
                                    {error && (
                                        <div className="alert alert-danger d-flex align-items-center" role="alert">
                                            <div>{error}</div>
                                        </div>
                                    )}
                                    
                                    {successMessage && (
                                        <div className="alert alert-success d-flex align-items-center" role="alert">
                                            <div>{successMessage}</div>
                                        </div>
                                    )}
                                    
                                    <div className="mb-3">
                                        <label htmlFor="loginEmail" className="form-label fw-bold">Email Address</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            id="loginEmail"
                                            placeholder="Enter your email"
                                            value={signInEmail}
                                            onChange={(e) => setSignInEmail(e.target.value)}
                                        />
                                    </div>
                                    
                                    <div className="mb-4">
                                        <label htmlFor="loginPassword" className="form-label fw-bold">Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showSignInPassword ? 'text' : 'password'}
                                                className="form-control"
                                                id="loginPassword"
                                                placeholder="Enter your password"
                                                value={signInPassword}
                                                onChange={(e) => setSignInPassword(e.target.value)}
                                                style={{ paddingRight: '36px' }}
                                            />
                                            <PasswordToggleButton
                                                visible={showSignInPassword}
                                                onToggle={() => setShowSignInPassword(v => !v)}
                                            />
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={handleSignIn}
                                        className="btn w-100 fw-bold mb-3"
                                        style={{ backgroundColor: '#6B2C3E', color: 'white' }}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Signing In...' : 'Sign In'}
                                    </button>

                                    <div className="text-center">
                                        <p className="mb-0">
                                            Don't have an account?{' '}
                                            <button 
                                                type="button"
                                                className="btn btn-link p-0 text-decoration-none"
                                                onClick={switchToSignUp}
                                                style={{ color: '#6B2C3E', fontWeight: 'bold' }}
                                            >
                                                Sign Up
                                            </button>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showSignUpModal && (
                    <div 
                        className="modal fade show d-block" 
                        style={{ 
                            backgroundColor: 'rgba(0,0,0,0.5)', 
                            zIndex: 1050 
                        }}
                        onClick={closeAllModals}
                    >
                        <div 
                            className="modal-dialog modal-dialog-centered modal-lg"
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                margin: 'auto',
                                minHeight: '100vh',
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div 
                                className="modal-content"
                                style={{
                                    width: '100%',
                                    maxWidth: '900px'
                                }}
                            >
                                <div 
                                    className="modal-header" 
                                    style={{ backgroundColor: '#6B2C3E', color: 'white' }}
                                >
                                    <h5 
                                        className="modal-title fw-bold" 
                                        style={{ color: 'white' }}
                                    >
                                        Create Account
                                    </h5>

                                    <button
                                        type="button"
                                        className="btn-close btn-close-white"
                                        onClick={closeAllModals}
                                    ></button>
                                </div>

                                <div className="modal-body p-4">
                                <div>
                                    {error && (
                                        <div className="alert alert-danger d-flex align-items-center" role="alert">
                                            <div>{error}</div>
                                        </div>
                                    )}

                                    <div className="row">
                                        <div className="col-md-4 mb-3">
                                            <label htmlFor="registerFirstName" className="form-label fw-bold">First Name</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="registerFirstName"
                                                placeholder="First name"
                                                value={signUpFirstName}
                                                onChange={handleNameChange(setSignUpFirstName)}
                                            />
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label htmlFor="registerMiddleName" className="form-label fw-bold">Middle Name</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="registerMiddleName"
                                                placeholder="(Optional)"
                                                value={signUpMiddleName}
                                                onChange={handleNameChange(setSignUpMiddleName)}
                                            />
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label htmlFor="registerLastName" className="form-label fw-bold">Last Name</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="registerLastName"
                                                placeholder="Last name"
                                                value={signUpLastName}
                                                onChange={handleNameChange(setSignUpLastName)}
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="registerUsername" className="form-label fw-bold">Username</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="registerUsername"
                                            placeholder="Choose a username"
                                            value={signUpUsername}
                                            onChange={(e) => setSignUpUsername(e.target.value)}
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="registerContact" className="form-label fw-bold">Contact Number</label>
                                        <div className="input-group">
                                            <span className="input-group-text">+63</span>
                                            <input
                                                type="tel"
                                                className="form-control"
                                                id="registerContact"
                                                placeholder="9XXXXXXXXX"
                                                value={signUpContact}
                                                onChange={handleContactChange}
                                                maxLength={10}
                                                inputMode="numeric"
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="registerEmail" className="form-label fw-bold">Email Address</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            id="registerEmail"
                                            placeholder="Enter your email"
                                            value={signUpEmail}
                                            onChange={(e) => setSignUpEmail(e.target.value)}
                                        />
                                    </div>
                                    
                                    <div className="mb-3">
                                        <label htmlFor="registerPassword" className="form-label fw-bold">Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showSignUpPassword ? 'text' : 'password'}
                                                className="form-control"
                                                id="registerPassword"
                                                placeholder="Min. 8 characters"
                                                value={signUpPassword}
                                                onChange={(e) => setSignUpPassword(e.target.value)}
                                                style={{ paddingRight: '36px' }}
                                            />
                                            <PasswordToggleButton
                                                visible={showSignUpPassword}
                                                onToggle={() => setShowSignUpPassword(v => !v)}
                                            />
                                        </div>
                                        {signUpPassword && (
                                            <ul className="list-unstyled mb-0 mt-2" style={{ fontSize: '0.85rem' }}>
                                                {PASSWORD_REQUIREMENTS.map((req) => {
                                                    const met = req.test(signUpPassword);
                                                    return (
                                                        <li
                                                            key={req.label}
                                                            style={{ color: met ? '#198754' : '#dc3545' }}
                                                        >
                                                            {met ? '✓' : '✗'} {req.label}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <label htmlFor="registerConfirmPassword" className="form-label fw-bold">Confirm Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type={showSignUpConfirmPassword ? 'text' : 'password'}
                                                className="form-control"
                                                id="registerConfirmPassword"
                                                placeholder="Confirm your password"
                                                value={signUpConfirmPassword}
                                                onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                                                style={{ paddingRight: '36px' }}
                                            />
                                            <PasswordToggleButton
                                                visible={showSignUpConfirmPassword}
                                                onToggle={() => setShowSignUpConfirmPassword(v => !v)}
                                            />
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={handleSignUp}
                                        className="btn w-100 fw-bold mb-3"
                                        style={{ backgroundColor: '#6B2C3E', color: 'white' }}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Creating Account...' : 'Create Account'}
                                    </button>

                                    <div className="text-center">
                                        <p className="mb-0">
                                            Already have an account?{' '}
                                            <button 
                                                type="button"
                                                className="btn btn-link p-0 text-decoration-none"
                                                onClick={switchToSignIn}
                                                style={{ color: '#6B2C3E', fontWeight: 'bold' }}
                                            >
                                                Sign In
                                            </button>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Hero;