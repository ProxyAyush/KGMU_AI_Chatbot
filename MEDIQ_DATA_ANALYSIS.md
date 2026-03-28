# MEDIQ Dataset Analysis: KGMU AI Chatbot Public Data

**Dataset:** [ProxyAyush/MEDIQ](https://github.com/ProxyAyush/MEDIQ)
**Total QA Pairs:** 8,251
**Date Range:** April 1, 2025 - March 28, 2026 (360 days, 235 active days)
**Daily Average:** ~35 queries/day

---

## 1. Executive Summary

The MEDIQ dataset captures 8,251 real-world interactions from an AI medical chatbot deployed at King George's Medical University (KGMU), Lucknow. Analysis reveals a chatbot primarily used for **exam scheduling inquiries** and **appointment booking** rather than clinical medicine. The bot's answer quality improved dramatically over time (unanswered rate dropped from 30% to ~2.5%), but critical gaps remain in exam-related queries where 51% go unanswered and 33% are deflected.

---

## 2. User Demographics & Behavior

### 2.1 Who Uses the Chatbot?

| User Type | Count | % |
|-----------|-------|------|
| Unknown | 3,828 | 46.4% |
| Student | 2,180 | 26.4% |
| Patient | 1,606 | 19.5% |
| Staff | 562 | 6.8% |
| Faculty | 49 | 0.6% |
| Visitor | 22 | 0.3% |
| Applicant | 4 | 0.05% |

**Key Insight:** Nearly half of users (46.4%) cannot be classified. Students and patients together make up the identifiable majority. The chatbot is essentially serving two distinct populations: **academic users** (students + staff + faculty = 33.8%) and **healthcare seekers** (patients + visitors = 19.7%).

### 2.2 What Do Different Users Ask About?

- **Students** dominate exams (794), admissions (650), and courses (413)
- **Patients** dominate appointments (510), OPD (578), and departments (123)
- **Staff** focus on exams (222) and career (131)
- **Unknown users** dominate the "general" category (2,404) - likely casual or first-time users

### 2.3 When Do Users Interact?

**Peak hours (IST):** 13:00-16:00 (afternoon cluster, ~660 avg queries/hour)
**Lowest activity:** 03:00-05:00 IST (~40 avg queries/hour)
**Average query hour:** Students 14.4, Patients 14.0, Staff 14.5 IST

**Day of week:** Remarkably uniform (Monday: 1,241, Sunday: 1,091) - only ~12% drop on weekends.

**Weekend behavior shift:** Slightly more appointment queries on weekends (11% vs 8.9%) and more general questions (36.5% vs 34.4%).

---

## 3. Language Analysis

### 3.1 The Hidden Multilingual Reality

| Detection Method | English | Hindi (Devanagari) | Romanized Hindi | Code-Mixed (Hindi-English) |
|---|---|---|---|---|
| Heuristic | 96.7% (7,977) | 2.4% (194) | - | 1.0% (80) |
| AI-Corrected | 57.8% (4,772) | 2.8% (232) | 10.0% (822) | 28.8% (2,378) + 0.6% (47) |

**Critical Finding:** The heuristic language detector massively over-counts English. When corrected by AI, **42.2% of queries contain Hindi** (Romanized, Devanagari, or code-mixed). The 39.3% mismatch rate (3,239 entries) reveals that users overwhelmingly write Hindi in Roman script (Romanized Hindi/Hinglish), which simple script-based detection misclassifies as English.

**Example misclassified queries:**
- "Opd ki timings kya hai" → Detected as English, actually Romanized Hindi
- "kgmu non teaching post ka exam kab hoga?" → Detected as English, actually Hindi-English code-mixed
- "BMLT main addmission kaise mil skta h??" → Detected as English, actually Romanized Hindi

### 3.2 Language vs Answer Quality

| Language | Adequate | Comprehensive | Deflected | Partial |
|---|---|---|---|---|
| English | 31.0% | 13.5% | 25.8% | 29.7% |
| Hindi (Devanagari) | 72.8% | 13.4% | 2.6% | 11.2% |
| Romanized Hindi | 44.0% | 20.9% | 17.9% | 17.2% |
| Code-Mixed | 41.1% | 16.7% | 16.6% | 25.7% |

**Surprising Finding:** Hindi Devanagari queries get the BEST answer quality (72.8% adequate, only 2.6% deflected). This suggests the chatbot handles Hindi queries well when they are in native script. English queries have the HIGHEST deflection rate (25.8%), likely because English users ask more complex/specific questions.

### 3.3 AI Translation Quality Issue

The AI translations of Hindi queries are often poor word-by-word substitutions rather than meaningful translations:
- "kya bina exam ke admission ho gayega" → "what bina exam of admission ho gayega" (meaningless)
- "Isme admission kese le sakte hai" → "Isme admission how le sakte is" (broken)

This indicates the translation enrichment model struggles with Romanized Hindi.

---

## 4. Query Categories & Patterns

### 4.1 Category Distribution

| Category | Count | % | Bot Success Rate |
|---|---|---|---|
| General | 2,883 | 34.9% | 89.3% |
| Exams | 1,106 | 13.4% | 84.9% |
| Appointment | 784 | 9.5% | 98.5% |
| Admissions | 758 | 9.2% | 91.6% |
| Courses | 610 | 7.4% | 92.5% |
| OPD | 579 | 7.0% | 98.8% |
| Departments | 527 | 6.4% | 94.5% |
| Career | 314 | 3.8% | 89.8% |
| Contact | 269 | 3.3% | 95.2% |
| Fees | 173 | 2.1% | 88.4% |
| Faculty | 171 | 2.1% | 94.2% |
| Campus | 38 | 0.5% | 78.9% |
| Emergency | 32 | 0.4% | 90.6% |
| Research | 7 | 0.1% | 71.4% |

### 4.2 Most Repeated Questions (Exact Duplicates)

| Question | Count | Category |
|---|---|---|
| "appointment" | 49 | Appointment |
| "opd" | 31 | OPD |
| "online appointment" | 22 | Appointment |
| "admit card" | 21 | Exams |
| "how to book appointment" | 19 | Appointment |
| "nursing officer exam date" | 16 | Exams |
| "bsc nursing" | 16 | Courses |
| "result" | 13 | Exams |
| "job" | 11 | Career |
| "who made you" | 11 | General |

**Pattern:** Single-word or very short queries dominate. Users treat the chatbot like a search engine, entering keywords rather than full questions.

### 4.3 Top Keywords in Questions

The top non-stop-words reveal core user concerns:
1. **exam** (914) - Examination scheduling is the #1 concern
2. **kgmu** (884) - University name used as context
3. **hai** (817) - Hindi copula, confirming heavy Hindi usage
4. **appointment** (739) - Appointment booking is #2 concern
5. **nursing** (658) - Nursing programs dominate interest
6. **opd** (582) - Outpatient department queries
7. **admission** (555) - Admissions process

### 4.4 Top Bigrams

| Bigram | Count | Indicates |
|---|---|---|
| "i want" | 435 | Intent-driven queries |
| "want to" | 337 | Action-seeking users |
| "how to" | 296 | Procedural questions |
| "nursing officer" | 281 | Specific role inquiry |
| "non teaching" | 245 | Staff recruitment |
| "exam date" | 244 | Temporal exam queries |
| "admit card" | 193 | Exam logistics |
| "bsc nursing" | 174 | Course inquiry |

---

## 5. Chatbot Performance Analysis

### 5.1 Response Quality Distribution

| Quality | Count | % |
|---|---|---|
| Adequate | 3,015 | 36.5% |
| Partial | 2,201 | 26.7% |
| Deflected | 1,780 | 21.6% |
| Comprehensive | 1,255 | 15.2% |

**51.7% of answers are adequate or comprehensive.** But 21.6% are deflected (bot couldn't answer meaningfully) and 26.7% are only partial.

### 5.2 Response Types

| Type | Count | % |
|---|---|---|
| Direct Answer | 4,642 | 56.3% |
| Unable to Answer | 2,192 | 26.6% |
| Referral | 1,239 | 15.0% |
| Safety Redirect | 178 | 2.2% |

### 5.3 Dramatic Improvement Over Time

| Month | Unanswered Rate |
|---|---|
| Apr 2025 | 30.0% |
| Jun 2025 | 17.9% |
| Jul 2025 | 16.3% |
| Aug 2025 | 17.7% |
| Nov 2025 | 6.2% |
| Dec 2025 | 2.2% |
| Jan 2026 | 1.7% |
| Feb 2026 | 2.8% |
| Mar 2026 | 2.5% |

**The unanswered rate improved by 91.7%** (from 30% to 2.5%) over the dataset period. The biggest jump happened between Aug-Nov 2025, suggesting a major knowledge base update during the Sep-Oct gap.

### 5.4 Answer Quality Also Improved

| Month | Comprehensive | Adequate | Partial | Deflected |
|---|---|---|---|---|
| Jun 2025 | 7.9% | 28.4% | 30.5% | 33.3% |
| Jul 2025 | 6.8% | 32.8% | 28.6% | 31.8% |
| Dec 2025 | 13.0% | 43.0% | 31.4% | 12.6% |
| Feb 2026 | 16.1% | 49.6% | 18.3% | 16.0% |
| Mar 2026 | 39.6% | 30.1% | 15.9% | 14.4% |

Comprehensive answers jumped from ~7% to **39.6%** by March 2026. Deflection dropped from 33% to ~14%.

### 5.5 What Makes a Good vs Bad Answer?

| Characteristic | Comprehensive | Deflected |
|---|---|---|
| Avg question length | 7.4 words | 5.8 words |
| Avg answer length | 146.9 words | 29.5 words |
| Contains links | 65.1% | 11.6% |
| Contains lists | 80.0% | 6.3% |

**Pattern:** Comprehensive answers are 5x longer, include links 5.6x more often, and include formatted lists 12.7x more often. Shorter, vaguer questions lead to deflected answers.

---

## 6. Problem Areas & Failure Modes

### 6.1 Exam Queries: The Biggest Pain Point

Exams category (1,106 queries) has the worst performance:
- **51.1% unable to answer** (565 queries)
- **33.0% deflected** answer quality
- Only 8.9% comprehensive

Most exam questions ask about **future dates** (nursing officer exam, pharmacist result, non-teaching exam dates) that the chatbot simply doesn't know. These are temporal queries requiring real-time information the knowledge base lacks.

### 6.2 The "Link Not Working" Crisis

**60 frustrated users** (92 complaints total) are dominated by a single issue: **broken external links**. The chatbot refers users to ors.gov.in for appointment booking, but users repeatedly report the link doesn't work. This is the #1 source of user frustration.

Sample complaints:
- "Online appointment link for patient is not working"
- "Above url not working" (×15+ variations)
- "Where to book opd if ors.gov is not working"
- "both sites are not working"

### 6.3 Unanswered Questions Analysis (722 queries)

Top unanswered categories:
- General (309) - too vague for the bot
- Exams (167) - future date questions
- Admissions (64) - specific process questions
- Courses (46) - niche program queries

Many unanswered queries are in **Romanized Hindi**: "kgmu k admit card job vaccany wale kab ayenge", "Kgmu nursing recuitment paper kab tak hoga"

### 6.4 Safety Redirects (178 queries)

The chatbot correctly redirects medical symptom queries to professional care:
- "pairo ki ghukhroo ke liye best department" (for ankle bones)
- "Gale me laar ghutne me diikt ho rhi h" (throat difficulty)
- "MRI krya tha maine pr bs film hi mili h" (MRI result concern)

This is appropriate behavior for a university information chatbot.

### 6.5 Queries Requiring Follow-up

**30.8% (2,545)** of queries are flagged as requiring follow-up - meaning the initial response was insufficient for the user's needs. This suggests the chatbot frequently gives partial information that would need human intervention.

---

## 7. Department & Medical Analysis

### 7.1 Most Mentioned Departments

| Department | Mentions |
|---|---|
| Nursing | 695 |
| Pharmacology | 198 |
| Cardiology | 125 |
| Radiology | 113 |
| Surgery | 83 |
| Neurology | 52 |
| Dermatology | 47 |
| ENT | 42 |
| Orthopedics | 39 |

**Nursing dominates** with 3.5x more mentions than any clinical department. This reflects that nursing recruitment/exams are the primary driver of chatbot usage, not clinical care inquiries.

### 7.2 Medical Relevance

| Relevance | Count | % |
|---|---|---|
| High | 2,972 | 36.0% |
| Medium | 2,786 | 33.8% |
| Low | 2,292 | 27.8% |
| None | 201 | 2.4% |

Only 36% of queries have high medical relevance. The chatbot is more of an **administrative assistant** than a medical information resource.

### 7.3 Medical Relevance by User Type

| User Type | High | Medium | Low | None |
|---|---|---|---|---|
| Patient | 50.9% | 45.3% | 3.3% | 0.4% |
| Staff | 58.7% | 13.9% | 26.3% | 1.1% |
| Student | 19.4% | 53.5% | 26.8% | 0.3% |
| Faculty | 34.7% | 10.2% | 55.1% | 0.0% |

Patients ask the most medically relevant questions. Faculty queries are 55% low-relevance (likely administrative).

---

## 8. Session & Engagement Patterns

### 8.1 Session Statistics

- **97.9% single-turn sessions** (7,801 of 7,965)
- Only 164 multi-turn sessions (2+ queries)
- Only 11 sessions with 5+ queries
- Longest session: 15 queries
- Follow-up questions: only 286 (3.5%)

**Critical Finding:** The chatbot is overwhelmingly used as a one-shot Q&A tool, not a conversational interface. Users ask one question and leave. This suggests either (a) users get what they need in one query, or (b) users give up after one unsatisfactory answer.

### 8.2 Question Length Statistics

- **Mean question:** 6.7 words / 37.5 characters
- **Median question:** 6 words / 31 characters
- **75th percentile:** 8 words / 45 characters
- **Longest question:** 2,226 characters (a formal complaint letter)

Users write extremely short queries. Half of all questions are 6 words or fewer.

---

## 9. Emergent Patterns & Novel Conclusions

### Conclusion 1: The Chatbot Serves Two Completely Different Populations
Students/staff use it for exam dates and career info. Patients use it for appointments and OPD navigation. These two groups have fundamentally different needs, languages, and satisfaction levels. A **split chatbot experience** (academic vs. patient portal) could improve service quality.

### Conclusion 2: Romanized Hindi is the True Lingua Franca
Despite 96.7% of queries being heuristically classified as English, AI analysis reveals 42.2% contain Hindi. Romanized Hindi ("exam kab hoga", "appointment kaise le") is the natural way users communicate. The chatbot's NLP pipeline must handle romanized Hindi as a first-class language, not an edge case.

### Conclusion 3: The Chatbot is an Administrative Tool, Not a Medical One
Only 36% of queries have high medical relevance. The top concerns are exams, appointments, and admissions - not medical conditions. This has implications for how the chatbot should be designed, trained, and marketed.

### Conclusion 4: Exam Scheduling is an Unsolved Problem
The single largest gap is exam date/result queries (13.4% of all traffic) with the worst performance metrics. The chatbot needs **real-time integration with exam scheduling systems** or at minimum a regularly updated exam calendar.

### Conclusion 5: Broken External Links Cause Most User Frustration
The ors.gov.in appointment booking system being frequently down or unreachable is the #1 source of complaints. The chatbot should either (a) check link validity before sharing, (b) provide alternative booking methods, or (c) integrate appointment booking natively.

### Conclusion 6: The Sep-Oct 2025 Gap Marks a Transformation
Between Aug and Nov 2025, the chatbot went from 17.7% unanswered to 6.2%, and comprehensive answers jumped from 8.5% to 10.4%. Something significant changed - likely a major knowledge base overhaul or system upgrade. This created the inflection point that made the chatbot actually useful.

### Conclusion 7: Single-Word Queries are the Norm
Users treat the chatbot like a search engine. "appointment", "opd", "result", "bsc nursing" are typed as bare keywords. The system needs robust **query expansion and intent inference** to handle these minimal inputs.

### Conclusion 8: Formal Complaints Are Being Submitted Through the Chatbot
The longest queries (700-2,200 chars) are formal complaint letters addressed to "Sir/Madam" about hospital mismanagement, hygiene issues, and administrative grievances. Users are using the chatbot as a **complaint submission channel** even though it's not designed for that. This suggests a need for a dedicated complaint/grievance routing system.

### Conclusion 9: Night-Time Users Have Different Needs
176 queries at midnight and 101 at 1 AM suggest a non-trivial night-time user base. These users likely include emergency inquiries, international users, or anxious patients/students seeking information after hours.

### Conclusion 10: The Nursing Recruitment Pipeline Drives Traffic
Nursing-related queries (officer exams, BSc nursing admissions, nursing vacancy) represent the single largest thematic cluster. The chatbot is inadvertently serving as KGMU's **primary recruitment information channel** for nursing positions.

### Conclusion 11: AI Translation Enrichment Needs Improvement
The AI-generated English translations for Romanized Hindi are largely non-functional word substitutions. A better transliteration + translation pipeline (possibly using models fine-tuned on Romanized Hindi) would significantly improve the dataset's research value.

### Conclusion 12: Answer Quality Correlates with Structural Formatting
Comprehensive answers are 5x longer, have 5.6x more links, and 12.7x more formatted lists than deflected answers. This suggests that **structured, link-rich responses** are the hallmark of quality in this chatbot, and training/prompting should emphasize formatted, detailed responses.

---

## 10. Recommendations for Chatbot Improvement

1. **Add real-time exam calendar integration** - Reduces the #1 failure category
2. **Implement link health checking** - Prevent broken link frustration
3. **Build a complaint routing system** - Redirect formal complaints to administration
4. **Optimize for Romanized Hindi** - Train NLP on Hindi in Latin script
5. **Add appointment booking directly** - Don't just link to ors.gov.in
6. **Create FAQ shortcuts** - Auto-expand single-word queries like "appointment" and "opd"
7. **Split academic/patient UX** - Tailor responses based on detected user type
8. **Add a night-mode response set** - Include emergency numbers prominently during off-hours

---

*Analysis generated from 8,251 QA pairs in the MEDIQ dataset (v0.3.0)*
*Dataset DOI: 10.5281/zenodo.19204472*
*License: CC-BY 4.0*
