import React, { useState, useEffect } from 'react';
import { Client, Databases, Query } from "appwrite";

// --- Appwrite Configuration ---
const APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = '68d7b5ec002a1e7eb6a8';
const APPWRITE_DATABASE_ID = '68d7b6480023236e8e9a';
const ELEMENTS_COLLECTION_ID = 'elementen';
const AFBEELDINGEN_COLLECTION_ID = 'afbeeldingen';
const VIDEOS_COLLECTION_ID = 'videos';

// Initialize Appwrite Client
const client = new Client();
client
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

const databases = new Databases(client);

// --- Static Data (Desktop Defaults) ---
const cloudData = [
    { id: 'c1', src: 'https://i.imgur.com/3CVYDp0.png', top: '10%', left: '-20vw', right: 'auto', width: '60vw', zIndex: 15 },
    { id: 'c2', src: 'https://i.imgur.com/ivgLBmC.png', top: '30%', left: 'auto', right: '10vw', width: '80vw', zIndex: 16 },
    { id: 'c3', src: 'https://i.imgur.com/cksHjfb.png', top: '45%', left: '60vw', right: 'auto', width: '70vw', zIndex: 15 },
];

const basePositions = [
    { position: { top: '10%', left: '50%' }, rotation: -53, transform: 'translateX(-50%)' },
    { position: { top: '30%', left: '25%' }, rotation: -85, transform: 'translateX(-50%)' },
    { position: { top: '25%', left: '75%' }, rotation: 40, transform: 'translateX(-50%)' },
    { position: { top: '55%', left: '35%' }, rotation: -20, transform: 'translateX(-50%)' },
    { position: { top: '50%', left: '65%' }, rotation: 40, transform: 'translateX(-50%)' },
];

// Helper function to convert YouTube watch URLs to embeddable URLs
const convertToEmbedUrl = (url) => {
    if (!url) return '';
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname.includes('youtube.com')) {
            const videoId = urlObj.searchParams.get('v');
            return `https://www.youtube.com/embed/${videoId}`;
        }
        return url;
    } catch (error) {
        console.error("Invalid URL for video:", url);
        return '';
    }
};

// --- Content Parsing ---
const parseContent = (content) => {
  if (!content) return null;
  const contentRegex = /(\[Button:(.*?):(.*?)\])|(\[b\](.*?)\[b\])/g;
  let lastIndex = 0;
  const parts = [];

  content.replace(contentRegex, (match, btnMatch, buttonText, buttonLink, bMatch, boldText, offset) => {
    if (offset > lastIndex) {
      parts.push(<span key={`text-${lastIndex}`}>{content.substring(lastIndex, offset)}</span>);
    }
    
    if (btnMatch) {
      parts.push(
        <a
          key={`button-${offset}`}
          href={buttonLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()} 
          className="inline-block px-4 py-2 bg-yellow-300/80 text-black rounded-lg text-lg font-chango hover:bg-yellow-300 transition-colors duration-200 m-1"
        >
          {buttonText}
        </a>
      );
    } 
    else if (bMatch) {
      parts.push(
        <strong key={`bold-${offset}`} style={{ color: '#518cba' }}>
          {boldText}
        </strong>
      );
    }
    
    lastIndex = offset + match.length;
    return match;
  });

  if (lastIndex < content.length) {
    parts.push(<span key={`text-${lastIndex}`}>{content.substring(lastIndex)}</span>);
  }
  return parts;
};

// --- SEO & Meta Tags Helper ---
const updateMetaTags = (title, description, image = null) => {
    document.title = title;

    const setMetaTag = (attrName, attrValue, content) => {
        let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
        if (!element) {
            element = document.createElement('meta');
            element.setAttribute(attrName, attrValue);
            document.head.appendChild(element);
        }
        element.setAttribute('content', content);
    };

    setMetaTag('name', 'description', description);
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:url', window.location.href);
    
    const defaultImage = "https://i.imgur.com/BzgiMi7.png"; 
    setMetaTag('property', 'og:image', image || defaultImage);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.origin + window.location.pathname);
};


