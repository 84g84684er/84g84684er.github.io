// --- DOM & 全域變數 ---
const body = document.body;
const canvas = document.getElementById('visualizerCanvas');
const ctx = canvas.getContext('2d');
const welcomeScreen = document.getElementById('welcome-screen');
const startButton = document.getElementById('startButton');
const settingsPanel = document.getElementById('settings-panel');
const hidePanelBtn = document.getElementById('hide-panel-btn');
const showPanelBtn = document.getElementById('show-panel-btn');

// 控制項
const styleSelect = document.getElementById('style-select');
const colorSelect = document.getElementById('color-select');
const bassShakeToggle = document.getElementById('bass-shake-toggle');
const detailDensityRange = document.getElementById('detail-density');
const shapeSizeRange = document.getElementById('shape-size');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let audioContext, analyser, source, frequencyData, timeDomainData;
let animationFrameId;

let lastBassValue = 0;
let bassPulse = 0;

let stars = [];
let meteors = [];
const STAR_COUNT = 500;
const METEOR_MAX_COUNT = 10;

// --- 設定物件 (State Management) ---
const config = {
    style: 'radial-bars', 
    colorScheme: 'neon-dream',
    bassShake: true,
    detailDensity: 250,
    shapeSize: 1.5,
};


// --- ★★★ 核心修改區域：Star 類別的 draw 方法 ★★★ ---
class Star {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.radius = Math.random() * 1.2 + 0.5;
        this.baseAlpha = 0.3 + Math.random() * 0.5;
        this.twinkleSpeed = Math.random() * 0.001;
        this.phase = Math.random() * Math.PI * 2;
    }

    draw(features) {
        // --- 1. 更強烈的節奏反應 ---
        const highFreqBoost = features.highs * 0.8; // 增加高頻對亮度的影響
        const finalRadius = this.radius * (1 + features.bass * 0.6); // 增加低音對大小的影響

        // --- 2. 獨立閃爍邏輯 ---
        const twinkle = Math.abs(Math.sin(this.phase + Date.now() * this.twinkleSpeed));
        // 結合基礎透明度、獨立閃爍、音樂高頻，並確保 alpha 不會超過 1
        const finalAlpha = Math.min(1, this.baseAlpha * twinkle + highFreqBoost);

        // 性能優化：如果星星太暗，則不進行繪製
        if (finalAlpha < 0.05) return;

        // --- 3. 根據色彩配置決定星星顏色 ---
        let starColor;
        
        if (config.colorScheme === 'rainbow') {
            // 彩虹模式：每個星星有固定的顏色，基於其水平位置，創造出靜態但多彩的星空
            const hue = (this.x / canvas.width) * 360;
            // 使用較高的亮度和較低的飽和度，使其看起來像星星而不是霓虹燈
            starColor = `hsl(${hue}, 85%, 75%)`; 
        } else {
            // 其他模式：顏色基於其自身的閃爍亮度，創造出同色系下的動態色彩變化
            // 將 twinkle (0-1) 映射到 0-150，避免顏色過於飽和或太暗
            const colorValue = twinkle * 150; 
            starColor = getColor(colorValue, this.x); // 傳入 x 增加隨機性
        }

        // --- 4. 應用最終顏色和計算出的透明度 ---
        // 使用字串替換，將 'hsl(..)' 轉換為 'hsla(.., finalAlpha)'
        ctx.fillStyle = starColor.replace('hsl', 'hsla').replace(')', `, ${finalAlpha})`);
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, finalRadius, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Meteor {
    constructor() {
        this.reset();
    }
    reset() {
        this.x = Math.random() * canvas.width * 2 - canvas.width / 2;
        this.y = -50;
        this.length = Math.random() * 150 + 100;
        this.speed = Math.random() * 8 + 5;
        this.angle = Math.PI * 0.35;
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
        this.life = 1;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.005;
        if (this.life <= 0 || this.y > canvas.height + 50 || this.x > canvas.width + 50) {
            this.life = 0;
        }
    }
    draw() {
        if (this.life <= 0) return;
        const tailX = this.x - this.length * Math.cos(this.angle);
        const tailY = this.y - this.length * Math.sin(this.angle);
        const gradient = ctx.createLinearGradient(this.x, this.y, tailX, tailY);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${this.life * 0.8})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
    }
}


// --- 事件監聽器 (無變動) ---
startButton.addEventListener('click', init);
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    stars = [];
    for(let i = 0; i < STAR_COUNT; i++) { stars.push(new Star()); }
});
hidePanelBtn.addEventListener('click', () => { body.classList.add('panel-hidden'); });
showPanelBtn.addEventListener('click', () => { body.classList.remove('panel-hidden'); });
styleSelect.addEventListener('change', e => config.style = e.target.value);
colorSelect.addEventListener('change', e => config.colorScheme = e.target.value);
bassShakeToggle.addEventListener('change', e => config.bassShake = e.target.checked);
detailDensityRange.addEventListener('input', e => config.detailDensity = parseInt(e.target.value));
shapeSizeRange.addEventListener('input', e => config.shapeSize = parseFloat(e.target.value));

