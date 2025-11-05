
import React, { useState } from 'react';
import CameraCapture from './components/CameraCapture';
import { editImageWithPrompt } from './services/geminiService';
import { processDataUrl } from './utils/imageUtils';
import Spinner from './components/Spinner';
import BackIcon from './components/icons/BackIcon';

type View = 'capture' | 'edit';

const App: React.FC = () => {
  const [view, setView] = useState<View>('capture');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('Give me a short, stylish haircut');
  const [numVariations, setNumVariations] = useState<number>(5);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageCapture = (imageDataUrl: string) => {
    setImageSrc(imageDataUrl);
    setView('edit');
    setGeneratedImages([]);
    setError(null);
  };

  const handleRetake = () => {
    setImageSrc(null);
    setView('capture');
    setGeneratedImages([]);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!imageSrc || !prompt) {
      setError('Please ensure you have a captured image and a prompt.');
      return;
    }

    const processed = processDataUrl(imageSrc);
    if (!processed) {
      setError('Could not process the captured image format.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);

    // Create unique prompts to encourage diverse hairstyles
    const variationKeywords = [
        "with a modern twist",
        "in a classic style",
        "that's a bit edgy and bold",
        "with a softer, more natural look",
        "with subtle color highlights",
        "that has more volume and texture",
        "in a sleek and polished version",
        "that looks playful and fun",
        "suitable for a professional setting",
        "that is completely different and surprising"
    ];
    
    const prompts = Array.from({ length: numVariations }, (_, i) => {
        const keyword = variationKeywords[i % variationKeywords.length];
        // By adding a variation hint, we guide the model to generate different results.
        return `${prompt}, but ${keyword}. Please provide style variation number ${i + 1}.`;
    });

    const generationPromises = prompts.map(p =>
      editImageWithPrompt(processed.base64Data, processed.mimeType, p)
    );

    try {
      const results = await Promise.all(generationPromises);
      setGeneratedImages(results);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Generation failed: ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-6xl text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
          AI Hairstylist
        </h1>
        <p className="text-gray-400 mt-2 text-lg">
          Try on new hairstyles in seconds. Capture your photo and let AI do the magic!
        </p>
      </header>

      <main className="w-full max-w-6xl flex-grow">
        {view === 'capture' ? (
          <CameraCapture onCapture={handleImageCapture} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 flex flex-col space-y-6">
              <div className="relative">
                <img src={imageSrc ?? ''} alt="Captured" className="rounded-lg shadow-2xl w-full" />
                 <button
                    onClick={handleRetake}
                    className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 bg-black bg-opacity-50 text-white font-semibold rounded-full hover:bg-opacity-75 transition-all"
                    >
                    <BackIcon />
                    Retake
                </button>
              </div>
              
              <div className="bg-gray-800 p-5 rounded-lg shadow-lg">
                <div className="flex flex-col space-y-4">
                  <div>
                    <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-1">
                      Describe the hairstyle
                    </label>
                    <textarea
                      id="prompt"
                      rows={3}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      placeholder="e.g., vibrant pink mohawk"
                    />
                  </div>
                  <div>
                    <label htmlFor="variations" className="block text-sm font-medium text-gray-300 mb-2">
                      Number of Styles ({numVariations})
                    </label>
                    <input
                      id="variations"
                      type="range"
                      min="1"
                      max="10"
                      value={numVariations}
                      onChange={(e) => setNumVariations(Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="w-full px-6 py-3 bg-indigo-600 text-white font-bold rounded-md shadow-lg hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-wait transition-all duration-300 transform hover:scale-105"
                  >
                    {isLoading ? 'Generating...' : 'Generate Hairstyles'}
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-gray-800 p-5 rounded-lg shadow-lg relative min-h-[400px]">
                <h2 className="text-2xl font-bold mb-4 text-gray-200">Generated Styles</h2>
                {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-md mb-4">{error}</div>}
                
                {isLoading && (
                    <div className="absolute inset-0 bg-gray-800 bg-opacity-80 flex flex-col items-center justify-center rounded-lg z-10">
                        <Spinner />
                        <p className="mt-4 text-lg text-gray-300">Generating your new look...</p>
                    </div>
                )}

                {!isLoading && generatedImages.length === 0 && (
                    <div className="text-center text-gray-500 pt-16">
                        <p>Your AI-generated hairstyles will appear here.</p>
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {generatedImages.map((img, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden shadow-md transition-transform duration-300 hover:scale-105 hover:shadow-indigo-500/30">
                        <img src={img} alt={`Generated hairstyle ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                    ))}
                </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
