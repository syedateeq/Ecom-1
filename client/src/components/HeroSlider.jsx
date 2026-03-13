import { useState, useEffect } from 'react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { Link } from 'react-router-dom';

const slides = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop',
    title: 'Boost Your Local Sales',
    description: 'Reach thousands of nearby customers looking for products right now.',
    buttonText: 'Add New Product',
    buttonLink: '/retailer/add-product',
    primaryColor: 'from-blue-900/80 to-blue-600/60',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?q=80&w=2070&auto=format&fit=crop',
    title: 'Manage Inventory Easily',
    description: 'Update stock, prices, and discounts in real-time with our smart dashboard.',
    buttonText: 'View Dashboard',
    buttonLink: '/retailer/dashboard',
    primaryColor: 'from-emerald-900/80 to-emerald-600/60',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1950&auto=format&fit=crop',
    title: 'Premium Retailer Benefits',
    description: 'Get exclusive insights on local trends and stay ahead of the competition.',
    buttonText: 'Update Profile',
    buttonLink: '/retailer/dashboard',
    primaryColor: 'from-purple-900/80 to-fuchsia-600/60',
  },
];

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-scroll logic
  useEffect(() => {
    let interval;
    if (!isHovered) {
      interval = setInterval(() => {
        setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
      }, 5000); // 5 seconds per slide
    }
    return () => clearInterval(interval);
  }, [isHovered]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div 
      className="relative w-full h-[300px] md:h-[400px] overflow-hidden rounded-2xl shadow-2xl mb-8 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Slides Container */}
      <div 
        className="flex transition-transform duration-700 ease-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide) => (
          <div key={slide.id} className="min-w-full h-full relative flex-shrink-0">
            {/* Background Image */}
            <img 
              src={slide.image} 
              alt={slide.title} 
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Gradient Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-r ${slide.primaryColor} mix-blend-multiply`}></div>
            <div className="absolute inset-0 bg-black/30"></div>
            
            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-center items-start p-8 md:p-16 text-white max-w-3xl">
              <div className="inline-block mb-3 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider animate-fade-in-up">
                Retailer Exclusive
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight drop-shadow-lg transform transition-all duration-700 translate-y-0 opacity-100">
                {slide.title}
              </h2>
              <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-xl drop-shadow-md">
                {slide.description}
              </p>
              <Link 
                to={slide.buttonLink} 
                className="bg-white text-gray-900 font-bold py-3 px-8 rounded-full shadow-lg hover:bg-gray-100 hover:scale-105 transition-all duration-300"
              >
                {slide.buttonText}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 opacity-0 group-hover:opacity-100 hover:bg-white/30 transition-all duration-300 shadow-xl"
        aria-label="Previous slide"
      >
        <HiChevronLeft className="text-3xl" />
      </button>
      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 opacity-0 group-hover:opacity-100 hover:bg-white/30 transition-all duration-300 shadow-xl"
        aria-label="Next slide"
      >
        <HiChevronRight className="text-3xl" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-400 ease-in-out rounded-full shadow-md ${
              currentSlide === index 
                ? 'w-8 h-2.5 bg-white' 
                : 'w-2.5 h-2.5 bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