// --- 初始化函式 (無變動) ---
async function init() {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        if (stream.getAudioTracks().length === 0) {
            alert('錯誤：您沒有分享音訊。請重新操作並在分享時勾選「分享分頁音訊」。');
            return;
        }
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        source = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8; 
        
        const bufferLength = analyser.frequencyBinCount;
        frequencyData = new Uint8Array(bufferLength);
        timeDomainData = new Uint8Array(bufferLength);

        source.connect(analyser);

        for(let i = 0; i < STAR_COUNT; i++) { stars.push(new Star()); }
        for(let i = 0; i < METEOR_MAX_COUNT; i++) { meteors.push(new Meteor()); }
        
        welcomeScreen.classList.add('hidden');
        mainLoop();
    } catch (err) {
        console.error("無法擷取媒體串流。", err);
        alert(`無法開始擷取，錯誤訊息：${err.message}`);
    }
}

// --- 主要動畫迴圈 (無變動) ---
function mainLoop() {
    animationFrameId = requestAnimationFrame(mainLoop);
    analyser.getByteFrequencyData(frequencyData);
    analyser.getByteTimeDomainData(timeDomainData);
    
    const audioFeatures = calculateAudioFeatures();
    
    drawBackground(audioFeatures);

    ctx.save();
    if (config.bassShake && audioFeatures.bass > 0.9) {
        const shake = audioFeatures.bass * 2.5;
        ctx.translate(Math.random() * shake - shake / 2, Math.random() * shake - shake / 2);
    }
    
    visualStyles[config.style](audioFeatures);
    ctx.restore();
}

// --- 繪圖邏輯物件 (無變動) ---
const visualStyles = {
    'radial-bars': drawRadialBars,
    'rings': drawRings,
    'oscilloscope': drawOscilloscope,
};

// --- 音訊特徵計算 (無變動) ---
function calculateAudioFeatures() {
    const bufferLength = analyser.frequencyBinCount;
    const bassEnd = Math.floor(bufferLength * 0.05);
    const midStart = Math.floor(bufferLength * 0.1);
    const midEnd = Math.floor(bufferLength * 0.4);
    const highStart = Math.floor(bufferLength * 0.5);
    
    let bassTotal = 0, midTotal = 0, highTotal = 0, overallTotal = 0;
    for (let i = 0; i < bufferLength; i++) {
        const val = frequencyData[i];
        if (i <= bassEnd) bassTotal += val;
        else if (i >= midStart && i <= midEnd) midTotal += val;
        else if (i >= highStart) highTotal += val;
        overallTotal += val;
    }

    const bass = (bassTotal / (bassEnd + 1)) / 255;
    lastBassValue = lerp(lastBassValue, bass, 0.1);

    return {
        bass: lastBassValue,
        mids: (midTotal / (midEnd - midStart + 1)) / 255,
        highs: (highTotal / (bufferLength - highStart + 1)) / 255,
        overall: (overallTotal / bufferLength) / 255
    };
}

// --- 背景繪製函式 (無變動) ---
function drawBackground(features) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    bassPulse = lerp(bassPulse, features.bass, 0.05);
    if (bassPulse > 0.1) {
        const pulseRadius = canvas.width * 0.5 * bassPulse;
        const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, pulseRadius);
        
        let pulseColor;
        if (config.colorScheme === 'rainbow') {
            const rainbowPulseHue = (Date.now() / 25) % 360;
            pulseColor = `hsl(${rainbowPulseHue}, 90%, 55%)`;
        } else {
            pulseColor = getColor(features.bass * 255, 0);
        }
        
        const gradientColor = pulseColor.replace('hsl', 'hsla').replace(')', ', 0.1)');
        gradient.addColorStop(0, gradientColor);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    stars.forEach(star => star.draw(features));
    
    if (Math.random() < 0.001 + features.mids * 0.03) {
        const deadMeteor = meteors.find(m => m.life <= 0);
        if (deadMeteor) {
            deadMeteor.reset();
        }
    }
    meteors.forEach(meteor => {
        meteor.update();
        meteor.draw();
    });
}


