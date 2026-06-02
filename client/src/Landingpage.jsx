// client/src/LandingPage.jsx
import { useState, useEffect } from 'react';
import './Landingpage.css';

export default function LandingPage({ onEnterApp }) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    
    // Auto-rotate feature highlights
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: '⚡',
      title: 'Smart Timer',
      description: 'Intelligent workout timer with precise work/rest intervals. Automatic transitions keep you focused.',
      color: '#6366F1'
    },
    {
      icon: '📋',
      title: 'Custom Routines',
      description: 'Build unlimited routines with custom exercises. Set work and rest times for each movement.',
      color: '#10B981'
    },
    {
      icon: '📊',
      title: 'Progress Tracking',
      description: 'Visualize your journey with detailed analytics. Track weekly goals and workout history.',
      color: '#F59E0B'
    }
  ];

  const stats = [
    { value: '500+', label: 'Active Users' },
    { value: '10K+', label: 'Workouts Completed' },
    { value: '99%', label: 'Satisfaction Rate' },
    { value: '24/7', label: 'Access Anywhere' }
  ];

  return (
    <div className="landing-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
        </div>
        
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-pulse"></span>
            IFT 310 Group 10 Project
          </div>
          
          <h1 className="hero-title">
            Transform Your
            <span className="gradient-text"> Workout Journey</span>
          </h1>
          
          <p className="hero-description">
            The intelligent workout scheduler that helps you stay consistent, 
            track progress, and achieve your fitness goals. Built for athletes 
            who demand excellence.
          </p>
          
          <div className="hero-buttons">
            <button className="btn-primary" onClick={onEnterApp}>
              Launch Dashboard
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="btn-secondary" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              Learn More
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 4L10 16M10 16L6 12M10 16L14 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          
          <div className="hero-stats">
            {stats.map((stat, index) => (
              <div key={index} className="hero-stat">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="hero-preview">
          <div className="preview-card">
            <div className="preview-header">
              <div className="preview-dots">
                <span></span><span></span><span></span>
              </div>
              <span>Training Dashboard</span>
            </div>
            <div className="preview-content">
              <div className="preview-metric">
                <span>Routines</span>
                <strong>4</strong>
              </div>
              <div className="preview-timer">
                <span>00:45</span>
                <div className="preview-progress"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <span className="section-badge">Why Choose Us</span>
          <h2>Everything you need to succeed</h2>
          <p>Powerful features designed to transform your fitness routine</p>
        </div>
        
        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className={`feature-card ${activeFeature === index ? 'active' : ''}`}
              onMouseEnter={() => setActiveFeature(index)}
            >
              <div className="feature-icon" style={{ background: `linear-gradient(135deg, ${feature.color}, ${feature.color}80)` }}>
                {feature.icon}
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <div className="feature-link">
                <span>Learn more</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Showcase Section */}
      <section className="showcase-section">
        <div className="section-header">
          <span className="section-badge">Experience the Flow</span>
          <h2>Designed for focused workouts</h2>
          <p>Clean interface, powerful functionality, zero distractions</p>
        </div>
        
        <div className="showcase-grid">
          <div className="showcase-card">
            <div className="showcase-icon">🎯</div>
            <h4>Precision Timing</h4>
            <p>Work and rest intervals with visual progress bars</p>
          </div>
          <div className="showcase-card">
            <div className="showcase-icon">📱</div>
            <h4>Responsive Design</h4>
            <p>Perfect on desktop, tablet, or mobile</p>
          </div>
          <div className="showcase-card">
            <div className="showcase-icon">🌙</div>
            <h4>Dark/Light Mode</h4>
            <p>Workout comfortably any time of day</p>
          </div>
          <div className="showcase-card">
            <div className="showcase-icon">💾</div>
            <h4>Cloud Sync</h4>
            <p>Your progress, always saved</p>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="testimonial-section">
        <div className="testimonial-card">
          <div className="testimonial-quote">"</div>
          <p className="testimonial-text">
            This app completely transformed how I track my workouts. 
            The timer is so intuitive, and seeing my progress keeps me motivated.
          </p>
          <div className="testimonial-author">
            <div className="author-avatar">JD</div>
            <div>
              <div className="author-name">James Davis</div>
              <div className="author-title">Fitness Enthusiast</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to transform your fitness journey?</h2>
          <p>Join thousands of users who've made working out a consistent habit.</p>
          <button className="btn-primary btn-large" onClick={onEnterApp}>
            Get Started Now
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>🏋️ Workout Scheduler</h3>
            <p>Your ultimate fitness companion for tracking workouts and achieving goals.</p>
          </div>
          
          <div className="footer-links">
            <div className="footer-column">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#">Pricing</a>
              <a href="#">FAQ</a>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Blog</a>
              <a href="#">Contact</a>
            </div>
            <div className="footer-column">
              <h4>Legal</h4>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Security</a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© 2024 Group 10 - IFT 310 Project. All rights reserved.</p>
          <p className="footer-academic">Bowen University - Web Development</p>
        </div>
      </footer>
    </div>
  );
}