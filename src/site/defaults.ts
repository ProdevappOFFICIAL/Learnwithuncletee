import { ROUTES } from '@/routes/paths';

export type SitePageKey =
  | 'global'
  | 'home'
  | 'about'
  | 'academics'
  | 'admissions'
  | 'student-life'
  | 'services'
  | 'gallery'
  | 'news'
  | 'contact';

export const SITE_PAGES: Array<{ key: SitePageKey; label: string; path: string }> = [
  { key: 'global', label: 'Brand & site', path: ROUTES.home },
  { key: 'home', label: 'Home page', path: ROUTES.home },
  { key: 'about', label: 'About page', path: ROUTES.about },
  { key: 'academics', label: 'Academics', path: ROUTES.academics },
  { key: 'admissions', label: 'Admissions', path: ROUTES.admissions },
  { key: 'student-life', label: 'Student Life', path: ROUTES.studentLife },
  { key: 'services', label: 'Services', path: ROUTES.services },
  { key: 'gallery', label: 'Gallery', path: ROUTES.gallery },
  { key: 'news', label: 'News & Events', path: ROUTES.news },
  { key: 'contact', label: 'Contact', path: ROUTES.contact },
];

const nav = [
  { label: 'Home', to: ROUTES.home },
  { label: 'About', to: ROUTES.about },
  { label: 'Academics', to: ROUTES.academics },
  { label: 'Admissions', to: ROUTES.admissions },
  { label: 'Student Life', to: ROUTES.studentLife },
  { label: 'Services', to: ROUTES.services },
  { label: 'News & Events', to: ROUTES.news },
  { label: 'Gallery', to: ROUTES.gallery },
  { label: 'Contact', to: ROUTES.contact },
];

const programmes = [
  {
    id: 'secondary',
    level: 'Secondary',
    title: 'Secondary School',
    ageRange: 'Ages 12 – 18',
    description:
      'A rigorous academic programme preparing students for examinations and future opportunities.',
    outcomes: ['Examination preparation', 'Specialised subject tracks', 'Leadership & independence'],
  },
];

const services = [
  {
    id: 'catering',
    slug: 'catering',
    title: 'Catering Services',
    summary: 'Nutritious, well-balanced meals prepared for students and school events.',
    description:
      'Our catering team provides daily meals for students as well as catering support for school events and functions, with attention to hygiene and balanced nutrition.',
    features: ['Daily student meals', 'Special dietary options', 'Event & function catering'],
    icon: 'utensils',
    ctaLabel: 'Request Catering',
  },
  {
    id: 'coaching',
    slug: 'coaching',
    title: 'Coaching Center',
    summary: 'Extra academic support and examination coaching for students at every level.',
    description:
      'The coaching center offers focused academic support outside regular class hours, helping students strengthen weak areas and prepare confidently for examinations.',
    features: ['Subject-focused coaching', 'Examination preparation', 'Small group sessions'],
    icon: 'book',
    ctaLabel: 'Enquire About Coaching',
  },
  {
    id: 'accommodation',
    slug: 'accommodation',
    title: 'Accommodation / Boarding',
    summary: 'Safe, supervised boarding facilities with meals, study time and welfare support.',
    description:
      'Our boarding facilities provide a safe home away from home, with supervised accommodation, regular meals, structured study periods and welfare support.',
    features: ['Supervised housing', 'Meals included', 'Structured study periods'],
    icon: 'house',
    ctaLabel: 'Learn About Boarding',
  },
  {
    id: 'events',
    slug: 'events',
    title: 'Event / Conference Center',
    summary: 'A versatile venue available for school and approved external events.',
    description:
      'Our event and conference facilities can host school functions, workshops and approved community events with modern amenities.',
    features: ['Flexible event spaces', 'Modern amenities', 'Booking enquiries welcome'],
    icon: 'landmark',
    ctaLabel: 'Book a Venue Enquiry',
  },
  {
    id: 'ict',
    slug: 'ict',
    title: 'ICT / Digital Skills',
    summary: 'Computer literacy and digital skills training for students of all ages.',
    description:
      'Our ICT program builds digital literacy through hands-on computer training, equipping students with practical skills for the modern world.',
    features: ['Computer literacy training', 'Hands-on digital projects', 'Age-appropriate curriculum'],
    icon: 'laptop',
    ctaLabel: 'Explore ICT Programmes',
  },
  {
    id: 'transportation',
    slug: 'transportation',
    title: 'Transportation',
    summary: 'Supervised school transport routes for students within the catchment area.',
    description:
      'We provide safe and supervised transportation options for students, with defined routes and registration handled through the school office.',
    features: ['Supervised school routes', 'Registration through school office', 'Safety-first approach'],
    icon: 'bus',
    ctaLabel: 'Register for Transport',
  },
];

