# Employee Skill Assessment and Skill Gap Analysis Platform

An integrated web-based platform for assessing employee skills, evaluating responses using AI-assisted rubrics, tracking skill progression, and identifying skill gaps based on role-specific competency requirements.

---

## 📌 Project Overview

The **Employee Skill Assessment and Skill Gap Analysis Platform** is a capstone project designed to provide a structured approach to employee skill evaluation and development.

Unlike conventional static assessments, the platform uses an **adaptive assessment mechanism** that adjusts the employee's skill level based on assessment performance. Subjective responses can be evaluated using **AI-based rubric evaluation**, while assessment results are further analyzed at competency and concept levels.

The platform also compares an employee's achieved skill level with the expected skill level associated with their business role to identify:

- Key Strengths
- Development Areas
- Priority Skill Gaps
- Competency-Level Performance
- Skill Progression

An administrator module provides authorized users with access to employee assessment activity and performance information.

---

## 🎯 Objectives

The project is developed around five primary objectives:

1. **Design** the architecture and system structure for employee skill assessment and skill gap analysis.
2. **Build** the platform using React, FastAPI, a relational database, adaptive assessment, and AI-based rubric evaluation.
3. **Test** the implemented system across functional, security, assessment, and analytical components.
4. **Validate** the complete assessment workflow, skill progression, AI evaluation, and skill gap results.
5. **Deploy and demonstrate** the completed platform as a functional academic capstone application.

---

## ✨ Key Features

### 👤 Employee Features

- Employee registration and login
- JWT-based authentication
- Employee dashboard
- Skill-based assessment selection
- Adaptive skill assessment
- Multiple question types
- Subjective response evaluation
- AI-assisted rubric evaluation
- Assessment completion and results
- Review of submitted answers
- Assessment history
- Skill progression tracking
- Skill gap overview
- Detailed competency and concept analysis

### 👨‍💼 Administrator Features

- Secure administrator authentication
- Role-based access control
- Administrator dashboard
- Employee search and filtering
- Employee assessment history
- Employee performance information
- Skill performance analysis
- Competency performance analysis
- Role-based skill gap information

---

## 🧠 Adaptive Assessment

The platform uses a deterministic adaptive assessment mechanism based on the employee's assessment performance.

| Performance | Decision |
|---|---|
| **80% or above** | Promote to next level |
| **60% – 79.99%** | Remain at current level |
| **Below 60%** | Demote to previous level |

The assessment level is constrained between:

**Level 1 → Level 2 → Level 3 → Level 4 → Level 5**

At Level 5, achieving the promotion threshold results in **Mastery** rather than progression beyond the defined maximum level.

At Level 1, performance below the demotion threshold keeps the employee at Level 1.

---

## 🤖 AI-Based Rubric Evaluation

The platform integrates an external AI service to evaluate subjective employee responses against predefined rubric criteria.

The evaluation process considers:

- Question context
- Employee response
- Predefined rubric criteria
- Competency/concept information

The resulting evaluation information is stored and used for competency-level analysis and skill gap generation.

> **Note:** AI evaluation in this project is validated through rubric alignment and functional integration. No numerical AI accuracy claim is made because the project does not use a large independently labelled benchmark dataset.

---

## 📊 Skills Covered

The current platform includes assessments for:

- **Excel**
- **Power BI**
- **SQL**

Each skill contains questions distributed across multiple competency levels.

The assessment content includes question types such as:

- Multiple Choice Questions
- Short Answer
- Scenario-Based Questions
- Case Study Questions

---

## 🏗️ System Architecture

The platform follows a layered web application architecture.

```text
                    ┌──────────────────────┐
                    │      React UI        │
                    │ Employee / Admin     │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   FastAPI Backend    │
                    │ APIs & Business Logic│
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       ┌────────────┐   ┌─────────────┐   ┌──────────────┐
       │   Auth &   │   │ Assessment  │   │ Skill Gap &  │
       │    RBAC    │   │   Engine    │   │  Analytics   │
       └────────────┘   └──────┬──────┘   └───────┬──────┘
                               │                  │
                               ▼                  │
                       ┌──────────────┐           │
                       │ AI Evaluation│           │
                       │  OpenRouter  │           │
                       └──────┬───────┘           │
                              │                   │
                              ▼                   ▼
                    ┌──────────────────────────────┐
                    │      Relational Database     │
                    │ Users • Roles • Skills       │
                    │ Questions • Assessments      │
                    │ Responses • Evaluations      │
                    │ Skill Gap Information        │
                    └──────────────────────────────┘
