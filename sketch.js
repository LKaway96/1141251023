// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------


// 確保這是全域變數
let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; // 用於 p5.js 繪圖的文字
let fireworks = []; // 【新增】用於儲存煙火實例的陣列
let gravity; // 【新增】用於粒子系統的重力向量


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
        // 關鍵步驟 2: 呼叫重新繪製 (見方案二)
        // ----------------------------------------
        if (typeof redraw === 'function') {
            redraw(); 
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
        this.firework = firework; // true 表示是上升的火箭，false 表示是爆炸後的碎片
        this.lifespan = 255;
        this.hu = hu; // 色相 (Hue)
        this.acc = createVector(0, 0);

        if (this.firework) {
            // 火箭向上飛
            this.vel = createVector(0, random(-12, -8));
        } else {
            // 爆炸碎片，向隨機方向發射
            this.vel = p5.Vector.random2D();
            this.vel.mult(random(2, 10)); // 隨機速度
        }
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        if (!this.firework) {
            // 碎片受重力且速度會衰減 (模擬空氣阻力)
            this.vel.mult(0.9);
            this.lifespan -= 4; // 碎片壽命減少
        }
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0); // 清除加速度
    }

    done() {
        return this.lifespan < 0; // 碎片壽命結束
    }

    show() {
        colorMode(HSB);
        if (!this.firework) {
            // 爆炸碎片
            strokeWeight(2);
            stroke(this.hu, 255, 255, this.lifespan);
        } else {
            // 上升的火箭
            strokeWeight(4);
            stroke(this.hu, 255, 255);
        }
        point(this.pos.x, this.pos.y);
    }
}

// 【新增類別 2】Firework 類別 - 代表整個煙火流程
class Firework {
    constructor(x) {
        // 隨機顏色
        this.hu = random(255); 
        // 創建上升的火箭粒子 (firework=true)
        this.firework = new Particle(x, height, this.hu, true);
        this.exploded = false;
        this.particles = [];
    }

    update() {
        if (!this.exploded) {
            this.firework.applyForce(gravity);
            this.firework.update();

            // 檢查火箭是否達到最高點 (速度為正表示開始下落)
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
                this.particles.splice(i, 1); // 移除壽命結束的粒子
            }
        }
    }

    explode() {
        // 產生 100 個爆炸碎片 (firework=false)
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
        // 火箭已爆炸，且所有碎片都已消失
        return this.exploded && this.particles.length === 0;
    }
}


function setup() { 
    createCanvas(windowWidth / 2, windowHeight / 2); 
    background(255); 
    // 【修改】設置重力 (向下)
    gravity = createVector(0, 0.2);
    // 【修改】允許 draw() 迴圈執行，因為煙火需要動畫，但我們會限制在 high score 時才啟動
    // noLoop(); // 移除 noLoop() 
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
        // 滿分或高分：顯示鼓勵文本，使用鮮豔顏色
        fill(0, 200, 50); // 綠色 [6]
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
        // 【新增：啟動煙火特效】
        // 在高分時，以一定機率發射新煙火
        if (random(1) < 0.05) { 
            // 在畫面底部隨機 X 軸位置發射
            fireworks.push(new Firework(random(width)));
        }
        
    } else if (percentage >= 60) {
        // 中等分數：顯示一般文本，使用黃色 [6]
        fill(255, 181, 35); 
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        // 低分：顯示警示文本，使用紅色 [6]
        fill(200, 0, 0); 
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        // 尚未收到分數或分數為 0
        fill(150);
        text(scoreText, width / 2, height / 2);
    }

    // 顯示具體分數
    textSize(50);
    fill(50);
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // -----------------------------------------------------------------
    // B. 根據分數觸發不同的幾何圖形反映 (畫面反映二)
    // -----------------------------------------------------------------
    
    if (percentage >= 90) {
        // 畫一個大圓圈代表完美 [7]
        fill(0, 200, 50, 150); // 帶透明度
        noStroke();
        circle(width / 2, height / 2 + 150, 150);
        
        // 【新增】更新並顯示所有煙火
        for (let i = fireworks.length - 1; i >= 0; i--) {
            fireworks[i].update();
            fireworks[i].show();
            if (fireworks[i].done()) {
                fireworks.splice(i, 1); // 移除已完成的煙火
            }
        }
        
    } else if (percentage >= 60) {
        // 畫一個方形 [4]
        fill(255, 181, 35, 150);
        rectMode(CENTER);
        rect(width / 2, height / 2 + 150, 150, 150);
        
        // 【新增】非高分時，清空現有的煙火
        fireworks = [];
    }
    
    // 如果您想要更複雜的視覺效果，還可以根據分數修改線條粗細 (strokeWeight) 
    // 或使用 sin/cos 函數讓圖案的動畫效果有所不同 [8, 9]。
}
