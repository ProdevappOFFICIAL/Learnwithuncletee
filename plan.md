# Learnwithuncletee
## Modern School Website + School Portal — Wireframe & Product Specification

**Version:** 1.0  
**Prepared:** 30 September 2026  
**Primary goal:** Redesign the existing school website into a modern, image-led, green-branded school website with a connected role-based portal for students, parents/guardians, teachers/staff, and administrators.

---

# 1. Product Vision

Learnwithuncletee should be presented as more than a school brochure.

The website should communicate:

- Academic excellence
- Student development and character
- A safe and welcoming school community
- Modern facilities and learning environment
- Day and boarding options
- The school's curriculum
- Student activities, events, sports and culture
- School-provided services such as catering and coaching
- Easy admissions
- Easy communication with the school
- A secure digital portal for school operations

The product should therefore be split into:

### A. Public Website
Used by prospective parents, existing parents, students, visitors, teachers, partners and the general public.

### B. School Portal
A secured application used by authenticated school users.

Both should share the same visual identity, but the portal should feel more like a productivity application than a marketing website.

---

# 2. Existing Website Audit

The existing site currently exposes Home, About, Gallery, Admission and Portal navigation. The homepage also contains Gallery, Timetable and Tuition Fee sections. Admission currently opens an external admissions application site, while Portal opens a login page.

The current About page contains school statistics, history, mission and administration sections. The Gallery page is primarily a collection of school photographs. The portal login currently asks for an ID number and password and includes a forgotten-password flow.

Source reviewed:
- https://distinctivelandmarkacademy.com.ng/
- https://distinctivelandmarkacademy.com.ng/about
- https://distinctivelandmarkacademy.com.ng/gallery
- https://distinctivelandmarkacademy.com.ng/login
- https://distinctivelandmarkacademy.impression.com.ng/admissions

The new design should preserve useful existing information while replacing the current presentation with a more modern and structured experience.

---

# 3. Recommended Information Architecture

## Public Website Navigation

Primary navigation:

1. Home
2. About
3. Academics
4. Admissions
5. Student Life
6. Services
7. News & Events
8. Gallery
9. Contact

Right-side actions:

- Portal Login
- Apply Now

On smaller screens:

- Hamburger menu
- Sticky Apply button or Portal button

---

# 4. Global Design System

## Brand Direction

The school color is GREEN.

Recommended palette:

- Primary Green: `#0B6B3A`
- Deep Green: `#064A2A`
- Fresh Green: `#16A05D`
- Light Green: `#EAF7EF`
- Accent Lime: `#B7E36B`
- Warm Cream: `#FFFDF7`
- White: `#FFFFFF`
- Text: `#15221A`
- Muted Text: `#637067`
- Border: `#DDE9E1`

Use green as the brand color, not as the background of every section.

The interface should alternate between:

- White sections
- Very light green sections
- Dark-green CTA sections
- Image-heavy sections
- Occasional warm/cream backgrounds

## Visual Style

- Large, high-quality school photography
- Rounded cards
- Soft shadows
- Large headings
- Strong visual hierarchy
- Spacious layouts
- Green gradient overlays on photography
- Small accent shapes
- Clean icons
- Subtle motion
- Horizontal carousels
- Image grids
- Scroll-triggered animation
- Hover states
- Smooth page transitions

Avoid:

- Overcrowded sections
- Excessive gradients
- Giant blocks of text
- Too many colors
- Generic stock photography when real school images are available

---

# 5. Global Components

These should be reusable components.

## Header

Desktop:

- School logo
- School name
- Navigation
- Apply Now button
- Portal Login button

Optional top bar:

- Phone
- Email
- School hours
- Social links

Mobile:

- Logo
- Menu trigger
- Portal button

## Footer

Columns:

### School
- About
- Academics
- Admissions
- Student Life

### Services
- Catering
- Coaching
- Accommodation
- Event/Conference services
- Other verified services

### Quick Links
- Portal
- Apply
- Gallery
- News
- Contact

### Contact
- Address
- Phone
- Email
- Opening hours

Bottom:

- Copyright
- Privacy Policy
- Terms
- Accessibility
- Site credit

---

# 6. HOME PAGE

Route:

`/`

## Goal

Immediately communicate what the school offers and guide visitors toward:

- Admission
- School information
- Services
- Portal
- Contact

