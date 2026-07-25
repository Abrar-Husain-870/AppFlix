'use client'

import { useState } from 'react'
import { Plus, X, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface FAQItem {
  id: number
  question: string
  answer: string
}

const FAQ_DATA: FAQItem[] = [
  {
    id: 1,
    question: 'What is AppFlix?',
    answer: `AppFlix is a platform where students can discover, showcase, and share apps, websites, AI projects, and software built within our university.

Whether you're looking for useful campus tools or want to showcase your own project, AppFlix helps connect student developers with the university community.`,
  },
  {
    id: 2,
    question: 'Who can publish projects?',
    answer: `Any student from our university can submit their software projects for review.

Projects are reviewed before publication to ensure they meet basic quality standards and are relevant to the university community.`,
  },
  {
    id: 3,
    question: 'Is AppFlix free to use?',
    answer: `Yes. AppFlix is completely free for students.

You can browse projects, submit your own work, save favorites, and support other student developers without any cost.`,
  },
  {
    id: 4,
    question: 'What kind of projects can I upload?',
    answer: `You can publish almost any software project you've built.

Examples include:
• Web applications
• Mobile apps
• AI & Machine Learning projects
• Desktop software
• Open-source tools
• Utility applications
• College project submissions
• Research prototypes`,
  },
  {
    id: 5,
    question: 'How are projects approved?',
    answer: `Every submission goes through a simple review process before becoming publicly visible.

This helps keep AppFlix organized and ensures projects are safe, relevant, and appropriate for the university community.`,
  },
  {
    id: 6,
    question: 'Why should I upload my project?',
    answer: `Publishing your work helps you build a stronger developer portfolio while allowing others to discover and use what you've created.

It's also a great way to receive feedback, gain recognition, and inspire fellow students.`,
  },
]

export default function NetflixFAQSection() {
  const [openId, setOpenId] = useState<number | null>(null)

  const toggleItem = (id: number) => {
    setOpenId(prev => (prev === id ? null : id))
  }

  return (
    <section style={{
      padding: '4rem 1.5rem 5rem',
      background: '#141414',
      position: 'relative',
      boxSizing: 'border-box',
    }}>
      <div style={{
        maxWidth: '1100px',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}>
        {/* Title */}
        <h2 style={{
          fontSize: 'clamp(1.6rem, 4vw, 2.3rem)',
          fontWeight: 900,
          color: '#FFFFFF',
          letterSpacing: '-0.02em',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
        }}>
          <div style={{ width: '4px', height: '30px', background: '#E50914', borderRadius: '2px' }} />
          Frequently Asked Questions
        </h2>

        {/* Accordion Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '3.5rem' }}>
          {FAQ_DATA.map(item => {
            const isOpen = openId === item.id
            return (
              <div key={item.id} style={{ borderRadius: '4px', overflow: 'hidden' }}>
                {/* Question Header Button */}
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  style={{
                    width: '100%',
                    padding: '1.25rem 1.75rem',
                    background: isOpen ? '#3A3A3A' : '#2D2D2D',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: 'clamp(1.05rem, 2.5vw, 1.35rem)',
                    fontWeight: 500,
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    transition: 'background 0.2s ease',
                    boxSizing: 'border-box',
                  }}
                  onMouseEnter={e => {
                    if (!isOpen) e.currentTarget.style.background = '#414141'
                  }}
                  onMouseLeave={e => {
                    if (!isOpen) e.currentTarget.style.background = '#2D2D2D'
                  }}
                >
                  <span>{item.question}</span>
                  <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    {isOpen ? <X size={32} /> : <Plus size={32} />}
                  </div>
                </button>

                {/* Answer Drawer */}
                {isOpen && (
                  <div style={{
                    background: '#2D2D2D',
                    padding: '1.5rem 1.75rem',
                    borderTop: '1px solid #141414',
                    color: '#FFFFFF',
                    fontSize: 'clamp(0.95rem, 2vw, 1.2rem)',
                    lineHeight: 1.65,
                    whiteSpace: 'pre-line',
                    boxSizing: 'border-box',
                  }}>
                    {item.answer}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Bottom CTA bar matching Netflix footer style */}
        <div style={{
          textAlign: 'center',
          maxWidth: '720px',
          margin: '0 auto',
        }}>
          <p style={{
            fontSize: '1.1rem',
            color: '#FFFFFF',
            marginBottom: '1.25rem',
            fontWeight: 400,
          }}>
            Ready to explore? Submit your project or discover student innovations.
          </p>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}>
            <Link
              href="/submit"
              id="faq-submit-btn"
              style={{
                padding: '0.9rem 2.2rem',
                background: '#E50914',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '1.25rem',
                borderRadius: '4px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 16px rgba(229, 9, 20, 0.4)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#F40612'}
              onMouseLeave={e => e.currentTarget.style.background = '#E50914'}
            >
              Get Started <ArrowRight size={22} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
