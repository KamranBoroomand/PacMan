class Pacman {
    constructor(x, y, width, height, speed) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = speed;
        this.direction = 4;
        this.nextDirection = 4;
        this.frameCount = 7;
        this.currentFrame = 1;
        this.animationTimer = setInterval(() => {
            this.changeAnimation();
        }, 100);
    }

    dispose() {
        if (this.animationTimer) {
            clearInterval(this.animationTimer);
            this.animationTimer = null;
        }
    }

    moveProcess() {
        this.changeDirectionIfPossible();
        this.moveForwards();
        this.handleTunnelWrap();
        if (this.checkCollisions()) {
            this.moveBackwards();
            return;
        }
    }

    eat() {
        const eatResult = {
            atePellet: false,
            atePowerPellet: false,
        };

        const mapX = this.getMapX();
        const mapY = this.getMapY();

        if (mapY < 0 || mapY >= map.length || mapX < 0 || mapX >= map[0].length) {
            return eatResult;
        }

        if (map[mapY][mapX] === 2 || map[mapY][mapX] === 4) {
            const isPowerPellet = map[mapY][mapX] === 4;
            map[mapY][mapX] = 0;
            const points = isPowerPellet ? 5 : 1;
            if (typeof addScore === "function") {
                addScore(points);
            } else {
                score += points;
            }

            if (!isPowerPellet && typeof playGameSfx === "function") {
                playGameSfx("pellet");
            }

            eatResult.atePellet = true;
            eatResult.atePowerPellet = isPowerPellet;
        }

        return eatResult;
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
            case DIRECTION_RIGHT: // Right
                this.x -= this.speed;
                break;
            case DIRECTION_UP: // Up
                this.y += this.speed;
                break;
            case DIRECTION_LEFT: // Left
                this.x += this.speed;
                break;
            case DIRECTION_BOTTOM: // Bottom
                this.y -= this.speed;
                break;
        }
    }

    moveForwards() {
        switch (this.direction) {
            case DIRECTION_RIGHT: // Right
                this.x += this.speed;
                break;
            case DIRECTION_UP: // Up
                this.y -= this.speed;
                break;
            case DIRECTION_LEFT: // Left
                this.x -= this.speed;
                break;
            case DIRECTION_BOTTOM: // Bottom
                this.y += this.speed;
                break;
        }
    }

    checkCollisions() {
        const utils =
            typeof GameplayUtils === "object" && GameplayUtils
                ? GameplayUtils
                : null;

        if (utils && typeof utils.checkRectTileCollision === "function") {
            return utils.checkRectTileCollision(
                map,
                this.x,
                this.y,
                this.width,
                this.height,
                oneBlockSize,
                { allowHorizontalTunnelWrap: true }
            );
        }

        const top = Math.floor(this.y / oneBlockSize);
        const left = Math.floor(this.x / oneBlockSize);
        const bottom = Math.floor((this.y + this.height - 1) / oneBlockSize);
        const right = Math.floor((this.x + this.width - 1) / oneBlockSize);
        const tileRows = map.length;
        const tileCols = map[0].length;

        if (top < 0 || bottom >= tileRows) {
            return true;
        }

        const outOfHorizontalBounds = left < 0 || right >= tileCols;
        if (outOfHorizontalBounds) {
            const centerY = Math.floor((this.y + this.height / 2) / oneBlockSize);
            const isTunnelRow =
                centerY >= 0 &&
                centerY < tileRows &&
                map[centerY][0] !== 1 &&
                map[centerY][tileCols - 1] !== 1;
            if (!isTunnelRow) {
                return true;
            }
        }

        const corners = [
            { x: left, y: top },
            { x: left, y: bottom },
            { x: right, y: top },
            { x: right, y: bottom },
        ];

        for (let i = 0; i < corners.length; i++) {
            const corner = corners[i];
            if (corner.x < 0 || corner.x >= tileCols) {
                continue;
            }
            if (map[corner.y][corner.x] === 1) {
                return true;
            }
        }

        return false;
    }

    checkGhostCollision(ghosts) {
        for (let i = 0; i < ghosts.length; i++) {
            let ghost = ghosts[i];
            if (
                ghost.getMapX() == this.getMapX() &&
                ghost.getMapY() == this.getMapY()
            ) {
                return true;
            }
        }
        return false;
    }

    changeDirectionIfPossible() {
        if (this.direction == this.nextDirection) return;

        const isHorizontal = (direction) =>
            direction === DIRECTION_LEFT || direction === DIRECTION_RIGHT;
        const currentHorizontal = isHorizontal(this.direction);
        const nextHorizontal = isHorizontal(this.nextDirection);

        if (currentHorizontal !== nextHorizontal) {
            if (nextHorizontal) {
                const snappedY = this.snapCoordinateToGrid(this.y);
                if (snappedY === null) return;
                this.y = snappedY;
            } else {
                const snappedX = this.snapCoordinateToGrid(this.x);
                if (snappedX === null) return;
                this.x = snappedX;
            }
        }

        let tempDirection = this.direction;
        this.direction = this.nextDirection;
        this.moveForwards();
        if (this.checkCollisions()) {
            this.moveBackwards();
            this.direction = tempDirection;
        } else {
            this.moveBackwards();
        }
    }

    snapCoordinateToGrid(value) {
        const nearestGridLine = Math.round(value / oneBlockSize) * oneBlockSize;
        const distance = Math.abs(nearestGridLine - value);
        const maxSnapDistance = Math.max(this.speed * 1.25, 1);

        if (distance > maxSnapDistance) {
            return null;
        }

        return nearestGridLine;
    }

    getMapX() {
        let mapX = parseInt(this.x / oneBlockSize);
        return mapX;
    }

    getMapY() {
        let mapY = parseInt(this.y / oneBlockSize);

        return mapY;
    }

    getMapXRightSide() {
        let mapX = parseInt((this.x * 0.99 + oneBlockSize) / oneBlockSize);
        return mapX;
    }

    getMapYRightSide() {
        let mapY = parseInt((this.y * 0.99 + oneBlockSize) / oneBlockSize);
        return mapY;
    }

    changeAnimation() {
        this.currentFrame =
            this.currentFrame == this.frameCount ? 1 : this.currentFrame + 1;
    }

    draw() {
        canvasContext.save();
        canvasContext.translate(
            this.x + oneBlockSize / 2,
            this.y + oneBlockSize / 2
        );
        canvasContext.rotate((this.direction * 90 * Math.PI) / 180);
        canvasContext.translate(
            -this.x - oneBlockSize / 2,
            -this.y - oneBlockSize / 2
        );
        canvasContext.drawImage(
            pacmanFrames,
            (this.currentFrame - 1) * oneBlockSize,
            0,
            oneBlockSize,
            oneBlockSize,
            this.x,
            this.y,
            this.width,
            this.height
        );
        canvasContext.restore();
    }
}
