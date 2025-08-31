'use client';

import { useEffect, useRef, useState } from 'react';

export default function TennisGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [cpuScore, setCpuScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  // ゲームの状態
  const gameState = useRef({
    playerY: 300,
    cpuY: 300,
    ballX: 400,
    ballY: 300,
    ballSpeedX: 5,
    ballSpeedY: 3,
    paddleSpeed: 8,
    keys: {
      ArrowUp: false,
      ArrowDown: false,
    },
  });

  // ゲーム定数
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const PADDLE_WIDTH = 15;
  const PADDLE_HEIGHT = 100;
  const BALL_SIZE = 10;
  const CPU_SPEED = 4;
  const MAX_BALL_SPEED = 12;
  const WINNING_SCORE = 10;

  // キーボードイベント
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key in gameState.current.keys) {
        gameState.current.keys[e.key as keyof typeof gameState.current.keys] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key in gameState.current.keys) {
        gameState.current.keys[e.key as keyof typeof gameState.current.keys] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // ボールをリセット
  const resetBall = (towardPlayer: boolean) => {
    gameState.current.ballX = CANVAS_WIDTH / 2;
    gameState.current.ballY = CANVAS_HEIGHT / 2;
    gameState.current.ballSpeedX = towardPlayer ? -5 : 5;
    gameState.current.ballSpeedY = (Math.random() - 0.5) * 6;
  };

  // ゲームリセット
  const resetGame = () => {
    setPlayerScore(0);
    setCpuScore(0);
    setWinner(null);
    gameState.current.playerY = 300;
    gameState.current.cpuY = 300;
    resetBall(Math.random() > 0.5);
    setGameStarted(true);
  };

  // ゲームループ
  useEffect(() => {
    if (!gameStarted || winner) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = () => {
      const state = gameState.current;

      // プレイヤーの移動
      if (state.keys.ArrowUp && state.playerY > PADDLE_HEIGHT / 2) {
        state.playerY -= state.paddleSpeed;
      }
      if (state.keys.ArrowDown && state.playerY < CANVAS_HEIGHT - PADDLE_HEIGHT / 2) {
        state.playerY += state.paddleSpeed;
      }

      // CPUの移動（簡単なAI）
      const cpuTargetY = state.ballY;
      const cpuDiff = cpuTargetY - state.cpuY;
      if (Math.abs(cpuDiff) > CPU_SPEED) {
        state.cpuY += cpuDiff > 0 ? CPU_SPEED : -CPU_SPEED;
      } else {
        state.cpuY = cpuTargetY;
      }

      // CPUパドルの画面境界制限
      if (state.cpuY < PADDLE_HEIGHT / 2) {
        state.cpuY = PADDLE_HEIGHT / 2;
      }
      if (state.cpuY > CANVAS_HEIGHT - PADDLE_HEIGHT / 2) {
        state.cpuY = CANVAS_HEIGHT - PADDLE_HEIGHT / 2;
      }

      // ボールの移動
      state.ballX += state.ballSpeedX;
      state.ballY += state.ballSpeedY;

      // 上下の壁での跳ね返り
      if (state.ballY <= BALL_SIZE / 2 || state.ballY >= CANVAS_HEIGHT - BALL_SIZE / 2) {
        state.ballSpeedY = -state.ballSpeedY;
      }

      // プレイヤーパドルとの衝突判定
      if (
        state.ballX - BALL_SIZE / 2 <= 50 + PADDLE_WIDTH &&
        state.ballX + BALL_SIZE / 2 >= 50 &&
        state.ballY >= state.playerY - PADDLE_HEIGHT / 2 &&
        state.ballY <= state.playerY + PADDLE_HEIGHT / 2
      ) {
        if (state.ballSpeedX < 0) {
          state.ballSpeedX = -state.ballSpeedX;
          // ボールの角度を変える
          const relativeIntersectY = state.playerY - state.ballY;
          const normalizedRelativeIntersectionY = relativeIntersectY / (PADDLE_HEIGHT / 2);
          state.ballSpeedY = -normalizedRelativeIntersectionY * 5;
          
          // スピードを少し上げる
          if (Math.abs(state.ballSpeedX) < MAX_BALL_SPEED) {
            state.ballSpeedX *= 1.1;
          }
        }
      }

      // CPUパドルとの衝突判定
      if (
        state.ballX + BALL_SIZE / 2 >= CANVAS_WIDTH - 50 - PADDLE_WIDTH &&
        state.ballX - BALL_SIZE / 2 <= CANVAS_WIDTH - 50 &&
        state.ballY >= state.cpuY - PADDLE_HEIGHT / 2 &&
        state.ballY <= state.cpuY + PADDLE_HEIGHT / 2
      ) {
        if (state.ballSpeedX > 0) {
          state.ballSpeedX = -state.ballSpeedX;
          // ボールの角度を変える
          const relativeIntersectY = state.cpuY - state.ballY;
          const normalizedRelativeIntersectionY = relativeIntersectY / (PADDLE_HEIGHT / 2);
          state.ballSpeedY = -normalizedRelativeIntersectionY * 5;
          
          // スピードを少し上げる
          if (Math.abs(state.ballSpeedX) < MAX_BALL_SPEED) {
            state.ballSpeedX *= 1.1;
          }
        }
      }

      // 得点判定
      if (state.ballX < 0) {
        // CPUが得点
        setCpuScore(prev => {
          const newScore = prev + 1;
          if (newScore >= WINNING_SCORE) {
            setWinner('CPU');
          }
          return newScore;
        });
        resetBall(true);
      } else if (state.ballX > CANVAS_WIDTH) {
        // プレイヤーが得点
        setPlayerScore(prev => {
          const newScore = prev + 1;
          if (newScore >= WINNING_SCORE) {
            setWinner('プレイヤー');
          }
          return newScore;
        });
        resetBall(false);
      }

      // 描画
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // コートのライン
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 15]);
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2, 0);
      ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);

      // プレイヤーパドル
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(
        50,
        state.playerY - PADDLE_HEIGHT / 2,
        PADDLE_WIDTH,
        PADDLE_HEIGHT
      );

      // CPUパドル
      ctx.fillStyle = '#f87171';
      ctx.fillRect(
        CANVAS_WIDTH - 50 - PADDLE_WIDTH,
        state.cpuY - PADDLE_HEIGHT / 2,
        PADDLE_WIDTH,
        PADDLE_HEIGHT
      );

      // ボール
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(state.ballX, state.ballY, BALL_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
    };

    const intervalId = setInterval(gameLoop, 1000 / 60);

    return () => clearInterval(intervalId);
  }, [gameStarted, winner]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
      <h1 className="text-4xl font-bold mb-4">テニスゲーム</h1>
      
      {/* スコアボード */}
      <div className="flex justify-center items-center gap-8 mb-4 text-2xl">
        <div className="text-green-400">
          プレイヤー: {playerScore}
        </div>
        <div className="text-gray-400">vs</div>
        <div className="text-red-400">
          CPU: {cpuScore}
        </div>
      </div>

      {/* ゲームキャンバス */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-2 border-gray-600 rounded-lg shadow-2xl"
      />

      {/* 操作説明とスタートボタン */}
      <div className="mt-4 text-center">
        {!gameStarted && !winner && (
          <>
            <p className="mb-2">↑↓キーでパドルを操作</p>
            <p className="mb-4">先に10点取った方が勝利！</p>
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
            >
              ゲームスタート
            </button>
          </>
        )}

        {winner && (
          <div className="text-center">
            <p className="text-3xl font-bold mb-4">
              {winner === 'プレイヤー' ? '🎉 勝利！' : '😢 敗北...'}
            </p>
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
            >
              もう一度プレイ
            </button>
          </div>
        )}

        {gameStarted && !winner && (
          <p className="text-gray-400">↑↓キーでパドルを操作</p>
        )}
      </div>
    </div>
  );
}