const facilities = [
  { id: 'classrooms', title: 'Classrooms', description: 'Spacious, well-lit classrooms designed for focused learning.', icon: 'building' },
  { id: 'library', title: 'Library', description: 'A quiet space stocked with books and study resources.', icon: 'book' },
  { id: 'ict-centre', title: 'ICT Centre', description: 'Computer labs equipped for digital literacy training.', icon: 'laptop' },
  { id: 'sports', title: 'Sports Area', description: 'Fields and courts supporting a wide range of sports.', icon: 'trophy' },
  { id: 'boarding', title: 'Boarding Facilities', description: 'Safe, supervised accommodation for boarding students.', icon: 'house' },
  { id: 'dining', title: 'Dining / Catering Area', description: 'A clean, welcoming space for daily meals.', icon: 'utensils' },
  { id: 'laboratory', title: 'Laboratory', description: 'Equipped science labs for practical learning.', icon: 'flask' },
  { id: 'playground', title: 'Playground', description: 'Safe outdoor play areas for younger learners.', icon: 'play' },
];

const values = [
  { id: 'faith', title: 'Faith', icon: 'heart' },
  { id: 'integrity', title: 'Integrity', icon: 'handshake' },
  { id: 'excellence', title: 'Excellence', icon: 'award' },
  { id: 'respect', title: 'Respect', icon: 'heart' },
  { id: 'discipline', title: 'Discipline', icon: 'ruler' },
  { id: 'responsibility', title: 'Responsibility', icon: 'target' },
  { id: 'innovation', title: 'Innovation', icon: 'lightbulb' },
];

const whyChooseUs = [
  { id: 'teachers', title: 'Experienced Teachers', text: 'Qualified, passionate educators dedicated to every learner.', icon: 'user' },
  { id: 'holistic', title: 'Holistic Education', text: 'Academics balanced with character, faith and confidence building.', icon: 'sprout' },
  { id: 'safe', title: 'Safe Environment', text: 'A secure, supportive and welcoming school community.', icon: 'shield' },
  { id: 'facilities', title: 'Modern Facilities', text: 'Well-equipped classrooms, labs and recreational spaces.', icon: 'school' },
  { id: 'character', title: 'Character Development', text: 'Programmes that shape discipline, leadership and integrity.', icon: 'compass' },
  { id: 'support', title: 'Student Support', text: 'Dedicated guidance, mentoring and welfare structures.', icon: 'heart' },
];

const academicFaqs = [
  { id: 'af1', question: 'What curriculum does the school follow?', answer: 'Our academic programmes follow a structured curriculum designed to prepare students for national examinations. Contact the school office for full curriculum details.' },
  { id: 'af2', question: 'Are there examination preparation classes?', answer: 'Yes, secondary students receive dedicated examination preparation support as part of the academic programme and through the coaching center.' },
  { id: 'af3', question: 'What subjects are offered?', answer: 'Subjects span Mathematics, English, Sciences, Social Sciences, Languages, ICT, Arts and Physical & Health Education. Availability varies by level.' },
];

const admissionsFaqs = [
  { id: 'ad1', question: 'When can I apply?', answer: 'Admissions are open year-round for upcoming sessions, subject to space availability. See the Important Dates section for deadlines.' },
  { id: 'ad2', question: 'What documents are required?', answer: 'Required documents typically include a birth certificate, passport photograph, previous school report and transfer documents where applicable.' },
  { id: 'ad3', question: 'Is there an entrance assessment?', answer: 'Yes, applicants go through a short assessment and/or interview as part of the admissions process.' },
];