## Section 1 — Hero

Large full-width image carousel.

Recommended slides:

### Slide 1
Headline:
**Nurturing Future Leaders**

Supporting text:
Academic excellence, strong character and a supportive environment for every learner.

CTA:
- Apply Now
- Explore Our School

### Slide 2
Headline:
**Learning Beyond the Classroom**

Visuals:
Students participating in sports, practical learning, clubs and cultural activities.

CTA:
- Discover Student Life

### Slide 3
Headline:
**A Complete School Experience**

Highlight:
Academic programmes + boarding + support services + student development.

CTA:
- Explore Our Services

Carousel behavior:

- Autoplay
- Pause on hover
- Previous/next controls
- Dot indicators
- Swipe on mobile
- Image preloading

## Section 2 — Trust / Key Numbers

4–5 statistic cards:

- Students
- Qualified teachers
- Years of excellence
- Programmes
- Facilities

Only use verified numbers.

## Section 3 — Welcome to the School

Two-column layout.

Left:
- Introductory copy
- Read More button

Right:
- Large school/building image
- Small image overlay
- "A place to learn, grow and belong"

## Section 4 — What We Offer

Programme cards:

- Early Years / Nursery
- Primary
- Secondary

Each card contains:

- Image/icon
- Age range
- Short description
- Learn More

## Section 5 — Why Choose Us

Use 5–6 cards:

- Experienced Teachers
- Holistic Education
- Safe Environment
- Modern Facilities
- Character Development
- Student Support

Each has:

- Icon
- Title
- Short explanation

## Section 6 — Additional Services

Important because the school provides more than classroom education.

Create visual service cards for verified services such as:

- Catering Services
- Coaching Center
- Boarding / Accommodation
- Event / Conference Center
- ICT / Digital Skills
- Transportation
- Other school-approved services

Each card:

- Image
- Service name
- Description
- Learn More

## Section 7 — School Facilities

Image carousel/grid:

- Classrooms
- Library
- ICT Centre
- Sports Area
- Boarding Facilities
- Dining/Catering Area
- Laboratory
- Playground

Use real photographs.

## Section 8 — Student Life

Three large feature cards:

- Clubs & Societies
- Sports & Recreation
- Cultural Activities

Include photography.

## Section 9 — Latest News & Events

3–6 cards.

Each:

- Image
- Category
- Date
- Title
- Short excerpt
- Read More

## Section 10 — Gallery Preview

Large masonry/gallery carousel.

Categories:

- Academics
- Events
- Sports
- Cultural
- Campus

CTA:

**View Full Gallery**

## Section 11 — Testimonials

Parent/student/graduate testimonials.

Card includes:

- Quote
- Name
- Role
- Optional photo

Only publish real testimonials with permission.

## Section 12 — Admissions CTA

Large dark-green section.

Headline:
**Ready to Begin Your Child's Journey?**

Buttons:

- Apply Now
- Contact Admissions

## Section 13 — Footer

---

# 7. ABOUT PAGE

Route:

`/about`

## Hero

Heading:
**About Learnwithuncletee**

Background:

School image with green overlay.

## Our Story

Timeline or narrative section.

Possible structure:

- Founding
- Growth
- Major milestones
- Current vision

Use real school history.

## Mission

Large visual card.

## Vision

Large visual card.

## Core Values

Grid:

- Faith
- Integrity
- Excellence
- Respect
- Discipline
- Responsibility
- Innovation

Use the school's officially confirmed values.

## Educational Philosophy

Explain the school's view of:

- Academic development
- Character
- Faith
- Confidence
- Self-reliance

## Leadership

Principal / proprietor / leadership team.

Each card:

- Photo
- Name
- Role
- Short message
- Biography

## School at a Glance

Stats:

- Students
- Staff
- Programmes
- Facilities
- Years

## Why Families Choose Us

Feature grid.

## Final CTA

**Become Part of Our Story**

---

# 8. ACADEMICS PAGE

Route:

`/academics`

## Hero

Academic-focused school photograph.

## Academic Programmes

Tabs/cards:

### Early Years
- Age range
- Learning focus
- Class levels

### Primary
- Class levels
- Curriculum
- Learning outcomes

### Secondary
- Class levels
- Subjects
- Examination preparation

## Curriculum

Explain the school's officially used curriculum.

