import React, { useState, useEffect, useRef } from 'react';

// Data voor de verschillende pagina's.
// Objecten zijn hoger geplaatst om overlap te voorkomen.
const pageData = [
  {
    id: 'hond',
    title: 'Een hond die huilt',
    imageUrl: 'https://i.imgur.com/Pk012sw.png',
    position: { top: '10%', left: '15%' },
    size: { width: '45vw', minWidth: '300px', maxWidth: '500px' },
    animationDelay: '0s',
    content: 'Dit is de pagina over de huilende hond. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat.'
  },
  {
    id: 'picnick',
    title: 'Picnick',
    imageUrl: 'https://i.imgur.com/TvJrbPP.png',
    position: { top: '30%', left: '55%' }, // Hoger geplaatst
    size: { width: '55vw', minWidth: '400px', maxWidth: '700px' },
    animationDelay: '0.5s',
    content: 'Welkom op de picknick pagina. Duis semper. Duis arcu massa, scelerisque vitae, consequat in, pretium a, enim. Pellentesque congue. Ut in risus volutpat libero pharetra tempor. Cras vestibulum bibendum augue. Praesent egestas leo in pede. Praesent blandit odio eu enim. Pellentesque sed dui ut augue blandit sodales. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aliquam nibh.'
  },
  {
    id: 'nieuw-werk',
    title: 'Nieuw werk',
    imageUrl: 'https://i.imgur.com/gn4lcHr.png',
    position: { top: '55%', left: '20%' }, // Hoger geplaatst
    size: { width: '50vw', minWidth: '350px', maxWidth: '600px' },
    animationDelay: '1s',
    content: 'Hier vind je mijn nieuwe werk. Fusce aliquet pede non pede. Suspendisse dapibus lorem pellentesque magna. Integer nulla. Donec blandit feugiat ligula. Donec hendrerit, felis et imperdiet euismod, purus ipsum pretium metus, in lacinia nulla nisl eget sapien. Donec ut est in lectus consequat consequat. Etiam eget dui. Aliquam erat volutpat. Sed at lorem in nunc porta tristique.'
  }
];

