import { useEffect, useRef, useState } from "react";
import goBoardImage from '../assets/boardImg.png';
import "./Board.css";

function Board() {
    const canvasRef = useRef(null);
    const [boardList, setBoardList] = useState(createBoard());
    const [currentColor, setCurrentColor] = useState("black"); // Go starts with black stones

    // Function to create the 19x19 board for the compute
    function createBoard() {
        const currentBoard = [];
        for (let i = 0; i < 19; i++) { 
            const row = Array(19).fill(null); // Use null to represent empty cells
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
            if (r < 0 || r >= 19 || c < 0 || c >= 19 || visited.has(`${r},${c}`)) return;
            visited.add(`${r},${c}`);

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

    // Handle mouse clicks to place stones
    const handleClick = (event) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left; // X position relative to the canvas
        const y = event.clientY - rect.top;  // Y position relative to the canvas

        const cellSize = 30;
        const colIndex = Math.floor(x / cellSize);
        const rowIndex = Math.floor(y / cellSize);

        // Check for valid move
        if (boardList[rowIndex][colIndex] === null) {
            const liberties = checkLiberties(rowIndex, colIndex, currentColor);
            if (liberties) { // Place stone only if it has liberties
                const newBoardList = [...boardList];
                newBoardList[rowIndex][colIndex] = currentColor; // Set stone color
                setBoardList(newBoardList);
                setCurrentColor(currentColor === "black" ? "white" : "black"); // Switch turn
            }
            else {
                return
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
