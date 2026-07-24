# DeenList Reverse Engineering Plan

## Tasks Checklist
- [x] Initialize scratchpad with plan
- [x] 1. Explore Landing Page (https://deenlist.co/)
    - [x] Take hero section screenshot
    - [x] Take newly added section screenshot
    - [x] Take benefits ("Why Deenlist") section screenshot
    - [x] Scroll further and capture more sections (process, dev tools, CTA, footer)
    - [x] Document headings, text, buttons, links
    - [/] Analyze SEO/meta tags/page source (got basic OG meta details, no framework headers available)
- [/] 2. Explore Products Page (https://deenlist.co/products/)
    - [x] Take screenshot (top of products)
    - [x] Document URL parameters, categories, sidebar slugs (category URL parameter format: `?category=slug`. Category badge links directly to `https://deenlist.co/products/?category=slug`).
    - [ ] Document layout, filters, search functionality
- [x] 3. Explore Product Detail Pages (at least 2 products)
    - [x] Product 1: URL, title, description, details, screenshots, reviews, feature requests (documented "Prayer Times")
    - [x] Product 2: URL, title, description, details, screenshots, reviews, feature requests (documented "Tasbih99")
- [x] 4. Explore Authentication Pages
    - [x] Login: fields, UI, validation errors
    - [x] Signup: fields, validation errors
- [/] 5. Explore Guidelines Page (https://deenlist.co/guidelines/)
    - [x] Navigate to Guidelines
    - [x] Take screenshots of top, requirements, step-by-step, mock form, social promotion, FAQ
    - [x] Document FAQs, accordions, policies (expanded all 8 FAQs)
- [x] 6. Explore Contact Page (https://deenlist.co/contact/)
    - [x] Document fields, subject dropdown options
- [x] 7. Test Dashboard Redirects
    - https://deenlist.co/dashboard/ (redirects to /login/)
    - https://deenlist.co/dashboard/products/new/ (redirects to /login/)
- [x] 8. Footer Links Analysis (list all footer links)
- [x] 9. Compile and Generate Final Report

## Notes & Observations
### Landing Page
- **Hero**: Title: "Discover & Share the Best Islamic Apps". Subtitle: "Deenlist is a free community directory... List your product — we'll promote it...". CTAs: "Browse Products" (href: `/products/`), "Submit Your App" (href: `/signup/`).
- **Stats**: "Free - Always Free to List", "3 - Social Platforms", "15+ - Categories", "Dawah - Niyyah".
- **Newly Added**: Showcases list of apps. E.g. "Prayer Times", "Tasbih99 Names of Allah & More", "Sukoon Guidance". Each card has: icon, title, description, category tag (e.g. 🕌 Prayer & Salah), and upvote count button.
- **Why Deenlist?** Benefits: "100% Free, Forever", "Social Media Promotion", "Community Discovery", "Dawah & Sadaqah Jaariyah".
- **Process**: "List your product in 3 easy steps": 1. Create an account, 2. Submit details, 3. We promote.
- **Developer Tools**: "Feedback & Issue Tracker", "Version & Changelog Tracker", "Free Social Promotion".
- **Footer Links**:
  - Products: Browse All (`/products/`), Newly Added (`/products/?sort=newest`), Top Rated (`/products/?sort=top`), Submit a Product (`/dashboard/products/new/`)
  - Company: Guidelines (`/guidelines/`), Contact Us (`/contact/`), Sign Up Free (`/signup/`), Log In (`/login/`)
  - Legal: Privacy Policy (`/privacy-policy/`), Terms & Conditions (`/terms/`), Cookie Policy (`/cookie-policy/`)
  - Social: Facebook (`https://facebook.com/deenlist`), LinkedIn (`https://linkedin.com/company/deenlist`), X (`https://x.com/deenlisthq`)
  - Brand: A service from Zuraan (`https://zuraan.com?utm_source=deenlist`)

### Products Page
- **Title**: "Islamic Apps & Tools — Deenlist"
- **URL**: `https://deenlist.co/products/`
- **Sort options**: `?sort=newest` (New), `?sort=top` (Top), `?sort=comments` (Discussed)
- **Category URLs**: Filterable via `?category=slug`. For example, `prayer-salah` slug was observed on Prayer Times detail page.
- **Observations**: Total 37 products. No categories sidebar visible on desktop, and no search bar in DOM.

### Guidelines Page
- **Title**: "Listing Guidelines — How to Submit Your Islamic App | Deenlist"
- **Listing Requirements**:
  - Islamic App/Tool: Must serve the Muslim community or facilitate Islamic practice/learning.
  - No Forbidden Content: No Riba (usury), music, inappropriate images, or sectarian conflict/hate speech.
  - Active & Functional: Must be launched, accessible, and not in closed alpha/beta.
  - Privacy First: Must respect user data privacy.
- **Submission Process (5 steps)**:
  - 1. **Create an Account**: Signup for free.
  - 2. **Fill Product Details**: Product Name (required), Upload Logo (required, PNG/JPG max 2MB), Category (required), Short Description (required), Product URL (required).
  - 3. **Submit for Review**: Products are manually reviewed within 24-48 hours.
  - 4. **Get Approved**: Status changes to active.
  - 5. **Social Promotion**: Free promotional posts on Facebook, LinkedIn, X.
- **FAQs**:
  - *Is it really free to list my product?* Yes — completely free, with no hidden fees, no premium tiers, and no time limits. Deenlist is built as an act of dawah.
  - *Can I submit an app that isn't exclusively Islamic but is useful for Muslims?* Yes, as long as it serves or benefits the Muslim community and contains nothing contrary to Islamic values.
  - *How long does the review process take?* We aim to review all submissions within 24–48 hours on business days. You will receive an email notification when your product is approved.
  - *What happens if my submission is rejected?* If your submission doesn't meet our guidelines, we'll notify you by email and explain why. In many cases you can address the issue and resubmit.
  - *Can I submit someone else's Islamic app on their behalf?* We strongly prefer that submissions come from the creator. Unsolicited submissions from third parties may be removed if the developer objects.
  - *How does social media promotion work?* Once approved, we share a promotional post on Facebook, LinkedIn, and Twitter/X with a link back to your Deenlist listing.
  - *Can I update my product listing after it's approved?* Yes, via dashboard. Significant changes may trigger a brief re-review.
  - *My app is no longer available. What should I do?* Notify us via the contact page or update your listing from your dashboard.

### Product Detail - Prayer Times
- **URL**: `https://deenlist.co/products/prayer-times`
- **Title**: Prayer Times
- **Description**: A flutter-based material design 3 prayer times application that calculates prayer time locally without internet.
- **Category**: `🕌 Prayer & Salah` (slug: `prayer-salah`)
- **Submitted by**: MD ABU SAYED on Jul 19, 2026
- **External URL**: Google Play link
- **Features**: Vote button (1 upvote), Save/Bookmark.
- **Feedback & Issues**: Tabs (All, Features, Bugs). Login required to post. No feedback exists.
- **Reviews**: Comments section. Login required to comment. No comments exist.

### Product Detail - Tasbih99
- **URL**: `https://deenlist.co/products/tasbih99`
- **Title**: Tasbih99 Names of Allah & More
- **Description**: Tasbih99 is a feature-rich, privacy-focused digital tasbih application designed to enrich your daily remembrance (dhikr) of Allah.
- **Category**: `🕌 Prayer & Salah` (slug: `prayer-salah`)
- **Submitted by**: MD ABU SAYED on Jul 19, 2026
- **External URL**: Web/App link (under "Get It")
- **Features**: Vote button (2 upvotes), Save/Bookmark, Video/Promo YouTube embed.
- **Feedback & Issues**: Tabs (All, Features, Bugs). Login required. No issues posted.
- **Reviews**: Comments section. Login required. No reviews/comments exist.

### Authentication Pages
- **Login Page (`/login/`)**:
  - Social options: Google, GitHub.
  - Fields: Email Address, Password.
  - Validation: "Please enter a valid email address." (if empty/invalid email), "Password is required." (if empty password).
- **Signup Page (`/signup/`)**:
  - Social options: Google, GitHub.
  - Fields: Full Name, Email Address, Password.
  - Validation: "Name is required." (if empty name), "Please enter a valid email address." (if empty/invalid email), "Password is required." (if empty password).
  - Footer/disclaimer: Links to Terms (`/terms/`), Privacy Policy (`/privacy/`), Log in (`/login/`).

### Contact Page
- **URL**: `https://deenlist.co/contact/`
- **Contact Info**: Email (`hello@deenlist.co`), Response time (within 48 hours, Mon-Fri, excl. public holidays).
- **Fields**: Full Name (required), Email Address (required), Subject dropdown (required), Message (required).
- **Subject Options**:
  - default placeholder: "Select a subject..." (not selectable, placeholder)
  - Option 1: "Product Submission Help"
  - Option 2: "Review or Approval Question"
  - Option 3: "Platform Feedback"
  - Option 4: "Partnership or Collaboration"
  - Option 5: "Report an Issue"
  - Option 6: "Other"
- **Validation**:
  - Shows custom toast at top center of form.
  - Toast: "Name required." (if Name is empty)
  - Toast: "Email required." (if Name is filled but Email is empty)
  - Toast: "Message required." (if Name and Email are filled but Message is empty - deduced)
### Legal Pages
- **Privacy Policy (`/privacy-policy/`)**:
  - Sections: Information We Collect, How We Use Your Information, Cookies & Local Storage, Third-Party Services, Data Retention, Your Rights, Children's Privacy, Changes to This Policy, Contact Us.
- **Terms & Conditions (`/terms/`)**:
  - Sections: Acceptance of Terms, Use of the Platform, Product Submissions, User Conduct, Intellectual Property, Account Termination, Disclaimer of Warranties, Limitation of Liability, Changes to These Terms, Contact Us.
- **Cookie Policy (`/cookie-policy/`)**:
  - Sections: What Are Cookies?, How We Use Cookies, Cookies We Use, Local Storage, Third-Party Cookies, Managing & Disabling Cookies, Changes to This Policy, Contact Us.