const experiences = [
  { title: 'Clubs & Societies', text: 'Explore interests, work with peers and try new skills in a supportive setting.', image: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=1000&q=80' },
  { title: 'Sports & Recreation', text: 'Take part in activities that encourage teamwork, healthy habits and confidence.', image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=1000&q=80' },
  { title: 'Cultural Activities', text: 'Celebrate creativity, community and the many stories students bring to school.', image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1000&q=80' },
];

export const siteDefaults: Record<SitePageKey, any> = {
  global: {
    siteName: 'Learnwithuncletee',
    shortName: 'Learnwithuncletee',
    tagline: 'Nurturing future leaders',
    logo: '/logo.png',
    favicon: '/logo.png',
    applyLabel: 'Apply Now',
    address: '5 Unity Avenue , Valentino Ondo',
    phoneContacts: [
      { label: 'Central Admin', number: '+2347039334594', href: 'tel:+2347039334594' },
      { label: 'School Secretary', number: '+2348034422974', href: 'tel:+2348034422974' },
    ],
    email: 'info@learnwithuncletee.org',
    hours: 'Opening hours to be confirmed',
    footerText: 'Nurturing academic excellence, strong character and a supportive environment for every learner.',
    copyright: 'Address, email and opening hours are pending confirmation.',
    socials: [
      { label: 'Facebook', href: '' },
      { label: 'Instagram', href: '' },
    ],
    nav,
    cta: {
      eyebrow: 'Admissions',
      title: 'Ready to begin your child’s journey?',
      text: 'Take the first step or speak with our admissions team.',
      primaryLabel: 'Apply Now',
      primaryTo: ROUTES.admissions,
      secondaryLabel: 'Contact Admissions',
      secondaryTo: ROUTES.contact,
    },
    theme: {
      primary: '#0b6b3a',
      accent: '#b7e36b',
    },
    seoTitle: 'Learnwithuncletee — Nurturing Future Leaders',
    seoDescription: 'Academic excellence, strong character and a supportive environment for every learner.',
  },

  home: {
    seoTitle: 'Learnwithuncletee — Nurturing Future Leaders',
    seoDescription: 'Academic excellence, strong character and a supportive environment for every learner.',
    hero: {
      slides: [
        {
          id: 'slide-1',
          eyebrow: 'Welcome to Learnwithuncletee',
          title: 'Nurturing Future Leaders',
          text: 'Academic excellence, strong character and a supportive environment for every learner.',
          image: '/school.JPG',
          primaryCta: { label: 'Apply Now', to: ROUTES.admissions },
          secondaryCta: { label: 'Explore Our School', to: ROUTES.about },
        },
        {
          id: 'slide-2',
          eyebrow: 'Beyond the classroom',
          title: 'Learning Beyond the Classroom',
          text: 'Students participating in sports, practical learning, clubs and cultural activities.',
          image: '/students_playing_games.jfif',
          primaryCta: { label: 'Discover Student Life', to: ROUTES.studentLife },
        },
        {
          id: 'slide-3',
          eyebrow: 'A complete experience',
          title: 'A Complete School Experience',
          text: 'Academic programmes, boarding and support services working together for every child.',
          image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=2000&q=85',
          primaryCta: { label: 'Explore Our Services', to: ROUTES.services },
        },
      ],
    },
    stats: [
      { id: 'students', label: 'Students', value: '1,200+' },
      { id: 'teachers', label: 'Qualified Teachers', value: '85+' },
      { id: 'years', label: 'Years of Excellence', value: '18' },
      { id: 'programmes', label: 'Academic Programmes', value: '3' },
      { id: 'facilities', label: 'Campus Facilities', value: '12' },
    ],
    welcome: {
      eyebrow: 'Welcome to our school',
      title: 'A place to learn, grow and belong',
      text: 'We bring academic learning, character development and a caring school community together so every learner can discover their potential.',
      body: 'Learnwithuncletee welcomes families seeking a supportive environment where children are encouraged to think, create and build confidence. Our school community works in partnership with families at every stage of the learning journey.',
      image: '/school.JPG',
      caption: 'A welcoming community for every learner',
      captionText: 'Replace with an approved school photograph.',
      linkLabel: 'Discover our story',
      linkTo: ROUTES.about,
    },
    programmes: {
      eyebrow: 'Learning pathways',
      title: 'A strong start at every stage',
      text: 'Explore the learning pathways available for children as they grow and prepare for what comes next.',
      items: programmes.map((programme) => ({ ...programme, image: '/img_1.jpeg' })),
    },
    whyChooseUs: {
      eyebrow: 'Why families choose us',
      title: 'A school experience built around the whole child',
      text: 'Learning is strongest when students feel supported, challenged and part of a community.',
      items: whyChooseUs,
    },
    services: {
      eyebrow: 'More than education',
      title: 'Support for school and beyond',
      text: 'Discover services designed to complement learning and support the wider school community.',
      linkLabel: 'View all services',
      linkTo: ROUTES.services,
      items: services.slice(0, 3),
    },
    facilities: {
      eyebrow: 'Our spaces',
      title: 'Room to learn, play and thrive',
      text: 'Take a first look at some of the spaces that can support a well-rounded school day.',
      items: facilities,
    },
    studentLife: {
      enabled: false,
      eyebrow: 'Student life',
      title: 'Every day is a chance to discover more',
      text: 'From teamwork to creative expression, student life makes room for connection, confidence and curiosity.',
      items: experiences,
      linkLabel: 'Explore student life',
      linkTo: ROUTES.studentLife,
    },
    news: {
      eyebrow: 'From our community',
      title: 'Latest news & events',
      text: 'Updates and highlights from across the school community.',
      linkLabel: 'All news',
      linkTo: ROUTES.news,
      limit: 3,
    },
    gallery: {
      eyebrow: 'A look around',
      title: 'Moments from school life',
      text: 'Browse a selection of photographs from around our school.',
      linkLabel: 'View full gallery',
      linkTo: ROUTES.gallery,
      limit: 4,
    },
    testimonials: {
      eyebrow: 'Community voices',
      title: 'A school community that cares',
      text: 'Hear from parents, students and educators in our community.',
    },
  },

  about: {
    seoTitle: 'About Learnwithuncletee',
    seoDescription: 'A welcoming school community committed to learning, growth and character.',
    hero: {
      eyebrow: 'Our school',
      title: 'About Learnwithuncletee',
      text: 'A welcoming school community committed to learning, growth and character.',
      image: '/school.JPG',
    },
    story: {
      eyebrow: 'Our story',
      title: 'A foundation for the future',
      paragraphs: [
        'Learnwithuncletee is a school community focused on helping children develop the knowledge, confidence and character they need for life. We partner with families to make each learner feel known, supported and encouraged.',
        'Our history and milestones belong here once confirmed by school leadership. We are building an environment where academic progress and personal growth go hand in hand.',
      ],
      image: '/img_1.jpeg',
      notice: 'School founding year, history and milestones are placeholders pending confirmation.',
    },
    missionVision: [
      { title: 'Our Mission', text: 'To provide a supportive learning environment that nurtures academic excellence, strong character and confidence in every learner.' },
      { title: 'Our Vision', text: 'To empower young people to become thoughtful, capable and compassionate contributors to their communities.' },
    ],
    values: {
      eyebrow: 'What guides us',
      title: 'Our core values',
      items: values,
      notice: "Values shown are proposed placeholders; confirm the school's official values.",
    },
    leadership: {
      eyebrow: 'Leadership',
      title: 'Guided by a shared purpose',
      text: 'Meet the people helping shape our school community.',
      principalMessage: 'We are committed to nurturing every child academically, socially and morally to become confident future leaders.',
      others: [
        {
          id: 'proprietor',
          name: 'The Proprietor',
          role: 'Proprietor',
          img: '/teachers/PET.jpeg',
          message: 'Our vision is a school community where every learner is known, supported and empowered to succeed.',
        },
      ],
    },
    whyChooseUs: {
      eyebrow: 'The Learnwithuncletee experience',
      title: 'Why families choose us',
      items: whyChooseUs,
    },
    ctaLabel: 'Become part of our story',
    ctaTo: ROUTES.admissions,
  },

  academics: {
    seoTitle: 'Academics at Learnwithuncletee',
    seoDescription: 'A clear pathway from early learning through primary and secondary education.',
    hero: {
      eyebrow: 'Learning',
      title: 'Academics at Learnwithuncletee',
      text: 'A clear pathway from early learning through primary and secondary education.',
      image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1800&q=85',
    },
    programmesIntro: {
      eyebrow: 'Academic programmes',
      title: 'Learning for every stage',
      text: 'Each pathway is designed to support development, curiosity and readiness for the next step.',
      notice: 'Age ranges, class levels and learning outcomes are sample placeholders pending confirmation.',
      items: programmes,
    },
    curriculum: {
      eyebrow: 'Curriculum',
      title: 'A thoughtful approach to learning',
      text: 'Our programmes are designed around a structured curriculum and age-appropriate learning goals. Exact curriculum frameworks, examination affiliations and subject combinations should be confirmed by the school before publication.',
      notice: 'Curriculum implementation details are intentionally not asserted until officially confirmed.',
      approaches: ['Practical Learning', 'Project-Based Learning', 'Technology-Enabled Learning', 'Individual Support', 'Examination Preparation'],
    },
    subjects: {
      eyebrow: 'Subjects & resources',
      title: 'A broad foundation',
      text: 'Subject offerings vary by programme and class level. Confirm the current subject list with the academic office.',
      groups: [
        { name: 'Languages & Communication', subjects: ['English', 'Languages'] },
        { name: 'Sciences & Technology', subjects: ['Mathematics', 'Sciences', 'ICT'] },
        { name: 'People & Society', subjects: ['Social Sciences', 'Arts'] },
        { name: 'Health & Wellbeing', subjects: ['Physical & Health Education'] },
      ],
      resourceTitle: 'Academic resources',
      resourceText: 'Library, ICT facilities, laboratories and dedicated study spaces support classroom learning. Facility details are pending confirmation.',
    },
    faqs: {
      eyebrow: 'Frequently asked questions',
      title: 'Academic FAQs',
      text: 'For specific class or curriculum questions, please contact the school office.',
      ctaLabel: 'Contact the academic office',
      ctaTo: ROUTES.contact,
      items: academicFaqs,
    },
  },

  admissions: {
    seoTitle: 'Admissions — Learnwithuncletee',
    seoDescription: 'Explore our programmes and speak with the school about joining the Learnwithuncletee community.',
    hero: {
      eyebrow: 'Admissions',
      title: 'A great next step starts here',
      text: 'Explore our programmes and speak with the school about joining the Learnwithuncletee community.',
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1800&q=85',
    },
    intro: {
      eyebrow: 'Who can apply',
      title: 'Find the right learning pathway',
      text: 'Applications are welcomed for our early years, primary and secondary programmes. Placement depends on age, previous learning and available spaces.',
      notice: 'Admissions availability and age requirements need confirmation for each session.',
    },
    programmes,
    aside: {
      eyebrow: 'Take the first step',
      title: 'Talk to admissions',
      text: 'Our admissions team can advise on requirements, availability and next steps.',
      ctaLabel: 'Contact Admissions',
      ctaTo: ROUTES.contact,
      enquiryLabel: 'Start an application enquiry',
      enquiryNote: 'Online applications are not connected yet. Contact the school office to begin.',
    },
    steps: {
      eyebrow: 'The process',
      title: 'Your admissions journey',
      items: ['Submit an enquiry', 'Document review', 'Assessment or interview', 'Offer and acceptance', 'Enrollment'],
    },
    documents: {
      eyebrow: 'What to prepare',
      title: 'Entry documents',
      items: ['Birth certificate', 'Recent passport photograph', 'Previous school report', 'Transfer documents, if applicable', 'Medical information'],
      notice: 'Document requirements may vary by level. Confirm the official list before applying.',
    },
    fees: {
      eyebrow: 'Fees & important dates',
      title: 'Get current information',
      text: 'Fees, application deadlines, assessment dates and resumption information change by session. We do not publish fee amounts or dates here until they are confirmed.',
      ctaLabel: 'Request current details',
      ctaTo: ROUTES.contact,
    },
    faqs: {
      eyebrow: 'Need a hand?',
      title: 'Admissions FAQs',
      text: 'Our team can guide you through the process and help with any questions.',
      items: admissionsFaqs,
    },
  },

  'student-life': {
    seoTitle: 'Student Life — Learnwithuncletee',
    seoDescription: 'School life extends beyond lessons, helping students build friendships, confidence and a sense of possibility.',
    hero: {
      eyebrow: 'Life at school',
      title: 'A community to learn and belong',
      text: 'School life extends beyond lessons, helping students build friendships, confidence and a sense of possibility.',
      image: 'https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=1800&q=85',
    },
    intro: {
      eyebrow: 'Everyday growth',
      title: 'More than a timetable',
      text: 'Students learn through shared experiences: solving problems together, discovering interests, expressing ideas and caring for their community. We aim to make school a place where every child has room to contribute and grow.',
      image: '/academics.jpeg',
      notice: 'School-specific schedules and activity details await confirmation.',
    },
    experiences: {
      eyebrow: 'Find your place',
      title: 'Ways to get involved',
      text: 'A balanced school experience includes space for teamwork, creativity and play.',
      items: experiences,
      notice: 'Activity descriptions and images are illustrative placeholders.',
    },
    support: [
      { eyebrow: 'Boarding life', title: 'A supported home away from home', text: 'Boarding information should explain accommodation, supervision, meals, study routines, activities and welfare. Please contact the school for confirmed details.', ctaLabel: 'Explore accommodation', ctaTo: ROUTES.services },
      { eyebrow: 'Student support', title: 'Care for the whole learner', text: 'Academic support, guidance, mentoring and welfare help students navigate challenges and make the most of their time at school.', ctaLabel: 'Contact the school', ctaTo: ROUTES.contact },
    ],
    galleryCta: { eyebrow: 'A closer look', title: 'See moments from our community', label: 'Visit the gallery', to: ROUTES.gallery },
  },

  services: {
    seoTitle: 'School Services — Learnwithuncletee',
    seoDescription: 'Explore school-supported services for students, families and the wider community.',
    hero: {
      eyebrow: 'School services',
      title: 'More than just education',
      text: 'Explore school-supported services for students, families and the wider community.',
      image: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1800&q=85',
    },
    intro: {
      eyebrow: 'Support & opportunities',
      title: 'Services for the school community',
      text: 'Contact the school to confirm availability, schedules, eligibility and costs.',
      notice: 'Services and features shown are sample placeholders. Confirm which are officially offered before publication.',
    },
    items: services,
    enquiry: {
      eyebrow: 'Have a question?',
      title: 'Talk to our school team',
      text: 'Send an enquiry and the appropriate department can follow up.',
      label: 'Make an enquiry',
      to: ROUTES.contact,
    },
  },

  gallery: {
    seoTitle: 'Gallery — Learnwithuncletee',
    seoDescription: 'Browse moments from campus, learning, student life and school events.',
    hero: {
      eyebrow: 'A look around',
      title: 'Gallery',
      text: 'Browse moments from campus, learning, student life and school events.',
      image: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1800&q=85',
    },
    categories: ['All', 'Campus', 'Academics', 'Students', 'Sports', 'Cultural', 'Events', 'Staff'],
    notice: 'Photographs shown are placeholders. Replace with approved school images and captions.',
  },

  news: {
    seoTitle: 'News & Events — Learnwithuncletee',
    seoDescription: 'School updates, upcoming moments and stories from the Learnwithuncletee learning community.',
    hero: {
      eyebrow: 'From our community',
      title: 'News & Events',
      text: 'School updates, upcoming moments and stories from our learning community.',
      image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1800&q=85',
    },
    filters: ['All', 'Announcement', 'Academic', 'Sports', 'Cultural', 'Events', 'News'],
    searchPlaceholder: 'Search announcements…',
    emptyText: 'No updates in this category yet.',
  },

  contact: {
    seoTitle: 'Contact — Learnwithuncletee',
    seoDescription: 'Reach out with questions about admissions, academics, school services or the portal.',
    hero: {
      eyebrow: 'Contact',
      title: 'We’d love to hear from you',
      text: 'Reach out with questions about admissions, academics, school services or the portal.',
      image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1800&q=85',
    },
    intro: {
      eyebrow: 'Get in touch',
      title: 'Contact details',
      text: 'Call the Central Admin or School Secretary using the official numbers below.',
      notice: 'Address, email, opening hours and map location are pending confirmation.',
    },
    form: {
      title: 'Send an enquiry',
      text: 'Choose a topic and share how we can help.',
      submitLabel: 'Send enquiry',
      topics: ['Admissions', 'Catering', 'Coaching', 'Accommodation', 'Portal support', 'General enquiry', 'Other'],
      notice: 'Form preview only. A secure delivery service must be connected before launch.',
      sentText: 'Demo only: this form is not connected to a message service, so nothing was sent.',
    },
  },
};

/** Deep-merge overrides onto the defaults without mutating either object. */
export const mergeSiteContent = (base: any, overrides: any): any => {
  if (Array.isArray(base)) return Array.isArray(overrides) ? overrides : base;
  if (base && typeof base === 'object') {
    const output: any = { ...base };
    if (overrides && typeof overrides === 'object') {
      for (const [key, value] of Object.entries(overrides)) {
        output[key] = key in base ? mergeSiteContent(base[key], value) : value;
      }
    }
    return output;
  }
  return overrides === undefined || overrides === null ? base : overrides;
};

export const pageKeyForPath = (pathname: string): SitePageKey => {
  const clean = pathname.replace(/\/+$/, '') || '/';
  if (clean === ROUTES.home) return 'home';
  if (clean === ROUTES.about) return 'about';
  if (clean === ROUTES.academics) return 'academics';
  if (clean === ROUTES.admissions) return 'admissions';
  if (clean === ROUTES.studentLife) return 'student-life';
  if (clean === ROUTES.services) return 'services';
  if (clean === ROUTES.gallery) return 'gallery';
  if (clean === ROUTES.news || clean.startsWith('/news/')) return 'news';
  if (clean === ROUTES.contact) return 'contact';
  return 'home';
};
