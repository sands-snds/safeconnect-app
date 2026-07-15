# SAFECONNECT

***A Web-Based Community Disaster Response System***

**SafeConnect** is an online platform designed to strengthen community preparedness and response during disasters and emergencies. Its primary goal is to enable residents to report incidents, request assistance, and contribute to disaster relief efforts through volunteering and donations.

---

## TABLE OF CONTENTS
1. [Overview](#overview)
2. [Functionality](#functionality)
   - [Main Features](#main-features)
3. [Tech Stack](#tech-stack)
4. [Installation and Setup](#installation-and-setup)
   - [Prerequisites](#prerequisites)
   - [Steps](#steps)
5. [Project Structure](#project-structure)
6. [Contributors](#contributors)

---
## OVERVIEW
**SafeConnect** is a community-centered emergency management system developed to improve coordination, communication, and response during disasters such as floods, fires, and other local emergencies.

The platform provides users with real-time tools to submit incident reports, locate safe zones, access available resources, and offer assistance to those affected. It aims to create a reliable and user-friendly communication channel that enables residents to report emergencies, request support, volunteer, or donate directly through the system.

Through its responsive design and intuitive interface, **SafeConnect** ensures accessibility across devices, allowing users to reach out for help or contribute assistance at any time.

----
## FUNCTIONALITY
**Main Features**
1. **Real-Time Incident Reporting** – Residents can quickly report emergencies and include details such as incident type and location.  
2. **Resident Assistance Page** – Enables users to request help or report ongoing emergency situations.  
3. **Interactive Map** – Displays safe zones, affected areas, and nearby evacuation centers.  
4. **Volunteer Registration** – Allows individuals to sign up and indicate their skills or the type of help they can offer.  
5. **Donation Portal** – Enables users to provide financial or material assistance to support victims and response operations.  
6. **Admin Dashboard** – Allows system administrators to oversee users, reports, and volunteer registrations for management and validation.

---

## SHEETDB API
**SafeConnect** uses the **SheetDB API**, which connects Google Sheets to the React frontend, enabling efficient storage and management of form data.

**API Capabilities Include:**

- Capturing and storing data from users who sign in or create an account, as well as report and volunteer form submissions.

- Retrieving submitted information for admin access and review.

- Offering a lightweight, serverless database solution suitable for community-scale applications.



---
## TECH STACK

**Frontend:** 
- **ReactJS**
- **HTML**
- **CSS**
- **JavaScript**     

**Tools & Libraries:**
- **Visual Studio Code** - for development and debugging
- **Bootstrap** - for UI components and styling
- **SheetDB** - for database integration and data handling


---
## INSTALLATION AND SETUP
**Prerequisites**
Before running the application, make sure the following are installed:
- Node.js (v16 or higher)
- npm (Node Package Manager)

**Steps**

1. **Install Dependencies**
   ```bash
   npm install
2. **Run the Application**
    ```bash
    npm start
3. **Build for Production**
    ```bash
    npm run
---
### PROJECT STRUCTURE

The **SafeConnect** project directory is organized as follows:
 
- **public/** – Includes static public files such as HTML templates, icons, and the manifest file.  
- **src/** – Main source code directory that contains all components, pages, styles, and configuration files.  
  - **components/** – Reusable and feature-specific React components.  
    - **admin/** – Components for the Admin Dashboard, including logs and report management.  
    - **donation/** – Components related to the Donation Page and forms.  
    - **landing/** – Components for the homepage and landing interface.  
    - **resident/** – Components for the Resident Page, where users can report incidents or request help.  
    - **shared/** – Shared UI elements such as the navigation bar, footer, and modals.  
    - **volunteer/** – Components for the Volunteer Page and registration.  
    - **Hero.jsx** – Hero section component for the homepage.  
    - **RegisterModal.jsx** – Modal component for user registration.  
    - **SignInModal.jsx** – Modal component for user login.  
  - **pages/** – Contains page-level components that define routes (e.g., Home, Admin, Volunteer, Donation).  
  - **Services/** – Manages API requests and service integrations.  
  - **styles/** – Holds CSS files for custom page styling.  
  - **App.css** – Global styling for the entire application.  
  - **App.js** – Main application file that handles routing and structure.  

---

## CONTRIBUTORS
- **Shiela Mae Caratao**
- **Aian Janzy Cuento**

 