Do not publish claims about British/American/Nigerian curriculum until school management confirms exactly how each curriculum is implemented.

## Subjects

Grid by category:

- Mathematics
- English
- Sciences
- Social Sciences
- Languages
- ICT
- Arts
- Physical & Health Education
- Other verified subjects

## Learning Approach

Cards:

- Practical Learning
- Project-Based Learning
- Technology-Enabled Learning
- Individual Support
- Examination Preparation

## Academic Resources

- Library
- ICT
- Laboratories
- Study spaces

## Academic Calendar

- Term dates
- Holidays
- Examination periods
- Important academic dates

Could link to a downloadable PDF.

## FAQs

Accordion.

---

# 9. ADMISSIONS PAGE

Route:

`/admissions`

This should be a dedicated conversion page.

## Hero

Headline:
**Admissions Are Open**

Buttons:

- Start Application
- Contact Admissions

## Who Can Apply

Cards for school levels.

## Entry Requirements

Requirements depend on programme/level.

Potential categories:

- Birth certificate
- Passport photograph
- Previous school report
- Transfer documents
- Medical information
- Other required documents

Only publish the official requirements.

## Admissions Process

Visual 4–5 step timeline:

1. Submit Application
2. Document Review
3. Assessment / Interview
4. Offer / Acceptance
5. Enrollment

## Fees

Do not hardcode fees inside the frontend if they change frequently.

Use a CMS/database-controlled fee table.

Fields:

- Programme
- Tuition
- Registration
- Boarding
- Other official charges
- Effective term/session

## Downloadable Forms

- Admission Form
- Medical Form
- Transfer Form
- Other official documents

## Important Dates

- Application opening
- Application deadline
- Assessment date
- Resumption

## Admissions FAQ

## Contact Admissions

Phone/email/WhatsApp if officially provided.

## CTA

**Start Your Application**

---

# 10. STUDENT LIFE PAGE

Route:

`/student-life`

## Hero

Students interacting on campus.

## School Life Overview

Text + photography.

## Clubs & Societies

Cards:

- Club name
- Description
- Meeting schedule
- Photo

## Sports

- Football
- Athletics
- Other verified sports

## Cultural Activities

Examples:

- Cultural Day
- Performances
- Competitions
- Celebrations

## Events

Upcoming school events.

## Boarding Life

Explain:

- Accommodation
- Supervision
- Meals
- Study periods
- Activities
- Boarding rules

Only publish verified details.

## Student Support

- Academic support
- Guidance
- Mentoring
- Welfare

## Gallery Strip

Student-life photos.

---

# 11. SERVICES PAGE

Route:

`/services`

This is one of the most important additions requested by the school.

Hero:

**More Than Just Education**

Subtitle:
School-supported services for students, families and the wider community.

## Service Cards

### Catering Services

Show:

- Dining/catering photos
- What the service provides
- Who can use it
- Meal/event options where applicable
- Request/Contact CTA

Possible CTA:
**Request Catering**

### Coaching Center

Show:

- Academic coaching
- Target audience
- Subjects/programmes
- Schedule
- Contact/Enrollment CTA

### Accommodation / Boarding

Show:

- Facilities
- Rooms
- Meals
- Welfare
- Availability

### Event / Conference Center

Only include if the school actually offers this.

Show:

- Venue images
- Capacity
- Suitable events
- Booking enquiry

### ICT / Digital Skills

Show:

- Computer facilities
- Training
- Digital literacy
- Available courses

### Transportation

Only include if officially offered.

Show:

- Route information
- Safety
- Registration/contact

### Other Services

Make this CMS-driven so new services can be added later without redesigning the page.

## Service Detail Template

Every service should have:

- Hero
- Overview
- Benefits/features
- Gallery
- Pricing or enquiry flow
- FAQ
- Contact CTA

---

# 12. NEWS & EVENTS PAGE

Route:

`/news`

## Hero

**News & Events**

## Featured Story

Large featured article.

## Filters

- All
- News
- Events
- Announcements
- Academic
- Sports
- Cultural

## News Cards

Each card:

- Image
- Category
- Date
- Title
- Excerpt
- Read More

## Upcoming Events

Calendar-style list.

Each:

- Date
- Event name
- Time
- Location
- Description

## Article Detail

Route:

`/news/[slug]`

