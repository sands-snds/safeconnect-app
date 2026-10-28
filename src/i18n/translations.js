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
      done: 'Done',
      cancel: 'Cancel'
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
      choose: 'Choose',
      chooseWho: 'Choose who to call',
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
      close: 'Close',
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
      subtitle: 'Welcome back! Sign in to your Safe Connect account.',
      email: 'Email Address',
      emailPlaceholder: 'Enter your email',
      password: 'Password',
      passwordPlaceholder: 'Enter your password',
      forgotPassword: 'Forgot password?',
      submit: 'Sign In',
      submitting: 'Signing In...',
      noAccount: "Don't have an account?",
      signUpLink: 'Sign Up',
      signInRequired: 'Please sign in to continue to your Safe Connect account.'
    },
    residentGuard: {
      checking: 'Checking your sign-in...',
      signingIn: 'Signing you in...',
      offlineTitle: "Couldn't verify your sign-in",
      offlineBody: 'We could not reach Safe Connect to confirm that you are signed in. Check your internet connection and try again.',
      retry: 'Try Again',
      signInAgain: 'Sign In Again'
    },
    rememberLogin: {
      title: 'Save your login info?',
      body: 'Stay signed in on this device for 30 days, so you can open Safe Connect without signing in again.',
      warning: 'Only choose Yes on your own device, never on a shared or public computer.',
      yes: 'Yes, save',
      no: 'No',
      saving: 'Saving...',
      noExplains: 'If you choose No, you\'ll need to sign in again after closing your browser.',
      signOutHint: 'You can sign out anytime from your account menu.'
    },
    signUp: {
      createTitle: 'Create Account',
      subtitle: 'Join Safe Connect to report emergencies, request help, and stay informed.',
      sectionPersonal: 'Personal Information',
      sectionContact: 'Contact Details',
      sectionSecurity: 'Account Security',
      optional: '(optional)',
      passwordRules: 'Password requirements',
      verifyTitle: 'Verify Your Email',
      firstName: 'First Name',
      firstNamePlaceholder: 'First name',
      middleName: 'Middle Name',
      middlePlaceholder: 'Middle name',
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
      agreePrefix: 'I have read and agree to the',
      agreeLink: 'Terms and Conditions',
      viewTermsHint: 'Open the Terms and Conditions to enable this checkbox.',
      viewTermsFirst: 'Please read the Terms and Conditions before creating an account.',
      mustAgree: 'You must agree to the Terms and Conditions to create an account.'
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
      titlePrefix: 'One website.',
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
    demoVideo: {
      eyebrow: 'Watch the demo',
      defaultTitle: 'See SafeConnect in action',
      subtitle: 'A quick walkthrough of how to report an emergency, request help, and follow your reports.',
      comingSoonTitle: 'Demo video coming soon',
      comingSoonText: 'A short video showing how to use SafeConnect will be available here.',
      newsBadge: 'Video guide'
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
      title: 'Terms and Conditions',
      lastUpdated: 'Last updated: October 16, 2026',
      intro: 'Please read these Terms and Conditions carefully before creating an account or using Safe Connect. They set out your rights and responsibilities as a user of the Platform.',
      close: 'Close',
      understand: 'I Understand',
      sections: [
        {
          id: 'acceptance',
          title: 'Acceptance of Terms',
          points: [
            'These Terms and Conditions ("Terms") govern your access to and use of Safe Connect (the "Platform"), operated by Barangay Sta. Fe, Dasmariñas, Cavite (the "Barangay," "we," or "us").',
            'By creating an account, signing in, or otherwise using the Platform, you confirm that you have read, understood, and agree to be bound by these Terms.',
            'If you do not agree with these Terms, you must not use the Platform.',
            'Users under 18 years of age may use the Platform only with the consent and supervision of a parent or legal guardian.'
          ]
        },
        {
          id: 'about',
          title: 'Description of the Platform',
          points: [
            'Safe Connect is the official online reporting platform of Barangay Sta. Fe.',
            'The Platform allows residents to report emergencies and petty crimes, request assistance, locate evacuation centers, and receive news and announcements from the Barangay.',
            'All reports and requests are received and handled by the Barangay\'s designated response personnel.'
          ]
        },
        {
          id: 'emergencies',
          title: 'Emergency Situations',
          points: [
            'The Platform does not replace emergency hotlines. In any life-threatening situation, call 911 or the emergency numbers listed on this website immediately.',
            'The Platform relies on internet connectivity and third-party services. Reports may therefore be delayed or interrupted.',
            'Submitting a report does not guarantee a response within a specific period of time.'
          ]
        },
        {
          id: 'account',
          title: 'User Accounts',
          points: [
            'You must provide accurate, current, and complete information when registering, including your full name, a valid email address, and a working contact number, and you must keep this information up to date.',
            'You are responsible for keeping your password confidential and for all activity that occurs under your account.',
            'Each person may hold only one account. You may not register on behalf of another person or impersonate anyone.',
            'You must notify the Barangay immediately if you suspect any unauthorized use of your account.'
          ]
        },
        {
          id: 'reports',
          title: 'Reports and Requests',
          points: [
            'All reports and requests must be truthful, accurate, and as complete as possible.',
            'Your location, either your address or a pin on the map, is attached to each report so that responders can find you. Reported locations must be within Barangay Sta. Fe.',
            'Photos and videos must show the actual incident or situation being reported. Certain report types require a photo or video so that the Barangay can verify the report.',
            'You must not upload content that is unrelated to the report, obscene, gratuitously violent, or degrading to any person.',
            'When reporting on behalf of another person, you may share their personal information only if they need assistance or are unable to request it themselves.'
          ]
        },
        {
          id: 'falseReports',
          title: 'False or Misleading Reports',
          points: [
            'Submitting false, prank, or deliberately misleading reports is strictly prohibited.',
            'False reports divert responders and resources away from genuine emergencies.',
            'Accounts found to have submitted false reports may be suspended or terminated, and the matter may be referred to the appropriate authorities for action under Philippine law.'
          ]
        },
        {
          id: 'anonymous',
          title: 'Anonymous Reporting',
          points: [
            'Petty crime reports may be submitted anonymously. When you choose this option, your name and contact number are not shown to Barangay personnel.',
            'Anonymous reports remain linked to your account so that you can track them in My Reports and receive status updates.',
            'Anonymous reporting protects your identity but does not exempt you from these Terms. The prohibition on false reports applies equally to anonymous reports.'
          ]
        },
        {
          id: 'community',
          title: 'Community Guidelines',
          points: [
            'Comments on news and announcements must be respectful and relevant to the post.',
            'You must not post content that is abusive, threatening, discriminatory, defamatory, or misleading; that discloses another person\'s personal information; or that constitutes spam.',
            'The Barangay reserves the right to remove any content that violates these guidelines.'
          ]
        },
        {
          id: 'privacy',
          title: 'Data Privacy',
          points: [
            'We collect the information you provide, including your name, email address, contact number, reports, photos and videos, location data, and comments.',
            'This information is used solely to receive, verify, and respond to your reports; to communicate with you about them; to send you updates; and to operate and secure the Platform.',
            'Your reports are accessible only to authorized Barangay personnel. We do not sell or rent your personal information to third parties.',
            'Your personal information is processed in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173). You may request access to, correction of, or deletion of your personal information by contacting the Barangay.'
          ]
        },
        {
          id: 'limitations',
          title: 'Service Availability and Limitation of Liability',
          points: [
            'We strive to keep the Platform available at all times but do not guarantee uninterrupted or error-free operation. The Platform may be unavailable during maintenance or because of circumstances beyond our control.',
            'Information on the Platform, including news and evacuation center details, is provided in good faith. Always follow the instructions of responders and officials on the ground.',
            'To the extent permitted by law, the Barangay is not liable for any loss arising from delays, interruptions, or the unavailability of the Platform.'
          ]
        },
        {
          id: 'suspension',
          title: 'Suspension and Termination',
          points: [
            'The Barangay may suspend or terminate any account that violates these Terms, submits false reports, or misuses the Platform, with or without prior notice.',
            'Serious violations may be reported to the appropriate authorities.'
          ]
        },
        {
          id: 'changes',
          title: 'Amendments to These Terms',
          points: [
            'We may revise these Terms from time to time to reflect changes to the Platform or to applicable law. The "Last updated" date above indicates when the Terms were last revised.',
            'Your continued use of the Platform after any revision constitutes your acceptance of the revised Terms.'
          ]
        },
        {
          id: 'contact',
          title: 'Contact Information',
          points: [
            'Questions about these Terms or the handling of your personal information may be directed to Barangay Sta. Fe through the contact details provided in the Contact section of this website.'
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
      tabNew: 'New notification',
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
      expectLow: 'and a low of',
      widgetTitle: 'Weather in Sta. Fe',
      high: 'High',
      low: 'Low',
      rainChance: 'Chance of rain',
      tipRain: 'Bring an umbrella and stay away from flood-prone areas.',
      tipHot: 'It will be hot. Drink plenty of water and limit time under the sun.',
      tipFair: 'Good weather for outdoor activities. Stay safe!'
    },
    news: {
      latestNews: 'Latest News',
      headerSubtitle: 'Barangay alerts, updates, and community news',
      searchPlaceholder: 'Search updates',
      filterLabel: 'Filter by category',
      filterAll: 'All',
      latestBadge: 'Latest',
      noMatch: 'No updates match your search or filter.',
      clearFilters: 'Clear filters',
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
    residentGlance: {
      title: 'At a glance',
      subtitle: 'Your reports, the latest barangay update, and today\'s weather.',
      reportsTitle: 'My reports',
      noReports: 'You haven\'t sent any reports yet.',
      viewReports: 'View my reports',
      newsTitle: 'Latest update',
      noNews: 'No announcements yet.',
      viewNews: 'See all news',
      viewForecast: 'View forecast',
      loading: 'Loading...'
    },
    residentHero: {
      eyebrow: 'Barangay Sta. Fe Safe Connect',
      titleLine1: 'Help Is Just',
      titleLine2: 'One Tap Away',
      subtitle: 'Report emergencies, request assistance, and get real-time barangay updates, so help reaches you and your neighbors faster.',
      ctaReport: 'Report an emergency',
      ctaAssist: 'Request assistance',
      lifeThreatening: 'In a life-threatening emergency, call 911 right away.',
      call911: 'Call 911',
      hotlinesButton: 'Barangay hotlines'
    },
    emergencyReportSection: {
      badge: 'Get help fast',
      title: 'Report an Incident',
      subtitle: 'Tell the barangay what is happening and where. Your report goes straight to the barangay\'s response team. Choose the option that fits your situation.',
      reportButton: 'Report',
      cards: {
        emergency: {
          title: 'Report an Emergency',
          description: 'A life-threatening situation happening right now that needs responders immediately.',
          cta: 'Report an emergency'
        },
        assistance: {
          title: 'Request Assistance',
          description: 'Need relief goods, rescue, or support during or after a disaster? Let the barangay know what you need.',
          cta: 'Request assistance'
        },
        pettyCrime: {
          title: 'Report a Petty Crime',
          description: 'Report theft, vandalism, harassment, or suspicious activity. You can choose to stay anonymous.',
          cta: 'Report a petty crime'
        }
      },
      dangerNote: 'In immediate danger? Call 911 or tap the red phone button for emergency hotlines.'
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
      deleteTitle: 'Delete this report?',
      deleteBody: 'Your {{type}} report "{{title}}" will be permanently removed. This cannot be undone.',
      deletedTitle: 'Report Deleted',
      deletedBody: 'Your report has been deleted.',
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
      sortLabel: 'Sort reports',
      allStatuses: 'All statuses',
      statusFilterLabel: 'Filter by status',
      noFilterMatch: 'No reports match these filters.',
      paginationLabel: 'Report pages',
      prevPage: 'Previous',
      nextPage: 'Next',
      pageRange: 'Showing {{from}}–{{to}} of {{total}}',
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
      moreOptions: 'More options',
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
      photoHint: 'JPG, PNG, or WEBP · up to 10MB.',
      photoTypeError: 'Please choose a JPG, PNG, or WEBP image.',
      photoSizeError: 'Photo must be under 10MB.',
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
      passwordSub: 'Use a strong password you don\'t use anywhere else.',
      newPassword: 'New password',
      newPasswordPlaceholder: 'Create a strong password',
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
      memberSince: 'Member since',
      nav: {
        profile: 'Profile',
        contact: 'Contact details',
        security: 'Password & security',
        app: 'Install the app',
        account: 'Account'
      },
      installTitle: 'Install the app',
      installSub: 'Add Safe Connect to your home screen. It opens like a regular app, full screen, so you can report an emergency faster.',
      installButton: 'Install Safe Connect',
      installDone: 'Safe Connect is installed on this device.',
      installIos1: 'In Safari, tap the Share button (the square with an arrow).',
      installIos2: 'Scroll down and tap "Add to Home Screen".',
      installIos3: 'Tap "Add". Safe Connect will appear on your home screen.',
      installAndroid1: 'Open this page in Chrome.',
      installAndroid2: 'Tap the menu (⋮) at the top right.',
      installAndroid3: 'Tap "Install app" or "Add to Home screen", then "Install".',
      profileSub: 'Your name and username, as the barangay sees them on your reports.',
      fullNamePlaceholder: 'Enter your full name',
      fullNameHint: 'Use your real name so the barangay can identify you when responding.',
      nameEmptyError: 'Please enter your full name.',
      nameInvalidError: 'Full name can only contain letters, spaces, periods, apostrophes and hyphens (up to 100 characters).',
      nameUpdateError: 'Could not update your full name.',
      profileUpdated: 'Your profile has been updated.',
      saveChanges: 'Save changes',
      contactDetailsUpdated: 'Your contact details have been updated.',
      confirmWithPassword: 'Enter your current password to change your email',
      passwordRulesError: 'Your new password must meet all the requirements below.',
      passwordDevicesNote: 'Changing your password signs you out of saved logins on your other devices. You\'ll stay signed in here.',
      changePhoto: 'Change photo',
      addPhoto: 'Add a photo',
      cropTitle: 'Adjust your photo',
      cropSubtitle: 'Drag to reposition, and zoom in or out to fit.',
      cropFrameLabel: 'Photo position. Drag, or use the arrow keys to move it and plus or minus to zoom.',
      cropHelp: 'Drag the photo to move it. Pinch or scroll to zoom.',
      cropLoadError: 'This photo couldn\'t be opened. Please choose another one.',
      zoom: 'Zoom',
      zoomIn: 'Zoom in',
      zoomOut: 'Zoom out',
      preview: 'Preview',
      previewProfile: 'Profile',
      previewNavbar: 'Menu bar',
      recenter: 'Recenter'
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
      done: 'Tapos na',
      cancel: 'Kanselahin'
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
      choose: 'Pumili',
      chooseWho: 'Piliin kung sino ang tatawagan',
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
      close: 'Isara',
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
      subtitle: 'Maligayang pagbabalik! Mag-sign in sa iyong Safe Connect account.',
      email: 'Email Address',
      emailPlaceholder: 'Ilagay ang iyong email',
      password: 'Password',
      passwordPlaceholder: 'Ilagay ang iyong password',
      forgotPassword: 'Nakalimutan ang password?',
      submit: 'Mag-sign In',
      submitting: 'Nagsa-sign In...',
      noAccount: 'Wala ka pang account?',
      signUpLink: 'Mag-sign Up',
      signInRequired: 'Mag-sign in muna para magpatuloy sa iyong Safe Connect account.'
    },
    residentGuard: {
      checking: 'Sinusuri ang iyong pag-sign in...',
      signingIn: 'Sina-sign in ka...',
      offlineTitle: 'Hindi ma-verify ang iyong pag-sign in',
      offlineBody: 'Hindi namin maabot ang Safe Connect para kumpirmahing naka-sign in ka. Suriin ang iyong koneksyon sa internet at subukang muli.',
      retry: 'Subukang Muli',
      signInAgain: 'Mag-sign In Muli'
    },
    rememberLogin: {
      title: 'I-save ang iyong login info?',
      body: 'Manatiling naka-sign in sa device na ito nang 30 araw, para mabuksan mo ang Safe Connect nang hindi na muling nagsa-sign in.',
      warning: 'Piliin lamang ang Oo sa sarili mong device, hindi sa shared o pampublikong computer.',
      yes: 'Oo, i-save',
      no: 'Hindi',
      saving: 'Sine-save...',
      noExplains: 'Kung pipiliin mo ang Hindi, kailangan mong mag-sign in muli pagkatapos isara ang iyong browser.',
      signOutHint: 'Maaari kang mag-sign out anumang oras mula sa menu ng iyong account.'
    },
    signUp: {
      createTitle: 'Gumawa ng Account',
      subtitle: 'Sumali sa Safe Connect para mag-ulat ng emergency, humingi ng tulong, at manatiling may alam.',
      sectionPersonal: 'Personal na Impormasyon',
      sectionContact: 'Detalye ng Pakikipag-ugnayan',
      sectionSecurity: 'Seguridad ng Account',
      optional: '(opsyonal)',
      passwordRules: 'Mga kailangan sa password',
      verifyTitle: 'I-verify ang Iyong Email',
      firstName: 'Unang Pangalan',
      firstNamePlaceholder: 'Unang pangalan',
      middleName: 'Gitnang Pangalan',
      middlePlaceholder: 'Gitnang pangalan',
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
      agreePrefix: 'Nabasa ko at sumasang-ayon ako sa',
      agreeLink: 'Mga Tuntunin at Kundisyon',
      viewTermsHint: 'Buksan ang Mga Tuntunin at Kundisyon para magamit ang checkbox na ito.',
      viewTermsFirst: 'Pakibasa muna ang Mga Tuntunin at Kundisyon bago gumawa ng account.',
      mustAgree: 'Kailangan mong sumang-ayon sa Mga Tuntunin at Kundisyon para makagawa ng account.'
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
      titlePrefix: 'Isang website.',
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
    demoVideo: {
      eyebrow: 'Panoorin ang demo',
      defaultTitle: 'Tingnan kung paano gumagana ang SafeConnect',
      subtitle: 'Maikling gabay kung paano mag-report ng emergency, humingi ng tulong, at subaybayan ang iyong mga report.',
      comingSoonTitle: 'Malapit nang ilabas ang demo video',
      comingSoonText: 'Dito ilalagay ang maikling video kung paano gamitin ang SafeConnect.',
      newsBadge: 'Video gabay'
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
      title: 'Mga Tuntunin at Kundisyon',
      lastUpdated: 'Huling na-update: Oktubre 16, 2026',
      intro: 'Pakibasa nang mabuti ang mga Tuntunin at Kundisyong ito bago gumawa ng account o gumamit ng Safe Connect. Nakasaad dito ang iyong mga karapatan at responsibilidad bilang user ng Plataporma.',
      close: 'Isara',
      understand: 'Naiintindihan Ko',
      sections: [
        {
          id: 'acceptance',
          title: 'Pagtanggap sa mga Tuntunin',
          points: [
            'Ang mga Tuntunin at Kundisyong ito ("Mga Tuntunin") ang namamahala sa iyong pag-access at paggamit ng Safe Connect (ang "Plataporma"), na pinapatakbo ng Barangay Sta. Fe, Dasmariñas, Cavite (ang "Barangay," "kami," o "namin").',
            'Sa paggawa ng account, pag-sign in, o anumang paggamit ng Plataporma, kinukumpirma mong nabasa, naintindihan, at sumasang-ayon kang sumunod sa mga Tuntuning ito.',
            'Kung hindi ka sumasang-ayon sa mga Tuntuning ito, hindi mo dapat gamitin ang Plataporma.',
            'Ang mga user na wala pang 18 taong gulang ay maaari lamang gumamit ng Plataporma nang may pahintulot at gabay ng magulang o legal na tagapag-alaga.'
          ]
        },
        {
          id: 'about',
          title: 'Paglalarawan ng Plataporma',
          points: [
            'Ang Safe Connect ang opisyal na online na plataporma sa pag-uulat ng Barangay Sta. Fe.',
            'Sa pamamagitan ng Plataporma, maaaring mag-ulat ang mga residente ng emergency at petty crime, humingi ng tulong, maghanap ng evacuation center, at makatanggap ng balita at anunsyo mula sa Barangay.',
            'Ang lahat ng ulat at kahilingan ay tinatanggap at inaasikaso ng mga itinalagang tauhan ng Barangay sa pagtugon.'
          ]
        },
        {
          id: 'emergencies',
          title: 'Mga Sitwasyong Pang-emergency',
          points: [
            'Hindi pinapalitan ng Plataporma ang mga emergency hotline. Sa anumang sitwasyong nagbabanta sa buhay, tumawag agad sa 911 o sa mga emergency number na nakalista sa website na ito.',
            'Umaasa ang Plataporma sa koneksyon sa internet at sa mga serbisyo ng ikatlong partido. Dahil dito, maaaring maantala o maputol ang pagpapadala ng mga ulat.',
            'Ang pagsusumite ng ulat ay hindi garantiya ng pagtugon sa loob ng tiyak na panahon.'
          ]
        },
        {
          id: 'account',
          title: 'Mga Account ng User',
          points: [
            'Dapat kang magbigay ng tama, kasalukuyan, at kumpletong impormasyon sa pagpaparehistro, kabilang ang iyong buong pangalan, wastong email address, at gumaganang contact number, at panatilihing updated ang impormasyong ito.',
            'Ikaw ang responsable sa pagpapanatiling kumpidensyal ng iyong password at sa lahat ng aktibidad na nagaganap sa iyong account.',
            'Isang account lamang ang maaaring hawakan ng bawat tao. Hindi ka maaaring magparehistro para sa ibang tao o magpanggap bilang sinuman.',
            'Dapat mong ipaalam agad sa Barangay kung may hinala kang may hindi awtorisadong gumagamit ng iyong account.'
          ]
        },
        {
          id: 'reports',
          title: 'Mga Ulat at Kahilingan',
          points: [
            'Ang lahat ng ulat at kahilingan ay dapat totoo, tama, at kumpleto hangga\'t maaari.',
            'Kasama sa bawat ulat ang iyong lokasyon, ang iyong address o pin sa mapa, upang mahanap ka ng mga responder. Ang iniuulat na lokasyon ay dapat nasa loob ng Barangay Sta. Fe.',
            'Ang mga larawan at video ay dapat nagpapakita ng mismong insidente o sitwasyong iniuulat. May ilang uri ng ulat na nangangailangan ng larawan o video upang maberipika ito ng Barangay.',
            'Hindi ka dapat mag-upload ng nilalamang walang kaugnayan sa ulat, malaswa, labis na marahas, o yumuyurak sa dignidad ng sinumang tao.',
            'Kapag nag-uulat para sa ibang tao, maaari mo lamang ibahagi ang kanilang personal na impormasyon kung kailangan nila ng tulong o hindi nila ito kayang hingin mismo.'
          ]
        },
        {
          id: 'falseReports',
          title: 'Peke o Mapanlinlang na mga Ulat',
          points: [
            'Mahigpit na ipinagbabawal ang pagsusumite ng peke, biro, o sinadyang mapanlinlang na ulat.',
            'Inililihis ng mga pekeng ulat ang mga responder at mapagkukunan palayo sa mga tunay na emergency.',
            'Ang mga account na mapatunayang nagsumite ng pekeng ulat ay maaaring suspindihin o tanggalin, at maaaring idulog ang usapin sa kinauukulang awtoridad para sa aksyon alinsunod sa batas ng Pilipinas.'
          ]
        },
        {
          id: 'anonymous',
          title: 'Pag-uulat nang Hindi Nagpapakilala',
          points: [
            'Maaaring isumite nang hindi nagpapakilala ang mga ulat ng petty crime. Kapag pinili mo ito, hindi ipapakita sa mga tauhan ng Barangay ang iyong pangalan at contact number.',
            'Nananatiling naka-link ang mga anonymous na ulat sa iyong account upang masubaybayan mo ang mga ito sa Aking Mga Ulat at makatanggap ng mga update.',
            'Pinoprotektahan ng anonymous na pag-uulat ang iyong pagkakakilanlan, ngunit hindi ka nito inaalis sa saklaw ng mga Tuntuning ito. Nalalapat din sa mga anonymous na ulat ang pagbabawal sa pekeng ulat.'
          ]
        },
        {
          id: 'community',
          title: 'Mga Alituntunin ng Komunidad',
          points: [
            'Ang mga komento sa balita at anunsyo ay dapat magalang at may kaugnayan sa post.',
            'Hindi ka dapat mag-post ng nilalamang mapang-abuso, nagbabanta, mapang-diskrimina, mapanirang-puri, o mapanlinlang; nagbubunyag ng personal na impormasyon ng ibang tao; o maituturing na spam.',
            'May karapatan ang Barangay na alisin ang anumang nilalamang lumalabag sa mga alituntuning ito.'
          ]
        },
        {
          id: 'privacy',
          title: 'Privacy ng Datos',
          points: [
            'Kinokolekta namin ang impormasyong ibinibigay mo, kabilang ang iyong pangalan, email address, contact number, mga ulat, larawan at video, datos ng lokasyon, at mga komento.',
            'Ginagamit lamang ang impormasyong ito upang tanggapin, beripikahin, at tugunan ang iyong mga ulat; makipag-ugnayan sa iyo tungkol sa mga ito; magpadala sa iyo ng mga update; at patakbuhin at protektahan ang Plataporma.',
            'Ang mga awtorisadong tauhan lamang ng Barangay ang may access sa iyong mga ulat. Hindi namin ibinebenta o pinauupahan ang iyong personal na impormasyon sa ikatlong partido.',
            'Pinoproseso ang iyong personal na impormasyon alinsunod sa Data Privacy Act of 2012 (Republic Act No. 10173). Maaari mong hilingin na makita, itama, o burahin ang iyong personal na impormasyon sa pamamagitan ng pakikipag-ugnayan sa Barangay.'
          ]
        },
        {
          id: 'limitations',
          title: 'Pagkakaroon ng Serbisyo at Limitasyon ng Pananagutan',
          points: [
            'Sinisikap naming laging magagamit ang Plataporma, ngunit hindi namin ginagarantiya na tuloy-tuloy o walang error ang operasyon nito. Maaaring hindi ito magamit habang may maintenance o dahil sa mga pangyayaring wala sa aming kontrol.',
            'Ang impormasyon sa Plataporma, kabilang ang balita at detalye ng evacuation center, ay ibinibigay nang may mabuting hangarin. Laging sundin ang mga tagubilin ng mga responder at opisyal sa lugar.',
            'Hanggang sa pinahihintulutan ng batas, walang pananagutan ang Barangay sa anumang pinsalang dulot ng pagkaantala, pagkaputol, o hindi pagkakaroon ng Plataporma.'
          ]
        },
        {
          id: 'suspension',
          title: 'Pagsuspinde at Pagtanggal ng Account',
          points: [
            'Maaaring suspindihin o tanggalin ng Barangay ang anumang account na lumalabag sa mga Tuntuning ito, nagsusumite ng pekeng ulat, o nag-aabuso sa Plataporma, may paunang abiso man o wala.',
            'Ang mabibigat na paglabag ay maaaring iulat sa kinauukulang awtoridad.'
          ]
        },
        {
          id: 'changes',
          title: 'Mga Pagbabago sa mga Tuntuning Ito',
          points: [
            'Maaari naming baguhin ang mga Tuntuning ito paminsan-minsan upang ipakita ang mga pagbabago sa Plataporma o sa umiiral na batas. Ipinapakita ng petsang "Huling na-update" sa itaas kung kailan huling binago ang mga Tuntunin.',
            'Ang patuloy mong paggamit ng Plataporma pagkatapos ng anumang pagbabago ay nangangahulugang tinatanggap mo ang binagong mga Tuntunin.'
          ]
        },
        {
          id: 'contact',
          title: 'Impormasyon sa Pakikipag-ugnayan',
          points: [
            'Ang mga tanong tungkol sa mga Tuntuning ito o sa pangangasiwa ng iyong personal na impormasyon ay maaaring idulog sa Barangay Sta. Fe gamit ang mga detalyeng nasa seksyong Contact ng website na ito.'
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
      tabNew: 'Bagong notification',
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
      expectLow: 'at pinakamababang',
      widgetTitle: 'Panahon sa Sta. Fe',
      high: 'Pinakamataas',
      low: 'Pinakamababa',
      rainChance: 'Tsansa ng ulan',
      tipRain: 'Magdala ng payong at umiwas sa mga lugar na madalas bahain.',
      tipHot: 'Mainit ngayon. Uminom ng maraming tubig at umiwas sa matagal na pagbibilad sa araw.',
      tipFair: 'Magandang panahon para sa mga gawain sa labas. Mag-ingat!'
    },
    news: {
      latestNews: 'Pinakabagong Balita',
      headerSubtitle: 'Mga alerto, update, at balita ng barangay',
      searchPlaceholder: 'Maghanap ng update',
      filterLabel: 'I-filter ayon sa kategorya',
      filterAll: 'Lahat',
      latestBadge: 'Pinakabago',
      noMatch: 'Walang update na tugma sa iyong hinanap o filter.',
      clearFilters: 'Alisin ang filter',
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
    residentGlance: {
      title: 'Sa isang tingin',
      subtitle: 'Ang iyong mga ulat, ang pinakabagong balita ng barangay, at ang panahon ngayon.',
      reportsTitle: 'Aking mga ulat',
      noReports: 'Wala ka pang naipapadalang ulat.',
      viewReports: 'Tingnan ang aking mga ulat',
      newsTitle: 'Pinakabagong balita',
      noNews: 'Wala pang anunsyo.',
      viewNews: 'Tingnan ang lahat ng balita',
      viewForecast: 'Tingnan ang panahon',
      loading: 'Naglo-load...'
    },
    residentHero: {
      eyebrow: 'Barangay Sta. Fe Safe Connect',
      titleLine1: 'Isang Pindot Lang,',
      titleLine2: 'May Tulong Na',
      subtitle: 'Mag-report ng emergency, humingi ng tulong, at makatanggap ng balita mula sa barangay nang real time, para mas mabilis makarating ang tulong sa iyo at sa iyong mga kapitbahay.',
      ctaReport: 'Mag-report ng emergency',
      ctaAssist: 'Humingi ng tulong',
      lifeThreatening: 'Kung nagbabanta sa buhay ang emergency, tumawag agad sa 911.',
      call911: 'Tumawag sa 911',
      hotlinesButton: 'Mga hotline ng barangay'
    },
    emergencyReportSection: {
      badge: 'Mabilis na tulong',
      title: 'Mag-report ng Insidente',
      subtitle: 'Sabihin sa barangay kung ano ang nangyayari at saan. Diretso sa response team ng barangay ang iyong report. Piliin ang angkop sa iyong sitwasyon.',
      reportButton: 'I-report',
      cards: {
        emergency: {
          title: 'Mag-report ng Emergency',
          description: 'Isang nagbabantang-buhay na sitwasyon na nangyayari ngayon at kailangan agad ng responder.',
          cta: 'Mag-report ng emergency'
        },
        assistance: {
          title: 'Humingi ng Tulong',
          description: 'Kailangan ng relief goods, rescue, o suporta habang o pagkatapos ng sakuna? Ipaalam sa barangay ang iyong kailangan.',
          cta: 'Humingi ng tulong'
        },
        pettyCrime: {
          title: 'Mag-report ng Maliit na Krimen',
          description: 'I-report ang pagnanakaw, bandalismo, panliligalig, o kahina-hinalang gawain. Maaari kang manatiling anonymous.',
          cta: 'Mag-report ng maliit na krimen'
        }
      },
      dangerNote: 'Nasa agarang panganib? Tumawag sa 911 o pindutin ang pulang phone button para sa mga emergency hotline.'
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
      deleteTitle: 'Burahin ang ulat na ito?',
      deleteBody: 'Permanenteng mabubura ang iyong {{type}} report na "{{title}}". Hindi na ito maibabalik.',
      deletedTitle: 'Nabura ang Ulat',
      deletedBody: 'Nabura na ang iyong ulat.',
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
      sortLabel: 'Ayusin ang mga ulat',
      allStatuses: 'Lahat ng status',
      statusFilterLabel: 'I-filter ayon sa status',
      noFilterMatch: 'Walang ulat na tugma sa mga filter.',
      paginationLabel: 'Mga pahina ng ulat',
      prevPage: 'Nakaraan',
      nextPage: 'Susunod',
      pageRange: 'Ipinapakita ang {{from}}–{{to}} sa {{total}}',
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
      moreOptions: 'Iba pang opsyon',
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
      photoHint: 'JPG, PNG, o WEBP · hanggang 10MB.',
      photoTypeError: 'Pumili ng JPG, PNG, o WEBP na larawan.',
      photoSizeError: 'Dapat mas mababa sa 10MB ang larawan.',
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
      passwordSub: 'Gumamit ng matibay na password na hindi mo ginagamit sa ibang lugar.',
      newPassword: 'Bagong password',
      newPasswordPlaceholder: 'Gumawa ng matibay na password',
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
      memberSince: 'Miyembro mula noong',
      nav: {
        profile: 'Profile',
        contact: 'Detalye ng contact',
        security: 'Password at seguridad',
        app: 'I-install ang app',
        account: 'Account'
      },
      installTitle: 'I-install ang app',
      installSub: 'Idagdag ang Safe Connect sa iyong home screen. Bubukas ito na parang karaniwang app, full screen, para mas mabilis kang makapag-ulat ng emergency.',
      installButton: 'I-install ang Safe Connect',
      installDone: 'Naka-install na ang Safe Connect sa device na ito.',
      installIos1: 'Sa Safari, i-tap ang Share button (ang kahon na may arrow).',
      installIos2: 'Mag-scroll pababa at i-tap ang "Add to Home Screen".',
      installIos3: 'I-tap ang "Add". Lalabas ang Safe Connect sa iyong home screen.',
      installAndroid1: 'Buksan ang page na ito sa Chrome.',
      installAndroid2: 'I-tap ang menu (⋮) sa kanang itaas.',
      installAndroid3: 'I-tap ang "Install app" o "Add to Home screen", saka "Install".',
      profileSub: 'Ang iyong pangalan at username, gaya ng nakikita ng barangay sa iyong mga ulat.',
      fullNamePlaceholder: 'Ilagay ang iyong buong pangalan',
      fullNameHint: 'Gamitin ang iyong tunay na pangalan para makilala ka ng barangay sa pagtugon.',
      nameEmptyError: 'Pakilagay ang iyong buong pangalan.',
      nameInvalidError: 'Letra, espasyo, tuldok, apostrophe at gitling lamang ang maaari sa buong pangalan (hanggang 100 character).',
      nameUpdateError: 'Hindi ma-update ang iyong buong pangalan.',
      profileUpdated: 'Na-update na ang iyong profile.',
      saveChanges: 'I-save ang mga pagbabago',
      contactDetailsUpdated: 'Na-update na ang iyong detalye ng contact.',
      confirmWithPassword: 'Ilagay ang kasalukuyang password para palitan ang iyong email',
      passwordRulesError: 'Dapat matugunan ng bagong password ang lahat ng kailangan sa ibaba.',
      passwordDevicesNote: 'Ang pagpapalit ng password ay magsa-sign out sa iyong mga naka-save na login sa ibang device. Mananatili kang naka-sign in dito.',
      changePhoto: 'Palitan ang larawan',
      addPhoto: 'Magdagdag ng larawan',
      cropTitle: 'Ayusin ang iyong larawan',
      cropSubtitle: 'I-drag para ilipat, at mag-zoom in o out para magkasya.',
      cropFrameLabel: 'Posisyon ng larawan. I-drag, o gamitin ang arrow keys para ilipat at plus o minus para mag-zoom.',
      cropHelp: 'I-drag ang larawan para ilipat. I-pinch o i-scroll para mag-zoom.',
      cropLoadError: 'Hindi mabuksan ang larawang ito. Pumili ng iba.',
      zoom: 'Zoom',
      zoomIn: 'Mag-zoom in',
      zoomOut: 'Mag-zoom out',
      preview: 'Preview',
      previewProfile: 'Profile',
      previewNavbar: 'Menu bar',
      recenter: 'Igitna'
    }
  }
};
