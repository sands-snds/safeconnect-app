// Translation dictionary for SafeConnect's public landing page and the
// signed-in resident dashboard. Organized by the component/section that
// consumes each key. Admin-only screens are intentionally not covered.
//
// Usage: const { t } = useLanguage(); t('nav.home')

export const translations = {
  en: {
    popup: {
      successTitle: 'Success',
      warningTitle: 'Please Check',
      errorTitle: 'Something Went Wrong',
      updatedTitle: 'Report Updated',
      submitFailedTitle: "Couldn't Submit Report",
      ok: 'OK',
      done: 'Done'
    },
    nav: {
      home: 'Home',
      services: 'Services',
      contact: 'Contact',
      about: 'About Us'
    },
    languageGate: {
      eyebrow: 'Welcome to SafeConnect',
      title: 'Choose your language',
      subtitle: 'Piliin ang iyong gustong wika para sa website.',
      english: 'English',
      englishNote: 'Continue in English',
      tagalog: 'Tagalog',
      tagalogNote: 'Magpatuloy sa Tagalog',
      change: 'You can change this anytime from the menu.'
    },
    languageToggle: {
      label: 'Language',
      en: 'English',
      tl: 'Tagalog'
    },
    hero: {
      eyebrow: 'Barangay Sta. Fe Safe Connect',
      titleLine1: 'STAY',
      titleHighlight: 'SAFE',
      titleLine2: 'STAY INFORMED',
      subtitle: 'Be prepared when it matters most. Get real-time updates, request help instantly, and find safe evacuation centers — all in one place.',
      signIn: 'Sign In',
      signUp: 'Sign Up'
    },
    emergencyContacts: {
      title: 'Emergency Contacts',
      subtitle: 'Tap a contact to call immediately',
      call: 'Call',
      sublabels: {
        police: 'National Emergency Hotline',
        dasma: 'Dasmariñas City PNP',
        cdrmc: 'Cavite Disaster Risk Management',
        dswd: 'Social Welfare & Development',
        barangay: 'Barangay Emergency Line'
      }
    },
    pwReq: {
      length: 'at least 8 characters',
      uppercase: 'an uppercase letter',
      number: 'a number',
      symbol: 'a symbol (e.g. ! @ # $ %)'
    },
    auth: {
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      fillRequired: 'Please fill in all required fields',
      bothEmailPassword: 'Please enter both email and password',
      invalidCredentials: 'Invalid email or password.',
      accountClosedTitle: 'Account Closed',
      accountClosedMessage: 'This account has been permanently closed and can no longer be used to sign in to SafeConnect. Accounts are closed when a barangay official\'s term or role has ended, or when a suspended account was not resolved with the barangay administrator. If you believe this was done in error, please contact the Barangay Sta. Fe administrator at {{email}}. Thank you, and stay safe, stay informed!',
      accountSuspendedTitle: 'Account Suspended',
      accountSuspendedMessage: 'Your account has been suspended, so you can\'t sign in to SafeConnect right now. To resolve this and restore access, please contact the Barangay Sta. Fe administrator at {{email}}. Thank you for your understanding.',
      accountInactiveTitle: 'Account Not Active',
      accountInactiveMessage: 'Your account can\'t sign in right now. Please contact the Barangay Sta. Fe administrator at {{email}} for help.',
      serverError: 'Could not reach the server. Please check your connection and try again.',
      serverErrorShort: 'Could not reach the server.',
      contactDigits: 'Contact number must be exactly 10 digits',
      passwordMismatch: 'Passwords do not match',
      passwordMismatchPeriod: 'Passwords do not match.',
      passwordMissing: 'Password is missing: {{list}}',
      otpIncomplete: 'Please enter the complete 6-digit code.',
      otpInvalid: 'Incorrect or expired code.',
      otpSendFailed: 'Failed to send verification code.',
      resendFailed: 'Could not resend code.',
      emailRequired: 'Please enter your email address.',
      genericError: 'Something went wrong.',
      fillBothPasswordFields: 'Please fill in both password fields.',
      couldNotResetPassword: 'Could not reset password.'
    },
    signIn: {
      title: 'Sign In',
      email: 'Email Address',
      emailPlaceholder: 'Enter your email',
      password: 'Password',
      passwordPlaceholder: 'Enter your password',
      forgotPassword: 'Forgot password?',
      submit: 'Sign In',
      submitting: 'Signing In...',
      noAccount: "Don't have an account?",
      signUpLink: 'Sign Up'
    },
    signUp: {
      createTitle: 'Create Account',
      verifyTitle: 'Verify Your Email',
      firstName: 'First Name',
      firstNamePlaceholder: 'First name',
      middleName: 'Middle Name',
      middlePlaceholder: '(Optional)',
      lastName: 'Last Name',
      lastNamePlaceholder: 'Last name',
      username: 'Username',
      usernamePlaceholder: 'Choose a username',
      contactNumber: 'Contact Number',
      email: 'Email Address',
      emailPlaceholder: 'Enter your email',
      password: 'Password',
      passwordPlaceholder: 'Min. 8 characters',
      confirmPassword: 'Confirm Password',
      confirmPasswordPlaceholder: 'Confirm your password',
      passwordsMatch: '✓ Passwords match',
      passwordsNoMatch: '✗ Passwords do not match',
      submit: 'Continue',
      submitting: 'Sending verification code...',
      haveAccount: 'Already have an account?',
      signInLink: 'Sign In',
      otpHeading: 'Check your email',
      otpBody: 'We sent a 6-digit code to {{email}}. Enter it below to verify your email and create your account.',
      verify: 'Verify & Create Account',
      verifying: 'Verifying...',
      didntReceive: "Didn't receive the code?",
      resendIn: 'Resend code in {{s}}s',
      resend: 'Resend code',
      backToRegistration: '← Back to registration',
      accountCreated: 'Account created successfully! Please sign in.',
      agreePrefix: 'By creating an account, you agree to our',
      agreeLink: 'Terms and Conditions'
    },
    forgotPassword: {
      titleEmail: 'Forgot Password',
      titleOtp: 'Check Your Email',
      titleReset: 'Create New Password',
      titleDone: 'Password Reset',
      step1Desc: "Enter your registered email address and we'll send you a verification code to reset your password.",
      email: 'Email Address',
      emailPlaceholder: 'Enter your registered email',
      sendCode: 'Send Reset Code',
      sendingCode: 'Sending code...',
      backToSignIn: '← Back to Sign In',
      step2Heading: 'Check your email',
      step2Desc: 'We sent a 6-digit reset code to {{email}}.',
      verifyCode: 'Verify Code',
      verifying: 'Verifying...',
      didntReceive: "Didn't receive the code?",
      resendIn: 'Resend code in {{s}}s',
      resend: 'Resend code',
      useDifferentEmail: '← Use a different email',
      step3Desc: 'Create a new password for {{email}}.',
      newPassword: 'New Password',
      newPasswordPlaceholder: 'Min. 8 characters',
      confirmNewPassword: 'Confirm New Password',
      confirmNewPasswordPlaceholder: 'Confirm your new password',
      save: 'Save New Password',
      saving: 'Saving...',
      step4Title: 'Password reset successfully!',
      step4Desc: 'Your password has been updated. You can now sign in with your new password.',
      signInNow: 'Sign In Now'
    },
    about: {
      badge: 'About SafeConnect',
      titlePrefix: 'One app.',
      titleHighlight: 'A safer',
      titleSuffix: 'Barangay Sta. Fe.',
      intro: "SafeConnect connects every resident directly to the barangay's emergency response team — report incidents, request help, and stay informed, all in one place.",
      stats: {
        alwaysOn: 'Always On',
        gpsTagged: 'Tagged Reports',
        liveUpdates: 'Status Updates'
      },
      steps: {
        submit: {
          title: 'Submit a report',
          body: 'Open SafeConnect and report an emergency, request assistance, or flag a petty crime — your location and photos are attached automatically.'
        },
        respond: {
          title: 'Your barangay responds',
          body: 'Your report reaches the barangay response team the moment you send it, any hour of the day.'
        },
        stayUpdated: {
          title: 'Stay updated',
          body: 'Follow your report in real time — from received, to in progress, to resolved.'
        }
      }
    },
    services: {
      badge: 'What You Can Do',
      title: 'Everything you need, in one place.',
      subtitle: "From reporting an emergency to checking the weather — here's what's waiting for you the moment you sign in.",
      features: {
        emergencyReports: {
          label: 'Emergency Reports',
          desc: 'Report fires, floods, or any life-threatening situation happening right now — help is one tap away.'
        },
        assistanceRequests: {
          label: 'Assistance Requests',
          desc: 'Request rescue, relief goods, or support during or after a disaster.'
        },
        crimeReports: {
          label: 'Crime Reports',
          desc: 'Report theft, vandalism, or suspicious activity in your area.'
        },
        announcements: {
          label: 'Announcements',
          desc: 'Read the latest barangay alerts, updates, and community news.'
        },
        liveWeather: {
          label: 'Live Weather',
          desc: 'Check real-time weather conditions before heading out.'
        },
        yourProfile: {
          label: 'Your Profile',
          desc: 'Manage your name, photo, and account password anytime.'
        }
      }
    },
    contact: {
      badge: 'Emergency Contacts',
      title: 'Help is always one call away.',
      subtitle: 'Save these numbers now. In an emergency, every second counts — you can also tap the floating call button anywhere on this page.',
      sosEyebrow: 'Life-threatening emergency?',
      sosLabel: 'Police, fire, and medical response — nationwide, 24/7.',
      sosButton: 'Call 911 Now',
      hotlines: {
        barangay: { title: 'Barangay Sta. Fe', sub: 'Primary line', note: 'Emergencies, coordination & general inquiries' },
        dasma:    { title: 'Dasmariñas PNP',    sub: 'City police',  note: 'Crime, public safety & law enforcement' },
        cdrmc:    { title: 'CDRMC Cavite',      sub: 'Disaster mgmt',note: 'Provincial disaster risk management & response' }
      },
      bannerTitle: 'Signed in? Report through SafeConnect.',
      bannerDesc: 'Submit emergency reports, assistance requests, and petty crime reports — GPS and photos captured automatically.',
      bannerCta: 'Open SafeConnect'
    },
    footer: {
      description: 'A community emergency platform connecting residents with their barangay for faster reporting and assistance.',
      contactUs: 'Contact Us',
      barangayOfficials: 'Barangay Officials',
      socials: 'Socials',
      createdBy: 'Created by Group Tres · BS Information Technology',
      responseCenter: 'Emergency Response Center',
      responseCenterValue: 'Dasmariñas Emergency Operations',
      emergencyHotline: 'Emergency Hotline',
      emailSupport: 'Email Support',
      copyright: '© 2025 Safe Connect. All rights reserved.',
      privacyPolicy: 'Privacy Policy',
      termsOfService: 'Terms and Conditions'
    },
    terms: {
      badge: 'Legal',
      title: 'Terms and Conditions',
      lastUpdated: 'Last updated: October 16, 2026',
      summaryTitle: 'The short version',
      summary: [
        'In a life-threatening emergency, call 911 first. Safe Connect helps, but it does not replace emergency hotlines.',
        'Only submit true and accurate reports. False reports waste help that someone else may need.',
        'Your information is used only to respond to your reports and to run Safe Connect, under the Data Privacy Act of 2012.',
        'Be respectful in comments. The barangay may remove posts or suspend accounts that break these terms.'
      ],
      contents: 'Contents',
      close: 'Close',
      understand: 'I Understand',
      sections: [
        {
          id: 'acceptance',
          title: 'Acceptance of These Terms',
          points: [
            'By creating an account or using Safe Connect, you agree to these Terms and Conditions.',
            'If you do not agree, please do not use Safe Connect.',
            'If you are under 18, use Safe Connect with the guidance of a parent or guardian.'
          ]
        },
        {
          id: 'about',
          title: 'About Safe Connect',
          points: [
            'Safe Connect is the online reporting platform of Barangay Sta. Fe, Dasmariñas, Cavite.',
            'It lets residents report emergencies and petty crimes, request assistance, find evacuation centers, and read barangay news and announcements.',
            'Reports are received and handled by the barangay response team.'
          ]
        },
        {
          id: 'emergencies',
          title: 'Not a Replacement for Emergency Hotlines',
          points: [
            'In any life-threatening situation, call 911 or the emergency numbers listed on this website first.',
            'Safe Connect depends on your internet connection and our servers, so a report may be delayed.',
            'Submitting a report does not guarantee a specific response time.'
          ]
        },
        {
          id: 'account',
          title: 'Your Account',
          points: [
            'Give your real name, a working email address, and a correct contact number when you sign up.',
            'Keep your password private. You are responsible for everything done through your account.',
            'One account per person. Do not create accounts for, or pretend to be, someone else.',
            'Tell the barangay right away if you think someone else is using your account.'
          ]
        },
        {
          id: 'reports',
          title: 'Submitting Reports and Requests',
          points: [
            'Describe what happened truthfully and as clearly as you can.',
            'Your location (address or map pin) is attached so responders can find you. Only pin places within Barangay Sta. Fe.',
            'Photos and videos must be of the actual incident or situation. Some report types require one, to help the barangay verify the report.',
            'Do not upload content that is unrelated, violent for shock value, sexual, or that shows people in a way that violates their dignity.',
            'When you report for someone else, only share their details if they would want help, or if they cannot ask for it themselves.'
          ]
        },
        {
          id: 'falseReports',
          title: 'False or Misleading Reports',
          points: [
            'Never submit fake, prank, or exaggerated reports.',
            'False reports take responders away from real emergencies.',
            'Accounts that submit false reports may be suspended, and the matter may be referred to the proper authorities under Philippine law.'
          ]
        },
        {
          id: 'anonymous',
          title: 'Anonymous Reports',
          points: [
            'When you report a petty crime anonymously, your name and contact number are hidden from barangay staff.',
            'The report stays linked to your account so you can follow it in My Reports and receive status updates.',
            'Anonymous reporting protects your identity, not false reports. The rules above still apply.'
          ]
        },
        {
          id: 'community',
          title: 'News, Comments and Community Conduct',
          points: [
            'Keep comments respectful and related to the post.',
            'Do not post insults, threats, hate speech, personal information about others, spam, or false information.',
            'Barangay administrators may hide or delete comments that break these rules.'
          ]
        },
        {
          id: 'privacy',
          title: 'Your Information and Privacy',
          points: [
            'We collect the details you give us: your name, email, contact number, reports, photos and videos, locations, and comments.',
            'This information is used only to receive and respond to your reports, contact you about them, send you updates, and keep Safe Connect running and secure.',
            'Only authorized barangay personnel can see your reports. We do not sell your information.',
            'Your information is handled in line with the Data Privacy Act of 2012 (Republic Act No. 10173). You may ask the barangay to access, correct, or delete your personal information.'
          ]
        },
        {
          id: 'limitations',
          title: 'Service Availability and Limitations',
          points: [
            'We work to keep Safe Connect available at all times, but it may sometimes be unavailable because of maintenance, outages, or problems outside our control.',
            'Information on Safe Connect, such as news and evacuation centers, is provided in good faith. Always follow instructions from responders and officials on the ground.'
          ]
        },
        {
          id: 'suspension',
          title: 'Suspension or Removal of Accounts',
          points: [
            'The barangay may suspend or remove accounts that break these terms, submit false reports, or misuse Safe Connect.',
            'Serious violations may be reported to the proper authorities.'
          ]
        },
        {
          id: 'changes',
          title: 'Changes to These Terms',
          points: [
            'We may update these terms as Safe Connect changes. The date at the top shows the latest version.',
            'If you keep using Safe Connect after an update, you accept the updated terms.'
          ]
        },
        {
          id: 'contact',
          title: 'Questions and Contact',
          points: [
            'For questions about these terms or your information, contact Barangay Sta. Fe using the details in the Contact section of this website.'
          ]
        }
      ]
    },
    residentNav: {
      home: 'Home',
      emergency: 'Emergency',
      news: 'News',
      notifications: 'Notifications',
      myReports: 'My Reports',
      settings: 'Settings',
      logout: 'Logout'
    },
    notificationPanel: {
      title: 'Notifications',
      markAllRead: 'Mark all read',
      all: 'All',
      unread: 'Unread',
      weatherAdvisory: 'Weather Advisory',
      weatherBody: "It's possible to rain today ({{chance}}% chance). High {{tMax}}°C, low {{tMin}}°C.",
      today: 'Today',
      caughtUp: "You're all caught up!",
      noNotifications: 'No notifications yet.',
      yourReport: 'Your Report',
      viewAll: 'View all announcements'
    },
    weather: {
      codes: {
        clear: 'Clear sky',
        partlyCloudy: 'Partly cloudy',
        foggy: 'Foggy',
        drizzle: 'Drizzle',
        rain: 'Rain',
        thunderstorm: 'Thunderstorm',
        update: 'Weather update'
      },
      today: 'today',
      rainLikely: "It's possible to rain today — {{chance}}% chance of precipitation.",
      rainUnlikely: 'Low chance of rain today ({{chance}}%).',
      expectHigh: 'Expect a high of',
      expectLow: 'and a low of'
    },
    news: {
      latestNews: 'Latest News',
      headerSubtitle: 'Barangay alerts, updates, and community news',
      articleCountSingular: '{{count}} update',
      articleCountPlural: '{{count}} updates',
      loading: 'Loading news...',
      empty: 'No announcements yet. Check back soon.',
      externalArticle: 'External article',
      openArticle: 'Open article',
      readFullArticle: 'Read full article',
      on: 'on',
      like: 'Like',
      liked: 'Liked',
      comment: 'Comment',
      share: 'Share',
      copied: 'Copied!',
      noComments: 'No comments yet. Be the first to share your thoughts.',
      loadingComments: 'Loading comments...',
      commentPlaceholder: 'Write a comment...',
      deleteComment: 'Delete comment',
      adminBadge: 'Barangay Admin',
      officialBadge: 'Barangay Official',
      viewOneReply: '1 reply',
      viewReplies: '{{count}} replies',
      hideReplies: 'Hide replies'
    },
    residentHero: {
      titleLine1: 'Barangay Sta. Fe',
      titleLine2: 'Safe Connect',
      subtitleLine1: 'Be part of our emergency response network and stand ready to save lives when it matters most.',
      subtitleLine2: 'Your action can bring hope in times of crisis.',
      hotline: 'Emergency Hotline: 911',
      available247: 'Available 24/7 for immediate emergencies'
    },
    emergencyReportSection: {
      title: 'Report an Incident',
      subtitle: 'Every second counts. Choose the type of incident below and reach our response team right away, 24/7.',
      reportButton: 'Report',
      cards: {
        emergency: {
          title: 'Report Emergency',
          badge: 'Critical',
          description: 'Fires, floods, earthquakes, or any life-threatening situation happening right now'
        },
        assistance: {
          title: 'Request Assistance',
          badge: 'High',
          description: 'Request help, rescue, or support for a non-critical situation'
        },
        pettyCrime: {
          title: 'Report Petty Crimes',
          badge: 'Medium',
          description: 'Theft, vandalism, disturbances, or other minor offenses'
        }
      }
    },
    reportForm: {
      reportingFor: 'Who are you reporting for?',
      self: 'Reporting for Myself',
      others: 'Reporting for Others',
      personBoxLabel: 'Person You Are Reporting For',
      relationship: 'Your Relationship',
      relationshipPlaceholder: 'Select relationship',
      relationshipOptions: {
        family: 'Family Member',
        friend: 'Friend',
        neighbor: 'Neighbor',
        colleague: 'Colleague',
        stranger: 'Stranger',
        other: 'Other (not listed — please specify)'
      },
      relationshipOtherPlaceholder: 'Please specify your relationship to them',
      theirName: 'Their Name',
      optional: '(optional)',
      namePlaceholder: 'Full name',
      theirContact: 'Their Contact',
      additionalDetails: 'Additional Details',
      additionalDetailsPlaceholder: "Describe the person or situation — e.g. 'elderly woman near the covered court, wearing a red jacket'",
      address: 'Address',
      locating: 'Locating...',
      useCurrentLocation: 'Use my current location',
      fullAddress: 'Full address',
      houseNumberPlaceholder: 'House / Lot / Block No.',
      streetPlaceholder: 'Street',
      floorUnitPlaceholder: 'Floor / Unit / Room (Optional)',
      landmarkPlaceholder: 'Landmark / directions (e.g. beside the covered court, blue gate)',
      serviceAreaNote: 'Reports are limited to Barangay Sta. Fe, Dasmariñas, Cavite, Philippines',
      peopleAffected: 'Number of People Affected',
      selectRange: 'Select range',
      photoOrVideo: 'Photo or Video',
      mediaHintEdit: 'Optional. Attach a new file only if you want to replace the one already on record. JPG/JPEG image (max 20MB) or MP4/MOV/WEBM video (max 50MB).',
      mediaHintRequired: 'Required. JPG/JPEG image (max 20MB) or MP4/MOV/WEBM video (max 50MB).',
      remove: 'Remove',
      consent: 'I confirm that the information provided is accurate and consent to be contacted by the response team.',
      cancel: 'Cancel',
      saving: 'Saving...',
      submitting: 'Submitting...',
      saveChanges: 'Save Changes',
      submitReport: 'Submit Report',
      mediaTypeError: 'Only JPG/JPEG images or MP4/MOV/WEBM videos are allowed.',
      mediaTooLargeVideo: 'File is too large (max 50MB for videos).',
      mediaTooLargeImage: 'File is too large (max 20MB for images).',
      provideLocation: 'Please provide a location.',
      pinLocation: 'Please pin the location on the map, or enter the house/lot number and street.',
      selectRelationship: 'Please select your relationship to them.',
      specifyRelationship: 'Please specify your relationship to them.',
      enterName: 'Please enter the name of the person you are reporting for.',
      provideDetails: 'Please provide additional details about the person you are reporting for.',
      updateFailed: 'Failed to update report',
      submitFailed: 'Failed to submit report'
    },
    emergencyModal: {
      editTitle: 'Edit {{type}} Report',
      reportTitle: 'Report {{type}}',
      defaultTypeEdit: 'Emergency',
      defaultTypeReport: 'an Emergency',
      emergencyType: 'Emergency Type',
      selectType: 'Select emergency type',
      typeFire: 'Fire',
      typeFlood: 'Flood',
      typeEarthquake: 'Earthquake',
      incidentDetails: 'Incident Details',
      incidentDetailsPlaceholder: 'Describe the emergency situation...',
      specialNeeds: 'Special Needs / Considerations',
      specialNeedsOptions: {
        elderly: 'Elderly',
        children: 'Children',
        pwd: 'Persons with disabilities',
        pregnant: 'Pregnant',
        pets: 'Pets'
      },
      cooldownAlert: 'Please wait {{time}} before submitting another emergency report.',
      cooldownBanner: 'You can submit another emergency report in {{time}}.',
      mediaRequired: 'Please attach a photo or video of the incident. This is required.',
      updateSuccess: 'Emergency report updated successfully.',
      submitError: 'Failed to submit report. Please try again or call emergency hotline: 911',
      reportSubmitted: 'Report Submitted',
      assistancePromptBody: 'Our team will respond shortly. Would you also like to request assistance (food, water, medical aid, etc.) related to this emergency? This step is optional.',
      noThanks: 'No, thanks',
      requestAssistance: 'Request Assistance'
    },
    assistanceModal: {
      editTitle: 'Edit Assistance Request',
      requestTitle: 'Request Assistance',
      whoRequestingFor: 'Who are you requesting for?',
      myself: 'Myself',
      someoneElse: 'Someone Else',
      personBoxLabel: 'Person You Are Requesting For',
      assistanceType: 'Assistance Type',
      selectType: 'Select assistance type',
      typeFoodWater: 'Food and Water',
      typeMedicalAid: 'Medical Aid',
      typeTransportVehicle: 'Transport Vehicle',
      urgency: 'Urgency',
      selectUrgency: 'Select urgency (optional)',
      urgencyOptions: {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        critical: 'Critical'
      },
      currentAddress: 'Current Address',
      serviceAreaNote: 'Requests are limited to Barangay Sta. Fe, Dasmariñas, Cavite, Philippines',
      describeSituation: 'Describe Your Situation',
      situationPlaceholder: 'Please provide details about what kind of help you need...',
      cooldownAlert: 'Please wait {{time}} before submitting another assistance request.',
      cooldownBanner: 'You can submit another assistance request in {{time}}.',
      enterNameRequesting: 'Please enter the name of the person you are requesting for.',
      provideDetailsRequesting: 'Please provide additional details about the person you are requesting for.',
      updateFailed: 'Failed to update request',
      updateSuccess: 'Assistance request updated successfully.',
      submitFailed: 'Failed to submit request',
      submitError: 'There was an error submitting your request. Please try again.',
      submitRequest: 'Submit Request',
      requestSubmitted: 'Request Submitted',
      requestSubmittedBody: 'Your assistance request has been submitted successfully. Our team will contact you soon.',
      done: 'Done',
      victimOfEmergency: 'Victim of What Emergency?',
      selectEmergency: 'Select Emergency',
      emergencyOther: 'Other (please specify)',
      emergencyOtherPlaceholder: 'What emergency did you experience?',
      specifyEmergency: 'Please specify the emergency you experienced.',
      proofPhoto: 'Photo or Video (Proof)',
      proofHint: 'Required. It helps the barangay verify your request. JPG/JPEG image (max 20MB) or MP4/MOV/WEBM video (max 50MB).',
      proofRequired: 'Please attach a photo or video of your situation. It is required so the barangay can verify your request.'
    },
    pettyCrimeModal: {
      title: 'Report Petty Crime',
      crimeType: 'Crime Type',
      selectType: 'Select Type',
      crimeTypes: {
        theft: 'Theft',
        vandalism: 'Vandalism',
        publicDisturbance: 'Public Disturbance',
        suspiciousActivity: 'Suspicious Activity',
        trespassing: 'Trespassing',
        harassment: 'Harassment',
        other: 'Other (not listed — please specify in the description)'
      },
      description: 'Description',
      descriptionPlaceholder: 'Describe what happened...',
      suspectInfo: 'Suspect Information',
      suspectInfoPlaceholder: 'Appearance, clothing, vehicle...',
      consent: 'I confirm that this report is accurate and consent to submit this petty crime report for review and action.',
      cooldownAlert: 'Please wait {{time}} before submitting another report.',
      cooldownBanner: 'You can submit another report in {{time}}.',
      updateSuccess: 'Petty crime report updated successfully.',
      submitError: 'There was an error submitting your report. Please try again.',
      submitCrimeReport: 'Submit Crime Report',
      reportSubmitted: 'Report Submitted',
      reportSubmittedBody: 'Your petty crime report has been submitted successfully. Our team will review it shortly.',
      mediaHintSelectType: 'Optional for Theft, Suspicious Activity and Harassment; required for all other crime types. JPG/JPEG image (max 20MB) or MP4/MOV/WEBM video (max 50MB).',
      mediaHintOptional: 'Optional for this crime type. JPG/JPEG image (max 20MB) or MP4/MOV/WEBM video (max 50MB).',
      mediaRequired: 'Please attach a photo or video of the incident. It is required for this crime type.',
      anonymousLabel: 'Report anonymously',
      anonymousHint: 'Your name and contact number will be hidden from barangay staff, for your safety. You can still follow this report in My Reports.',
      anonymousOnEdit: 'This report was submitted anonymously.'
    },
    myReports: {
      title: 'My Reports',
      subtitle: "Track and manage everything you've submitted",
      noAccount: 'We could not identify your account. Please sign in again.',
      loadError: 'Could not load your reports right now. Please try again later.',
      confirmDelete: 'Delete this {{type}} report? This cannot be undone.',
      deleteFailed: 'Failed to delete report.',
      totalReports: 'Total Reports',
      other: 'Other',
      filters: {
        all: 'All',
        emergency: 'Emergency',
        assistance: 'Assistance',
        pettyCrime: 'Petty Crime'
      },
      types: {
        emergency: 'Emergency',
        assistance: 'Assistance',
        pettyCrime: 'Petty Crime'
      },
      status: {
        received: 'Received',
        pending: 'Pending',
        inProgress: 'In Progress',
        resolved: 'Resolved',
        completed: 'Completed',
        rejected: 'Rejected',
        cancelled: 'Cancelled'
      },
      searchPlaceholder: 'Search by title, description, location, or reference...',
      newestFirst: 'Newest first',
      oldestFirst: 'Oldest first',
      showingCountSingular: 'Showing {{shown}} of {{total}} report',
      showingCountPlural: 'Showing {{shown}} of {{total}} reports',
      tryAgain: 'Try again',
      noSearchMatch: 'No reports match your search.',
      emptyAll: "You haven't submitted any reports yet.",
      emptyFiltered: "You haven't submitted any {{type}} reports yet.",
      clearFilters: 'Clear filters',
      untitledReport: 'Untitled report',
      copied: 'Copied!',
      onBehalfOf: 'Reported on behalf of',
      severity: 'Severity',
      map: 'Map',
      openInMaps: 'Open in Google Maps',
      hideDetails: 'Hide Details',
      viewDetails: 'View Details',
      edit: 'Edit',
      delete: 'Delete',
      detail: {
        contactNumber: 'Contact Number',
        peopleAffected: 'People Affected',
        peopleNeedingHelp: 'People Needing Help',
        specialNeeds: 'Special Needs',
        suspectInfo: 'Suspect Info'
      }
    },
    settings: {
      title: 'Settings',
      subtitle: 'Manage your profile, contact details, and account security',
      profilePhoto: 'Profile Photo',
      profilePhotoSub: 'This appears next to your name across SafeConnect.',
      choosePhoto: 'Choose Photo',
      uploading: 'Uploading...',
      savePhoto: 'Save Photo',
      cancel: 'Cancel',
      photoPendingNote: 'Photo selected — click Save Photo to apply.',
      photoHint: 'JPG, PNG, or WEBP · Max 5MB',
      photoTypeError: 'Please choose a JPG, PNG, or WEBP image.',
      photoSizeError: 'Photo must be under 5MB.',
      photoSuccess: 'Profile photo updated successfully.',
      photoUploadError: 'Could not upload photo.',
      serverError: 'Could not reach the server. Please try again.',
      fullName: 'Full name',
      contactInfo: 'Contact Information',
      contactInfoSub: 'Keep your email and phone number up to date so our team can reach you during an emergency.',
      emailAddress: 'Email address',
      currentPassword: 'Current password',
      currentPasswordPlaceholder: 'Enter your current password',
      emailPasswordHint: '(required to change your email)',
      saving: 'Saving...',
      saveEmail: 'Save email',
      emailEmptyError: 'Email address cannot be empty.',
      emailInvalidError: 'Enter a valid email address.',
      emailPasswordRequired: 'Enter your current password to confirm this change.',
      emailUpdated: 'Email address updated.',
      emailUpdateError: 'Could not update email address.',
      phoneNumber: 'Phone number',
      savePhoneNumber: 'Save phone number',
      contactInvalidError: 'Enter a valid 10-digit mobile number.',
      contactUpdated: 'Phone number updated.',
      contactUpdateError: 'Could not update phone number.',
      username: 'Username',
      usernameSub: "This is how you'll be identified across SafeConnect.",
      usernamePlaceholder: 'Enter a username',
      saveUsername: 'Save username',
      usernameEmptyError: 'Username cannot be empty.',
      usernameUpdated: 'Username updated.',
      usernameUpdateError: 'Could not update username.',
      password: 'Password',
      passwordSub: 'Choose a new password with at least 8 characters.',
      newPassword: 'New password',
      newPasswordPlaceholder: 'At least 8 characters',
      confirmNewPassword: 'Confirm new password',
      confirmNewPasswordPlaceholder: 'Re-enter your new password',
      updatePassword: 'Update password',
      passwordFillAll: 'Fill in all three password fields.',
      passwordTooShort: 'New password must be at least 8 characters.',
      passwordMismatch: 'New password and confirmation do not match.',
      passwordSameAsCurrent: 'New password must be different from your current password.',
      passwordUpdated: 'Password updated.',
      passwordUpdateError: 'Could not update password.',
      accountInfo: 'Account Information',
      accountInfoSub: 'Details about your SafeConnect account.',
      accountType: 'Account type',
      accountStatus: 'Account status',
      memberSince: 'Member since'
    }
  },
  tl: {
    popup: {
      successTitle: 'Tagumpay',
      warningTitle: 'Pakisuri',
      errorTitle: 'May Nangyaring Mali',
      updatedTitle: 'Na-update ang Ulat',
      submitFailedTitle: 'Hindi Naisumite ang Ulat',
      ok: 'OK',
      done: 'Tapos na'
    },
    nav: {
      home: 'Home',
      services: 'Serbisyo',
      contact: 'Makipag-ugnayan',
      about: 'Tungkol Sa Amin'
    },
    languageGate: {
      eyebrow: 'Maligayang pagdating sa SafeConnect',
      title: 'Piliin ang iyong wika',
      subtitle: 'Choose your preferred language for the website.',
      english: 'English',
      englishNote: 'Continue in English',
      tagalog: 'Tagalog',
      tagalogNote: 'Magpatuloy sa Tagalog',
      change: 'Maaari mo itong baguhin anumang oras mula sa menu.'
    },
    languageToggle: {
      label: 'Wika',
      en: 'English',
      tl: 'Tagalog'
    },
    hero: {
      eyebrow: 'Barangay Sta. Fe Safe Connect',
      titleLine1: 'MANATILING',
      titleHighlight: 'LIGTAS',
      titleLine2: 'MANATILING MAY ALAM',
      subtitle: 'Maging bahagi ng aming pangkat sa pagtugon sa mga emergency at tumulong sa pagliligtas ng buhay sa oras ng pangangailangan. Ang bawat pagkilos mo ay maaaring magbigay ng pag-asa sa panahon ng krisis.',
      signIn: 'Mag-sign In',
      signUp: 'Mag-sign Up'
    },
    emergencyContacts: {
      title: 'Mga Emergency Contact',
      subtitle: 'Pindutin ang isang contact para tumawag agad',
      call: 'Tawagan',
      sublabels: {
        police: 'Pambansang Emergency Hotline',
        dasma: 'Dasmariñas City PNP',
        cdrmc: 'Cavite Disaster Risk Management',
        dswd: 'Kagawaran ng Kapakanang Panlipunan',
        barangay: 'Linya ng Emergency ng Barangay'
      }
    },
    pwReq: {
      length: 'hindi bababa sa 8 na karakter',
      uppercase: 'isang malaking titik',
      number: 'isang numero',
      symbol: 'isang simbolo (hal. ! @ # $ %)'
    },
    auth: {
      showPassword: 'Ipakita ang password',
      hidePassword: 'Itago ang password',
      fillRequired: 'Pakisagutan lahat ng kinakailangang field',
      bothEmailPassword: 'Pakilagay ang email at password',
      invalidCredentials: 'Maling email o password.',
      accountClosedTitle: 'Sarado na ang Account',
      accountClosedMessage: 'Permanenteng isinara na ang account na ito at hindi na maaaring gamitin para mag-sign in sa SafeConnect. Isinasara ang mga account kapag natapos na ang termino o tungkulin ng isang opisyal ng barangay, o kapag ang isang na-suspend na account ay hindi naayos kasama ang administrator ng barangay. Kung sa tingin mo ay nagkamali ito, mangyaring makipag-ugnayan sa administrator ng Barangay Sta. Fe sa {{email}}. Salamat, at manatiling ligtas at may alam!',
      accountSuspendedTitle: 'Naka-suspend ang Account',
      accountSuspendedMessage: 'Naka-suspend ang iyong account, kaya hindi ka muna makakapag-sign in sa SafeConnect. Upang maayos ito at maibalik ang access, mangyaring makipag-ugnayan sa administrator ng Barangay Sta. Fe sa {{email}}. Salamat sa iyong pag-unawa.',
      accountInactiveTitle: 'Hindi Aktibo ang Account',
      accountInactiveMessage: 'Hindi makakapag-sign in ang iyong account sa ngayon. Mangyaring makipag-ugnayan sa administrator ng Barangay Sta. Fe sa {{email}} para sa tulong.',
      serverError: 'Hindi ma-access ang server. Pakisuri ang iyong koneksyon at subukang muli.',
      serverErrorShort: 'Hindi ma-access ang server.',
      contactDigits: 'Ang numero ng contact ay dapat eksaktong 10 na digit',
      passwordMismatch: 'Hindi magkatugma ang mga password',
      passwordMismatchPeriod: 'Hindi magkatugma ang mga password.',
      passwordMissing: 'Kulang ang password sa: {{list}}',
      otpIncomplete: 'Pakilagay ang kumpletong 6-digit na code.',
      otpInvalid: 'Mali o expired na ang code.',
      otpSendFailed: 'Hindi naipadala ang verification code.',
      resendFailed: 'Hindi na-resend ang code.',
      emailRequired: 'Pakilagay ang iyong email address.',
      genericError: 'May nagkamali.',
      fillBothPasswordFields: 'Pakisagutan ang parehong password field.',
      couldNotResetPassword: 'Hindi na-reset ang password.'
    },
    signIn: {
      title: 'Mag-sign In',
      email: 'Email Address',
      emailPlaceholder: 'Ilagay ang iyong email',
      password: 'Password',
      passwordPlaceholder: 'Ilagay ang iyong password',
      forgotPassword: 'Nakalimutan ang password?',
      submit: 'Mag-sign In',
      submitting: 'Nagsa-sign In...',
      noAccount: 'Wala ka pang account?',
      signUpLink: 'Mag-sign Up'
    },
    signUp: {
      createTitle: 'Gumawa ng Account',
      verifyTitle: 'I-verify ang Iyong Email',
      firstName: 'Unang Pangalan',
      firstNamePlaceholder: 'Unang pangalan',
      middleName: 'Gitnang Pangalan',
      middlePlaceholder: '(Opsyonal)',
      lastName: 'Apelyido',
      lastNamePlaceholder: 'Apelyido',
      username: 'Username',
      usernamePlaceholder: 'Pumili ng username',
      contactNumber: 'Numero ng Contact',
      email: 'Email Address',
      emailPlaceholder: 'Ilagay ang iyong email',
      password: 'Password',
      passwordPlaceholder: 'Hindi bababa sa 8 na karakter',
      confirmPassword: 'Kumpirmahin ang Password',
      confirmPasswordPlaceholder: 'Kumpirmahin ang iyong password',
      passwordsMatch: '✓ Magkatugma ang mga password',
      passwordsNoMatch: '✗ Hindi magkatugma ang mga password',
      submit: 'Magpatuloy',
      submitting: 'Ipinapadala ang verification code...',
      haveAccount: 'Mayroon ka nang account?',
      signInLink: 'Mag-sign In',
      otpHeading: 'Tingnan ang iyong email',
      otpBody: 'Nagpadala kami ng 6-digit na code sa {{email}}. Ilagay ito sa ibaba para i-verify ang iyong email at gawin ang iyong account.',
      verify: 'I-verify at Gumawa ng Account',
      verifying: 'Vine-verify...',
      didntReceive: 'Hindi natanggap ang code?',
      resendIn: 'Ipadala ulit ang code sa loob ng {{s}}s',
      resend: 'Ipadala ulit ang code',
      backToRegistration: '← Bumalik sa pagpaparehistro',
      accountCreated: 'Matagumpay na nagawa ang account! Mangyaring mag-sign in.',
      agreePrefix: 'Sa paggawa ng account, sumasang-ayon ka sa aming',
      agreeLink: 'Mga Tuntunin at Kundisyon'
    },
    forgotPassword: {
      titleEmail: 'Nakalimutan ang Password',
      titleOtp: 'Tingnan ang Iyong Email',
      titleReset: 'Gumawa ng Bagong Password',
      titleDone: 'Na-reset ang Password',
      step1Desc: 'Ilagay ang iyong nakarehistrong email address at magpapadala kami ng verification code para i-reset ang iyong password.',
      email: 'Email Address',
      emailPlaceholder: 'Ilagay ang iyong nakarehistrong email',
      sendCode: 'Ipadala ang Reset Code',
      sendingCode: 'Ipinapadala ang code...',
      backToSignIn: '← Bumalik sa Sign In',
      step2Heading: 'Tingnan ang iyong email',
      step2Desc: 'Nagpadala kami ng 6-digit na reset code sa {{email}}.',
      verifyCode: 'I-verify ang Code',
      verifying: 'Vine-verify...',
      didntReceive: 'Hindi natanggap ang code?',
      resendIn: 'Ipadala ulit ang code sa loob ng {{s}}s',
      resend: 'Ipadala ulit ang code',
      useDifferentEmail: '← Gumamit ng ibang email',
      step3Desc: 'Gumawa ng bagong password para sa {{email}}.',
      newPassword: 'Bagong Password',
      newPasswordPlaceholder: 'Hindi bababa sa 8 na karakter',
      confirmNewPassword: 'Kumpirmahin ang Bagong Password',
      confirmNewPasswordPlaceholder: 'Kumpirmahin ang iyong bagong password',
      save: 'I-save ang Bagong Password',
      saving: 'Sine-save...',
      step4Title: 'Matagumpay na na-reset ang password!',
      step4Desc: 'Na-update na ang iyong password. Maaari ka nang mag-sign in gamit ang iyong bagong password.',
      signInNow: 'Mag-sign In Ngayon'
    },
    about: {
      badge: 'Tungkol sa SafeConnect',
      titlePrefix: 'Isang app.',
      titleHighlight: 'Mas ligtas na',
      titleSuffix: 'Barangay Sta. Fe.',
      intro: 'Direktang ikinokonekta ng SafeConnect ang bawat residente sa emergency response team ng barangay — mag-report ng insidente, humingi ng tulong, at manatiling updated, lahat sa iisang lugar.',
      stats: {
        alwaysOn: 'Laging Bukas',
        gpsTagged: 'May GPS na Report',
        liveUpdates: 'Live na Status'
      },
      steps: {
        submit: {
          title: 'Magsumite ng report',
          body: 'Buksan ang SafeConnect at mag-report ng emergency, humingi ng tulong, o mag-flag ng petty crime — awtomatikong nakalakip ang iyong lokasyon at mga larawan.'
        },
        respond: {
          title: 'Tumutugon ang iyong barangay',
          body: 'Naaabot ng response team ng barangay ang iyong report sa sandaling ipadala mo ito, kahit anong oras ng araw.'
        },
        stayUpdated: {
          title: 'Manatiling updated',
          body: 'Subaybayan ang iyong report sa real time — mula received, hanggang in progress, hanggang resolved.'
        }
      }
    },
    services: {
      badge: 'Ano ang Magagawa Mo',
      title: 'Lahat ng kailangan mo, sa iisang lugar.',
      subtitle: 'Mula sa pag-report ng emergency hanggang sa pagtingin ng panahon — ito ang naghihintay sa iyo sa sandaling mag-sign in ka.',
      features: {
        emergencyReports: {
          label: 'Emergency Reports',
          desc: 'Mag-report ng sunog, baha, o anumang nagbabantang buhay na sitwasyon ngayon — isang tap lang ang layo ang tulong.'
        },
        assistanceRequests: {
          label: 'Kahilingan ng Tulong',
          desc: 'Humiling ng rescue, relief goods, o suporta sa panahon o pagkatapos ng kalamidad.'
        },
        crimeReports: {
          label: 'Ulat ng Krimen',
          desc: 'Mag-report ng pagnanakaw, bandalismo, o kahina-hinalang aktibidad sa inyong lugar.'
        },
        announcements: {
          label: 'Mga Anunsyo',
          desc: 'Basahin ang pinakabagong alerto, update, at balita ng barangay.'
        },
        liveWeather: {
          label: 'Live na Panahon',
          desc: 'Tingnan ang real-time na kalagayan ng panahon bago lumabas.'
        },
        yourProfile: {
          label: 'Iyong Profile',
          desc: 'Pamahalaan ang iyong pangalan, larawan, at password ng account anumang oras.'
        }
      }
    },
    contact: {
      badge: 'Mga Emergency Contact',
      title: 'Isang tawag lang ang layo ang tulong.',
      subtitle: 'I-save na ang mga numerong ito ngayon. Sa emergency, mahalaga ang bawat segundo — maaari mo ring pindutin ang lumulutang na call button kahit saan sa pahinang ito.',
      sosEyebrow: 'Emergency na nagbabanta sa buhay?',
      sosLabel: 'Pulis, bumbero, at medikal na tugon — sa buong bansa, 24/7.',
      sosButton: 'Tumawag sa 911 Ngayon',
      hotlines: {
        barangay: { title: 'Barangay Sta. Fe', sub: 'Pangunahing linya', note: 'Emergency, koordinasyon, at pangkalahatang katanungan' },
        dasma:    { title: 'Dasmariñas PNP',    sub: 'Pulis ng lungsod', note: 'Krimen, kaligtasan ng publiko, at pagpapatupad ng batas' },
        cdrmc:    { title: 'CDRMC Cavite',      sub: 'Disaster mgmt',   note: 'Panlalawigang disaster risk management at tugon' }
      },
      bannerTitle: 'Naka-sign in na? Mag-report gamit ang SafeConnect.',
      bannerDesc: 'Magsumite ng emergency report, kahilingan ng tulong, at ulat ng petty crime — awtomatikong nakukuha ang GPS at mga larawan.',
      bannerCta: 'Buksan ang SafeConnect'
    },
    footer: {
      description: 'Isang community emergency platform na nag-uugnay sa mga residente at sa kanilang barangay para sa mas mabilis na pag-uulat at tulong.',
      contactUs: 'Makipag-ugnayan',
      barangayOfficials: 'Mga Opisyal ng Barangay',
      socials: 'Socials',
      createdBy: 'Ginawa ng Group Tres · BS Information Technology',
      responseCenter: 'Emergency Response Center',
      responseCenterValue: 'Dasmariñas Emergency Operations',
      emergencyHotline: 'Emergency Hotline',
      emailSupport: 'Email Support',
      copyright: '© 2025 Safe Connect. Nakalaan ang lahat ng karapatan.',
      privacyPolicy: 'Patakaran sa Privacy',
      termsOfService: 'Mga Tuntunin at Kundisyon'
    },
    terms: {
      badge: 'Legal',
      title: 'Mga Tuntunin at Kundisyon',
      lastUpdated: 'Huling na-update: Oktubre 16, 2026',
      summaryTitle: 'Ang maikling bersyon',
      summary: [
        'Sa emergency na nagbabanta sa buhay, tumawag muna sa 911. Nakakatulong ang Safe Connect, pero hindi nito pinapalitan ang mga emergency hotline.',
        'Magsumite lamang ng totoo at tamang ulat. Inaagaw ng pekeng ulat ang tulong na maaaring kailangan ng iba.',
        'Ginagamit lamang ang iyong impormasyon para tugunan ang iyong mga ulat at patakbuhin ang Safe Connect, alinsunod sa Data Privacy Act of 2012.',
        'Maging magalang sa mga komento. Maaaring alisin ng barangay ang mga post o suspindihin ang mga account na lumalabag sa mga tuntuning ito.'
      ],
      contents: 'Nilalaman',
      close: 'Isara',
      understand: 'Naiintindihan Ko',
      sections: [
        {
          id: 'acceptance',
          title: 'Pagtanggap sa mga Tuntuning Ito',
          points: [
            'Sa paggawa ng account o paggamit ng Safe Connect, sumasang-ayon ka sa mga Tuntunin at Kundisyong ito.',
            'Kung hindi ka sumasang-ayon, huwag gamitin ang Safe Connect.',
            'Kung ikaw ay wala pang 18 taong gulang, gamitin ang Safe Connect sa gabay ng magulang o tagapag-alaga.'
          ]
        },
        {
          id: 'about',
          title: 'Tungkol sa Safe Connect',
          points: [
            'Ang Safe Connect ay ang online na plataporma sa pag-uulat ng Barangay Sta. Fe, Dasmariñas, Cavite.',
            'Dito maaaring mag-ulat ang mga residente ng emergency at petty crime, humingi ng tulong, maghanap ng evacuation center, at magbasa ng balita at anunsyo ng barangay.',
            'Ang mga ulat ay tinatanggap at inaasikaso ng response team ng barangay.'
          ]
        },
        {
          id: 'emergencies',
          title: 'Hindi Kapalit ng mga Emergency Hotline',
          points: [
            'Sa anumang sitwasyong nagbabanta sa buhay, tumawag muna sa 911 o sa mga emergency number na nakalista sa website na ito.',
            'Umaasa ang Safe Connect sa iyong internet at sa aming mga server, kaya maaaring maantala ang isang ulat.',
            'Ang pagsusumite ng ulat ay hindi garantiya ng tiyak na oras ng pagtugon.'
          ]
        },
        {
          id: 'account',
          title: 'Ang Iyong Account',
          points: [
            'Ibigay ang iyong tunay na pangalan, gumaganang email, at tamang contact number sa pag-sign up.',
            'Panatilihing pribado ang iyong password. Ikaw ang responsable sa lahat ng ginagawa gamit ang iyong account.',
            'Isang account bawat tao. Huwag gumawa ng account para sa iba, o magpanggap na ibang tao.',
            'Ipaalam agad sa barangay kung sa tingin mo ay may ibang gumagamit ng iyong account.'
          ]
        },
        {
          id: 'reports',
          title: 'Pagsusumite ng mga Ulat at Kahilingan',
          points: [
            'Ilarawan nang totoo at malinaw hangga\'t maaari ang nangyari.',
            'Kasama ang iyong lokasyon (address o pin sa mapa) para mahanap ka ng mga responder. Mag-pin lamang ng lugar sa loob ng Barangay Sta. Fe.',
            'Ang mga larawan at video ay dapat tungkol sa mismong insidente o sitwasyon. May ilang uri ng ulat na nangangailangan nito, para matulungan ang barangay na beripikahin ang ulat.',
            'Huwag mag-upload ng nilalamang walang kaugnayan, marahas para lamang manggulat, sekswal, o nagpapakita ng tao sa paraang yumuyurak sa kanilang dignidad.',
            'Kapag nag-uulat para sa iba, ibahagi lamang ang kanilang detalye kung nais nila ng tulong, o kung hindi nila ito kayang hingin mismo.'
          ]
        },
        {
          id: 'falseReports',
          title: 'Peke o Mapanlinlang na mga Ulat',
          points: [
            'Huwag kailanman magsumite ng peke, biro, o pinalabis na ulat.',
            'Inilalayo ng pekeng ulat ang mga responder sa mga tunay na emergency.',
            'Maaaring masuspinde ang mga account na nagsusumite ng pekeng ulat, at maaaring idulog ang usapin sa kinauukulan alinsunod sa batas ng Pilipinas.'
          ]
        },
        {
          id: 'anonymous',
          title: 'Mga Ulat nang Hindi Nagpapakilala',
          points: [
            'Kapag nag-ulat ka ng petty crime nang hindi nagpapakilala, itatago sa mga kawani ng barangay ang iyong pangalan at contact number.',
            'Nananatiling naka-link ang ulat sa iyong account para masubaybayan mo ito sa Aking Mga Ulat at makatanggap ng mga update.',
            'Pinoprotektahan ng anonymous na pag-uulat ang iyong pagkakakilanlan, hindi ang pekeng ulat. Nalalapat pa rin ang mga tuntunin sa itaas.'
          ]
        },
        {
          id: 'community',
          title: 'Balita, Komento at Asal sa Komunidad',
          points: [
            'Panatilihing magalang ang mga komento at may kaugnayan sa post.',
            'Huwag mag-post ng insulto, banta, mapoot na pananalita, personal na impormasyon ng iba, spam, o maling impormasyon.',
            'Maaaring itago o burahin ng mga administrador ng barangay ang mga komentong lumalabag sa mga tuntuning ito.'
          ]
        },
        {
          id: 'privacy',
          title: 'Ang Iyong Impormasyon at Privacy',
          points: [
            'Kinokolekta namin ang mga detalyeng ibinibigay mo: pangalan, email, contact number, mga ulat, larawan at video, lokasyon, at mga komento.',
            'Ginagamit lamang ang impormasyong ito para tanggapin at tugunan ang iyong mga ulat, makipag-ugnayan sa iyo tungkol dito, magpadala ng mga update, at panatilihing gumagana at ligtas ang Safe Connect.',
            'Ang mga awtorisadong tauhan lamang ng barangay ang nakakakita ng iyong mga ulat. Hindi namin ibinebenta ang iyong impormasyon.',
            'Pinangangasiwaan ang iyong impormasyon alinsunod sa Data Privacy Act of 2012 (Republic Act No. 10173). Maaari mong hilingin sa barangay na makita, itama, o burahin ang iyong personal na impormasyon.'
          ]
        },
        {
          id: 'limitations',
          title: 'Pagkakaroon ng Serbisyo at mga Limitasyon',
          points: [
            'Sinisikap naming laging gumagana ang Safe Connect, pero maaaring minsan itong hindi magamit dahil sa maintenance, pagkaputol ng serbisyo, o mga problemang wala sa aming kontrol.',
            'Ang impormasyon sa Safe Connect, gaya ng balita at evacuation center, ay ibinibigay nang may mabuting hangarin. Laging sundin ang mga tagubilin ng mga responder at opisyal sa lugar.'
          ]
        },
        {
          id: 'suspension',
          title: 'Pagsuspinde o Pag-alis ng mga Account',
          points: [
            'Maaaring suspindihin o alisin ng barangay ang mga account na lumalabag sa mga tuntuning ito, nagsusumite ng pekeng ulat, o nag-aabuso sa Safe Connect.',
            'Ang mabibigat na paglabag ay maaaring iulat sa kinauukulan.'
          ]
        },
        {
          id: 'changes',
          title: 'Mga Pagbabago sa mga Tuntuning Ito',
          points: [
            'Maaari naming i-update ang mga tuntuning ito habang nagbabago ang Safe Connect. Ipinapakita ng petsa sa itaas ang pinakabagong bersyon.',
            'Kung patuloy mong gagamitin ang Safe Connect pagkatapos ng update, tinatanggap mo ang mga na-update na tuntunin.'
          ]
        },
        {
          id: 'contact',
          title: 'Mga Tanong at Pakikipag-ugnayan',
          points: [
            'Para sa mga tanong tungkol sa mga tuntuning ito o sa iyong impormasyon, makipag-ugnayan sa Barangay Sta. Fe gamit ang mga detalye sa seksyong Contact ng website na ito.'
          ]
        }
      ]
    },
    residentNav: {
      home: 'Home',
      emergency: 'Emergency',
      news: 'Balita',
      notifications: 'Abiso',
      myReports: 'Aking Mga Ulat',
      settings: 'Mga Setting',
      logout: 'Mag-logout'
    },
    notificationPanel: {
      title: 'Abiso',
      markAllRead: 'Nabasa na lahat',
      all: 'Lahat',
      unread: 'Hindi Nabasa',
      weatherAdvisory: 'Babala sa Panahon',
      weatherBody: 'Posibleng umulan ngayon ({{chance}}% na tsansa). Mataas na {{tMax}}°C, mababa na {{tMin}}°C.',
      today: 'Ngayon',
      caughtUp: 'Wala ka nang bagong abiso!',
      noNotifications: 'Wala pang abiso.',
      yourReport: 'Iyong Ulat',
      viewAll: 'Tingnan lahat ng anunsyo'
    },
    weather: {
      codes: {
        clear: 'Maaliwalas na langit',
        partlyCloudy: 'Bahagyang maulap',
        foggy: 'Maulap na hamog',
        drizzle: 'Ambon',
        rain: 'Ulan',
        thunderstorm: 'Bagyo na may kulog',
        update: 'Update sa panahon'
      },
      today: 'ngayon',
      rainLikely: 'Posibleng umulan ngayon — {{chance}}% na tsansa ng pag-ulan.',
      rainUnlikely: 'Mababang tsansa ng pag-ulan ngayon ({{chance}}%).',
      expectHigh: 'Asahan ang pinakamataas na',
      expectLow: 'at pinakamababang'
    },
    news: {
      latestNews: 'Pinakabagong Balita',
      headerSubtitle: 'Mga alerto, update, at balita ng barangay',
      articleCountSingular: '{{count}} update',
      articleCountPlural: '{{count}} na update',
      loading: 'Naglo-load ng balita...',
      empty: 'Wala pang anunsyo. Bumalik ulit sa ibang pagkakataon.',
      externalArticle: 'Panlabas na artikulo',
      openArticle: 'Buksan ang artikulo',
      readFullArticle: 'Basahin ang buong artikulo',
      on: 'sa',
      like: 'Suportahan',
      liked: 'Sinuportahan',
      comment: 'Komento',
      share: 'Ibahagi',
      copied: 'Nakopya!',
      noComments: 'Wala pang komento. Maging una na mag-iwan ng iyong saloobin.',
      loadingComments: 'Naglo-load ng mga komento...',
      commentPlaceholder: 'Sumulat ng komento...',
      deleteComment: 'Burahin ang komento',
      adminBadge: 'Barangay Admin',
      officialBadge: 'Barangay Official',
      viewOneReply: '1 sagot',
      viewReplies: '{{count}} na sagot',
      hideReplies: 'Itago ang mga sagot'
    },
    residentHero: {
      titleLine1: 'Barangay Sta. Fe',
      titleLine2: 'Safe Connect',
      subtitleLine1: 'Maging bahagi ng aming emergency response network at maging handa na magligtas ng buhay kapag kailangan ito nang husto.',
      subtitleLine2: 'Ang iyong aksyon ay makapagdadala ng pag-asa sa panahon ng krisis.',
      hotline: 'Emergency Hotline: 911',
      available247: 'Bukas 24/7 para sa agarang emergency'
    },
    emergencyReportSection: {
      title: 'Mag-report ng Insidente',
      subtitle: 'Bawat segundo ay mahalaga. Piliin ang uri ng insidente sa ibaba upang agad na makipag-ugnayan sa aming pangkat na handang tumugon, 24/7.',
      reportButton: 'I-report',
      cards: {
        emergency: {
          title: 'Mag-report ng Emergency',
          badge: 'Kritikal',
          description: 'Sunog, baha, lindol, o anumang nagbabantang buhay na sitwasyon ngayon'
        },
        assistance: {
          title: 'Humingi ng Tulong',
          badge: 'Mataas',
          description: 'Humiling ng tulong, rescue, o suporta para sa hindi kritikal na sitwasyon'
        },
        pettyCrime: {
          title: 'Mag-report ng Krimen',
          badge: 'Katamtaman',
          description: 'Pagnanakaw, bandalismo, gulo, o iba pang maliliit na paglabag'
        }
      }
    },
    reportForm: {
      reportingFor: 'Sino ang iyong ino-report?',
      self: 'Ako Mismo',
      others: 'Ibang Tao',
      personBoxLabel: 'Taong Iyong Ino-report',
      relationship: 'Iyong Relasyon',
      relationshipPlaceholder: 'Piliin ang relasyon',
      relationshipOptions: {
        family: 'Miyembro ng Pamilya',
        friend: 'Kaibigan',
        neighbor: 'Kapitbahay',
        colleague: 'Katrabaho',
        stranger: 'Estranghero',
        other: 'Iba pa (wala sa listahan — pakispesipiko)'
      },
      relationshipOtherPlaceholder: 'Pakispesipiko ang iyong relasyon sa kanila',
      theirName: 'Kanilang Pangalan',
      optional: '(opsyonal)',
      namePlaceholder: 'Buong pangalan',
      theirContact: 'Kanilang Contact',
      additionalDetails: 'Karagdagang Detalye',
      additionalDetailsPlaceholder: "Ilarawan ang tao o sitwasyon — hal. 'matandang babae malapit sa covered court, naka-red jacket'",
      address: 'Address',
      locating: 'Hinahanap ang lokasyon...',
      useCurrentLocation: 'Gamitin ang kasalukuyang lokasyon',
      fullAddress: 'Buong address',
      houseNumberPlaceholder: 'House / Lot / Block No.',
      streetPlaceholder: 'Kalye',
      floorUnitPlaceholder: 'Floor / Unit / Room (Opsyonal)',
      landmarkPlaceholder: 'Landmark / direksyon (hal. tabi ng covered court, blue gate)',
      serviceAreaNote: 'Limitado lang ang mga report sa Barangay Sta. Fe, Dasmariñas, Cavite, Philippines',
      peopleAffected: 'Bilang ng mga Apektadong Tao',
      selectRange: 'Piliin ang saklaw',
      photoOrVideo: 'Larawan o Video',
      mediaHintEdit: 'Opsyonal. Maglagay lang ng bagong file kung gusto mong palitan ang nasa record na. JPG/JPEG na larawan (max 20MB) o MP4/MOV/WEBM na video (max 50MB).',
      mediaHintRequired: 'Kinakailangan. JPG/JPEG na larawan (max 20MB) o MP4/MOV/WEBM na video (max 50MB).',
      remove: 'Alisin',
      consent: 'Kinukumpirma ko na tama ang ibinigay na impormasyon at pumapayag na kontakin ng response team.',
      cancel: 'Kanselahin',
      saving: 'Sine-save...',
      submitting: 'Isinusumite...',
      saveChanges: 'I-save ang mga Pagbabago',
      submitReport: 'Isumite ang Ulat',
      mediaTypeError: 'JPG/JPEG na larawan o MP4/MOV/WEBM na video lamang ang pinapayagan.',
      mediaTooLargeVideo: 'Masyadong malaki ang file (max 50MB para sa video).',
      mediaTooLargeImage: 'Masyadong malaki ang file (max 20MB para sa larawan).',
      provideLocation: 'Pakilagay ang lokasyon.',
      pinLocation: 'Paki-pin ang lokasyon sa mapa, o ilagay ang house/lot number at kalye.',
      selectRelationship: 'Piliin ang iyong relasyon sa kanila.',
      specifyRelationship: 'Pakispesipiko ang iyong relasyon sa kanila.',
      enterName: 'Ilagay ang pangalan ng taong iyong ino-report.',
      provideDetails: 'Magbigay ng karagdagang detalye tungkol sa taong iyong ino-report.',
      updateFailed: 'Hindi na-update ang ulat',
      submitFailed: 'Hindi naisumite ang ulat'
    },
    emergencyModal: {
      editTitle: 'I-edit ang {{type}} Report',
      reportTitle: 'Mag-report ng {{type}}',
      defaultTypeEdit: 'Emergency',
      defaultTypeReport: 'Emergency',
      emergencyType: 'Uri ng Emergency',
      selectType: 'Piliin ang uri ng emergency',
      typeFire: 'Sunog',
      typeFlood: 'Baha',
      typeEarthquake: 'Lindol',
      incidentDetails: 'Detalye ng Insidente',
      incidentDetailsPlaceholder: 'Ilarawan ang emergency na sitwasyon...',
      specialNeeds: 'Espesyal na Pangangailangan / Konsiderasyon',
      specialNeedsOptions: {
        elderly: 'Matatanda',
        children: 'Mga Bata',
        pwd: 'Mga Taong may Kapansanan',
        pregnant: 'Buntis',
        pets: 'Mga Alagang Hayop'
      },
      cooldownAlert: 'Maghintay ng {{time}} bago magsumite ng isa pang emergency report.',
      cooldownBanner: 'Makakapagsumite ka ng isa pang emergency report sa loob ng {{time}}.',
      mediaRequired: 'Maglagay ng larawan o video ng insidente. Kinakailangan ito.',
      updateSuccess: 'Matagumpay na na-update ang emergency report.',
      submitError: 'Hindi naisumite ang ulat. Subukang muli o tawagan ang emergency hotline: 911',
      reportSubmitted: 'Naisumite ang Ulat',
      assistancePromptBody: 'Tutugon agad ang aming team. Gusto mo rin bang humiling ng tulong (pagkain, tubig, medikal na tulong, atbp.) kaugnay ng emergency na ito? Opsyonal ang hakbang na ito.',
      noThanks: 'Hindi na, salamat',
      requestAssistance: 'Humiling ng Tulong'
    },
    assistanceModal: {
      editTitle: 'I-edit ang Kahilingan ng Tulong',
      requestTitle: 'Humiling ng Tulong',
      whoRequestingFor: 'Para kanino ka humihiling ng tulong?',
      myself: 'Ako Mismo',
      someoneElse: 'Ibang Tao',
      personBoxLabel: 'Taong Iyong Hinihilingan ng Tulong',
      assistanceType: 'Uri ng Tulong',
      selectType: 'Piliin ang uri ng tulong',
      typeFoodWater: 'Pagkain at Tubig',
      typeMedicalAid: 'Medikal na Tulong',
      typeTransportVehicle: 'Sasakyang Pang-transportasyon',
      urgency: 'Pagkaagaran',
      selectUrgency: 'Piliin ang pagkaagaran (opsyonal)',
      urgencyOptions: {
        low: 'Mababa',
        medium: 'Katamtaman',
        high: 'Mataas',
        critical: 'Kritikal'
      },
      currentAddress: 'Kasalukuyang Address',
      serviceAreaNote: 'Limitado lang ang mga kahilingan sa Barangay Sta. Fe, Dasmariñas, Cavite, Philippines',
      describeSituation: 'Ilarawan ang Iyong Sitwasyon',
      situationPlaceholder: 'Magbigay ng detalye tungkol sa uri ng tulong na kailangan mo...',
      cooldownAlert: 'Maghintay ng {{time}} bago magsumite ng isa pang kahilingan ng tulong.',
      cooldownBanner: 'Makakapagsumite ka ng isa pang kahilingan ng tulong sa loob ng {{time}}.',
      enterNameRequesting: 'Ilagay ang pangalan ng taong iyong hinihilingan ng tulong.',
      provideDetailsRequesting: 'Magbigay ng karagdagang detalye tungkol sa taong iyong hinihilingan ng tulong.',
      updateFailed: 'Hindi na-update ang kahilingan',
      updateSuccess: 'Matagumpay na na-update ang kahilingan ng tulong.',
      submitFailed: 'Hindi naisumite ang kahilingan',
      submitError: 'Nagkaroon ng error sa pagsumite ng iyong kahilingan. Subukang muli.',
      submitRequest: 'Isumite ang Kahilingan',
      requestSubmitted: 'Naisumite ang Kahilingan',
      requestSubmittedBody: 'Matagumpay na naisumite ang iyong kahilingan ng tulong. Makikipag-ugnayan sa iyo ang aming team sa lalong madaling panahon.',
      done: 'Tapos na',
      victimOfEmergency: 'Biktima ng Anong Emergency?',
      selectEmergency: 'Piliin ang Emergency',
      emergencyOther: 'Iba pa (pakispesipiko)',
      emergencyOtherPlaceholder: 'Anong emergency ang naranasan mo?',
      specifyEmergency: 'Pakispesipiko ang emergency na naranasan mo.',
      proofPhoto: 'Larawan o Video (Patunay)',
      proofHint: 'Kinakailangan. Makakatulong ito sa barangay na beripikahin ang iyong kahilingan. JPG/JPEG na larawan (max 20MB) o MP4/MOV/WEBM na video (max 50MB).',
      proofRequired: 'Maglagay ng larawan o video ng iyong sitwasyon. Kinakailangan ito para maberipika ng barangay ang iyong kahilingan.'
    },
    pettyCrimeModal: {
      title: 'Mag-report ng Petty Crime',
      crimeType: 'Uri ng Krimen',
      selectType: 'Piliin ang Uri',
      crimeTypes: {
        theft: 'Pagnanakaw',
        vandalism: 'Bandalismo',
        publicDisturbance: 'Gulo sa Publiko',
        suspiciousActivity: 'Kahina-hinalang Aktibidad',
        trespassing: 'Pagpasok nang Walang Pahintulot',
        harassment: 'Panliligalig',
        other: 'Iba pa (wala sa listahan — pakispesipiko sa deskripsyon)'
      },
      description: 'Deskripsyon',
      descriptionPlaceholder: 'Ilarawan ang nangyari...',
      suspectInfo: 'Impormasyon ng Suspek',
      suspectInfoPlaceholder: 'Hitsura, damit, sasakyan...',
      consent: 'Kinukumpirma ko na tama ang ulat na ito at pumapayag na isumite ang petty crime report na ito para sa pagsusuri at aksyon.',
      cooldownAlert: 'Maghintay ng {{time}} bago magsumite ng isa pang ulat.',
      cooldownBanner: 'Makakapagsumite ka ng isa pang ulat sa loob ng {{time}}.',
      updateSuccess: 'Matagumpay na na-update ang petty crime report.',
      submitError: 'Nagkaroon ng error sa pagsumite ng iyong ulat. Subukang muli.',
      submitCrimeReport: 'Isumite ang Crime Report',
      reportSubmitted: 'Naisumite ang Ulat',
      reportSubmittedBody: 'Matagumpay na naisumite ang iyong petty crime report. Susuriin ito ng aming team sa lalong madaling panahon.',
      mediaHintSelectType: 'Opsyonal para sa Pagnanakaw, Kahina-hinalang Aktibidad at Panliligalig; kinakailangan para sa ibang uri ng krimen. JPG/JPEG na larawan (max 20MB) o MP4/MOV/WEBM na video (max 50MB).',
      mediaHintOptional: 'Opsyonal para sa uring ito ng krimen. JPG/JPEG na larawan (max 20MB) o MP4/MOV/WEBM na video (max 50MB).',
      mediaRequired: 'Maglagay ng larawan o video ng insidente. Kinakailangan ito para sa uring ito ng krimen.',
      anonymousLabel: 'Mag-report nang hindi nagpapakilala',
      anonymousHint: 'Itatago sa mga kawani ng barangay ang iyong pangalan at contact number, para sa iyong kaligtasan. Masusubaybayan mo pa rin ang ulat na ito sa Aking Mga Ulat.',
      anonymousOnEdit: 'Isinumite ang ulat na ito nang hindi nagpapakilala.'
    },
    myReports: {
      title: 'Aking Mga Ulat',
      subtitle: 'Subaybayan at pamahalaan ang lahat ng iyong naisumite',
      noAccount: 'Hindi namin matukoy ang iyong account. Mangyaring mag-sign in muli.',
      loadError: 'Hindi ma-load ang iyong mga ulat ngayon. Subukan muli sa ibang pagkakataon.',
      confirmDelete: 'Burahin ang {{type}} report na ito? Hindi na ito maibabalik.',
      deleteFailed: 'Hindi nabura ang ulat.',
      totalReports: 'Kabuuang Ulat',
      other: 'Iba pa',
      filters: {
        all: 'Lahat',
        emergency: 'Emergency',
        assistance: 'Tulong',
        pettyCrime: 'Krimen'
      },
      types: {
        emergency: 'Emergency',
        assistance: 'Tulong',
        pettyCrime: 'Krimen'
      },
      status: {
        received: 'Natanggap',
        pending: 'Naghihintay',
        inProgress: 'Isinasagawa',
        resolved: 'Naresolba',
        completed: 'Nakumpleto',
        rejected: 'Tinanggihan',
        cancelled: 'Kinansela'
      },
      searchPlaceholder: 'Maghanap ayon sa pamagat, deskripsyon, lokasyon, o reference...',
      newestFirst: 'Pinakabago muna',
      oldestFirst: 'Pinakaluma muna',
      showingCountSingular: 'Ipinapakita ang {{shown}} sa {{total}} na ulat',
      showingCountPlural: 'Ipinapakita ang {{shown}} sa {{total}} na mga ulat',
      tryAgain: 'Subukan muli',
      noSearchMatch: 'Walang ulat na tumugma sa iyong paghahanap.',
      emptyAll: 'Wala ka pang naisumiteng ulat.',
      emptyFiltered: 'Wala ka pang naisumiteng {{type}} na ulat.',
      clearFilters: 'I-clear ang mga filter',
      untitledReport: 'Walang pamagat na ulat',
      copied: 'Kinopya!',
      onBehalfOf: 'Iniulat sa ngalan ni',
      severity: 'Kalubhaan',
      map: 'Mapa',
      openInMaps: 'Buksan sa Google Maps',
      hideDetails: 'Itago ang Detalye',
      viewDetails: 'Tingnan ang Detalye',
      edit: 'I-edit',
      delete: 'Burahin',
      detail: {
        contactNumber: 'Numero ng Contact',
        peopleAffected: 'Mga Apektadong Tao',
        peopleNeedingHelp: 'Mga Taong Nangangailangan ng Tulong',
        specialNeeds: 'Espesyal na Pangangailangan',
        suspectInfo: 'Impormasyon ng Suspek'
      }
    },
    settings: {
      title: 'Mga Setting',
      subtitle: 'Pamahalaan ang iyong profile, detalye ng contact, at seguridad ng account',
      profilePhoto: 'Larawan ng Profile',
      profilePhotoSub: 'Lalabas ito sa tabi ng iyong pangalan sa buong SafeConnect.',
      choosePhoto: 'Pumili ng Larawan',
      uploading: 'Ina-upload...',
      savePhoto: 'I-save ang Larawan',
      cancel: 'Kanselahin',
      photoPendingNote: 'Napili ang larawan — pindutin ang Save Photo para ilapat.',
      photoHint: 'JPG, PNG, o WEBP · Max 5MB',
      photoTypeError: 'Pumili ng JPG, PNG, o WEBP na larawan.',
      photoSizeError: 'Dapat mas mababa sa 5MB ang larawan.',
      photoSuccess: 'Matagumpay na na-update ang larawan ng profile.',
      photoUploadError: 'Hindi na-upload ang larawan.',
      serverError: 'Hindi ma-access ang server. Subukang muli.',
      fullName: 'Buong pangalan',
      contactInfo: 'Impormasyon ng Contact',
      contactInfoSub: 'Panatilihing updated ang iyong email at numero ng telepono para maabot ka ng aming team sa panahon ng emergency.',
      emailAddress: 'Email address',
      currentPassword: 'Kasalukuyang password',
      currentPasswordPlaceholder: 'Ilagay ang iyong kasalukuyang password',
      emailPasswordHint: '(kinakailangan para baguhin ang iyong email)',
      saving: 'Sine-save...',
      saveEmail: 'I-save ang email',
      emailEmptyError: 'Hindi maaaring walang laman ang email address.',
      emailInvalidError: 'Ilagay ang isang wastong email address.',
      emailPasswordRequired: 'Ilagay ang iyong kasalukuyang password para kumpirmahin ang pagbabagong ito.',
      emailUpdated: 'Na-update ang email address.',
      emailUpdateError: 'Hindi na-update ang email address.',
      phoneNumber: 'Numero ng telepono',
      savePhoneNumber: 'I-save ang numero ng telepono',
      contactInvalidError: 'Ilagay ang wastong 10-digit na mobile number.',
      contactUpdated: 'Na-update ang numero ng telepono.',
      contactUpdateError: 'Hindi na-update ang numero ng telepono.',
      username: 'Username',
      usernameSub: 'Ganito ka makikilala sa buong SafeConnect.',
      usernamePlaceholder: 'Maglagay ng username',
      saveUsername: 'I-save ang username',
      usernameEmptyError: 'Hindi maaaring walang laman ang username.',
      usernameUpdated: 'Na-update ang username.',
      usernameUpdateError: 'Hindi na-update ang username.',
      password: 'Password',
      passwordSub: 'Pumili ng bagong password na hindi bababa sa 8 na karakter.',
      newPassword: 'Bagong password',
      newPasswordPlaceholder: 'Hindi bababa sa 8 na karakter',
      confirmNewPassword: 'Kumpirmahin ang bagong password',
      confirmNewPasswordPlaceholder: 'Muling ilagay ang iyong bagong password',
      updatePassword: 'I-update ang password',
      passwordFillAll: 'Punan ang lahat ng tatlong password field.',
      passwordTooShort: 'Ang bagong password ay dapat hindi bababa sa 8 na karakter.',
      passwordMismatch: 'Hindi magkatugma ang bagong password at kumpirmasyon.',
      passwordSameAsCurrent: 'Ang bagong password ay dapat iba sa iyong kasalukuyang password.',
      passwordUpdated: 'Na-update ang password.',
      passwordUpdateError: 'Hindi na-update ang password.',
      accountInfo: 'Impormasyon ng Account',
      accountInfoSub: 'Mga detalye tungkol sa iyong SafeConnect account.',
      accountType: 'Uri ng account',
      accountStatus: 'Status ng account',
      memberSince: 'Miyembro mula noong'
    }
  }
};