Includes:

- Cover image
- Title
- Date
- Category
- Author
- Article content
- Image gallery
- Related articles
- Share buttons

---

# 13. GALLERY PAGE

Route:

`/gallery`

## Hero

Photography-heavy banner.

## Category Tabs

- All
- Campus
- Academics
- Students
- Sports
- Cultural
- Events
- Staff

## Gallery Grid

Use a responsive masonry/grid layout.

Desktop:
4-column or asymmetrical layout.

Tablet:
3-column.

Mobile:
2-column.

## Image Viewer

When an image is clicked:

- Lightbox
- Full image
- Caption
- Previous/next
- Swipe
- Close

## Optional Video Section

School-approved videos from YouTube/Vimeo or locally hosted videos.

---

# 14. CONTACT PAGE

Route:

`/contact`

## Hero

**We'd Love to Hear From You**

## Contact Information

- Address
- Phone
- Email
- Opening hours

## Contact Form

Fields:

- Full Name
- Email
- Phone
- Subject
- Message

Optional dropdown:

- Admissions
- Catering
- Coaching
- General enquiry
- Portal support
- Other

## Map

Embed Google Maps/other map provider.

## Department Contacts

Where applicable:

- Admissions
- Administration
- Finance/Bursary
- Academic office
- Boarding
- Services

## Social Media

Official school accounts only.

---

# 15. PORTAL LOGIN

Route:

`/login`

The public site's Portal button should open this.

## Login Design

Split-screen desktop layout:

Left:
- School photography
- School statement
- Portal feature summary

Right:
- Login form

Fields:

- ID Number / Email
- Password

Actions:

- Login
- Forgot Password

Optional:

**Choose portal**

- Student
- Parent/Guardian
- Teacher/Staff
- Administrator

Do not rely solely on role selection for authorization. The backend must enforce permissions based on authenticated account roles.

---

# 16. PORTAL ARCHITECTURE

The portal should be a separate application shell.

Desktop layout:

- Sidebar
- Top navigation
- Notifications
- User menu
- Main content

Mobile:

- Bottom navigation or drawer
- Sticky header
- Responsive cards

---

# 17. STUDENT PORTAL

Route:

`/portal/student`

## Dashboard

Cards:

- Attendance
- Current GPA/Average
- Assignments
- Outstanding Fees
- Upcoming Classes
- Announcements

## Student Navigation

- Dashboard
- My Profile
- My Classes
- Timetable
- Assignments
- Results
- Attendance
- Fees
- Documents
- Announcements
- Messages
- Calendar
- Settings

## My Classes

Show:

- Subject
- Teacher
- Class
- Room
- Schedule

## Timetable

Weekly calendar.

## Assignments

Statuses:

- Upcoming
- Submitted
- Late
- Graded

## Results

- Term
- Subject
- Score
- Grade
- Remarks
- Overall average

## Attendance

- Present
- Late
- Absent
- Attendance percentage

## Fees

- Current balance
- Paid
- Outstanding
- Payment history
- Download receipt

## Documents

- Report card
- Result sheet
- Admission documents
- Certificates

## Announcements

School messages.

---

# 18. PARENT / GUARDIAN PORTAL

Route:

`/portal/parent`

Parents must be able to manage multiple children from one account.

## Dashboard

Show each child as a card:

- Name
- Class
- Attendance
- Current result
- Fees
- Upcoming events

## Parent Navigation

- Dashboard
- My Children
- Attendance
- Results
- Timetable
- Fees
- Assignments
- Announcements
- Messages
- Calendar
- Documents
- Profile

## Child Detail

Tabs:

- Overview
- Academics
- Attendance
- Fees
- Assignments
- Behaviour / welfare if implemented
- Documents

## Fee Payment

Integrate official payment provider later.

Flow:

1. Select child
2. Select fee
3. Select amount
4. Pay
5. Payment verification
6. Receipt

For Nigeria, provider choice can be evaluated separately based on school requirements.

---

# 19. TEACHER / STAFF PORTAL

Route:

`/portal/teacher`

## Dashboard

Cards:

- My Classes
- Today's Classes
- Pending Assignments
- Attendance To Mark
- Announcements

## Navigation

- Dashboard
- My Classes
- Timetable
- Attendance
- Assignments
- Results / Grades
- Students
- Materials
- Messages
- Announcements
- Calendar
- Profile

