import { useEffect, useRef, useState } from "react";
import "./Board.css";

const PrisonerBowl = ({ color, count }) => {
    // Create an array of stones based on the count
    const stones = Array.from({ length: count }, (_, index) => index);

    return (
        <div className="stats">
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
        </div>

    );
};


function Board() {
    const canvasRef = useRef(null);
    const [boardList, setBoardList] = useState(createBoard());
    const [currentColor, setCurrentColor] = useState("black");
    const [prisoners, setPrisoners] = useState({ black: 0, white: 0 }); 

    // Function to create the 19x19 board
    function createBoard() {
        const currentBoard = [];
        for (let i = 0; i < 19; i++) {
            const row = Array(19).fill(null);
            currentBoard.push(row);
        }
        return currentBoard;
    }

    // Draw the grids on the canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        const cellSize = 30;

        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);

        
        // Gameboard grid
        context.strokeStyle = "#000000"; 
    for (let i = 0; i < 19; i++) {
        context.beginPath();
        const offset = cellSize / 2;

        context.moveTo(i * cellSize + offset, offset);
        context.lineTo(i * cellSize + offset, 555);
        context.stroke();

        // Horizontal lines
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
        // Draw stones
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
    

    // Function to check liberties
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

            setPrisoners((prev) => ({ ...prev, [opponentColor]: prev[opponentColor] + capturedStones.length }));
            setBoardList(newBoardList);
        }
    };

    const handleClick = (event) => {
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

            checkAndCapture(rowIndex, colIndex, currentColor);
            const liberties = checkLiberties(rowIndex, colIndex, currentColor);
            if (liberties) {
                setBoardList(newBoardList);
                setCurrentColor(currentColor === "black" ? "white" : "black");
            } else {
                newBoardList[rowIndex][colIndex] = null; 
            }
        }
    };

    return (
        <div className="mainContainer">
            <div className="board-container">
                <canvas
                    ref={canvasRef}
                    width={570}
                    height={570}
                    className="go-board-canvas"
                    onClick={handleClick}
                />
                <div alt="Go Board" className="go-board-image">  </div>
            </div>                      
            <div className="whitesBowl">
                    <PrisonerBowl color="black" count={prisoners.black} />
            </div>
            <div className="blacksBowl">
                <PrisonerBowl color="white" count={prisoners.white} className="blacksBowl"/>
            </div>
        </div>

    );
}

export default Board;
