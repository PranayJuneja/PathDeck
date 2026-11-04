import { useRef, useEffect } from 'react';
import styles from './TheoryPanel.module.css';

// Helper for displaying theory features

const TheoryPanel = ({ tissue }) => {
    const panelRef = useRef(null);

    // Scroll to top when tissue changes
    useEffect(() => {
        if (panelRef.current) {
            panelRef.current.scrollTop = 0;
        }
    }, [tissue]);

    if (!tissue) {
        return (
            <div className={styles.panel} ref={panelRef}>
                <div className={styles.emptyState}>
                    Select a tissue to view theory
                </div>
            </div>
        );
    }

    const { theory } = tissue;

    return (
        <div className={styles.panel}>
            <div className={styles.content} ref={panelRef}>
                <header className={styles.header}>
                    <div className={styles.category}>{tissue.category}</div>
                    <h2 className={styles.title}>{tissue.name}</h2>
                    <p className={styles.description}>{tissue.description}</p>
                </header>

                {theory && (
                    <>
                        {/* Key Features */}
                        {theory.features && theory.features.length > 0 && (
                            <section className={styles.section}>
                                <h3>Microscopic features</h3>
                                <ul className={styles.featureList}>
                                    {theory.features.map((feature, idx) => (
                                        <li key={idx}>{feature}</li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {/* Function & Location Grid */}
                        <div className={styles.gridSection}>
                            {theory.location && theory.location.length > 0 && (
                                <section>
                                    <h3>Gross morphology</h3>
                                    <ul>
                                        {theory.location.map((loc, idx) => (
                                            <li key={idx}>{loc}</li>
                                        ))}
                                    </ul>
                                </section>
                            )}

                            {theory.function && theory.function.length > 0 && (
                                <section>
                                    <h3>Clinical correlations</h3>
                                    <ul>
                                        {theory.function.map((func, idx) => (
                                            <li key={idx}>{func}</li>
                                        ))}
                                    </ul>
                                </section>
                            )}
                        </div>

                        {theory.pathogenesis && <section className={styles.section}><h3>Pathogenesis</h3><p>{theory.pathogenesis}</p></section>}
                        {theory.stains?.length > 0 && <section className={styles.section}><h3>Stains & markers</h3><ul className={styles.featureList}>{theory.stains.map(item => <li key={item}>{item}</li>)}</ul></section>}
                        {theory.differentials?.length > 0 && <section className={styles.section}><h3>Differential diagnosis</h3>{theory.differentials.map(item => <p key={item.name}><strong>{item.name}:</strong> {item.distinction}</p>)}</section>}
                        {theory.references?.length > 0 && <section className={`${styles.section} pd-reference-links`}><h3>Read further</h3>{theory.references.map(item => <p key={item.url}><a href={item.url} target="_blank" rel="noreferrer">{item.title}</a></p>)}</section>}
                        {/* Exam Tips */}
                        {theory.examTips && (
                            <section className={`${styles.section} ${styles.examTipBoard}`}>
                                <div className={styles.examTipHeader}>
                                    <div className={styles.tipIcon}>💡</div>
                                    <h3>Exam Tips</h3>
                                </div>
                                <p>{theory.examTips}</p>
                            </section>
                        )}
                    </>
                )}
            </div>

        </div>
    );
};

export default TheoryPanel;
