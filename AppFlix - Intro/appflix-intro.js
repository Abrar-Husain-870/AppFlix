/**
 * Appflix Intro Animation Engine
 * Drop-in intro animation for any login page.
 */

const AppflixIntro = (() => {

    function drawVectorLogo(ctx, w, h, scale, leftProg, rightProg, opacity, isZoom) {
        opacity = (opacity === undefined) ? 1.0 : opacity;
        isZoom  = (isZoom  === undefined) ? false : isZoom;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(w / 2, h / 2);
        ctx.scale(scale, scale);

        var infinite = isZoom && (scale > 1.45);

        var leftGrad = ctx.createLinearGradient(-114, 0, 26, 0);
        leftGrad.addColorStop(0,   'rgb(190,22,14)');
        leftGrad.addColorStop(0.6, 'rgb(235,30,20)');
        leftGrad.addColorStop(1,   'rgb(250,35,22)');

        var rightGrad = ctx.createLinearGradient(0, -158.8, 0, infinite ? 600 : 164.5);
        rightGrad.addColorStop(0.0,  'rgb(110,12,8)');
        rightGrad.addColorStop(0.20, 'rgb(160,18,12)');
        rightGrad.addColorStop(0.35, 'rgb(230,28,18)');
        rightGrad.addColorStop(1.0,  'rgb(245,32,20)');

        // 1. Left Leg
        ctx.save();
        ctx.beginPath();
        if (leftProg < 1.0) {
            ctx.rect(-1000, 175 - 345 * leftProg, 2000, 2000);
        } else {
            ctx.rect(-1000, -1000, 2000, 2000);
        }
        ctx.clip();
        ctx.beginPath();
        if (!infinite) {
            ctx.moveTo(-32.0, -163.5);
            ctx.lineTo(26.3, -158.8);
            ctx.lineTo(-31.0, 151.5);
            ctx.quadraticCurveTo(-82, 154.5, -114.0, 161.5);
        } else {
            ctx.moveTo(-32.0, -163.5);
            ctx.lineTo(26.3, -158.8);
            ctx.lineTo(-113.8, 600.0);
            ctx.lineTo(-224.6, 600.0);
        }
        ctx.closePath();
        ctx.fillStyle = leftGrad;
        ctx.fill();

        // Apex Shadow
        if (rightProg > 0.05) {
            ctx.save();
            ctx.beginPath();
            if (!infinite) {
                ctx.moveTo(-32.0, -163.5);
                ctx.lineTo(26.3, -158.8);
                ctx.lineTo(-31.0, 151.5);
                ctx.quadraticCurveTo(-82, 154.5, -114.0, 161.5);
            } else {
                ctx.moveTo(-32.0, -163.5);
                ctx.lineTo(26.3, -158.8);
                ctx.lineTo(-113.8, 600.0);
                ctx.lineTo(-224.6, 600.0);
            }
            ctx.closePath();
            ctx.clip();
            var sEndY = infinite ? 500.0 : 156.5;
            var sEndX = infinite ? -124.93 : -72.5;
            var sg = ctx.createLinearGradient(-2.85, -161.15, sEndX, sEndY);
            sg.addColorStop(0.0,  'rgba(0,0,0,0.70)');
            sg.addColorStop(0.40, 'rgba(0,0,0,0.25)');
            sg.addColorStop(1.0,  'rgba(0,0,0,0.00)');
            ctx.fillStyle = sg;
            ctx.fillRect(-500, -600, 1000, 1200);
            ctx.restore();
        }
        ctx.restore();

        // 2. Right Leg
        if (rightProg > 0.0) {
            ctx.save();
            ctx.beginPath();
            if (rightProg < 1.0) {
                ctx.rect(-1000, -200, 2000, 345 * rightProg + 5);
            } else {
                ctx.rect(-1000, -1000, 2000, 2000);
            }
            ctx.clip();
            ctx.beginPath();
            if (!infinite) {
                ctx.moveTo(-28.2, -158.8);
                ctx.lineTo(33.8, -158.8);
                ctx.lineTo(114.0, 164.5);
                ctx.quadraticCurveTo(82, 157.5, 32.0, 154.5);
            } else {
                ctx.moveTo(-28.2, -158.8);
                ctx.lineTo(33.8, -158.8);
                ctx.lineTo(222.0, 600.0);
                ctx.lineTo(117.6, 600.0);
            }
            ctx.closePath();
            ctx.fillStyle = rightGrad;
            ctx.fill();
            ctx.restore();
        }

        ctx.restore();
    }

    function drawSpectrum(ctx, w, h, frameIndex) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);

        if (!window.spectrumData || !window.spectrumData[frameIndex]) return;

        var profile   = window.spectrumData[frameIndex];
        var dataWidth = profile.length;
        var opacity   = 1.0;
        var absFrame  = frameIndex + 79;
        if (absFrame > 140) opacity = 1.0 - (absFrame - 140) / 20.0;

        ctx.save();
        ctx.globalAlpha = opacity;

        for (var x = 0; x < w; x++) {
            var srcX = Math.floor(x * dataWidth / w);
            var rgb  = profile[srcX];
            ctx.fillStyle = 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
            ctx.fillRect(x, 0, 1.2, h);
        }

        // Vertical vignette
        var vv = ctx.createLinearGradient(0, 0, 0, h);
        vv.addColorStop(0,   'rgba(0,0,0,0.75)');
        vv.addColorStop(0.2, 'rgba(0,0,0,0.15)');
        vv.addColorStop(0.5, 'rgba(0,0,0,0.00)');
        vv.addColorStop(0.8, 'rgba(0,0,0,0.15)');
        vv.addColorStop(1,   'rgba(0,0,0,0.75)');
        ctx.fillStyle = vv;
        ctx.fillRect(0, 0, w, h);

        // Radial vignette
        var rv = ctx.createRadialGradient(w/2, h/2, h/2, w/2, h/2, w/1.2);
        rv.addColorStop(0,   'rgba(0,0,0,0.00)');
        rv.addColorStop(0.8, 'rgba(0,0,0,0.25)');
        rv.addColorStop(1,   'rgba(0,0,0,0.75)');
        ctx.fillStyle = rv;
        ctx.fillRect(0, 0, w, h);

        ctx.restore();
    }

    function renderFrame(ctx, w, h, frameNum) {
        if (frameNum < 15) {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, w, h);

        } else if (frameNum < 25) {
            var p = (frameNum - 15) / 9;
            var leftProg, rightProg, opacity;
            if (p <= 0.45) {
                leftProg  = Math.min(1.0, p / 0.45);
                rightProg = 0.0;
                opacity   = Math.min(1.0, p / 0.10);
            } else {
                leftProg  = 1.0;
                rightProg = Math.min(1.0, (p - 0.45) / 0.55);
                opacity   = 1.0;
            }
            drawVectorLogo(ctx, w, h, 0.49, leftProg, rightProg, opacity);

        } else if (frameNum < 70) {
            var progress = (frameNum - 25) / 45;
            var scale    = 0.49 + 0.51 * Math.pow(progress, 3.5);
            drawVectorLogo(ctx, w, h, scale, 1.0, 1.0, 1.0);

        } else if (frameNum < 79) {
            var progress = (frameNum - 70) / 9;
            var eased    = Math.pow(progress, 3.8);
            var scale    = 1.0 + eased * 14.0;
            ctx.save();
            ctx.translate(0, -35 * eased * scale);
            drawVectorLogo(ctx, w, h, scale, 1.0, 1.0, 1.0, true);
            ctx.restore();

        } else {
            drawSpectrum(ctx, w, h, frameNum - 79);
        }
    }

    function play(options) {
        options = options || {};
        var canvasId   = options.canvasId   || 'appflix-intro-canvas';
        var audioSrc   = options.audioSrc   !== undefined ? options.audioSrc : 'intro_audio.mp3';
        var onComplete = options.onComplete || null;

        var canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error('AppflixIntro: canvas not found with id="' + canvasId + '"');
            return;
        }

        canvas.style.position   = 'fixed';
        canvas.style.top        = '0';
        canvas.style.left       = '0';
        canvas.style.width      = '100vw';
        canvas.style.height     = '100vh';
        canvas.style.zIndex     = '9999';
        canvas.style.display    = 'block';
        canvas.style.background = '#000';
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;

        var ctx = canvas.getContext('2d');

        var audio = null;
        if (audioSrc) {
            audio = new Audio(audioSrc);
            audio.preload = 'auto';
        }

        var totalFrames  = 160;
        var fps          = 30;
        var currentFrame = 1;
        var lastTime     = null;
        var accumulator  = 0;
        var rafId        = null;

        function tick(timestamp) {
            if (!lastTime) lastTime = timestamp;
            var delta = timestamp - lastTime;
            lastTime  = timestamp;
            accumulator += delta;

            var msPerFrame = 1000 / fps;
            while (accumulator >= msPerFrame) {
                currentFrame++;
                accumulator -= msPerFrame;
                if (currentFrame > totalFrames) {
                    cancelAnimationFrame(rafId);
                    canvas.style.display = 'none';
                    if (onComplete) onComplete();
                    return;
                }
            }

            renderFrame(ctx, canvas.width, canvas.height, currentFrame);
            rafId = requestAnimationFrame(tick);
        }

        if (audio) audio.play().catch(function() {});
        rafId = requestAnimationFrame(tick);
    }

    return { play: play };

})();