// De hoofdcomponent van de applicatie
export default function App() {
  const [activePageId, setActivePageId] = useState(null);
  const [isContentVisible, setIsContentVisible] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const bottomContentRef = useRef(null);

  const activePageData = pageData.find(p => p.id === activePageId);

  // Effect voor de content van de actieve pagina
  useEffect(() => {
    if (activePageId) {
      const timer = setTimeout(() => setIsContentVisible(true), 700);
      document.body.style.overflow = 'hidden';
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = 'auto';
      }
    } else {
      setIsContentVisible(false);
    }
  }, [activePageId]);

  // Effect voor de Intersection Observer.
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowAbout(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.25
      }
    );

    const currentRef = bottomContentRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);
  
  // Vereenvoudigde functie: zet alleen de actieve pagina
  const handleSelectPage = (id) => {
    if (!activePageId) {
      setActivePageId(id);
    }
  };

  const handleGoBack = (e) => {
    e.stopPropagation();
    setActivePageId(null);
  };

  return (
    <>
      <style>{`
        /* ... bestaande stijlen ... */
        html {
          scroll-behavior: smooth;
        }
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
            sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          background-color: #7ab1e8;
        }
        .sky-background {
          background-image: url('https://i.imgur.com/q9FpLJK.jpeg');
          background-size: cover;
          background-position: top center; 
        }
        @keyframes fall {
          0% { transform: translateY(-15px); }
          50% { transform: translateY(15px); }
          100% { transform: translateY(-15px); }
        }
        .animate-fall {
          animation: fall 3s ease-in-out infinite;
        }

        @keyframes speed-line-anim {
            0% { transform: translateY(100%); opacity: 1; }
            100% { transform: translateY(-150%); opacity: 0; }
        }
        .speed-line {
            position: absolute;
            width: 3px;
            height: 80%;
            background: linear-gradient(to top, rgba(255, 255, 255, 0), white 70%);
            border-radius: 5px;
            transform-origin: bottom;
            animation: speed-line-anim linear infinite;
        }
      `}</style>

      {/* Hoofdcontainer */}
      <main className="sky-background min-h-screen relative w-screen overflow-x-hidden" style={{ height: '250vh' }}>
        
        {/* Titel */}
        <h1 
          className={`sticky top-8 text-center text-4xl md:text-6xl font-bold text-yellow-300/90 tracking-wider transition-all duration-700 ease-in-out ${activePageId ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`}
          style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
        >
          Stijn van Gorkum
        </h1>

        {/* De zwevende objecten/knoppen */}
        {pageData.map((page) => {
          const isActive = activePageId === page.id;
          
          // De stijl wordt nu direct aangepast, de CSS transitie doet de rest
          const style = isActive
            ? { // Actieve (eind)staat: fixed en schermvullend
                position: 'fixed',
                width: '100vw',
                height: '100vh',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 50,
              }
            : { // Inactieve (begin)staat: absolute positionering
                position: 'absolute',
                top: page.position.top,
                left: page.position.left,
                width: page.size.width,
                minWidth: page.size.minWidth,
                maxWidth: page.size.maxWidth,
                animationDelay: page.animationDelay
              };

          return (
            <div
              key={page.id}
              className={`group cursor-pointer transition-all duration-1000 ease-in-out 
                ${!isActive ? 'animate-fall' : ''}
                ${activePageId && !isActive ? 'opacity-0 scale-0' : 'opacity-100'}`}
              style={style}
              onClick={() => handleSelectPage(page.id)}
            >
              {/* Container voor de snelheidslijnen */}
              <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3/4 w-2/3 h-20 pointer-events-none transition-opacity duration-300 ${activePageId ? 'opacity-0' : 'opacity-100'}`}>
                <div className="speed-line" style={{ left: '20%', animationDelay: '0s', animationDuration: '0.7s' }}></div>
                <div className="speed-line" style={{ left: '50%', animationDelay: '0.3s', animationDuration: '0.6s' }}></div>
                <div className="speed-line" style={{ left: '80%', animationDelay: '0.1s', animationDuration: '0.8s' }}></div>
              </div>
              
              <img
                src={page.imageUrl}
                alt={page.title}
                className="w-full h-full object-contain drop-shadow-2xl"
              />

              {/* Titel die verschijnt bij hover */}
              <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none ${!activePageId ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'}`}>
                  <p className="text-white text-3xl font-bold" style={{ textShadow: '2px 2px 6px rgba(0,0,0,0.8)' }}>
                      {page.title}
                  </p>
              </div>
              
            </div>
          );
        })}
        
        {/* De content die verschijnt als een pagina actief is */}
        {activePageData && (
          <div 
             className={`fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8 md:p-16 transition-opacity duration-700 ease-in-out ${isContentVisible ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className="bg-black/60 backdrop-blur-md p-6 sm:p-10 rounded-2xl max-w-6xl w-full text-white/90 max-h-[90vh] overflow-y-auto shadow-2xl">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-yellow-200">{activePageData.title}</h2>
              <p className="text-base sm:text-lg leading-relaxed">{activePageData.content}</p>
              <button
                onClick={handleGoBack}
                className="mt-6 bg-yellow-300/80 hover:bg-yellow-300 text-black font-bold py-2 px-6 rounded-lg transition-colors duration-300"
              >
                Terug
              </button>
            </div>
          </div>
        )}

        {/* Container voor de content onderaan de pagina */}
        <div ref={bottomContentRef} className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-6xl px-4 flex flex-col items-center gap-6">
            <div className={`bg-black/60 backdrop-blur-md p-6 sm:p-10 rounded-2xl text-white/90 shadow-2xl w-full transition-all duration-1000 ease-in-out ${showAbout ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-yellow-200 text-center">Over Stijn van Gorkum</h2>
                <p className="text-base sm:text-lg leading-relaxed text-center">
                    Hier kun je een stukje over jezelf schrijven. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi.
                </p>
            </div>
            <div className={`bg-black/50 backdrop-blur-md p-6 rounded-2xl text-white/80 shadow-2xl w-full max-w-md transition-all duration-1000 ease-in-out delay-200 ${showAbout ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <h3 className="text-2xl font-bold mb-3 text-yellow-200/90 text-center">Contact</h3>
                <p className="text-center">
                    Email: <a href="mailto:voorbeeld@email.com" className="underline hover:text-yellow-200">voorbeeld@email.com</a>
                </p>
            </div>
        </div>
      </main>
    </>
  );
}
