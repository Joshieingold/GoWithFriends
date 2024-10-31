import { useState } from "react";
import "./board.css"; // Import a CSS file for styling

function Board() {
    // Creates an empty board.
    const createBoard = () => {
        const currentBoard = [];
        for (let i = 0; i < 20; i++) {
            const row = Array(20).fill("x"); // Create a row with 19 empty strings
            currentBoard.push(row); // Push the row to the board
        }
        return currentBoard;
    };

    const [boardList] = useState(createBoard());

    return (

            <div className="board">
                {boardList.map((row, rowIndex) => (
                    <div key={rowIndex} className="board-row">
                        {row.map((cell, colIndex) => (
                            <div key={colIndex} className="board-cell">
                                {cell}
                            </div>
                        ))}
                    </div>
                ))}
            </div>


    );
}

export default Board;
