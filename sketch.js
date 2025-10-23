// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------


// 確保這是全域變數
let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; // 用於 p5.js 繪圖的文字
let fireworks = []; // 用於儲存煙火實例的陣列
let gravity; // 用於粒子系統的重力向量


window.addEventListener('message', function (event) {
    // 執行來源驗證...
    // ...
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score; // 更新全域變數
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 
        
        // ----------------------------------------
        // 關鍵步驟 2: 確保繪製迴圈啟動
        // ----------------------------------------
        if (typeof loop === 'function') {
            loop(); // 【重要！】接收到分數時，確保繪圖迴圈啟動
        }
    }
}, false);


// =================================================================
// 步驟二：使用 p5.js 繪製分數 (在網頁 Canvas 上顯示)
// -----------------------------------------------------------------

// 【新增類別 1】Particle 類別 - 代表煙火爆炸後的小碎片
class Particle {
    constructor(x, y, hu, firework) {
        this.pos = createVector(x, y);
        this.firework = firework;
        this.lifespan = 255;
        this.hu = hu;
        this.acc = createVector(0, 0);

        if (this.firework) {
            this.vel = createVector(0, random(-12, -8));
        } else {
            this.vel = p5.Vector.random2D();
            this.vel.mult(random(2, 10));
        }
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        if (!this.firework) {
            this.vel.mult(0.9);
            this.lifespan -= 4;
        }
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0);
    }

    done() {
        return this.lifespan < 0;
    }

    show() {
        colorMode(HSB);
        if (!this.firework) {
            strokeWeight(2);
            stroke(this.hu, 255, 255, this.lifespan);
        } else {
            strokeWeight(4);
            stroke(this.hu, 255, 255);
        }
        point(this.pos.x, this.pos.y);
    }
}

// 【新增類別 2】Firework 類別 - 代表整個煙火流程
class Firework {
    constructor(x) {
        this.hu = random(255); 
        this.firework = new Particle(x, height, this.hu, true);
        this.exploded = false;
        this.particles = [];
    }

    update() {
        if (!this.exploded) {
            this.firework.applyForce(gravity);
            this.firework.update();

            // 檢查火箭是否達到最高點
            if (this.firework.vel.y >= 0) {
                this.exploded = true;
                this.explode();
            }
        }

        // 更新爆炸後的碎片
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].applyForce(gravity);
            this.particles[i].update();
            if (this.particles[i].done()) {
                this.particles.splice(i, 1);
            }
        }
    }

    explode() {
        // 產生 100 個爆炸碎片
        for (let i = 0; i < 100; i++) {
            let p = new Particle(this.firework.pos.x, this.firework.pos.y, this.hu, false);
            this.particles.push(p);
        }
    }

    show() {
        if (!this.exploded) {
            this.firework.show();
        }
        for (let p of this.particles) {
            p.show();
        }
    }

    done() {
        return this.exploded && this.particles.length === 0;
    }
}


function setup() { 
    createCanvas(windowWidth / 2, windowHeight / 2); 
    // 【修改】設置重力 (向下)
    gravity = createVector(0, 0.2);
    // 【修改】將 background 移到 draw() 中，並使用 noLoop() 暫停，直到分數接收到為止
    noLoop(); 
} 

function draw() { 
    // 【修改】設置半透明的背景，營造拖尾效果
    background(0, 0, 0, 50); // 黑色夜空，半透明疊加
    
    // 計算百分比
    let percentage = (finalScore / maxScore) * 100;

    textSize(80); 
    textAlign(CENTER);
    
    // -----------------------------------------------------------------
    // A. 根據分數區間改變文本顏色和內容 (畫面反映一)
    // -----------------------------------------------------------------
    if (percentage >= 90) {
        // 滿分或高分：顯示鼓勵文本
        fill(0, 200, 50);
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
        // 【新增：啟動煙火特效】
        if (random(1) < 0.05) { 
            fireworks.push(new Firework(random(width)));
        }
        
    } else if (percentage >= 60) {
        // 中等分數：顯示一般文本
        fill(255, 181, 35); 
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
        // 非高分時，清空現有的煙火
        fireworks = [];
        
    } else if (percentage > 0) {
        // 低分：顯示警示文本
        fill(200, 0, 0); 
        text("需要加強努力！", width / 2, height / 2 - 50);
        
        // 非高分時，清空現有的煙火
        fireworks = [];
        
    } else {
        // 尚未收到分數或分數為 0
        fill(150);
        text("等待成績...", width / 2, height / 2); // 為了讓 draw 執行，這裡不顯示 scoreText
        
        // 在分數未接收或為 0 時停止迴圈，節省資源
        noLoop(); // 【重要！】暫停迴圈
        fireworks = [];
    }

    // 顯示具體分數
    textSize(50);
    fill(50);
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // -----------------------------------------------------------------
    // B. 處理煙火動畫
    // -----------------------------------------------------------------
    if (percentage >= 90) {
        // 畫一個大圓圈代表完美
        fill(0, 200, 50, 150);
        noStroke();
        circle(width / 2, height / 2 + 150, 150);
        
        // 【處理煙火動畫】更新並顯示所有煙火
        for (let i = fireworks.length - 1; i >= 0; i--) {
            fireworks[i].update();
            fireworks[i].show();
            if (fireworks[i].done()) {
                fireworks.splice(i, 1); // 移除已完成的煙火
            }
        }
        
    } else if (percentage >= 60) {
        // 畫一個方形
        fill(255, 181, 35, 150);
        rectMode(CENTER);
        rect(width / 2, height / 2 + 150, 150, 150);
    }
}
