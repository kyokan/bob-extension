import React, { useRef, useEffect } from 'react';
import jdenticon from 'jdenticon';
import "./identicon.scss";

const Identicon = ({ value = 'test', size = '100%', className = '' }) => {
  const icon = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    jdenticon.update(icon.current as Element, value, {
      lightness: {
        color: [0.50, 0.78],
        grayscale: [0.25, 0.59],
      },
      saturation: {
        color: 0.36,
        grayscale: 0.43,
      },
      backColor: "#fff",
    });
  }, [value]);

  return (
    <div className={`identicon ${className}`}>
      <svg
        data-jdenticon-value={value}
        height={size}
        ref={icon}
        width={size}
      />
    </div>
  );
};

export default Identicon;
