import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styles from './SlideViewer.module.css';
import { imageByPath } from '../data/slides.js';

const SlideViewer = ({ tissue, currentSlideIndex, setCurrentSlideIndex, concealSource = false, onSource }) => {
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [imageError, setImageError] = useState(false);

    // Refs for boundary calculation
    const containerRef = useRef(null);
    const imageRef = useRef(null);

    // Get all slides combined into a linear list (low -> medium -> high -> default)
    const slides = useMemo(() => {
        if (!tissue?.slides) return [];

        return [
            ...(tissue.slides.low || []),
            ...(tissue.slides.medium || []),
            ...(tissue.slides.high || []),
            ...(tissue.slides.default || [])
        ];
    }, [tissue]);
    const currentSlide = slides[currentSlideIndex] || null;
    const totalSlides = slides.length;

    // Preload slides for smoother navigation
    useEffect(() => {
        if (!slides.length) return;

        // Preload current slide and next 2-3 slides
        const preloadIndices = [
            currentSlideIndex,
            currentSlideIndex + 1,
            currentSlideIndex + 2,
            currentSlideIndex - 1, // Also preload previous for back navigation
        ].filter(i => i >= 0 && i < slides.length);

        preloadIndices.forEach(index => {
            const img = new Image();
            img.src = slides[index];
        });
    }, [currentSlideIndex, slides]);

    // Preload all slides when tissue changes (background loading)
    useEffect(() => {
        if (!slides.length) return;

        // Preload all slides in the background with slight delay to not block UI
        const timeouts = slides.map((slidePath, index) => setTimeout(() => {
            const img = new Image();
            img.src = slidePath;
        }, 1000 + index * 100));
        return () => timeouts.forEach(clearTimeout);
    }, [tissue, slides]);

    // Clamp position to keep image within bounds
    // The image edge cannot go past the container edge
    const clampPosition = useCallback((x, y, currentZoom) => {
        if (!containerRef.current || !imageRef.current) {
            return { x, y };
        }

        const container = containerRef.current.getBoundingClientRect();
        const image = imageRef.current;

        // Get the natural/rendered size of the image
        const imageWidth = image.naturalWidth || image.offsetWidth;
        const imageHeight = image.naturalHeight || image.offsetHeight;

        // Calculate the displayed size (image is contained within container, then scaled by zoom)
        // First find the scale factor when image is "contained" in the container
        const containerAspect = container.width / container.height;
        const imageAspect = imageWidth / imageHeight;

        let displayedWidth, displayedHeight;
        if (imageAspect > containerAspect) {
            // Image is wider - width fills container
            displayedWidth = container.width;
            displayedHeight = container.width / imageAspect;
        } else {
            // Image is taller - height fills container
            displayedHeight = container.height;
            displayedWidth = container.height * imageAspect;
        }

        // Apply zoom to get the actual displayed size
        const scaledWidth = displayedWidth * currentZoom;
        const scaledHeight = displayedHeight * currentZoom;

        // Calculate maximum pan distance
        // When zoomed in, the image can pan until its edge reaches the container edge
        const maxPanX = Math.max(0, (scaledWidth - container.width) / 2);
        const maxPanY = Math.max(0, (scaledHeight - container.height) / 2);

        // Clamp the position
        const clampedX = Math.max(-maxPanX, Math.min(maxPanX, x));
        const clampedY = Math.max(-maxPanY, Math.min(maxPanY, y));

        return { x: clampedX, y: clampedY };
    }, []);

    // Zoom controls
    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev * 1.5, 5));
    };

    const handleZoomOut = () => {
        setZoom(prev => {
            const newZoom = Math.max(prev / 1.5, 1);
            // Re-clamp position when zooming out
            setPosition(currentPos => clampPosition(currentPos.x, currentPos.y, newZoom));
            return newZoom;
        });
    };

    const handleReset = () => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    };

    // Mouse drag for panning
    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            const rawX = e.clientX - dragStart.x;
            const rawY = e.clientY - dragStart.y;
            const clamped = clampPosition(rawX, rawY, zoom);
            setPosition(clamped);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Touch events for mobile - with pinch-to-zoom support
    const [lastTouchDistance, setLastTouchDistance] = useState(null);

    // Use refs to store latest values for event handlers
    const stateRef = useRef({ position, zoom, isDragging, dragStart, lastTouchDistance });
    useEffect(() => {
        stateRef.current = { position, zoom, isDragging, dragStart, lastTouchDistance };
    }, [position, zoom, isDragging, dragStart, lastTouchDistance]);

    const getTouchDistance = (touches) => {
        if (touches.length < 2) return null;
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    // Attach touch events with { passive: false } to allow preventDefault
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleTouchStart = (e) => {
            if (e.target.closest('button')) return;
            // Prevent default to stop page from scrolling/zooming
            e.preventDefault();

            if (e.touches.length === 2) {
                // Pinch gesture starting
                setLastTouchDistance(getTouchDistance(e.touches));
            } else if (e.touches.length === 1) {
                // Single finger drag (panning)
                setIsDragging(true);
                setDragStart({
                    x: e.touches[0].clientX - stateRef.current.position.x,
                    y: e.touches[0].clientY - stateRef.current.position.y
                });
            }
        };

        const handleTouchMove = (e) => {
            if (e.target.closest('button')) return;
            // Prevent default to stop page from scrolling/zooming
            e.preventDefault();

            const { isDragging, dragStart, lastTouchDistance, zoom } = stateRef.current;

            if (e.touches.length === 2) {
                // Pinch-to-zoom
                const newDistance = getTouchDistance(e.touches);
                if (lastTouchDistance !== null && newDistance !== null) {
                    const scale = newDistance / lastTouchDistance;
                    setZoom(prev => {
                        const newZoom = Math.min(Math.max(prev * scale, 1), 5);
                        // Re-clamp position when zooming out
                        if (scale < 1) {
                            setPosition(currentPos => clampPosition(currentPos.x, currentPos.y, newZoom));
                        }
                        return newZoom;
                    });
                    setLastTouchDistance(newDistance);
                }
            } else if (isDragging && e.touches.length === 1) {
                // Single finger panning
                const rawX = e.touches[0].clientX - dragStart.x;
                const rawY = e.touches[0].clientY - dragStart.y;
                const clamped = clampPosition(rawX, rawY, zoom);
                setPosition(clamped);
            }
        };

        const handleTouchEnd = (e) => {
            if (e.target.closest('button')) return;
            // Prevent default
            e.preventDefault();
            setIsDragging(false);
            setLastTouchDistance(null);
        };

        // Mouse wheel for zooming
        const handleWheel = (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.04 : 0.04;
            setZoom(prev => {
                const newZoom = Math.min(Math.max(prev + delta, 1), 5);
                // Re-clamp position when zooming out
                if (delta < 0) {
                    setPosition(currentPos => clampPosition(currentPos.x, currentPos.y, newZoom));
                }
                return newZoom;
            });
        };

        // Add event listeners with { passive: false } to enable preventDefault
        container.addEventListener('touchstart', handleTouchStart, { passive: false });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd, { passive: false });
        container.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
            container.removeEventListener('wheel', handleWheel);
        };
    }, [clampPosition]);

    // Navigate slides
    const nextSlide = () => {
        if (totalSlides > 1) {
            setCurrentSlideIndex(prev => Math.min(prev + 1, totalSlides - 1));
            setZoom(1);
            setPosition({ x: 0, y: 0 });
            setImageError(false);
        }
    };

    const prevSlide = () => {
        if (totalSlides > 1) {
            setCurrentSlideIndex(prev => Math.max(prev - 1, 0));
            setZoom(1);
            setPosition({ x: 0, y: 0 });
            setImageError(false);
        }
    };

    const handleImageError = () => {
        setImageError(true);
    };

    if (!tissue) {
        return (
            <div className={styles.viewerContainer}>
                <div className={styles.errorMessage}>
                    Select a tissue to view
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={styles.viewerContainer}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Image Display */}
            <div
                className={styles.imageWrapper}
                style={{
                    transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                    cursor: isDragging ? 'grabbing' : 'grab'
                }}
            >
                {currentSlide && !imageError ? (
                    <img
                        ref={imageRef}
                        src={currentSlide}
                        alt={tissue.name}
                        className={styles.slideImage}
                        onError={handleImageError}
                        draggable={false}
                    />
                ) : (
                    <div className={styles.errorMessage}>
                        {imageError ? (
                            <>
                                <p>Failed to load slide image</p>
                                <p className={styles.errorDetail}>
                                    Path: {currentSlide}
                                </p>
                            </>
                        ) : (
                            <p>No slides available for this selection</p>
                        )}
                    </div>
                )}
            </div>

            {currentSlide && onSource && <button className="pd-source-trigger" aria-label="Image source and licence" onClick={(event) => { event.stopPropagation(); onSource(imageByPath.get(currentSlide)); }}><span className="material-icon" style={{fontSize:17}}>info</span></button>}
            {/* Controls Overlay */}
            <div
                className={styles.controlsOverlay}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {/* Zoom Controls */}
                <div className={styles.zoomControls}>
                    <button onClick={handleZoomOut} className={styles.controlBtn} title="Zoom Out">
                        <span className="material-icon">remove</span>
                    </button>
                    <button onClick={handleReset} className={styles.controlBtn} title="Reset View">
                        <span className="material-icon">refresh</span>
                    </button>
                    <button onClick={handleZoomIn} className={styles.controlBtn} title="Zoom In">
                        <span className="material-icon">add</span>
                    </button>
                </div>

                {/* Slide Navigation - Linear Scale */}
                {totalSlides > 1 && (
                    <div className={styles.slideControls}>
                        <button
                            onClick={prevSlide}
                            className={`${styles.slideBtn} ${currentSlideIndex === 0 ? styles.disabled : ''}`}
                            disabled={currentSlideIndex === 0}
                            title="Previous Slide"
                        >
                            <span className="material-icon">remove</span>
                        </button>
                        <span className={styles.slideCounter}>
                            {currentSlideIndex + 1}/{totalSlides}
                        </span>
                        <button
                            onClick={nextSlide}
                            className={`${styles.slideBtn} ${currentSlideIndex === totalSlides - 1 ? styles.disabled : ''}`}
                            disabled={currentSlideIndex === totalSlides - 1}
                            title="Next Slide"
                        >
                            <span className="material-icon">add</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Source Credit */}
            {currentSlide && !concealSource && (
                <div className={styles.sourceCredit}>
                    {imageByPath.get(currentSlide)?.sourceUrl ? <a href={imageByPath.get(currentSlide).sourceUrl} target="_blank" rel="noreferrer" title={imageByPath.get(currentSlide).attribution || imageByPath.get(currentSlide).author}>{imageByPath.get(currentSlide).author} · {imageByPath.get(currentSlide).license}</a> : 'Path Deck original · CC BY 4.0'}
                </div>
            )}
        </div>
    );
};

export default SlideViewer;

