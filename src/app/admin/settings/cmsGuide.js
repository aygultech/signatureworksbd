// Plain-language guidance for the Full CMS, so the site owner can edit without a developer.

export const SECTION_GUIDES = {
  hero_slides_json: {
    where: 'Homepage-এর একদম উপরের বড় slider (প্রথমেই যা চোখে পড়ে)। প্রতিটা Item = একটা slide।',
    demo: '/admin-guide/hero.jpg', view: '/',
    steps: ['Headline = বড় সাদা লেখা, Headline Accent = তার নিচের সোনালি লেখা।', 'Image-এ 1920×1080 landscape ছবি upload করুন — এটাই slide-এর background।', 'Cta1/Cta2 = দুইটা button: Label হলো button-এর লেখা, Href হলো click করলে কোথায় যাবে।', '+ Add Item দিয়ে নতুন slide, Remove দিয়ে slide বাদ।'],
  },
  home_editorial_json: {
    where: 'Homepage-এ slider-এর ঠিক নিচের কালো section ("Our approach" + "Project flow" box) এবং "Who we work with"-এর ৩টা card।',
    demo: '/admin-guide/editorial.jpg', view: '/',
    steps: ['Signature Pillars = বাম পাশের ৩টা ছোট card।', 'Project Journey = ডান পাশের ধাপগুলো (01, 02…)।', 'Service Lens = নিচের সাদা অংশের ৩টা card।'],
  },
  services_home_json: {
    where: 'Homepage-এর "Complete Design & Construction Services" section — ৩টা বড় service card।',
    demo: '/admin-guide/services-home.jpg', view: '/#services',
    steps: ['প্রথম ৩টা item-ই দেখায় (Construction, Architecture, Interior)।', 'Features = card-এর ভেতরের টিক চিহ্ন দেওয়া list।'],
  },
  stats_json: {
    where: 'Homepage-এর সংখ্যার strip (150+ Projects, 8+ Years…)।',
    demo: '/admin-guide/stats.jpg', view: '/',
    steps: ['Value = বড় সংখ্যা (যেমন 150+), Label = নিচের লেখা।', 'শুধু সত্যি সংখ্যা দিন।'],
  },
  process_json: {
    where: 'Homepage-এর "Our Simple 4-Step Process" section।',
    demo: '/admin-guide/process.jpg', view: '/#process',
    steps: ['প্রতিটা Item = একটা ধাপ। Title আর Description বদলান।'],
  },
  about_home_json: {
    where: 'Homepage-এর "About" section — কোম্পানির গল্প, ৪টা ছবির collage, আর "Meet the Team"।',
    demo: '/admin-guide/about.jpg', view: '/#about',
    steps: ['Story / Mission = বাম পাশের লেখা।', 'Gallery = ডান পাশের ৪টা বর্গাকার ছবি (প্রতিটা 1200×1200 বা 1:1)।', 'Badge Number / Badge Text = ছবির কোণের "8+ Years of Excellence"।', 'Team = টিম মেম্বার। Photo-তে বর্গাকার ছবি দিন; না দিলে নামের আদ্যক্ষর দেখাবে।'],
  },
  why_us_json: {
    where: 'Homepage-এর "The Signature Works Difference" section-এর card গুলো।',
    demo: '/admin-guide/why-us.jpg', view: '/#why-us',
    steps: ['প্রতিটা Item = একটা card (Title + Description)।'],
  },
  testimonials_json: {
    where: 'Homepage-এর "What Our Clients Say" — client-দের review card।',
    demo: '/admin-guide/testimonials.jpg', view: '/#testimonials',
    steps: ['Name, Role (যেমন "Homeowner, Uttara"), Review = client-এর কথা।', 'Rating = 1 থেকে 5 তারা।', 'Photo-তে client-এর বর্গাকার ছবি (ঐচ্ছিক)।'],
  },
  services_page_json: {
    where: '/services page-এর উপরের অংশ (title আর ৩টা ছোট card)।',
    demo: '/admin-guide/services-page.jpg', view: '/services',
    steps: ['Title = সাদা লেখা, Accent = সোনালি লেখা।'],
  },
  service_pages_json: {
    where: 'প্রতিটা service-এর নিজস্ব page (যেমন /services/construction)। প্রতিটা Item = একটা service page।',
    demo: '/admin-guide/service-detail.jpg', view: '/services',
    steps: ['Image = page-এর বড় ছবি (1200×800)।', 'Video Url = এখানে video upload করলে page-এ "Video showcase" দেখাবে।', 'Workflow / Outcomes / Includes = bullet list; Faqs = প্রশ্ন-উত্তর।'],
  },
  portfolio_page_json: {
    where: '/portfolio page-এর উপরের অংশ। (Project যোগ করতে বাম menu-র "Portfolio" ব্যবহার করুন।)',
    demo: '/admin-guide/portfolio-page.jpg', view: '/portfolio',
  },
  blog_page_json: {
    where: '/blog page-এর উপরের অংশ। (Post লিখতে বাম menu-র "Blog" ব্যবহার করুন।)',
    demo: '/admin-guide/blog-page.jpg', view: '/blog',
  },
  book_page_json: {
    where: '/book (Consultation booking) page-এর উপরের অংশ।',
    demo: '/admin-guide/book-page.jpg', view: '/book',
  },
  calculator_page_json: {
    where: '/calculator (Cost Calculator) page-এর উপরের অংশ।',
    demo: '/admin-guide/calculator-page.jpg', view: '/calculator',
  },
  navbar_links_json: {
    where: 'সব page-এর উপরের menu bar।',
    demo: '/admin-guide/navbar.jpg', view: '/',
    steps: ['Label = menu-তে যা লেখা থাকবে।', 'Href = কোন page-এ যাবে (যেমন /portfolio)। না বুঝলে বদলাবেন না।'],
  },
}

