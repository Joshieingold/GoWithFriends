import { useEffect, useRef, useState } from "react";
import goBoardImage from '../assets/boardImg.png';
import "./Board.css";

function Board() {
    const canvasRef = useRef(null);
    const [boardList, setBoardList] = useState(createBoard());
    const [currentColor, setCurrentColor] = useState("black");
    const [prisoners, setPrisoners] = useState({ black: 0, white: 0 }); // Count prisoners

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
        const cellSize = 30; // Size of each cell

        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);

        // This is the invisable grid the stones are placed on
        context.strokeStyle = "rgba(0, 0, 200, 0)"; // invisable
        for (let i = 0; i <= 19; i++) {
            context.beginPath();
            context.moveTo(i * cellSize, 0);
            context.lineTo(i * cellSize, 570);
            context.stroke();

            context.beginPath();
            context.moveTo(0, i * cellSize);
            context.lineTo(570, i * cellSize);
            context.stroke();
        }

        // The gameboard grid.
        context.strokeStyle = "#000000"; 
        for (let i = 0; i <= 19; i++) {
            context.beginPath();
            const offset = cellSize / 2; // This puts the grid in the center of the red grid.
            context.moveTo(i * cellSize + offset, 0);
            context.lineTo(i * cellSize + offset, 570);
            context.stroke();

            context.beginPath();
            context.moveTo(0, i * cellSize + offset);
            context.lineTo(570, i * cellSize + offset);
            context.stroke();
        }

        // Draw stones
        boardList.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                if (cell) { // If there's a stone, draw it
                    const x = colIndex * cellSize + cellSize / 2;
                    const y = rowIndex * cellSize + cellSize / 2;
                    context.beginPath();
                    context.arc(x, y, cellSize / 2.7, 0, Math.PI * 2); // Stone size
                    context.fillStyle = cell; // Use the color from boardList
                    context.fill();
                    context.stroke();
                }
            });
        });
    }, [boardList]);

    // Function to check liberties
    const checkLiberties = (row, col, color) => {
        const liberties = new Set(); // Creates a list of the empty cords around stone
        const visited = new Set(); // keeps track of places already visited.

        const explore = (r, c) => {
            if (r < 0 || r >= 19 || c < 0 || c >= 19 || visited.has(`${r},${c}`)) return; // checks if the placement is outside of game or visited. if so it returns.
            visited.add(`${r},${c}`); // Else we add those cords to visited.

            if (boardList[r][c] === null) {
                liberties.add(`${r},${c}`);
            } else if (boardList[r][c] === color) {
                explore(r - 1, c); // Up
                explore(r + 1, c); // Down
                explore(r, c - 1); // Left
                explore(r, c + 1); // Right
            }
        };

        explore(row, col);
        return liberties.size > 0 ? liberties : null; // Return liberties if they exist
    };

    const checkAndCapture = (row, col, color) => {
        const opponentColor = color === "black" ? "white" : "black";
        const capturedStones = [];

        const checkLibertiesAndCapture = (r, c, visited) => {
            if (r < 0 || r >= 19 || c < 0 || c >= 19 || visited.has(`${r},${c}`)) return;
            visited.add(`${r},${c}`);

            if (boardList[r][c] === opponentColor) {
                // Check adjacent stones
                if (checkLiberties(r, c, opponentColor) === null) {
                    capturedStones.push([r, c]); // Capture this stone
                    // Continue exploring
                    checkLibertiesAndCapture(r - 1, c, visited);
                    checkLibertiesAndCapture(r + 1, c, visited);
                    checkLibertiesAndCapture(r, c - 1, visited);
                    checkLibertiesAndCapture(r, c + 1, visited);
                }
            }
        };

        // Start checking adjacent stones
        checkLibertiesAndCapture(row - 1, col, new Set());
        checkLibertiesAndCapture(row + 1, col, new Set());
        checkLibertiesAndCapture(row, col - 1, new Set());
        checkLibertiesAndCapture(row, col + 1, new Set());

        // Remove captured stones from the board and update prisoners
        if (capturedStones.length > 0) {
            const newBoardList = [...boardList];
            capturedStones.forEach(([r, c]) => {
                newBoardList[r][c] = null; // Remove stone
            });

            setPrisoners((prev) => ({ ...prev, [opponentColor]: prev[opponentColor] + capturedStones.length }));
            setBoardList(newBoardList); // Update board with captured stones removed
        }
    };
    // Handle mouse clicks to place stones
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
            newBoardList[rowIndex][colIndex] = currentColor; // Place the stone

            // Check for captures around the new stone
            checkAndCapture(rowIndex, colIndex, currentColor);

            // Check liberties for the newly placed stone
            const liberties = checkLiberties(rowIndex, colIndex, currentColor);
            if (liberties) {
                setBoardList(newBoardList);
                setCurrentColor(currentColor === "black" ? "white" : "black");
            } else {
                // Invalid move: Revert placement
                newBoardList[rowIndex][colIndex] = null;
                alert("Invalid move: This stone has no liberties and will die!");
            }
        }
    };

    return (
        <div className="board-container">
            <canvas
                ref={canvasRef}
                width={570}  // Adjust width according to cellSize * 19
                height={570} // Adjust height according to cellSize * 19
                className="go-board-canvas"
                onClick={handleClick} // Add click handler
            />
            <img src={goBoardImage} alt="Go Board" className="go-board-image" />
        </div>
    );
}

export default Board;
