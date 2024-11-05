import { useEffect, useRef, useState } from "react";
import flipIcon from "../assets/flip.png";
import resetIcon from "../assets/reset.png";
import capture from "../assets/stoneCapture.mp3";
import place from "../assets/stonePlace.mp3";
import "./Board.css";


// This contains the data for the players captured stones.
// Requires knowledge of players color, prisoner count, if the display is flipped, pass function and whos turn it is.
const PrisonerBowl = ({ color, count, isFlipped, onPass, isCurrentTurn }) => { 
    const stones = Array.from({ length: count }, (_, index) => index);

    return (
        <div className={`stats ${isFlipped ? 'flipped' : ''} ${isCurrentTurn ? 'highlight' : ''}`}>
            <div className={`prisoner-bowl ${color}`}>
                <div className="bowl">
                    {stones.map((stone) => (
                        <div 
                            key={stone} 
                            className={`stone ${color}`} 
                            style={{ 
                                position: 'absolute',
                                left: `${(stone % 5) * 20}px`,  
                                top: `${Math.floor(stone / 5) * 20}px`,
                            }} 
                        />
                    ))}
                </div>
            </div>
            <div className="count">{count}</div>
            <button className="passButton" onClick={onPass}>Pass</button>
        </div>
    );
};

// Main functions of the board.
function Board() {
    
    // Global Variables.
    const canvasRef = useRef(null); // Blank canvas
    const [boardList, setBoardList] = useState(createBoard()); //Current Record of the board.
    const [currentColor, setCurrentColor] = useState("black"); // The color of the player, starting with black as per Go.
    const [prisoners, setPrisoners] = useState({ black: 0, white: 0 }); // Contains the prisoner data for black and white stones.
    const [passCount, setPassCount] = useState({ black: 0, white: 0 }); // Counts how many consequitive passes have happened.
    const [gameOver, setGameOver] = useState(false); // State that activates after both players pass.
    const [isWhiteFlipped, setIsWhiteFlipped] = useState(false); // Allows for opposite side player bowls.

    // Plays any audio you pass to it when you want.
    function play(sound) {
        const audio = new Audio(sound);
        audio.volume = 1.0; // Max sound.
        audio.play().catch(error => {
            console.error("Could not load sound.", error); // Nice error catch.
        });
    }

    // Resets the game to original states
    function resetGame() {
        setBoardList(createBoard());
        setCurrentColor("black");
        setPrisoners({ black: 0, white: 0 });
        setPassCount({ black: 0, white: 0 });
        setGameOver(false);
    }

    // Passes the turn of the player.
    function pass() {
        setPassCount(prev => {
            const newPassCount = { ...prev, [currentColor]: prev[currentColor] + 1 };

            // If both players pass consequtively, the game will end.
            if (newPassCount.black > 0 && newPassCount.white > 0) {
                setGameOver(true);
            }
            // Changes to the next players move.
            setCurrentColor(currentColor === "black" ? "white" : "black");
            return newPassCount;
        });
    }
    
    // Creates an empty board.
    function createBoard() {
        const currentBoard = [];
        for (let i = 0; i < 19; i++) {
            const row = Array(19).fill(null);
            currentBoard.push(row);
        }
        return currentBoard;
    }

    // Flips the white prisoner bowl.
    const toggleWhiteFlip = () => {
        setIsWhiteFlipped(prev => !prev);
    };

    // Creates the boards designs
    useEffect(() => {
        // Setup
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        const canvasSize = Math.min(window.innerWidth * 0.9, 570); // 90% of the window width, max 570px
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        const cellSize = canvasSize / 19;
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Creates the Lines on the game board.
        context.strokeStyle = "#000000"; 
        for (let i = 0; i < 19; i++) {
            context.beginPath();
            const offset = cellSize / 2;

            context.moveTo(i * cellSize + offset, offset);
            context.lineTo(i * cellSize + offset, 555);
            context.stroke();

            context.moveTo(offset, i * cellSize + offset);
            context.lineTo(555, i * cellSize + offset);
            context.stroke();
        }

        // Function to draw dots for each hoshi point
        const drawHoshiPoints = () => {
            const hoshiPositions = [
                { row: 3, col: 3 },
                { row: 3, col: 9 },
                { row: 3, col: 15 },
                { row: 9, col: 3 },
                { row: 9, col: 9 },
                { row: 9, col: 15 },
                { row: 15, col: 3 },
                { row: 15, col: 9 },
                { row: 15, col: 15 },
            ];

            hoshiPositions.forEach(({ row, col }) => {
                const x = col * cellSize + cellSize / 2;
                const y = row * cellSize + cellSize / 2;
                context.beginPath();
                context.arc(x, y, 3.5, 0, Math.PI * 2); 
                context.fillStyle = "#000000"; 
                context.fill();
            });
        };

        // Draws the hoshi points.
        drawHoshiPoints();

        // Uses the board list to draw the stones based on their data.
        boardList.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                if (cell) {
                    const x = colIndex * cellSize + cellSize / 2;
                    const y = rowIndex * cellSize + cellSize / 2;
                    context.beginPath();
                    context.arc(x, y, cellSize / 2.5, 0, Math.PI * 2);
                    context.fillStyle = cell;
                    context.fill();
                    context.stroke();
                }
            });
        });
    }, [boardList]);

    // Function to check if every stone on the board has a liberty or not.
    const checkLiberties = (row, col, color) => {
        const liberties = new Set();
        const visited = new Set();

        const explore = (r, c) => {
            if (r < 0 || r >= 19 || c < 0 || c >= 19 || visited.has(`${r},${c}`)) return; // If it is greated than the board or less or we know it, loop back.
            visited.add(`${r},${c}`); // Else, we add it to our visited list.

            if (boardList[r][c] === null) { // Checks to see if there are blank areas around our stone if so, we know it has that liberty.
                liberties.add(`${r},${c}`); 
            } else if (boardList[r][c] === color) { // if we found a color you explore any attached areas to see if it has liberties.
                explore(r - 1, c);
                explore(r + 1, c);
                explore(r, c - 1);
                explore(r, c + 1);
            }
        };

        explore(row, col);
        return liberties.size > 0 ? liberties : null;
    };

    // Function for checking if stones lost all their liberties and if they have captures them.
    const checkAndCapture = (row, col, color) => {
        const opponentColor = color === "black" ? "white" : "black"; // opposite of the placed stones color.
        const capturedStones = [];

        // Iderates over the connected stones finding if they are void of liberties or not.
        const checkLibertiesAndCapture = (r, c, visited) => {
            if (r < 0 || r >= 19 || c < 0 || c >= 19 || visited.has(`${r},${c}`)) return;
            visited.add(`${r},${c}`);

            if (boardList[r][c] === opponentColor) {
                if (checkLiberties(r, c, opponentColor) === null) { // If all your liberties are your opponents we take your stone.
                    capturedStones.push([r, c]);
                    checkLibertiesAndCapture(r - 1, c, visited);
                    checkLibertiesAndCapture(r + 1, c, visited);
                    checkLibertiesAndCapture(r, c - 1, visited);
                    checkLibertiesAndCapture(r, c + 1, visited);
                }
            }
        };
        
        // Checks everywhere.
        checkLibertiesAndCapture(row - 1, col, new Set());
        checkLibertiesAndCapture(row + 1, col, new Set());
        checkLibertiesAndCapture(row, col - 1, new Set());
        checkLibertiesAndCapture(row, col + 1, new Set());

        // Adds to the correct prisoners list based on the amount of captured stones.
        if (capturedStones.length > 0) {
            const newBoardList = [...boardList];
            capturedStones.forEach(([r, c]) => {
                newBoardList[r][c] = null;
            });

            setPrisoners(prev => ({ ...prev, [opponentColor]: prev[opponentColor] + capturedStones.length }));
            setBoardList(newBoardList);
        }

        return capturedStones;
    };

    // Handles clicking on the board and as such contains all checks laid out as well as progressing the game.
    const handleClick = (event) => {
        if (gameOver) return; // If the game is over you can't make new moves.

        // Finds where you cicked and associates it with the correct location in our board list.
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const cellSize = 30;
        const colIndex = Math.floor(x / cellSize);
        const rowIndex = Math.floor(y / cellSize);

        // If the spot clicked is empty, it will place a stone into the board list.
        if (boardList[rowIndex][colIndex] === null) {
            const newBoardList = [...boardList];
            newBoardList[rowIndex][colIndex] = currentColor;

            // Plays the sound for placing a stone
            play(place);
            setPassCount({ black: 0, white: 0 }); // Resets the passes as a player did not consequtively pass.
            
            // Checks for captures
            const capturedStones = checkAndCapture(rowIndex, colIndex, currentColor);

            // Play the sound for capturing if any stones were captured
            if (capturedStones.length > 0) {
                play(capture);
            }

            // Only allows players to place stones in locations where they will not die.
            const liberties = checkLiberties(rowIndex, colIndex, currentColor);
            if (liberties) {
                setBoardList(newBoardList);
                setCurrentColor(currentColor === "black" ? "white" : "black");
            } else {
                newBoardList[rowIndex][colIndex] = null; // Undo the placement if no liberties
            }
        }
    };

    // This is the main board that is released to the website.
    return (
        <div className="mainContainer">
            {/* This is the container for the left hand Navbar. */}
            <nav>
                {/* Resets the game.*/}
                <button onClick={resetGame} className="navButton reset">
                    <img src={resetIcon} alt="Reset Icon" className="resetImg" />
                </button>

                {/* Flips whites bowl for optional play experience */}
                <button onClick={toggleWhiteFlip} className="navButton flip" alt="Flip">
                    <img src={flipIcon} className="flipImg" alt="Flip Icon" />
                </button>
            </nav>

            {/* This gets added when the game is over to the page. */}
            {gameOver && <div className="game-over-message">Game Over!</div>}

            {/* This holds the board :)*/}
            <div className="board-container">
                <canvas
                    ref={canvasRef}
                    width={570}
                    height={570}
                    className="go-board-canvas"
                    onClick={handleClick}
                />
                <div alt="Go Board" className="go-board-image"></div>
            </div>

            {/* The bowl of white containing their prisoner black stones. */}
            <div className="whitesBowl">
                <PrisonerBowl 
                    color="black" 
                    count={prisoners.black} 
                    isFlipped={isWhiteFlipped} 
                    onPass={pass}
                    isCurrentTurn={currentColor === "white"}
                />
            </div>
            {/* The bowl of black containing their prisoner white stones. */}
            <div className="blacksBowl">
                <PrisonerBowl 
                    color="white" 
                    count={prisoners.white} 
                    onPass={pass}
                    isCurrentTurn={currentColor === "black"}
                />
            </div>
        </div>
    );
}

export default Board;
