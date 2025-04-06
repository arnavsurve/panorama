import React, { useState, useRef, useEffect } from 'react';
import './PongLoadingGame.css';

const PongLoadingGame = () => {
  const canvasRef = useRef(null);
  const requestRef = useRef(null);
  const previousTimeRef = useRef(null);
  const scoreRef = useRef(0);
  const [displayScore, setDisplayScore] = useState(0);

  // Game constants - updated dimensions
  const WIDTH = 360;
  const HEIGHT = 250;
  const PADDLE_HEIGHT = 60;
  const PADDLE_WIDTH = 10;
  const BALL_RADIUS = 8;
  
  // Game state reference object - using refs to avoid re-renders
  const gameStateRef = useRef({
    paddleY: HEIGHT / 2 - PADDLE_HEIGHT / 2,
    ballX: WIDTH / 2,
    ballY: HEIGHT / 2,
    ballSpeedX: 4,
    ballSpeedY: 4,
    computerPaddleY: HEIGHT / 2 - PADDLE_HEIGHT / 2,
    computerSpeed: 3,
    isRunning: true
  });

  // Handle mouse/touch movement - optimized with throttling
  const lastMoveTimeRef = useRef(0);
  const handleMove = (e) => {
    const now = performance.now();
    // Throttle to every 16ms (approx 60fps)
    if (now - lastMoveTimeRef.current < 16) return;
    lastMoveTimeRef.current = now;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    let clientY;
    
    // Handle both mouse and touch events
    if (e.type === 'mousemove') {
      clientY = e.clientY;
    } else if (e.type === 'touchmove' && e.touches.length > 0) {
      clientY = e.touches[0].clientY;
      e.preventDefault(); // Prevent scrolling on touch devices
    } else {
      return;
    }

    // Calculate y-position relative to canvas
    const relativeY = clientY - rect.top;
    
    // Update paddle position, keeping it within canvas bounds
    gameStateRef.current.paddleY = Math.max(
      0, 
      Math.min(HEIGHT - PADDLE_HEIGHT, relativeY)
    );
  };

  // Game loop using requestAnimationFrame
  const updateGame = (time) => {
    if (previousTimeRef.current === undefined) {
      previousTimeRef.current = time;
    }
    
    const deltaTime = time - previousTimeRef.current;
    previousTimeRef.current = time;
    
    if (!gameStateRef.current.isRunning) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    
    // Clear with better performance
    context.clearRect(0, 0, WIDTH, HEIGHT);
    context.fillStyle = 'rgba(30, 30, 30, 0.5)';
    context.fillRect(0, 0, WIDTH, HEIGHT);
    
    // Extract values for easier access
    const { 
      paddleY, ballX, ballY, ballSpeedX, ballSpeedY, 
      computerPaddleY, computerSpeed 
    } = gameStateRef.current;
    
    // Calculate time factor for smooth animation across different frame rates
    const timeScale = deltaTime / (1000 / 60); // normalize to 60fps
    
    // Update ball position with time scaling
    const newBallX = ballX + ballSpeedX * timeScale;
    const newBallY = ballY + ballSpeedY * timeScale;
    
    // Ball physics
    let newBallSpeedX = ballSpeedX;
    let newBallSpeedY = ballSpeedY;
    
    // Wall collision (top and bottom)
    if (newBallY < BALL_RADIUS || newBallY > HEIGHT - BALL_RADIUS) {
      newBallSpeedY = -newBallSpeedY;
    }
    
    // Paddle collision (left - player)
    if (
      newBallX - BALL_RADIUS < PADDLE_WIDTH && 
      newBallY > paddleY && 
      newBallY < paddleY + PADDLE_HEIGHT
    ) {
      // Calculate angle based on where ball hits paddle
      const hitPosition = (newBallY - paddleY) / PADDLE_HEIGHT;
      // Angle between -45 and 45 degrees
      const angle = (hitPosition - 0.5) * Math.PI / 2;
      
      const speed = Math.sqrt(newBallSpeedX * newBallSpeedX + newBallSpeedY * newBallSpeedY);
      newBallSpeedX = Math.cos(angle) * speed * 1.05; // slightly increase speed
      newBallSpeedY = Math.sin(angle) * speed * 1.05;
      
      // Ensure the ball moves right
      if (newBallSpeedX < 0) newBallSpeedX = -newBallSpeedX;
      
      // Increase score
      scoreRef.current += 10;
      // Only update displayed score every 5 frames for better performance
      if (Math.random() < 0.2) setDisplayScore(scoreRef.current);
    }
    
    // Paddle collision (right - computer)
    if (
      newBallX + BALL_RADIUS > WIDTH - PADDLE_WIDTH && 
      newBallY > computerPaddleY && 
      newBallY < computerPaddleY + PADDLE_HEIGHT
    ) {
      // Similar angle calculation for the computer paddle
      const hitPosition = (newBallY - computerPaddleY) / PADDLE_HEIGHT;
      const angle = (hitPosition - 0.5) * Math.PI / 2;
      
      const speed = Math.sqrt(newBallSpeedX * newBallSpeedX + newBallSpeedY * newBallSpeedY);
      newBallSpeedX = Math.cos(angle + Math.PI) * speed * 1.05; // flip angle and increase speed
      newBallSpeedY = Math.sin(angle) * speed * 1.05;
      
      // Ensure the ball moves left
      if (newBallSpeedX > 0) newBallSpeedX = -newBallSpeedX;
    }
    
    // Ball out of bounds - reset ball
    let resetBall = false;
    if (newBallX < 0 || newBallX > WIDTH) {
      resetBall = true;
    }
    
    // Computer AI - move towards the ball with prediction
    const targetY = computerPaddleY + PADDLE_HEIGHT / 2;
    let desiredY = newBallY;
    
    // Only chase the ball when it's moving toward the computer
    if (newBallSpeedX > 0) {
      // Simple prediction
      const timeToReach = (WIDTH - newBallX) / newBallSpeedX;
      const predictedY = newBallY + newBallSpeedY * timeToReach;
      
      // Keep prediction in bounds
      desiredY = Math.max(PADDLE_HEIGHT / 2, Math.min(HEIGHT - PADDLE_HEIGHT / 2, predictedY));
    }
    
    let newComputerPaddleY = computerPaddleY;
    if (targetY < desiredY - 10) {
      newComputerPaddleY += computerSpeed * timeScale;
    } else if (targetY > desiredY + 10) {
      newComputerPaddleY -= computerSpeed * timeScale;
    }
    
    // Keep computer paddle within bounds
    newComputerPaddleY = Math.max(0, Math.min(HEIGHT - PADDLE_HEIGHT, newComputerPaddleY));
    
    // Update game state
    if (resetBall) {
      gameStateRef.current = {
        ...gameStateRef.current,
        ballX: WIDTH / 2,
        ballY: HEIGHT / 2,
        ballSpeedX: 4 * (Math.random() > 0.5 ? 1 : -1),
        ballSpeedY: 4 * (Math.random() > 0.5 ? 1 : -1),
        computerPaddleY: newComputerPaddleY
      };
    } else {
      gameStateRef.current = {
        ...gameStateRef.current,
        ballX: newBallX,
        ballY: newBallY,
        ballSpeedX: newBallSpeedX,
        ballSpeedY: newBallSpeedY,
        computerPaddleY: newComputerPaddleY
      };
    }
    
    // Draw only what we need (minimizing draw calls)
    // Background is already drawn
    
    // Draw paddles
    context.fillStyle = 'white';
    // Left paddle (player)
    context.fillRect(0, paddleY, PADDLE_WIDTH, PADDLE_HEIGHT);
    // Right paddle (computer)
    context.fillRect(
      WIDTH - PADDLE_WIDTH, 
      computerPaddleY, 
      PADDLE_WIDTH, 
      PADDLE_HEIGHT
    );
    
    // Draw ball
    context.beginPath();
    context.arc(ballX, ballY, BALL_RADIUS, 0, Math.PI * 2);
    context.fill();
    
    // Draw center line (only once every 3 frames to improve performance)
    if (Math.floor(time / 50) % 3 === 0) {
      context.beginPath();
      context.setLineDash([5, 15]);
      context.moveTo(WIDTH / 2, 0);
      context.lineTo(WIDTH / 2, HEIGHT);
      context.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      context.stroke();
    }
    
    // Continue animation loop
    requestRef.current = requestAnimationFrame(updateGame);
  };
  
  // Initialize game
  useEffect(() => {
    // Start the animation loop
    requestRef.current = requestAnimationFrame(updateGame);
    
    // Set initial score
    scoreRef.current = 0;
    setDisplayScore(0);
    
    // Clean up on unmount
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);
  
  // Attach and clean up event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Add mouse and touch event listeners
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('touchmove', handleMove);
    
    // Clean up on unmount
    return () => {
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('touchmove', handleMove);
    };
  }, []);
  
  return (
    <div className="pong-container">
      <div className="pong-header">
        <div className="score">Score: {displayScore}</div>
      </div>
      
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        className="pong-canvas"
      />
    </div>
  );
};

export default PongLoadingGame;