// Short help shown under individual fields, keyed by the field name.
export const FIELD_HELP = {
  badge: 'Headline-এর উপরের ছোট লেখা',
  headline: 'বড় সাদা শিরোনাম',
  headlineAccent: 'শিরোনামের সোনালি অংশ',
  subheadline: 'শিরোনামের নিচের ছোট বর্ণনা',
  label: 'Button বা menu-তে যা লেখা থাকবে',
  href: 'Click করলে কোথায় যাবে — site-এর page হলে /portfolio এভাবে; ফোন হলে tel:+8801…',
  title: 'শিরোনাম',
  accent: 'শিরোনামের রঙিন (সোনালি) অংশ',
  subtitle: 'শিরোনামের উপরের/নিচের ছোট লেখা',
  description: 'বর্ণনা',
  text: 'ছোট বর্ণনা',
  name: 'নাম',
  role: 'পদবি বা পরিচয়',
  review: 'Client-এর review',
  rating: '1 থেকে 5',
  avatar: 'ছবি না দিলে গোল ঘরে এই অক্ষর দেখাবে (যেমন AH)',
  photo: 'বর্গাকার ছবি upload করুন',
  value: 'বড় করে দেখানো সংখ্যা',
  imageAlt: 'ছবির ছোট বর্ণনা (Google ও দৃষ্টিপ্রতিবন্ধীদের জন্য)',
  alt: 'ছবির ছোট বর্ণনা (Google-এর জন্য)',
  story: 'কোম্পানির গল্প',
  mission: 'লক্ষ্য',
  badgeNumber: 'যেমন 8+',
  badgeText: 'যেমন Years of Excellence',
  navLabel: 'Menu/dropdown-এ service-এর নাম',
  summary: 'Page-এর শুরুর বর্ণনা',
  question: 'প্রশ্ন',
  answer: 'উত্তর',
  videoUrl: 'Video upload করুন (ঐচ্ছিক)',
}

// Technical keys the owner should not touch (they drive icons, URLs and ordering).
export const HIDDEN_FIELDS = new Set(['id', 'icon', 'slug'])
