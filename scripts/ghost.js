class Ghost {
    constructor(
        x,
        y,
        width,
        height,
        speed,
        imageX,
        imageY,
        imageWidth,
        imageHeight,
        range
    ) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.baseSpeed = speed;
        this.frightenedSpeed = Math.max(oneBlockSize / 10, speed * 0.75);
        this.eatenSpeed = Math.max(speed * 1.35, oneBlockSize / 4);
        this.speed = speed;
        this.direction = DIRECTION_RIGHT;
        this.imageX = imageX;
        this.imageY = imageY;
        this.imageHeight = imageHeight;
        this.imageWidth = imageWidth;
        this.range = range;
        this.state = "normal";
        this.randomTargetIndex = parseInt(
            Math.random() * randomTargetsForGhosts.length,
            10
        );
        this.target = randomTargetsForGhosts[this.randomTargetIndex];
        this.directionTimer = setInterval(() => {
            this.changeRandomDirection();
        }, 10000);
    }

    dispose() {
        if (this.directionTimer) {
            clearInterval(this.directionTimer);
            this.directionTimer = null;
        }
    }

    isInRange() {
        const xDistance = Math.abs(pacman.getMapX() - this.getMapX());
        const yDistance = Math.abs(pacman.getMapY() - this.getMapY());
        return Math.sqrt(xDistance * xDistance + yDistance * yDistance) <= this.range;
    }

    isFrightened() {
        return this.state === "frightened";
    }

    isEaten() {
        return this.state === "eaten";
    }

    setState(nextState) {
        if (this.state === nextState) return;
        this.state = nextState;
        this.syncSpeedWithState();
    }

    syncSpeedWithState() {
        if (this.state === "eaten") {
            this.speed = this.eatenSpeed;
            return;
        }

        if (this.state === "frightened") {
            this.speed = this.frightenedSpeed;
            return;
        }

        this.speed = this.baseSpeed;
    }

    setFrightenedMode(enabled) {
        if (this.isEaten()) return;
        this.setState(enabled ? "frightened" : "normal");
    }

    setEatenMode() {
        this.setState("eaten");
    }

    changeRandomDirection() {
        this.randomTargetIndex =
            (this.randomTargetIndex + 1) % randomTargetsForGhosts.length;
    }

    getHomeTarget() {
        if (typeof getGhostHomeTarget === "function") {
            const target = getGhostHomeTarget();
            if (target && Number.isFinite(target.x) && Number.isFinite(target.y)) {
                return target;
            }
        }

        return randomTargetsForGhosts[0];
    }

    getFrightenedTarget() {
        if (typeof getFrightenedTargetForGhost === "function") {
            const target = getFrightenedTargetForGhost(this);
            if (target && Number.isFinite(target.x) && Number.isFinite(target.y)) {
                return target;
            }
        }

        return randomTargetsForGhosts[this.randomTargetIndex];
    }

    updateModeFromGlobalState() {
        if (this.isEaten()) return;
        const frightenedActive =
            typeof isGhostFrightened === "function" && isGhostFrightened();
        this.setFrightenedMode(frightenedActive);
    }

    hasReachedTargetTile(target) {
        if (!target) return false;
        const targetTileX = parseInt(target.x / oneBlockSize, 10);
        const targetTileY = parseInt(target.y / oneBlockSize, 10);
        return this.getMapX() === targetTileX && this.getMapY() === targetTileY;
    }

    moveProcess() {
        this.updateModeFromGlobalState();

        if (this.isEaten()) {
            this.target = this.getHomeTarget();
        } else if (this.isFrightened()) {
            this.target = this.getFrightenedTarget();
        } else if (this.isInRange()) {
            this.target = pacman;
        } else {
            this.target = randomTargetsForGhosts[this.randomTargetIndex];
        }

        this.changeDirectionIfPossible();
        this.moveForwards();
        this.handleTunnelWrap();

        if (this.checkCollisions()) {
            this.moveBackwards();
            return;
        }

        if (this.isEaten() && this.hasReachedTargetTile(this.getHomeTarget())) {
            const frightenedActive =
                typeof isGhostFrightened === "function" && isGhostFrightened();
            this.setState(frightenedActive ? "frightened" : "normal");
        }
    }

    handleTunnelWrap() {
        const centerY = Math.floor((this.y + this.height / 2) / oneBlockSize);
        const lastColumn = map[0].length - 1;
        const maxX = (lastColumn + 1) * oneBlockSize;

        if (centerY < 0 || centerY >= map.length) return;

        const isTunnelRow =
            map[centerY][0] !== 1 && map[centerY][lastColumn] !== 1;
        if (!isTunnelRow) return;

        if (this.x + this.width <= 0) {
            this.x = lastColumn * oneBlockSize;
        } else if (this.x >= maxX) {
            this.x = 0;
        }
    }

    moveBackwards() {
        switch (this.direction) {
            case DIRECTION_RIGHT:
                this.x -= this.speed;
                break;
            case DIRECTION_UP:
                this.y += this.speed;
                break;
            case DIRECTION_LEFT:
                this.x += this.speed;
                break;
            case DIRECTION_BOTTOM:
                this.y -= this.speed;
                break;
        }
    }

    moveForwards() {
        switch (this.direction) {
            case DIRECTION_RIGHT:
                this.x += this.speed;
                break;
            case DIRECTION_UP:
                this.y -= this.speed;
                break;
            case DIRECTION_LEFT:
                this.x -= this.speed;
                break;
            case DIRECTION_BOTTOM:
                this.y += this.speed;
                break;
        }
    }

    checkCollisions() {
        const top = Math.floor(this.y / oneBlockSize);
        const left = Math.floor(this.x / oneBlockSize);
        const bottom = Math.floor((this.y + this.height - 1) / oneBlockSize);
        const right = Math.floor((this.x + this.width - 1) / oneBlockSize);

        if (
            top < 0 ||
            left < 0 ||
            bottom >= map.length ||
            right >= map[0].length
        ) {
            return true;
        }

        return (
            map[top][left] === 1 ||
            map[bottom][left] === 1 ||
            map[top][right] === 1 ||
            map[bottom][right] === 1
        );
    }

    changeDirectionIfPossible() {
        const tempDirection = this.direction;
        this.direction = this.calculateNewDirection(
            map,
            parseInt(this.target.x / oneBlockSize, 10),
            parseInt(this.target.y / oneBlockSize, 10)
        );

        if (typeof this.direction === "undefined") {
            this.direction = tempDirection;
            return;
        }

        if (
            this.getMapY() !== this.getMapYRightSide() &&
            (this.direction === DIRECTION_LEFT ||
                this.direction === DIRECTION_RIGHT)
        ) {
            this.direction = DIRECTION_UP;
        }

        if (
            this.getMapX() !== this.getMapXRightSide() &&
            this.direction === DIRECTION_UP
        ) {
            this.direction = DIRECTION_LEFT;
        }

        this.moveForwards();
        if (this.checkCollisions()) {
            this.moveBackwards();
            this.direction = tempDirection;
        } else {
            this.moveBackwards();
        }
    }

    calculateNewDirection(currentMap, destX, destY) {
        const mapCopy = [];
        for (let i = 0; i < currentMap.length; i++) {
            mapCopy[i] = currentMap[i].slice();
        }

        const queue = [
            {
                x: this.getMapX(),
                y: this.getMapY(),
                moves: [],
            },
        ];

        while (queue.length > 0) {
            const node = queue.shift();
            if (!node) continue;

            if (node.x === destX && node.y === destY) {
                return node.moves[0];
            }

            mapCopy[node.y][node.x] = 1;
            const neighbors = this.addNeighbors(node, mapCopy);
            for (let i = 0; i < neighbors.length; i++) {
                queue.push(neighbors[i]);
            }
        }

        return DIRECTION_BOTTOM;
    }

    addNeighbors(node, mapCopy) {
        const queue = [];
        const numRows = mapCopy.length;
        const numColumns = mapCopy[0].length;

        if (
            node.x - 1 >= 0 &&
            node.x - 1 < numColumns &&
            mapCopy[node.y][node.x - 1] !== 1
        ) {
            const leftMoves = node.moves.slice();
            leftMoves.push(DIRECTION_LEFT);
            queue.push({ x: node.x - 1, y: node.y, moves: leftMoves });
        }

        if (
            node.x + 1 >= 0 &&
            node.x + 1 < numColumns &&
            mapCopy[node.y][node.x + 1] !== 1
        ) {
            const rightMoves = node.moves.slice();
            rightMoves.push(DIRECTION_RIGHT);
            queue.push({ x: node.x + 1, y: node.y, moves: rightMoves });
        }

        if (
            node.y - 1 >= 0 &&
            node.y - 1 < numRows &&
            mapCopy[node.y - 1][node.x] !== 1
        ) {
            const upMoves = node.moves.slice();
            upMoves.push(DIRECTION_UP);
            queue.push({ x: node.x, y: node.y - 1, moves: upMoves });
        }

        if (
            node.y + 1 >= 0 &&
            node.y + 1 < numRows &&
            mapCopy[node.y + 1][node.x] !== 1
        ) {
            const downMoves = node.moves.slice();
            downMoves.push(DIRECTION_BOTTOM);
            queue.push({ x: node.x, y: node.y + 1, moves: downMoves });
        }

        return queue;
    }

    getMapX() {
        return parseInt(this.x / oneBlockSize, 10);
    }

    getMapY() {
        return parseInt(this.y / oneBlockSize, 10);
    }

    getMapXRightSide() {
        return parseInt((this.x * 0.99 + oneBlockSize) / oneBlockSize, 10);
    }

    getMapYRightSide() {
        return parseInt((this.y * 0.99 + oneBlockSize) / oneBlockSize, 10);
    }

    drawFrightenedGhost() {
        const shouldFlash =
            typeof shouldFlashFrightenedGhosts === "function" &&
            shouldFlashFrightenedGhosts();

        const bodyColor = shouldFlash ? "#F4F4F4" : "#1F5FFF";
        const accentColor = shouldFlash ? "#D63030" : "#FFFFFF";
        const pupilColor = shouldFlash ? "#2A2A2A" : "#0033AA";

        canvasContext.fillStyle = bodyColor;
        canvasContext.beginPath();
        canvasContext.arc(
            this.x + this.width * 0.5,
            this.y + this.height * 0.45,
            this.width * 0.48,
            Math.PI,
            0
        );
        canvasContext.rect(this.x + this.width * 0.02, this.y + this.height * 0.45, this.width * 0.96, this.height * 0.48);
        canvasContext.fill();

        canvasContext.fillStyle = accentColor;
        canvasContext.beginPath();
        canvasContext.arc(this.x + this.width * 0.36, this.y + this.height * 0.55, this.width * 0.13, 0, 2 * Math.PI);
        canvasContext.arc(this.x + this.width * 0.64, this.y + this.height * 0.55, this.width * 0.13, 0, 2 * Math.PI);
        canvasContext.fill();

        canvasContext.fillStyle = pupilColor;
        canvasContext.beginPath();
        canvasContext.arc(this.x + this.width * 0.36, this.y + this.height * 0.56, this.width * 0.06, 0, 2 * Math.PI);
        canvasContext.arc(this.x + this.width * 0.64, this.y + this.height * 0.56, this.width * 0.06, 0, 2 * Math.PI);
        canvasContext.fill();

        canvasContext.strokeStyle = accentColor;
        canvasContext.lineWidth = Math.max(1, oneBlockSize * 0.08);
        canvasContext.beginPath();
        canvasContext.moveTo(this.x + this.width * 0.24, this.y + this.height * 0.78);
        canvasContext.lineTo(this.x + this.width * 0.38, this.y + this.height * 0.86);
        canvasContext.lineTo(this.x + this.width * 0.5, this.y + this.height * 0.78);
        canvasContext.lineTo(this.x + this.width * 0.62, this.y + this.height * 0.86);
        canvasContext.lineTo(this.x + this.width * 0.76, this.y + this.height * 0.78);
        canvasContext.stroke();
    }

    drawEatenGhostEyes() {
        canvasContext.fillStyle = "#FFFFFF";
        canvasContext.beginPath();
        canvasContext.arc(this.x + this.width * 0.38, this.y + this.height * 0.48, this.width * 0.14, 0, 2 * Math.PI);
        canvasContext.arc(this.x + this.width * 0.62, this.y + this.height * 0.48, this.width * 0.14, 0, 2 * Math.PI);
        canvasContext.fill();

        canvasContext.fillStyle = "#2D5BFF";
        canvasContext.beginPath();
        canvasContext.arc(this.x + this.width * 0.38, this.y + this.height * 0.48, this.width * 0.07, 0, 2 * Math.PI);
        canvasContext.arc(this.x + this.width * 0.62, this.y + this.height * 0.48, this.width * 0.07, 0, 2 * Math.PI);
        canvasContext.fill();
    }

    draw() {
        canvasContext.save();

        if (this.isEaten()) {
            this.drawEatenGhostEyes();
            canvasContext.restore();
            return;
        }

        if (this.isFrightened()) {
            this.drawFrightenedGhost();
            canvasContext.restore();
            return;
        }

        canvasContext.drawImage(
            ghostFrames,
            this.imageX,
            this.imageY,
            this.imageWidth,
            this.imageHeight,
            this.x,
            this.y,
            this.width,
            this.height
        );
        canvasContext.restore();
    }
}

let updateGhosts = () => {
    for (let i = 0; i < ghosts.length; i++) {
        ghosts[i].moveProcess();
    }
};

let drawGhosts = () => {
    for (let i = 0; i < ghosts.length; i++) {
        ghosts[i].draw();
    }
};
