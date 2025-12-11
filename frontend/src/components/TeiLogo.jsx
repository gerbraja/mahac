import React from 'react';
import RotatingGlobe from './RotatingGlobe';

export default function TeiLogo({ size = "large", showSubtitle = true }) {
    const isLarge = size === "large";

    const titleStyle = {
        fontFamily: "'Outfit', sans-serif",
        fontSize: isLarge ? "clamp(6rem, 20vw, 11rem)" : "2rem",
        fontWeight: "800",
        background: "linear-gradient(to right, #2563eb, #06b6d4)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        letterSpacing: "-0.04em",
        marginBottom: "0rem",
        filter: isLarge ? "drop-shadow(0 0 40px rgba(6, 182, 212, 0.2))" : "none",
        lineHeight: "0.9",
        padding: isLarge ? "0 1rem" : "0",
        display: "inline-block"
    };

    const subtitleStyle = {
        fontFamily: "'Outfit', sans-serif",
        fontSize: isLarge ? "clamp(0.875rem, 2.5vw, 1.25rem)" : "0.75rem",
        fontWeight: "500",
        color: "#64748b",
        letterSpacing: "0.8em",
        textTransform: "uppercase",
        marginBottom: isLarge ? "2rem" : "0",
        marginLeft: "0.8em",
        display: "block"
    };

    const lineStyle = {
        width: isLarge ? "60px" : "30px",
        height: "3px",
        background: "linear-gradient(to right, #2563eb, #06b6d4)",
        margin: "0 auto",
        borderRadius: "10px",
        opacity: "0.8",
        marginTop: isLarge ? "0" : "0.25rem"
    };

    return (
        <div style={{ textAlign: "center" }}>
            {isLarge && <RotatingGlobe size="150px" />}
            <h1 style={titleStyle}>TEI</h1>
            {showSubtitle && (
                <h2 style={subtitleStyle}>
                    Tu Empresa Internacional
                </h2>
            )}
            {showSubtitle && <div style={lineStyle}></div>}
        </div>
    );
}