## Attendance

Teacher chooses:

- Class
- Subject
- Date

Then marks:

- Present
- Absent
- Late
- Excused

## Assignment Management

Create:

- Title
- Description
- Due date
- Class
- Subject
- Attachment

Then:

- View submissions
- Grade
- Give feedback

## Results

Enter:

- CA
- Exam
- Total
- Grade
- Teacher remark

Backend should calculate final values where possible.

---

# 20. ADMIN PORTAL

Route:

`/portal/admin`

## Admin Dashboard

Cards:

- Students
- Teachers
- Parents
- Classes
- Fees
- Pending admissions
- Attendance today
- Announcements

## Main Modules

### Student Management

- Create student
- Edit student
- Assign class
- Parent relationship
- View profile
- Status

### Parent Management

- Parent accounts
- Children
- Contact information
- Account status

### Teacher/Staff Management

- Staff profiles
- Assign subjects
- Assign classes
- Permissions

### Academic Management

- Classes
- Subjects
- Sessions
- Terms
- Timetable

### Admissions

- Applications
- Documents
- Assessment
- Offer
- Enrollment

### Finance

- Fee structures
- Payments
- Outstanding balances
- Receipts
- Reports

### Attendance

- Daily attendance
- Class attendance
- Student attendance history

### Results

- Grade configuration
- Result entry
- Approval
- Publishing

### Content Management

The public website should eventually be manageable from admin:

- News
- Events
- Gallery
- Services
- Programmes
- Facilities
- Testimonials
- FAQs
- Homepage slides

### Reports

- Student report
- Attendance
- Fees
- Results
- Admissions
- Staff

---

# 21. ROLE & PERMISSION MODEL

Suggested roles:

### Super Admin
Full system access.

### Admin
General school operations.

### Bursar / Finance
Fees and payment records.

### Admissions Officer
Applications and enrollment.

### Teacher
Academic operations.

### Parent/Guardian
Only their linked children.

### Student
Only their own academic/profile data.

Permissions must be enforced server-side.

The UI can hide unavailable modules, but hiding a menu item is not security.

---

# 22. ADMISSIONS + PORTAL INTEGRATION

Recommended future flow:

Public website:
**Apply Now**

↓

Admissions application

↓

Applicant record created

↓

Documents uploaded

↓

Admin reviews application

↓

Assessment/interview

↓

Offer

↓

Acceptance

↓

Student record created

↓

Parent/student portal account generated

This avoids the current experience where public admission is disconnected from the main school website.

---

# 23. PUBLIC WEBSITE → PORTAL CONNECTION

Every important visitor should have a clear next action.

### Prospect

Home → Academics → Admissions → Apply

### Parent

Home → Portal

### Existing Student

Home → Portal

### Teacher

Home → Portal

### Customer for school service

Services → Service Detail → Enquiry

### General visitor

Home → About → Gallery → Contact

---

# 24. HOMEPAGE CAROUSEL SPECIFICATION

The school specifically requested modern imagery/carousel behavior.

Recommended hero carousel:

- 3–5 slides
- 6–8 second autoplay
- Smooth fade/slide
- Manual controls
- Progress indicator
- Mobile swipe
- Text anchored consistently
- Dark green image overlay for readability

Do not make every section a carousel.

Use carousels only where they improve browsing:

- Hero
- Facilities
- Gallery preview
- Testimonials
- Possibly services

---

# 25. IMAGE STRATEGY

The website should rely heavily on authentic school photography.

Priority images:

1. Main school building
2. Students in class
3. Teachers teaching
4. Students in uniform
5. Sports
6. Cultural events
7. Dining/catering
8. Coaching
9. ICT
10. Boarding/accommodation
11. Library
12. Laboratory
13. Playground
14. School events
15. Staff/leadership

Create image variants:

- Hero landscape
- Card landscape
- Square
- Portrait
- Gallery original

All uploaded images should have:

- Alt text
- Caption
- Category
- Date/event
- Optional photographer/source

---

# 26. RESPONSIVE WIREFRAME RULES

## Desktop

Target:
1440px / 1280px.

Use:

- Max content width ~1200–1320px
- 12-column grid
- Generous spacing
- Large imagery

## Tablet

Target:
768–1024px.

