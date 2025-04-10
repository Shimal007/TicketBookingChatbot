import React, { useState } from 'react';
import { Clock, MapPin, Phone, Calendar, Camera, History, Palette, Book, Ticket, Users, Building, Star, Map } from 'lucide-react';
import Chatbot from '../../components/Chatbot';
import ChatbotIcon from '../../components/ChatbotIcon';
import './Home.css';

function Home() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const toggleChatbot = () => {
    setIsChatbotOpen(!isChatbotOpen);
  };

  return (
    <div className="main">
      <div className="hero">
        <div className="hero-overlay">
          <div className="container">
            <div className="hero-content">
              <div className="hero-text">
                <h1 className="hero-title">Government Museum Chennai</h1>
                <p className="hero-subtitle">Established in 1851 - The Second Oldest Museum in India</p>
                <button className="btn btn-primary" onClick={toggleChatbot}>
                  Plan Your Visit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="quick-info">
        <div className="quick-info-grid">
          <div className="info-item">
            <Clock className="info-icon" size={24} />
            <div>
              <h3 className="info-title">Opening Hours</h3>
              <p className="info-text">9:30 AM - 5:00 PM</p>
            </div>
          </div>
          <div className="info-item">
            <Ticket className="info-icon" size={24} />
            <div>
              <h3 className="info-title">Entry Fee</h3>
              <p className="info-text">₹15 (Adults) / ₹10 (Children)</p>
            </div>
          </div>
          <div className="info-item">
            <MapPin className="info-icon" size={24} />
            <div>
              <h3 className="info-title">Location</h3>
              <p className="info-text">Pantheon Road, Egmore</p>
            </div>
          </div>
          <div className="info-item">
            <Phone className="info-icon" size={24} />
            <div>
              <h3 className="info-title">Contact</h3>
              <p className="info-text">044-28193238</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chatbot Component */}
      <Chatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />

      {/* Chatbot Icon to toggle the chatbot */}
      <ChatbotIcon onClick={toggleChatbot} isOpen={isChatbotOpen} />

      <section className="section">
        <div className="container">
          <div className="about-content">
            <h2 className="section-title">About the Museum</h2>
            <p>
              The Government Museum, Chennai, is a museum of human history and culture located in the Government Museum Complex in the Egmore neighborhood of Chennai, India. Started in 1851, it is the second oldest museum in India after the Indian Museum in Kolkata. It is particularly rich in archaeological and numismatic collections.
            </p>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-icon-wrapper">
                  <Building className="stat-icon" size={32} />
                </div>
                <h3>6 Buildings</h3>
                <p>Housing different galleries</p>
              </div>
              <div className="stat-item">
                <div className="stat-icon-wrapper">
                  <Users className="stat-icon" size={32} />
                </div>
                <h3>1000+ Visitors</h3>
                <p>Daily footfall</p>
              </div>
              <div className="stat-item">
                <div className="stat-icon-wrapper">
                  <Star className="stat-icon" size={32} />
                </div>
                <h3>46,000+ Artifacts</h3>
                <p>In our collection</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ backgroundColor: 'var(--color-stone-100)' }}>
        <div className="container">
          <h2 className="section-title">Our Galleries</h2>
          <div className="galleries-grid">
            <GalleryCard
              image="https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?auto=format&fit=crop&q=80&w=2940"
              title="National Art Gallery"
              description="Houses paintings from the Tanjore, Rajput and Mughal schools"
            />
            <GalleryCard
              image="https://images.squarespace-cdn.com/content/v1/554066dde4b0b8a55e4b44ed/1573903809973-VDVAPRZP8LRT5VF8KSD7/DSC06534.jpg"
              title="Bronze Gallery"
              description="Features exquisite Chola bronze sculptures from 9th-13th centuries"
            />
            <GalleryCard
              image="https://images.unsplash.com/photo-1580136579312-94651dfd596d?auto=format&fit=crop&q=80&w=2940"
              title="Archaeological Gallery"
              description="Displays artifacts from the prehistoric to the medieval period"
            />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Special Collections</h2>
          <div className="collections-grid">
            <CollectionCard
              icon={<History size={24} />}
              title="Numismatics"
              description="Ancient coins from various dynasties including Roman gold coins"
            />
            <CollectionCard
              icon={<Palette size={24} />}
              title="Decorative Art"
              description="Ivory carvings, textiles, and wooden artifacts"
            />
            <CollectionCard
              icon={<Camera size={24} />}
              title="Anthropology"
              description="Tribal artifacts and cultural exhibits from Tamil Nadu"
            />
            <CollectionCard
              icon={<Book size={24} />}
              title="Children's Gallery"
              description="Interactive exhibits focusing on science and natural history"
            />
          </div>
        </div>
      </section>

      <section className="section featured-section" style={{ width: '124%', marginLeft: '-12%' }}>
        <div className="container">
          <div className="featured-grid">
            <div className="featured-content">
              <h2>Featured Exhibition</h2>
              <h3 className="featured-subtitle">Contemporary Art Gallery</h3>
              <p>
                Explore our newest gallery featuring contemporary Indian artists. The exhibition showcases modern interpretations of traditional art forms, bringing together the past and present of Indian artistic expression.
              </p>
              <div className="featured-info">
                <div className="featured-info-item">
                  <Calendar className="info-icon" size={20} />
                  <span>Exhibition Dates: March 1 - June 30, 2024</span>
                </div>
                <div className="featured-info-item">
                  <Ticket className="info-icon" size={20} />
                  <span>Special Exhibition Entry: ₹50</span>
                </div>
              </div>
              <button className="btn btn-primary">Learn More</button>
            </div>
            <div className="featured-image-wrapper">
              <img
                src="https://dynamic-media-cdn.tripadvisor.com/media/photo-o/17/56/cd/3d/tanzara-art-gallery.jpg?w=900&h=500&s=1"
                alt="Contemporary Art Gallery"
                className="featured-image"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="divider-line">
          <div className="line">__________________________________________________</div>
        </div>
      </div>

      <section className="section map-section">
        <div className="container">
          <h2 className="section-title">Find Us</h2>
          <div className="map-content">
            <div className="map-wrapper">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d248863.94577545254!2d80.08333192431085!3d12.939879761037457!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a52660ef39b8afb%3A0x9507fa7b131c1c36!2sGovernment%20Museum%20Chennai!5e0!3m2!1sen!2sin!4v1742731291832!5m2!1sen!2sin" 
                width="100%" 
                height="450" 
                style={{ border: 0, borderRadius: '10px' }} 
                allowFullScreen="" 
                loading="lazy"
                title="Government Museum Chennai Location"
              ></iframe>
            </div>
            <div className="map-info">
              <div className="map-info-card">
                <div className="map-info-header">
                  <MapPin className="map-info-icon" size={24} />
                  <h3>How to Reach Us</h3>
                </div>
                <div className="map-info-content">
                  <p><strong>Address:</strong> Government Museum Complex, Pantheon Road, Egmore, Chennai, Tamil Nadu 600008</p>
                  <p><strong>By Metro:</strong> Egmore Metro Station (0.5 km)</p>
                  <p><strong>By Train:</strong> Chennai Egmore Railway Station (0.7 km)</p>
                  <p><strong>By Bus:</strong> Egmore Bus Stop (0.3 km)</p>
                  <p><strong>Nearby Landmarks:</strong> Connemara Public Library, National Art Gallery</p>
                  <button className="btn btn-primary">Get Directions</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer" style={{ width: '127.5%', marginLeft: '-15%', marginBottom: '-10%' }}>
        <div className="container">
          <div className="footer-grid">
            <div>
              <h3 className="footer-title">Visit Us</h3>
              <p className="footer-text">
                Government Museum Chennai<br />
                Pantheon Road, Egmore<br />
                Chennai - 600008
              </p>
            </div>
            <div>
              <h3 className="footer-title">Opening Hours</h3>
              <p className="footer-text">
                Monday to Sunday<br />
                9:30 AM - 5:00 PM<br />
                Closed on Public Holidays
              </p>
            </div>
            <div>
              <h3 className="footer-title">Entry Fees</h3>
              <p className="footer-text">
                Adults: ₹15<br />
                Children (under 15): ₹10<br />
                School Groups: ₹5 per student
              </p>
            </div>
            <div>
              <h3 className="footer-title">Contact</h3>
              <p className="footer-text">
                Phone: 044-28193238<br />
                Email: info@chennaimuseum.org<br />
                Fax: 044-28193239
              </p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2024 Government Museum Chennai. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function CollectionCard({ icon, title, description }) {
  return (
    <div className="collection-card">
      <div className="collection-icon-wrapper">
        <div className="collection-icon">{icon}</div>
      </div>
      <h3 className="collection-title">{title}</h3>
      <p className="gallery-description">{description}</p>
    </div>
  );
}

function GalleryCard({ image, title, description }) {
  return (
    <div className="gallery-card">
      <img src={image} alt={title} className="gallery-image" />
      <div className="gallery-content">
        <h3 className="gallery-title">{title}</h3>
        <p className="gallery-description">{description}</p>
      </div>
    </div>
  );
}

export default Home;