// --- Main App Component ---
export default function App() {
  const [rawElements, setRawElements] = useState([]);
  const [elements, setElements] = useState([]);
  
  const [archiveElements, setArchiveElements] = useState([]);
  const [activeElement, setActiveElement] = useState(null);
  
  const [modalImages, setModalImages] = useState([]);
  const [modalVideos, setModalVideos] = useState([]);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentVideoSlide, setCurrentVideoSlide] = useState(0);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isInstagramScriptLoaded, setIsInstagramScriptLoaded] = useState(false);

  // Mobile detection state
  const [isMobile, setIsMobile] = useState(false);

  // Check schermgrootte bij laden en resizen
  useEffect(() => {
    const handleResize = () => {
        setIsMobile(window.innerWidth < 768); 
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Wolken configuratie (Mobiel vs Desktop) ---
  // AANGEPAST: Waarden iets normaler gezet (150vw-180vw is al heel groot!)
  const activeCloudData = isMobile ? [
      { id: 'cm1', src: 'https://i.imgur.com/3CVYDp0.png', top: '20%', left: '-20vw', right: 'auto', width: '200vw', zIndex: 15, opacity: 1 }, // Mobiel 1
      { id: 'cm2', src: 'https://i.imgur.com/ivgLBmC.png', top: '40%', left: 'auto', right: '-40vw', width: '180vw', zIndex: 16, opacity: 1 }, // Mobiel 2
      { id: 'cm3', src: 'https://i.imgur.com/cksHjfb.png', top: '70%', left: '-20vw', right: 'auto', width: '160vw', zIndex: 15, opacity: 1 }, // Mobiel 3
      { id: 'cm4', src: 'https://i.imgur.com/3CVYDp0.png', top: '80%', left: '-70vw', right: 'auto', width: '150vw', zIndex: 15, opacity: 1 }, // Mobiel 4
      // Ik heb de dubbele cm3 verwijderd (id's moeten uniek zijn) en een 4e wolk optioneel gemaakt
  ] : cloudData; 

  // Fetch data from Appwrite
  useEffect(() => {
    const fetchElements = async () => {
      setIsLoading(true);
      try {
        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          ELEMENTS_COLLECTION_ID
        );

        // Filter active docs (position 1-5)
        const activeDocs = response.documents
          .filter(doc => doc.positie && doc.positie >= 1 && doc.positie <= 5);
        
        // Filter archive docs
        const archived = response.documents
          .filter(doc => doc.positie > 5);
          
        setRawElements(activeDocs);
        setArchiveElements(archived);
      } catch (error) {
        console.error("Failed to fetch elements from Appwrite:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchElements();
  }, []);

  // Bereken posities dynamisch op basis van schermgrootte
  useEffect(() => {
    if (rawElements.length === 0) return;

    let currentWidth = isMobile ? 75 : 40; 
    const sizeDecay = isMobile ? 0.75 : 0.75; 

    // Specifieke Mobiele Posities
    const mobilePositions = [
        { top: '10%', left: '50%' }, // 1. Blijft bovenin
        { top: '30%', left: '65%' }, // 2. Flink omlaag (was 30%), onder nr 3
        { top: '50%', left: '60%' }, // 3. Hoog (was 25%), boven nr 2
        { top: '70%', left: '35%' }, // 4. Iets omlaag
        { top: '80%', left: '55%' }  // 5. Flink omlaag (was 50%), helemaal onderaan
    ];

    const calculatedPositions = [];
    for (let i = 0; i < 5; i++) {
        // Kies positie op basis van mobiel of desktop
        const pos = isMobile ? mobilePositions[i] : basePositions[i].position;

        calculatedPositions.push({
            position: pos, // Gebruik de gekozen positie
            rotation: basePositions[i].rotation, // Rotatie blijft hetzelfde
            transform: basePositions[i].transform,
            size: {
                width: `${currentWidth}vw`,
                minWidth: `${currentWidth * 4}px`,
                maxWidth: `${currentWidth * 9}px`
            }
        });
        currentWidth *= sizeDecay; 
    }

    const mappedElements = rawElements.map((doc) => ({ 
        ...doc, 
        ...calculatedPositions[doc.positie - 1] 
    }));
    
    setElements(mappedElements);

  }, [rawElements, isMobile]);
  
  // --- SEO Management Effect ---
  useEffect(() => {
    const baseTitle = "Stijn van Gorkum";
    const baseDesc = "Stijn van Gorkum is een Nederlandse filmregisseur en miniatuurbouwer. Portfolio van films, miniaturen en projecten.";

    if (activeElement) {
        const title = activeElement.Titel || activeElement.Naam;
        const desc = activeElement.Tekst1 
            ? activeElement.Tekst1.substring(0, 150).replace(/\[.*?\]/g, '') + "..." 
            : baseDesc;
        updateMetaTags(`${title} | ${baseTitle}`, desc, activeElement.Object);

    } else if (isAboutModalOpen) {
        updateMetaTags(`Over | ${baseTitle}`, "Biografie en contactinformatie van Stijn van Gorkum, filmregisseur en miniatuurbouwer.", "https://i.imgur.com/BzgiMi7.png");
    } else if (isArchiveOpen) {
        updateMetaTags(`Archief | ${baseTitle}`, "Overzicht van eerdere projecten en miniaturen van Stijn van Gorkum.");
    } else {
        updateMetaTags(`${baseTitle} - Regisseur & Miniatuurbouwer`, baseDesc);
    }
  }, [activeElement, isAboutModalOpen, isArchiveOpen]);

  // --- STRUCTURED DATA (JSON-LD) ---
  useEffect(() => {
    const schemaData = {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": "Stijn van Gorkum",
      "url": "https://www.stijnvangorkum.nl",
      "jobTitle": "Filmregisseur",
      "description": "Nederlandse filmregisseur en miniatuurbouwer, gespecialiseerd in de combinatie van miniatuur en live-action.",
      "sameAs": [
        "https://www.instagram.com/_stijnvangorkum_/"
      ],
      "knowsAbout": ["Film", "Regie", "Miniatuurbouw", "Set Design"]
    };

    let script = document.querySelector('#schema-json-ld');
    if (!script) {
        script = document.createElement('script');
        script.id = 'schema-json-ld';
        script.type = 'application/ld+json';
        document.head.appendChild(script);
    }
    script.text = JSON.stringify(schemaData);
  }, []);


  // Control body scroll and modal visibility animation
  useEffect(() => {
    const isAnyModalOpen = !!activeElement || isAboutModalOpen || isArchiveOpen;
    if (isAnyModalOpen) {
        document.body.style.overflow = 'hidden';
        const timer = setTimeout(() => setIsModalVisible(true), 100); 
        return () => clearTimeout(timer);
    } else {
        document.body.style.overflow = 'auto';
        setIsModalVisible(false);
    }
  }, [activeElement, isAboutModalOpen, isArchiveOpen]);

  // Instagram script handling
  useEffect(() => {
    const shouldLoadInstagramScript = activeElement && activeElement.Naam === 'ELMER';
    
    if (shouldLoadInstagramScript && !isInstagramScriptLoaded) {
      const script = document.createElement('script');
      script.src = '//www.instagram.com/embed.js';
      script.async = true;
      
      script.onload = () => {
        if (window.instgrm) {
          window.instgrm.Embeds.process();
        }
        setIsInstagramScriptLoaded(true);
      };
      
      document.body.appendChild(script);
      
    }
    
    if (shouldLoadInstagramScript && window.instgrm && isModalVisible) {
        setTimeout(() => {
            window.instgrm.Embeds.process();
        }, 300); 
    }
  }, [activeElement, isModalVisible, isInstagramScriptLoaded]);
  
  const handleSelectElement = async (element) => {
    if (!activeElement) {
      setActiveElement(element);
      setIsModalLoading(true);
      setIsInstagramScriptLoaded(false); 
      setCurrentSlide(0); 
      setCurrentVideoSlide(0);

      try {
        const imgResponse = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          AFBEELDINGEN_COLLECTION_ID,
          [Query.equal('Project', [element.$id])]
        );
        
        if (imgResponse.documents.length > 0) {
          const doc = imgResponse.documents[0];
          const images = [];
          for (let i = 1; i <= 8; i++) {
            if (doc[`Afbeelding${i}`]) {
              images.push(doc[`Afbeelding${i}`]);
            }
          }
          setModalImages(images);
        } else {
          setModalImages([]);
        }

        const vidResponse = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          VIDEOS_COLLECTION_ID,
          [Query.equal('Project', [element.$id])]
        );

        if (vidResponse.documents.length > 0) {
          const doc = vidResponse.documents[0];
          const videos = [];
          for (let i = 1; i <= 4; i++) {
            if (doc[`Video${i}`]) {
              videos.push({
                url: convertToEmbedUrl(doc[`Video${i}`]), 
                title: doc[`Titel${i}`] || '' 
              });
            }
          }
          setModalVideos(videos);
        } else {
          setModalVideos([]);
        }

      } catch (error) {
        console.error("Failed to fetch modal details:", error);
        setModalImages([]);
        setModalVideos([]);
      } finally {
        setIsModalLoading(false);
      }
    }
  };

  const handleGoBack = (e) => {
    e.stopPropagation();
    setActiveElement(null);
    setModalImages([]);
    setModalVideos([]);
    setIsModalLoading(false);
  };

  const handleArchiveClick = () => {
      if(!activeElement && !isAboutModalOpen) {
          setIsArchiveOpen(true);
      }
  };

  const handleCloseArchive = (e) => {
      e.stopPropagation();
      setIsArchiveOpen(false);
  }
  
  const renderElements = (elementsToRender) => {
      return elementsToRender.map((element) => {
          const isActive = activeElement && activeElement.$id === element.$id;
          const style = isActive ? 
            { position: 'fixed', width: '100vw', height: '100vh', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(0deg)', zIndex: 70 } : 
            { 
                position: 'absolute', 
                top: element.position.top, 
                left: element.position.left, 
                width: element.size.width, 
                minWidth: element.size.minWidth, 
                maxWidth: element.size.maxWidth, 
                transform: `${element.transform || ''} rotate(${element.rotation}deg)`, 
                zIndex: 10 
            };

          return (
            <div key={element.$id} className={`group cursor-pointer transition-all duration-1000 ease-in-out ${activeElement && !isActive ? 'opacity-0 scale-0' : 'opacity-100'}`} style={style} onClick={() => handleSelectElement(element)}>
              <img 
                src={element.Object} 
                alt={`Miniatuur object voor project ${element.Naam}`} 
                className="w-full h-full object-contain drop-shadow-2xl" 
              />
              <div 
                className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none ${!activeElement ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'}`}
                style={{ transform: `rotate(${-element.rotation}deg)` }} 
              >
                <div className="text-center">
                  <h2 className="text-white text-3xl font-bold font-chango" style={{ textShadow: '2px 2px 6px rgba(0,0,0,0.8)' }}>
                    {element.Naam}
                  </h2>
                  {element.Subtitel && (
                    <h3 className="text-yellow-300/90 text-2xl font-bold" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                      {element.Subtitel}
                    </h3>
                  )}
                </div>
              </div>
            </div>
          );
      });
  }

  const renderArchiveElements = (elementsToRender) => {
      return elementsToRender.map((element) => {
          const isActive = activeElement && activeElement.$id === element.$id;
          
          const style = isActive ? 
            { position: 'fixed', width: '100vw', height: '100vh', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(0deg)', zIndex: 70 } : 
            { 
                position: 'relative', 
                width: '100%', 
                aspectRatio: '1/1', 
                zIndex: 65
            };

          return (
              <div 
                  key={element.$id} 
                  className={`group cursor-pointer transition-all duration-1000 ease-in-out ${activeElement && !isActive ? 'opacity-0 scale-0' : 'opacity-100'}`} 
                  style={style} 
                  onClick={() => handleSelectElement(element)}
              >
                  <img 
                    src={element.Object} 
                    alt={`Archief project: ${element.Naam}`} 
                    loading="lazy"
                    className="w-full h-full object-contain drop-shadow-2xl transition-transform duration-300 group-hover:scale-105" 
                  />
                  <div className={`absolute inset-0 flex items-center justify-center p-2 transition-opacity duration-300 pointer-events-none ${!activeElement ? 'opacity-0 group-hover:opacity-100 bg-black/40' : 'opacity-0'}`}>
                      <h2 className="text-white text-lg font-bold text-center" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>{element.Naam}</h2>
                  </div>
              </div>
          );
      });
  }


  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Chango&display=swap');
        
        .font-chango { font-family: 'Chango', cursive; }

        body { background-color: #7ab1e8; }
        .archive-trigger:hover .archive-text { opacity: 1; }
        @keyframes fadeIn {
          from { opacity: 0.8; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>

      <main className="min-h-screen relative w-screen overflow-hidden h-[300vh] md:h-[215vh]">
        
        <img 
          src="https://i.imgur.com/ViU9aYX.png" 
          alt="Hoge lucht achtergrond met wolken" 
          className="absolute top-0 left-0 w-full h-full object-cover object-top -z-10" 
        />
        
        <h1 className={`sticky top-8 text-center text-3xl sm:text-4xl md:text-6xl font-bold text-yellow-300/90 tracking-wider transition-all duration-700 ease-in-out font-chango uppercase ${activeElement || isAboutModalOpen || isArchiveOpen ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`} style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)', zIndex: 20 }}>
          Stijn
          <br className="sm:hidden" />
          {' '}van{' '}
          <br className="sm:hidden" />
          Gorkum
        </h1>

        <button onClick={() => setIsAboutModalOpen(true)} className={`fixed top-8 right-6 md:top-6 z-40 bg-yellow-300/80 hover:bg-yellow-300 text-black font-bold py-2 px-5 rounded-lg transition-all duration-500 ease-in-out ${activeElement || isAboutModalOpen || isArchiveOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`}>
          OVER
        </button>

        {/* AANGEPAST: ClassName 'max-w-none' toegevoegd */}
        {activeCloudData.map(cloud => (
            <img key={cloud.id} src={cloud.src} alt="Decoratieve wolk op de achtergrond" className="absolute pointer-events-none max-w-none" style={{ top: cloud.top, left: cloud.left, right: cloud.right, width: cloud.width, zIndex: cloud.zIndex, opacity: cloud.opacity }} />
        ))}

        {isLoading ? (
            <div className="fixed inset-0 flex items-center justify-center z-10"><p className="text-white text-2xl">Loading elements...</p></div>
        ) : (
            <>
                { !isArchiveOpen && renderElements(elements) }
            </>
        )}
        
        {/* ... Rest of the modals (Element details, About, Archive) ... */}
        {/* --- Element Details Modal --- */}
        {activeElement && (
          <div className={`fixed inset-0 z-[80] p-4 sm:p-8 md:p-12 transition-opacity duration-500 ease-in-out ${isModalVisible ? 'opacity-100' : 'opacity-0'}`} onClick={handleGoBack}>
            <div className="bg-black/70 backdrop-blur-lg p-4 sm:p-6 md:p-8 rounded-2xl max-w-5xl w-full text-white/90 max-h-[90vh] overflow-y-auto shadow-2xl mx-auto" onClick={e => e.stopPropagation()}>
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 text-yellow-300/90 text-center font-chango uppercase" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>
                {activeElement.Titel || activeElement.Naam}
              </h2>
              
              {activeElement.Subtitel && (
                <h3 className="text-2xl sm:text-3xl font-bold mb-6 text-center" style={{ color: '#518cba' }}>
                  {activeElement.Subtitel}
                </h3>
              )}

              {activeElement.Tekst1 && (
                <p className="text-base sm:text-lg mb-6 text-center whitespace-pre-wrap">{parseContent(activeElement.Tekst1)}</p>
              )}

              {isModalLoading ? (
                <div className="flex justify-center items-center h-48">
                  <p className="text-xl text-yellow-200">Media laden...</p>
                </div>
              ) : (
                <>
                  {/* Image Slider */}
                  {modalImages.length > 0 && (
                    <div className="relative w-full max-w-3xl mx-auto mb-8 shadow-lg">
                      <div className="aspect-video w-full overflow-hidden rounded-lg bg-black/30">
                        <img 
                          key={currentSlide} 
                          src={modalImages[currentSlide]} 
                          alt={`Afbeelding ${currentSlide + 1} van project ${activeElement.Naam}`} 
                          className="w-full h-full object-contain animate-fade-in" 
                        />
                      </div>
                      
                      {modalImages.length > 1 && (
                        <>
                          <button 
                            onClick={e => { e.stopPropagation(); setCurrentSlide(s => (s === 0 ? modalImages.length - 1 : s - 1)); }} 
                            className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full z-10 hover:bg-black/80 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                          </button>
                          
                          <button 
                            onClick={e => { e.stopPropagation(); setCurrentSlide(s => (s === modalImages.length - 1 ? 0 : s + 1)); }} 
                            className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full z-10 hover:bg-black/80 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                          </button>
                          
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                            {modalImages.map((_, index) => (
                              <button 
                                key={index} 
                                onClick={e => { e.stopPropagation(); setCurrentSlide(index); }} 
                                className={`w-3 h-3 rounded-full transition-colors ${index === currentSlide ? 'bg-white' : 'bg-white/50 hover:bg-white/75'}`}
                              ></button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {activeElement.Tekst2 && (
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold text-center mb-3" style={{ color: 'rgb(253 224 71 / 0.9)', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>VIEWINGS</h3>
                      <p className="text-base sm:text-lg text-center whitespace-pre-wrap">{parseContent(activeElement.Tekst2)}</p>
                    </div>
                  )}

                  {/* Video Slider */}
                  {modalVideos.length > 0 && (
                    <div className="relative w-full max-w-3xl mx-auto mb-8">
                      {modalVideos[currentVideoSlide].title && (
                        <h4 className="text-xl font-bold mb-2 text-center" style={{ color: 'rgb(253 224 71 / 0.9)', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                          {modalVideos[currentVideoSlide].title}
                        </h4>
                      )}
                      
                      <div className="aspect-video w-full overflow-hidden rounded-lg bg-black/30 shadow-lg">
                        <iframe 
                          key={currentVideoSlide} 
                          className="w-full h-full animate-fade-in" 
                          src={modalVideos[currentVideoSlide].url} 
                          title={modalVideos[currentVideoSlide].title || 'Video'} 
                          frameBorder="0" 
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                          allowFullScreen
                        ></iframe>
                      </div>
                      
                      {modalVideos.length > 1 && (
                        <>
                          <button 
                            onClick={e => { e.stopPropagation(); setCurrentVideoSlide(s => (s === 0 ? modalVideos.length - 1 : s - 1)); }} 
                            className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full z-10 hover:bg-black/80 transition-colors"
                            style={{ top: 'calc(50% - 1rem)' }} 
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                          </button>
                          
                          <button 
                            onClick={e => { e.stopPropagation(); setCurrentVideoSlide(s => (s === modalVideos.length - 1 ? 0 : s + 1)); }} 
                            className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full z-10 hover:bg-black/80 transition-colors"
                            style={{ top: 'calc(50% - 1rem)' }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                          </button>
                          
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                            {modalVideos.map((_, index) => (
                              <button 
                                key={index} 
                                onClick={e => { e.stopPropagation(); setCurrentVideoSlide(index); }} 
                                className={`w-3 h-3 rounded-full transition-colors ${index === currentVideoSlide ? 'bg-white' : 'bg-white/50 hover:bg-white/75'}`}
                              ></button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}

              {activeElement.Credits && (
                <div className="text-center bg-black/30 p-4 rounded-lg mt-10">
                  <h3 className="text-xl font-bold text-yellow-300/90 mb-2">CREDITS</h3>
                  <p className="whitespace-pre-wrap text-sm sm:text-base">{parseContent(activeElement.Credits)}</p>
                </div>
              )}

              <button onClick={handleGoBack} className="mt-8 bg-yellow-300/80 hover:bg-yellow-300 text-black font-bold py-2 px-6 rounded-lg transition-colors duration-300 block mx-auto">Terug</button>
            </div>
          </div>
        )}
        
        {/* About Modal */}
        {isAboutModalOpen && (
            <div className={`fixed inset-0 z-[60] p-4 flex items-center justify-center transition-opacity duration-500 ${isModalVisible && isAboutModalOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsAboutModalOpen(false)}>
                 <div className="bg-black/70 backdrop-blur-lg p-8 rounded-2xl max-w-2xl w-full text-white/90 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <h2 className="text-3xl font-bold mb-4 text-yellow-300/90 text-center">OVER</h2>
                    
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="w-full md:w-1/3 flex-shrink-0">
                            <img 
                                src="https://i.imgur.com/BzgiMi7.png" 
                                alt="Stijn van Gorkum" 
                                className="rounded-lg object-cover w-full h-auto" 
                            />
                        </div>
                        
                        <div className="w-full md:w-2/3">
                            <p className="text-left whitespace-pre-wrap">{`Stijn van Gorkum (1999) is een Nederlandse filmregisseur en miniatuur bouwer. Hij werkt vanuit een fascinatie voor de mens die worstelt met het leven. Hij gelooft dat het troostrijk kan zijn om juist die zoekende kant in zijn filmpersonages te accentueren.

Zijn stijl wordt gekenmerkt door een combinatie van miniatuur en live-action. Hij speelt zo met realiteit en creëert een wereld die enerzijds doet denken aan die van ons, maar anderzijds een absurde eigen logica heeft. Hij vangt hierin scènes vaak in één beeld, als een tableau-vivant. De miniatuursets geven een claustrofobisch gevoel; de mens vast in een vervreemde wereld.`}</p>
                        </div>
                    </div>
                    
                    <div className="bg-black/30 mt-6 p-4 rounded-xl text-center">
                        <h3 className="text-xl font-bold mb-3 text-yellow-300/90">CONTACT</h3>
                        <div className="flex flex-col justify-center items-center gap-4">
                            <a href="mailto:stijnvangorkum@gmail.com" className="underline hover:text-yellow-300/90">
                                stijnvangorkum@gmail.com
                            </a>
                            <a 
                                href="https://www.instagram.com/_stijnvangorkum_/" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex items-center gap-2 bg-yellow-300/80 hover:bg-yellow-300 text-black font-bold py-2 px-4 rounded-lg transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                                Instagram
                            </a>
                        </div>
                    </div>
                     <button onClick={() => setIsAboutModalOpen(false)} className="mt-6 bg-yellow-300/80 hover:bg-yellow-300 text-black font-bold py-2 px-6 rounded-lg block mx-auto">Terug</button>
                 </div>
            </div>
        )}
        
        {/* Archive Modal */}
        {isArchiveOpen && (
             <div className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-500 ${isModalVisible && isArchiveOpen ? 'opacity-100' : 'opacity-0'}`} onClick={handleCloseArchive}>
                <div className="w-full h-full overflow-y-auto p-8 md:p-16" onClick={e => e.stopPropagation()}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-10">
                    {renderArchiveElements(archiveElements)}
                  </div>
                </div>
                <button onClick={handleCloseArchive} className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-yellow-300/80 hover:bg-yellow-300 text-black font-bold py-2 px-6 rounded-lg z-[75]">Terug</button>
             </div>
        )}

        <div className="group absolute bottom-0 left-0 w-full h-auto cursor-pointer archive-trigger" style={{ zIndex: 1 }} onClick={handleArchiveClick}>
            <img src="https://i.imgur.com/hzR67ON.png" alt="Bergen van objecten die leiden naar het archief" className="w-full pointer-events-none" />
            <div className="archive-text absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 pointer-events-none">
                <h2 className="text-white text-4xl font-bold" style={{ textShadow: '2px 2px 4px black' }}>ARCHIEF</h2>
            </div>
        </div>
      </main>
    </>
  );
}