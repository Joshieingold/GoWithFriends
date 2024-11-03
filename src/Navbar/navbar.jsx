// Navbar.js
import React from 'react';

const Navbar = ({ onFlip }) => {
    return (
        <nav>
            <button onClick={onFlip}>Flip Prisoner Bowl</button>
        </nav>
    );
};

export default Navbar;
