import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function UpgradeWheel({ chance, onComplete, spinning, result }) {
  const canvasRef = useRef(null);
  const [rotation, setRotation] = useState(0);
  const [currentAngle, setCurrentAngle] = useState(0);

  const winAngle = (chance / 100) * 360;
  const loseAngle = 360 - winAngle;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 8;

    ctx.clearRect(0, 0, size, size);

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate((currentAngle * Math.PI) / 180);
    ctx.translate(-center, -center);

    const startWin = -Math.PI / 2;
    const endWin = startWin + (winAngle * Math.PI) / 180;

    // Win segment
    const winGrad = ctx.createRadialGradient(center, center, 0, center, center, radius);
    winGrad.addColorStop(0, '#1a3a1a');
    winGrad.addColorStop(0.7, '#0d6b2e');
    winGrad.addColorStop(1, '#00ff5a');
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, startWin, endWin);
    ctx.closePath();
    ctx.fillStyle = winGrad;
    ctx.fill();

    // Lose segment
    const loseGrad = ctx.createRadialGradient(center, center, 0, center, center, radius);
    loseGrad.addColorStop(0, '#3a1a1a');
    loseGrad.addColorStop(0.7, '#6b0d0d');
    loseGrad.addColorStop(1, '#ff3a3a');
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, endWin, startWin + 2 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = loseGrad;
    ctx.fill();

    // Divider lines
    ctx.strokeStyle = '#ffffff40';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(center, center);
    const x1 = center + radius * Math.cos(startWin);
    const y1 = center + radius * Math.sin(startWin);
    ctx.lineTo(x1, y1);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(center, center);
    const x2 = center + radius * Math.cos(endWin);
    const y2 = center + radius * Math.sin(endWin);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Tick marks around edge
    for (let i = 0; i < 72; i++) {
      const angle = (i / 72) * Math.PI * 2;
      const innerR = i % 9 === 0 ? radius - 16 : radius - 8;
      ctx.beginPath();
      ctx.moveTo(
        center + innerR * Math.cos(angle),
        center + innerR * Math.sin(angle)
      );
      ctx.lineTo(
        center + radius * Math.cos(angle),
        center + radius * Math.sin(angle)
      );
      ctx.strokeStyle = '#ffffff30';
      ctx.lineWidth = i % 9 === 0 ? 2 : 1;
      ctx.stroke();
    }

    // Center circle
    const centerGrad = ctx.createRadialGradient(center, center, 0, center, center, 35);
    centerGrad.addColorStop(0, '#2a2a3a');
    centerGrad.addColorStop(1, '#1a1a2a');
    ctx.beginPath();
    ctx.arc(center, center, 35, 0, Math.PI * 2);
    ctx.fillStyle = centerGrad;
    ctx.fill();
    ctx.strokeStyle = '#de9b35';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center text
    ctx.fillStyle = '#de9b35';
    ctx.font = 'bold 16px Rajdhani';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${chance.toFixed(1)}%`, center, center);

    ctx.restore();

    // Pointer (top, outside canvas rotation)
    ctx.beginPath();
    ctx.moveTo(center - 12, 4);
    ctx.lineTo(center + 12, 4);
    ctx.lineTo(center, 24);
    ctx.closePath();
    ctx.fillStyle = '#de9b35';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();

  }, [chance, winAngle, currentAngle]);

  useEffect(() => {
    if (!spinning) return;

    const spins = 5 + Math.random() * 5;
    let targetAngle;

    if (result) {
      const winMidAngle = winAngle / 2;
      const randomOffset = (Math.random() - 0.5) * (winAngle * 0.7);
      targetAngle = spins * 360 + (360 - winMidAngle - randomOffset);
    } else {
      const loseMidAngle = winAngle + loseAngle / 2;
      const randomOffset = (Math.random() - 0.5) * (loseAngle * 0.7);
      targetAngle = spins * 360 + (360 - loseMidAngle - randomOffset);
    }

    setRotation(targetAngle);

    const duration = 4000;
    const startTime = Date.now();
    const startAngle = currentAngle;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const angle = startAngle + (targetAngle - startAngle) * eased;
      setCurrentAngle(angle % 360);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(() => onComplete?.(), 300);
      }
    };

    requestAnimationFrame(animate);
  }, [spinning]);

  return (
    <div className="wheel-container">
      <canvas
        ref={canvasRef}
        width={320}
        height={320}
        className="upgrade-wheel-canvas"
      />
      <div className="wheel-labels">
        <span className="wheel-label win">ВЫИГРЫШ</span>
        <span className="wheel-label lose">ПРОИГРЫШ</span>
      </div>
    </div>
  );
}