// --- 繪圖函式 (無變動) ---
function drawRadialBars(features){const centerX=canvas.width/2;const centerY=canvas.height/2;const bufferLength=analyser.frequencyBinCount;const baseRadius=80+features.bass*150;const step=Math.max(1,Math.floor(bufferLength/config.detailDensity));ctx.shadowBlur=12;ctx.lineWidth=config.shapeSize*2;const pathsByColor={};for(let i=0;i<bufferLength;i+=step){const barHeight=Math.pow(frequencyData[i]/255,2.2)*canvas.height*0.4*config.shapeSize;if(barHeight<1)continue;const angle=(i/bufferLength)*Math.PI*2;const color=getColor(frequencyData[i],i);if(!pathsByColor[color]){pathsByColor[color]=new Path2D()}const startX=centerX+Math.cos(angle)*baseRadius;const startY=centerY+Math.sin(angle)*baseRadius;const endX=centerX+Math.cos(angle)*(baseRadius+barHeight);const endY=centerY+Math.sin(angle)*(baseRadius+barHeight);pathsByColor[color].moveTo(startX,startY);pathsByColor[color].lineTo(endX,endY)}for(const color in pathsByColor){ctx.strokeStyle=color;ctx.shadowColor=color;ctx.stroke(pathsByColor[color])}ctx.shadowBlur=0}
function drawRings(features){const centerX=canvas.width/2;const centerY=canvas.height/2;ctx.shadowBlur=18;const step=Math.max(1,Math.floor(256/(config.detailDensity/2)));for(let i=1;i<256;i+=step){const index=Math.floor(Math.pow(i/255,2)*(analyser.frequencyBinCount-1));const val=frequencyData[index];if(val<10)continue;const radius=val*config.shapeSize*1.2+features.bass*80;let color;if(config.colorScheme==='rainbow'){const hue=(i/255)*360;color=`hsl(${hue}, 90%, 55%)`}else{color=getColor(val,i)}ctx.strokeStyle=color;ctx.shadowColor=color;ctx.lineWidth=1+features.mids*4*(val/255);ctx.beginPath();ctx.arc(centerX,centerY,radius,0,Math.PI*2);ctx.stroke()}ctx.shadowBlur=0}
function drawOscilloscope(features){const centerY=canvas.height/2;const bufferLength=analyser.frequencyBinCount;const gradient=ctx.createLinearGradient(0,0,canvas.width,0);const brightness=50+features.overall*20;switch(config.colorScheme){case'rainbow':gradient.addColorStop(0,'hsl(0, 100%, 55%)');gradient.addColorStop(0.2,'hsl(60, 100%, 55%)');gradient.addColorStop(0.4,'hsl(120, 100%, 55%)');gradient.addColorStop(0.6,'hsl(180, 100%, 55%)');gradient.addColorStop(0.8,'hsl(240, 100%, 55%)');gradient.addColorStop(1,'hsl(300, 100%, 55%)');break;case'cyberpunk':gradient.addColorStop(0,`hsl(180, 100%, ${brightness}%)`);gradient.addColorStop(1,`hsl(300, 100%, ${brightness}%)`);break;case'lava-fire':gradient.addColorStop(0,`hsl(50, 100%, ${brightness}%)`);gradient.addColorStop(1,`hsl(0, 100%, ${brightness}%)`);break;case'ice-cold':gradient.addColorStop(0,`hsl(180, 100%, ${brightness}%)`);gradient.addColorStop(1,`hsl(240, 100%, ${brightness}%)`);break;case'neon-dream':default:const hue1=(Date.now()/25)%360;const hue2=(hue1+45)%360;const hue3=(hue1+90)%360;gradient.addColorStop(0,`hsl(${hue1}, 100%, ${brightness}%)`);gradient.addColorStop(0.5,`hsl(${hue2}, 100%, ${brightness}%)`);gradient.addColorStop(1,`hsl(${hue3}, 100%, ${brightness}%)`);break}ctx.strokeStyle=gradient;ctx.lineWidth=config.shapeSize+features.overall*3;ctx.shadowColor='rgba(255, 255, 255, 0.5)';ctx.shadowBlur=15;const path=new Path2D();const sliceWidth=canvas.width/bufferLength;path.moveTo(0,centerY);for(let i=0;i<bufferLength;i++){const v=timeDomainData[i]/128;const y=v*canvas.height/2;path.lineTo(i*sliceWidth,y)}path.lineTo(canvas.width,centerY);path.moveTo(0,centerY);for(let i=0;i<bufferLength;i++){const v=timeDomainData[i]/128;const y=canvas.height-(v*canvas.height/2);path.lineTo(i*sliceWidth,y)}path.lineTo(canvas.width,centerY);ctx.stroke(path);ctx.shadowBlur=0}

// --- 助手函式 (無變動) ---
function lerp(start, end, amt) { return (1 - amt) * start + amt * end; }
function getColor(value, index) { value = Math.min(value, 255); switch (config.colorScheme) { case 'cyberpunk': return `hsl(${(value > 128) ? 180 : 300}, 100%, ${60 + value / 8}%)`; case 'lava-fire': return `hsl(${60 - value / 5}, 100%, ${50 + value / 8}%)`; case 'ice-cold': return `hsl(${180 + value / 3}, 100%, ${60 + value / 6}%)`; case 'rainbow': return `hsl(${(index / analyser.frequencyBinCount * 360)}, 90%, 55%)`; case 'neon-dream': default: return `hsl(${(value * 1.5 + index / 5) % 360}, 100%, ${50 + value / 10}%)`; } }