- Collapse navigation where necessary
- 2-column cards
- Smaller hero type
- Preserve image quality

## Mobile

Target:
360–430px.

- Single-column layout
- Hamburger navigation
- Sticky action
- Horizontal card scrolling only where useful
- Large touch targets
- Forms optimized for touch
- No tiny tables

Portal mobile should prioritize:

- Attendance
- Assignments
- Results
- Fees
- Messages

---

# 27. ACCESSIBILITY REQUIREMENTS

Minimum requirements:

- Semantic HTML
- Keyboard navigation
- Visible focus states
- Good contrast
- Alt text
- Labels for forms
- Error messages
- Accessible dialogs
- Accessible carousel controls
- Reduced-motion support
- Large touch targets

Do not communicate information by color alone.

---

# 28. SEO REQUIREMENTS

Every public page needs:

- Unique title
- Meta description
- Canonical URL
- Open Graph image
- Structured headings
- Image alt text
- Sitemap
- Robots.txt
- Clean URLs

Recommended structured data:

- School / EducationalOrganization
- LocalBusiness where appropriate
- Event
- Article

---

# 29. PERFORMANCE REQUIREMENTS

Because the site will use many photographs:

- WebP/AVIF
- Responsive images
- Lazy loading below the fold
- Optimized hero images
- Image CDN
- Next/Image or equivalent optimization
- Avoid loading all gallery images at once
- Skeleton/loading states

Target:

- Fast mobile load
- Minimal layout shift
- Optimized LCP hero image

---

# 30. CONTENT MANAGEMENT

Recommended CMS/data-driven content.

Admin should eventually be able to modify:

- Hero slides
- Homepage text
- Programmes
- Services
- Fees
- News
- Events
- Gallery
- Staff
- Facilities
- FAQs
- Admissions deadlines
- Documents

Hardcoded content should be limited to static brand/system information.

---

# 31. DATA MODEL — HIGH LEVEL

Suggested core entities:

- User
- Role
- Student
- Parent
- Teacher
- Staff
- Class
- Subject
- AcademicSession
- Term
- Timetable
- Attendance
- Assignment
- Submission
- Result
- Fee
- Payment
- AdmissionApplication
- Document
- Announcement
- Message
- Event
- NewsArticle
- GalleryAlbum
- GalleryImage
- Service
- Facility
- Testimonial

Important relationships:

Parent → many Students

Teacher → many Classes/Subjects

Class → many Students

Subject → many Classes

Student → many Results

Student → many Attendance records

Student → many Assignments/Submissions

Student → many Fee/Payment records

---

# 32. ROUTE MAP

## Public

`/`
`/about`
`/academics`
`/academics/[programme]`
`/admissions`
`/student-life`
`/services`
`/services/[slug]`
`/news`
`/news/[slug]`
`/gallery`
`/gallery/[album]`
`/contact`
`/faq`
`/privacy`
`/terms`

## Authentication

`/login`
`/forgot-password`
`/reset-password`

## Student

`/portal/student`
`/portal/student/profile`
`/portal/student/classes`
`/portal/student/timetable`
`/portal/student/assignments`
`/portal/student/results`
`/portal/student/attendance`
`/portal/student/fees`
`/portal/student/documents`
`/portal/student/messages`
`/portal/student/settings`

## Parent

`/portal/parent`
`/portal/parent/children/[id]`
`/portal/parent/attendance`
`/portal/parent/results`
`/portal/parent/fees`
`/portal/parent/payments`
`/portal/parent/messages`

## Teacher

`/portal/teacher`
`/portal/teacher/classes`
`/portal/teacher/attendance`
`/portal/teacher/assignments`
`/portal/teacher/results`
`/portal/teacher/students`
`/portal/teacher/messages`

## Admin

`/portal/admin`
`/portal/admin/students`
`/portal/admin/parents`
`/portal/admin/staff`
`/portal/admin/classes`
`/portal/admin/subjects`
`/portal/admin/timetable`
`/portal/admin/admissions`
`/portal/admin/fees`
`/portal/admin/payments`
`/portal/admin/results`
`/portal/admin/attendance`
`/portal/admin/news`
`/portal/admin/events`
`/portal/admin/gallery`
`/portal/admin/services`
`/portal/admin/settings`
`/portal/admin/reports`

---

# 33. MVP PHASING

