import { useEffect, useRef, useState } from "react";
import flipIcon from "../assets/flip.png";
import resetIcon from "../assets/reset.png";
import capture from "../assets/stoneCapture.mp3";
import place from "../assets/stonePlace.mp3";
import "./Board.css";

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


function Board() {
    const canvasRef = useRef(null);
    const [boardList, setBoardList] = useState(createBoard());
    const [currentColor, setCurrentColor] = useState("black");
    const [prisoners, setPrisoners] = useState({ black: 0, white: 0 }); 
    const [passCount, setPassCount] = useState({ black: 0, white: 0 });
    const [gameOver, setGameOver] = useState(false);
    const [isWhiteFlipped, setIsWhiteFlipped] = useState(false);

    function play(sound) {
        const audio = new Audio(sound);
        audio.volume = 1.0;
        audio.play().catch(error => {
            console.error("Audio play error:", error);
        });
    }

    function resetGame() {
        setBoardList(createBoard());
        setCurrentColor("black");
        setPrisoners({ black: 0, white: 0 });
        setPassCount({ black: 0, white: 0 });
        setGameOver(false);
    }

    function pass() {
        setPassCount(prev => {
            const newPassCount = { ...prev, [currentColor]: prev[currentColor] + 1 };

            // Check if both players have passed
            if (newPassCount.black > 0 && newPassCount.white > 0) {
                console.log("Game Over!");
                setGameOver(true); // Set game over state
            }

            setCurrentColor(currentColor === "black" ? "white" : "black");
            return newPassCount;
        });
    }

    function createBoard() {
        const currentBoard = [];
        for (let i = 0; i < 19; i++) {
            const row = Array(19).fill(null);
            currentBoard.push(row);
        }
        return currentBoard;
    }

    const toggleWhiteFlip = () => {
        setIsWhiteFlipped(prev => !prev);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");


        const canvasSize = Math.min(window.innerWidth * 0.9, 570); // 90% of the window width, max 570px
        canvas.width = canvasSize;
        canvas.height = canvasSize;
    
        const cellSize = canvasSize / 19; // Adjust cell size based on canvas size
        context.clearRect(0, 0, canvas.width, canvas.height);

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

        drawHoshiPoints();

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

    const checkLiberties = (row, col, color) => {
        const liberties = new Set();
        const visited = new Set();

        const explore = (r, c) => {
            if (r < 0 || r >= 19 || c < 0 || c >= 19 || visited.has(`${r},${c}`)) return;
            visited.add(`${r},${c}`);

            if (boardList[r][c] === null) {
                liberties.add(`${r},${c}`);
            } else if (boardList[r][c] === color) {
                explore(r - 1, c);
                explore(r + 1, c);
                explore(r, c - 1);
                explore(r, c + 1);
            }
        };

        explore(row, col);
        return liberties.size > 0 ? liberties : null;
    };

    const checkAndCapture = (row, col, color) => {
        const opponentColor = color === "black" ? "white" : "black";
        const capturedStones = [];

        const checkLibertiesAndCapture = (r, c, visited) => {
            if (r < 0 || r >= 19 || c < 0 || c >= 19 || visited.has(`${r},${c}`)) return;
            visited.add(`${r},${c}`);

            if (boardList[r][c] === opponentColor) {
                if (checkLiberties(r, c, opponentColor) === null) {
                    capturedStones.push([r, c]);
                    checkLibertiesAndCapture(r - 1, c, visited);
                    checkLibertiesAndCapture(r + 1, c, visited);
                    checkLibertiesAndCapture(r, c - 1, visited);
                    checkLibertiesAndCapture(r, c + 1, visited);
                }
            }
        };

        checkLibertiesAndCapture(row - 1, col, new Set());
        checkLibertiesAndCapture(row + 1, col, new Set());
        checkLibertiesAndCapture(row, col - 1, new Set());
        checkLibertiesAndCapture(row, col + 1, new Set());

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

    const handleClick = (event) => {
        if (gameOver) return; // Prevent placing stones if game is over

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const cellSize = 30;
        const colIndex = Math.floor(x / cellSize);
        const rowIndex = Math.floor(y / cellSize);

        if (boardList[rowIndex][colIndex] === null) {
            const newBoardList = [...boardList];
            newBoardList[rowIndex][colIndex] = currentColor;

            // Play the sound for placing a stone
            play(place);
            setPassCount({ black: 0, white: 0 }); // Reset pass counts on a valid move
            
            // Check for captures
            const capturedStones = checkAndCapture(rowIndex, colIndex, currentColor);

            // Play the sound for capturing if any stones were captured
            if (capturedStones.length > 0) {
                play(capture);
            }

            const liberties = checkLiberties(rowIndex, colIndex, currentColor);
            if (liberties) {
                setBoardList(newBoardList);
                setCurrentColor(currentColor === "black" ? "white" : "black");
            } else {
                newBoardList[rowIndex][colIndex] = null; // Undo the placement if no liberties
            }
        }
    };


    return (
        <div className="mainContainer">
            <nav>
                <button onClick={resetGame} className="navButton reset">
                    <img src={resetIcon} alt="Reset Icon" className="resetImg" />
                </button>
                <button onClick={toggleWhiteFlip} className="navButton flip" alt="Flip">
                    <img src={flipIcon} className="flipImg" alt="Flip Icon" />
                </button>
            </nav>
            {gameOver && <div className="game-over-message">Game Over!</div>}
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
            <div className="whitesBowl">
                <PrisonerBowl 
                    color="black" 
                    count={prisoners.black} 
                    isFlipped={isWhiteFlipped} 
                    onPass={pass}
                    isCurrentTurn={currentColor === "black"} // Highlight if it's black's turn
                />
            </div>
            <div className="blacksBowl">
                <PrisonerBowl 
                    color="white" 
                    count={prisoners.white} 
                    onPass={pass}
                    isCurrentTurn={currentColor === "white"} // Highlight if it's white's turn
                />
            </div>
            
        </div>
    );
}

export default Board;
