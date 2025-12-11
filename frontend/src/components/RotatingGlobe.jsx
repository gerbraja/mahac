import React from 'react';

const RotatingGlobe = ({ size = "100px" }) => {
    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: "50%",
                position: "relative",
                boxShadow: "inset 20px 0 50px 10px rgba(0,0,0,0.6), 0 0 20px rgba(59, 130, 246, 0.4)", // Deeper inner shadow for 3D sphere effect
                backgroundColor: "#1e40af", // Ocean Blue
                backgroundImage: "url(/world-continents.png)",
                backgroundBlendMode: "multiply", // Blends blue with the map (white becomes blue, black stays dark)
                backgroundSize: "210% 100%", // Zoom in slightly and allow scrolling
                backgroundRepeat: "repeat-x",
                animation: "rotateGlobe 25s linear infinite",
                margin: "0 auto",
                marginBottom: "1rem"
            }}
        >
            {/* Shine effect for 3D look */}
            <div
                style={{
                    position: "absolute",
                    top: "0",
                    left: "0",
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 60%)",
                }}
            ></div>

            <style>{`
        @keyframes rotateGlobe {
          0% { background-position-x: 0%; }
          100% { background-position-x: -210%; } /* Move left to right */
        }
      `}</style>
        </div>
    );
};

export default RotatingGlobe;