Do not build every portal feature simultaneously.

## Phase 1 — Public Website

Build:

- Home
- About
- Academics
- Admissions
- Student Life
- Services
- News
- Gallery
- Contact
- Login

This gives the school a complete professional web presence.

## Phase 2 — Authentication + Core Portal

Build:

- Login
- Users
- Roles
- Student
- Parent
- Teacher
- Admin
- Profiles
- Notifications

## Phase 3 — Academic Operations

Build:

- Classes
- Subjects
- Timetable
- Attendance
- Assignments
- Results

## Phase 4 — Finance + Admissions

Build:

- Fee structures
- Payment records
- Receipts
- Admission applications
- Documents
- Enrollment

## Phase 5 — CMS + Advanced Features

Build:

- Homepage management
- Services management
- Gallery management
- News management
- Event management
- Reports
- Messaging
- Analytics

---

# 34. HOMEPAGE SECTION ORDER — FINAL WIREFRAME

Recommended order:

1. Announcement/top bar
2. Navigation
3. Hero image carousel
4. Quick stats
5. Welcome / About
6. Academic programmes
7. Why choose us
8. Services
9. Facilities
10. Student life
11. News & events
12. Gallery
13. Testimonials
14. Admissions CTA
15. Contact/Map teaser
16. Footer

This gives the homepage a strong storytelling sequence:

**Who we are → What we teach → Why families choose us → What else we offer → What life is like → Proof → Take action**

---

# 35. VISUAL PAGE TEMPLATE

Every public inner page should follow:

Header
↓
Image Hero
↓
Breadcrumb
↓
Main Content
↓
Supporting sections
↓
Relevant Gallery
↓
FAQ/CTA where appropriate
↓
Footer

This keeps the website consistent.

---

# 36. PORTAL VISUAL TEMPLATE

Every authenticated page should follow:

Portal Header
↓
Sidebar
↓
Page Title + Breadcrumb
↓
Summary Cards
↓
Main Data / Tables / Forms
↓
Recent Activity / Notifications
↓
Footer or compact app footer

The portal should use denser information layouts than the public website.

---

# 37. MICRO-INTERACTIONS

Use subtle interactions:

- Button hover
- Card lift
- Image zoom
- Scroll reveal
- Number count-up
- Carousel transitions
- Accordion animation
- Page transition
- Skeleton loading
- Toast notifications
- Form validation
- Success states

Avoid excessive animation around core school information.

---

# 38. IMPORTANT CONTENT RULE

The website should distinguish between:

### Official school information

Must be confirmed by management.

### Marketing copy

Can be professionally rewritten.

### Dynamic information

Should be editable:

- Fees
- Dates
- Events
- Services
- News
- Staff
- Gallery

Never invent:

- Fees
- Accreditation
- School address
- Exam affiliations
- Student numbers
- Facilities
- Service availability
- Staff credentials

---

# 39. FINAL EXPERIENCE

A visitor should be able to understand the school within approximately 30 seconds.

The first screen should answer:

**What is this school?**  
**What does it offer?**  
**Why is it different?**  
**How do I apply?**

The rest of the site should answer:

**What will my child learn?**  
**What is school life like?**  
**What facilities/services are available?**  
**How can I contact the school?**  
**How do I access my school account?**

The portal should answer:

**What do I need to do today?**

That should determine the dashboard content for every role.

---

# 40. RECOMMENDED FINAL PRODUCT STRUCTURE

```text
Learnwithuncletee
│
├── Public Website
│   ├── Home
│   ├── About
│   ├── Academics
│   ├── Admissions
│   ├── Student Life
│   ├── Services
│   ├── News & Events
│   ├── Gallery
│   ├── Contact
│   └── Legal
│
├── Authentication
│   ├── Login
│   ├── Forgot Password
│   └── Reset Password
│
└── School Portal
    ├── Student Portal
    ├── Parent Portal
    ├── Teacher/Staff Portal
    └── Admin Portal
        ├── Students
        ├── Staff
        ├── Academics
        ├── Admissions
        ├── Attendance
        ├── Results
        ├── Finance
        ├── Communication
        ├── Content
        └── Reports
```

## Design principle

**Public website = emotional, visual, persuasive, image-led.**

**Portal = functional, fast, clear, data-led.**

They should look like the same school, but not like the same application.