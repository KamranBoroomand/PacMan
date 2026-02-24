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
        range,
        options = {}
    ) {
        this.x = x;
        this.y = y;
        this.spawnX = x;
        this.spawnY = y;
        this.width = width;
        this.height = height;
        this.baseSpeed = speed;
        this.frightenedSpeed = Math.max(oneBlockSize / 10, speed * 0.72);
        this.eatenSpeed = Math.max(oneBlockSize / 4, speed * 1.35);
        this.speed = speed;
        this.direction = DIRECTION_LEFT;
        this.imageX = imageX;
        this.imageY = imageY;
        this.imageHeight = imageHeight;
        this.imageWidth = imageWidth;
        this.range = range;
        this.state = "normal";
        this.personality = options.personality || "blinky";
        this.displayName = options.displayName || this.personality;
        this.scatterTile = options.scatterTile || { x: 1, y: 1 };
        this.houseState = {
            inside: Boolean(options.startInHouse),
            releaseDotThreshold: Number.isFinite(options.releaseDotThreshold)
                ? options.releaseDotThreshold
                : 0,
            forceReleaseMs: Number.isFinite(options.forceReleaseMs)
                ? options.forceReleaseMs
                : 0,
        };

        this.target = randomTargetsForGhosts[0];
        const randomFn = typeof randomFloat === "function" ? randomFloat : Math.random;
        this.randomTargetIndex = parseInt(
            randomFn() * randomTargetsForGhosts.length,
            10
        );
        this.directionTimer = null;
        this.frightenedTurnsRemaining = 0;
        this.debugIntent = null;
    }

    dispose() {
        if (this.directionTimer) {
            clearInterval(this.directionTimer);
            this.directionTimer = null;
        }
    }

    setLevelSpeed(baseSpeed) {
        this.baseSpeed = baseSpeed;
        this.frightenedSpeed = Math.max(oneBlockSize / 10, this.baseSpeed * 0.72);
        this.eatenSpeed = Math.max(oneBlockSize / 4, this.baseSpeed * 1.35);
        this.syncSpeedWithState();
    }

    isInHouse() {
        return this.houseState.inside;
    }

    setInHouse(inside) {
        this.houseState.inside = Boolean(inside);
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

    reverseDirection() {
        if (this.direction === DIRECTION_RIGHT) {
            this.direction = DIRECTION_LEFT;
        } else if (this.direction === DIRECTION_LEFT) {
            this.direction = DIRECTION_RIGHT;
        } else if (this.direction === DIRECTION_UP) {
            this.direction = DIRECTION_BOTTOM;
        } else {
            this.direction = DIRECTION_UP;
        }
    }

    setFrightenedMode(enabled) {
        if (this.isEaten()) return;
        const nextState = enabled ? "frightened" : "normal";
        if (this.state !== nextState) {
            this.reverseDirection();
            if (enabled) {
                const limit =
                    typeof getFrightenedTurnLimit === "function"
                        ? getFrightenedTurnLimit()
                        : 6;
                this.frightenedTurnsRemaining = Math.max(0, limit);
            }
        }
        this.setState(nextState);
    }

    setEatenMode() {
        this.setState("eaten");
    }

    releaseFromHouse() {
        if (
            typeof getGhostHouseExitTargetForPersonality !== "function" &&
            typeof getGhostHouseExitTarget !== "function"
        ) {
            this.setInHouse(false);
            return;
        }

        const exitTarget =
            typeof getGhostHouseExitTargetForPersonality === "function"
                ? getGhostHouseExitTargetForPersonality(this.personality)
                : getGhostHouseExitTarget();
        const exitTileX = parseInt(exitTarget.x / oneBlockSize, 10);
        const exitTileY = parseInt(exitTarget.y / oneBlockSize, 10);

        let safeTarget = exitTarget;
        if (!this.isWalkableTile(exitTileX, exitTileY, map)) {
            const fallbackTarget =
                typeof getGhostHouseExitTarget === "function"
                    ? getGhostHouseExitTarget()
                    : { x: this.spawnX, y: this.spawnY };
            safeTarget = fallbackTarget;
        }

        this.x = safeTarget.x;
        this.y = safeTarget.y;
        this.direction = DIRECTION_UP;
        this.setInHouse(false);
    }

    maybeReleaseFromHouse() {
        if (!this.isInHouse()) return;
        if (typeof canReleaseGhostFromHouse !== "function") return;
        const shouldRelease = canReleaseGhostFromHouse(this);
        if (shouldRelease) {
            this.releaseFromHouse();
        }
    }

    updateModeFromGlobalState() {
        if (this.isEaten()) return;
        const frightenedActive =
            typeof isGhostFrightened === "function" && isGhostFrightened();
        this.setFrightenedMode(frightenedActive);
    }

    getHomeTarget() {
        if (typeof getGhostHomeTarget === "function") {
            return getGhostHomeTarget();
        }
        return randomTargetsForGhosts[0];
    }

    getFrightenedTarget() {
        if (typeof getFrightenedTargetForGhost === "function") {
            const target = getFrightenedTargetForGhost(this);
            if (target) return target;
        }
        return randomTargetsForGhosts[this.randomTargetIndex];
    }

    getPersonalityTarget() {
        if (typeof getGhostTargetForPersonality === "function") {
            const target = getGhostTargetForPersonality(this);
            if (target) return target;
        }
        return { x: pacman.x, y: pacman.y };
    }

    hasReachedTargetTile(target) {
        if (!target) return false;
        const targetTileX = parseInt(target.x / oneBlockSize, 10);
        const targetTileY = parseInt(target.y / oneBlockSize, 10);
        return this.getMapX() === targetTileX && this.getMapY() === targetTileY;
    }

    moveProcess() {
        this.maybeReleaseFromHouse();
        if (this.isInHouse()) {
            this.debugIntent = null;
            return;
        }

        this.updateModeFromGlobalState();

        if (this.isEaten()) {
            this.target = this.getHomeTarget();
        } else if (this.isFrightened()) {
            this.target = this.getFrightenedTarget();
        } else {
            this.target = this.getPersonalityTarget();
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

    changeRandomDirection() {
        this.randomTargetIndex =
            (this.randomTargetIndex + 1) % randomTargetsForGhosts.length;
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

    changeDirectionIfPossible() {
        const tempDirection = this.direction;
        let nextDirection = this.calculateNewDirection(
            map,
            parseInt(this.target.x / oneBlockSize, 10),
            parseInt(this.target.y / oneBlockSize, 10)
        );

        if (typeof nextDirection === "undefined") {
            this.direction = tempDirection;
            return;
        }

        const isHorizontal = (direction) =>
            direction === DIRECTION_LEFT || direction === DIRECTION_RIGHT;
        const currentHorizontal = isHorizontal(tempDirection);
        const nextHorizontal = isHorizontal(nextDirection);

        if (currentHorizontal !== nextHorizontal) {
            if (nextHorizontal) {
                const snappedY = this.snapCoordinateToGrid(this.y);
                if (snappedY === null) {
                    nextDirection = tempDirection;
                } else {
                    this.y = snappedY;
                }
            } else {
                const snappedX = this.snapCoordinateToGrid(this.x);
                if (snappedX === null) {
                    nextDirection = tempDirection;
                } else {
                    this.x = snappedX;
                }
            }
        }

        this.direction = nextDirection;

        this.moveForwards();
        if (this.checkCollisions()) {
            this.moveBackwards();
            this.direction = tempDirection;

            this.moveForwards();
            if (this.checkCollisions()) {
                this.moveBackwards();
                const oppositeDirection = this.getOppositeDirection(tempDirection);
                this.direction = oppositeDirection;

                this.moveForwards();
                if (this.checkCollisions()) {
                    this.moveBackwards();
                    this.direction = tempDirection;
                } else {
                    this.moveBackwards();
                }
            } else {
                this.moveBackwards();
            }
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

    getOppositeDirection(direction) {
        if (direction === DIRECTION_RIGHT) return DIRECTION_LEFT;
        if (direction === DIRECTION_LEFT) return DIRECTION_RIGHT;
        if (direction === DIRECTION_UP) return DIRECTION_BOTTOM;
        return DIRECTION_UP;
    }

    getDirectionVector(direction) {
        if (direction === DIRECTION_RIGHT) return { x: 1, y: 0 };
        if (direction === DIRECTION_LEFT) return { x: -1, y: 0 };
        if (direction === DIRECTION_UP) return { x: 0, y: -1 };
        return { x: 0, y: 1 };
    }

    getDirectionPriority(direction) {
        const defaultOrder = [
            DIRECTION_UP,
            DIRECTION_LEFT,
            DIRECTION_BOTTOM,
            DIRECTION_RIGHT,
        ];
        const personalityOrderByGhost = {
            blinky: defaultOrder,
            pinky: [
                DIRECTION_LEFT,
                DIRECTION_UP,
                DIRECTION_RIGHT,
                DIRECTION_BOTTOM,
            ],
            inky: [
                DIRECTION_BOTTOM,
                DIRECTION_RIGHT,
                DIRECTION_UP,
                DIRECTION_LEFT,
            ],
            clyde: [
                DIRECTION_BOTTOM,
                DIRECTION_LEFT,
                DIRECTION_RIGHT,
                DIRECTION_UP,
            ],
        };

        const order =
            personalityOrderByGhost[this.personality] || defaultOrder;
        const priority = order.indexOf(direction);
        return priority === -1 ? defaultOrder.length : priority;
    }

    getCurrentCenterTile() {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        return {
            x: Math.floor(centerX / oneBlockSize),
            y: Math.floor(centerY / oneBlockSize),
        };
    }

    normalizeHorizontalTunnelTile(tileX, tileY, currentMap) {
        const numColumns = currentMap[0].length;
        if (tileX >= 0 && tileX < numColumns) {
            return tileX;
        }

        if (tileY < 0 || tileY >= currentMap.length) {
            return tileX;
        }

        const isTunnelRow =
            currentMap[tileY][0] !== 1 && currentMap[tileY][numColumns - 1] !== 1;
        if (!isTunnelRow) {
            return tileX;
        }

        return tileX < 0 ? numColumns - 1 : 0;
    }

    getNeighborTile(tileX, tileY, direction, currentMap) {
        const vector = this.getDirectionVector(direction);
        let nextX = tileX + vector.x;
        let nextY = tileY + vector.y;

        if (vector.y === 0) {
            nextX = this.normalizeHorizontalTunnelTile(nextX, tileY, currentMap);
        }

        if (nextY < 0 || nextY >= currentMap.length) {
            return null;
        }

        if (nextX < 0 || nextX >= currentMap[0].length) {
            return null;
        }

        return { x: nextX, y: nextY };
    }

    isWalkableTile(tileX, tileY, currentMap) {
        if (tileY < 0 || tileY >= currentMap.length) return false;
        if (tileX < 0 || tileX >= currentMap[0].length) return false;
        return currentMap[tileY][tileX] !== 1;
    }

    getAvailableDirections(tileX, tileY, currentMap) {
        const directions = [
            DIRECTION_UP,
            DIRECTION_LEFT,
            DIRECTION_BOTTOM,
            DIRECTION_RIGHT,
        ];
        const available = [];

        for (let i = 0; i < directions.length; i++) {
            const direction = directions[i];
            const neighbor = this.getNeighborTile(tileX, tileY, direction, currentMap);
            if (!neighbor) continue;
            if (this.isWalkableTile(neighbor.x, neighbor.y, currentMap)) {
                available.push(direction);
            }
        }

        return available;
    }

    buildDirectionalCandidates(candidates, originTile, currentMap) {
        if (!Array.isArray(candidates) || candidates.length === 0) {
            return [];
        }

        const directionalCandidates = [];
        for (let i = 0; i < candidates.length; i++) {
            const direction = candidates[i];
            const neighbor = this.getNeighborTile(
                originTile.x,
                originTile.y,
                direction,
                currentMap
            );
            if (!neighbor) continue;

            directionalCandidates.push({
                direction,
                x: neighbor.x,
                y: neighbor.y,
            });
        }

        return directionalCandidates;
    }

    setDebugIntent(options = {}) {
        const originTile = options.originTile || null;
        const targetTile = options.targetTile || null;
        const availableDirections = Array.isArray(options.availableDirections)
            ? options.availableDirections.slice()
            : [];
        const candidateTiles = Array.isArray(options.candidateTiles)
            ? options.candidateTiles.map((candidate) => ({
                direction: candidate.direction,
                x: candidate.x,
                y: candidate.y,
            }))
            : [];
        const chosenDirection = Number.isFinite(options.chosenDirection)
            ? options.chosenDirection
            : this.direction;
        const chosenTile =
            candidateTiles.find((candidate) => candidate.direction === chosenDirection) || null;

        this.debugIntent = {
            originTile: originTile
                ? { x: originTile.x, y: originTile.y }
                : null,
            targetTile: targetTile
                ? { x: targetTile.x, y: targetTile.y }
                : null,
            availableDirections,
            candidates: candidateTiles,
            chosenDirection,
            chosenTile: chosenTile ? { x: chosenTile.x, y: chosenTile.y } : null,
            reason: options.reason || "target",
            mode: this.isEaten() ? "eaten" : (this.isFrightened() ? "frightened" : "normal"),
        };
    }

    pickRandomDirection(candidates) {
        if (!Array.isArray(candidates) || candidates.length === 0) {
            return this.direction;
        }

        if (candidates.length === 1) {
            return candidates[0];
        }

        const randomFn = typeof randomFloat === "function" ? randomFloat : Math.random;
        const index = Math.floor(randomFn() * candidates.length);
        return candidates[index];
    }

    pickDirectionClosestToTarget(
        candidates,
        originTile,
        targetTile,
        currentMap,
        directionalCandidates = null
    ) {
        if (!Array.isArray(candidates) || candidates.length === 0) {
            return this.direction;
        }

        const utils =
            typeof GameplayUtils === "object" && GameplayUtils
                ? GameplayUtils
                : null;
        const normalizedDirectionalCandidates = Array.isArray(directionalCandidates)
            ? directionalCandidates
            : this.buildDirectionalCandidates(candidates, originTile, currentMap);

        if (
            utils &&
            typeof utils.pickGhostDirection === "function" &&
            normalizedDirectionalCandidates.length > 0
        ) {
            const mode = this.isEaten() ? "eaten" : (this.isFrightened() ? "frightened" : "normal");
            const pickedDirection = utils.pickGhostDirection({
                candidates: normalizedDirectionalCandidates,
                targetTile,
                currentDirection: this.direction,
                personality: this.personality,
                map: currentMap,
                mode,
                maxPathDepth: this.isEaten() ? 130 : 96,
            });
            if (Number.isFinite(pickedDirection)) {
                return pickedDirection;
            }
        }

        let bestDirection = candidates[0];
        let bestScore = Infinity;
        const currentDirection = this.direction;

        for (let i = 0; i < candidates.length; i++) {
            const direction = candidates[i];
            const neighbor = this.getNeighborTile(
                originTile.x,
                originTile.y,
                direction,
                currentMap
            );
            if (!neighbor) continue;

            const dx = targetTile.x - neighbor.x;
            const dy = targetTile.y - neighbor.y;
            let score = dx * dx + dy * dy;

            if (direction === currentDirection) {
                score -= 0.08;
            }

            if (
                score < bestScore ||
                (score === bestScore &&
                    this.getDirectionPriority(direction) <
                        this.getDirectionPriority(bestDirection))
            ) {
                bestScore = score;
                bestDirection = direction;
            }
        }

        return bestDirection;
    }

    calculateNewDirection(currentMap, destX, destY) {
        const originTile = this.getCurrentCenterTile();
        const targetTile = { x: destX, y: destY };
        const availableDirections = this.getAvailableDirections(
            originTile.x,
            originTile.y,
            currentMap
        );

        if (availableDirections.length === 0) {
            this.setDebugIntent({
                originTile,
                targetTile,
                availableDirections,
                candidateTiles: [],
                chosenDirection: this.direction,
                reason: "no-path",
            });
            return this.direction;
        }

        const reverseDirection = this.getOppositeDirection(this.direction);
        let candidates = availableDirections;

        if (candidates.length > 1) {
            const nonReverse = candidates.filter(
                (direction) => direction !== reverseDirection
            );
            if (nonReverse.length > 0) {
                candidates = nonReverse;
            }
        }
        const directionalCandidates = this.buildDirectionalCandidates(
            candidates,
            originTile,
            currentMap
        );

        if (this.isFrightened() && !this.isEaten()) {
            const canContinue = candidates.includes(this.direction);
            if (this.frightenedTurnsRemaining <= 0 && canContinue) {
                this.setDebugIntent({
                    originTile,
                    targetTile,
                    availableDirections,
                    candidateTiles: directionalCandidates,
                    chosenDirection: this.direction,
                    reason: "frightened-hold",
                });
                return this.direction;
            }

            const picked = this.pickRandomDirection(candidates);
            const atIntersection = availableDirections.length > 2;
            if (picked !== this.direction && atIntersection) {
                this.frightenedTurnsRemaining = Math.max(
                    0,
                    this.frightenedTurnsRemaining - 1
                );
            }
            this.setDebugIntent({
                originTile,
                targetTile,
                availableDirections,
                candidateTiles: directionalCandidates,
                chosenDirection: picked,
                reason: "frightened-random",
            });
            return picked;
        }

        const pickedDirection = this.pickDirectionClosestToTarget(
            candidates,
            originTile,
            targetTile,
            currentMap,
            directionalCandidates
        );
        this.setDebugIntent({
            originTile,
            targetTile,
            availableDirections,
            candidateTiles: directionalCandidates,
            chosenDirection: pickedDirection,
            reason: "target-closest",
        });
        return pickedDirection;
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
        canvasContext.rect(
            this.x + this.width * 0.02,
            this.y + this.height * 0.45,
            this.width * 0.96,
            this.height * 0.48
        );
        canvasContext.fill();

        canvasContext.fillStyle = accentColor;
        canvasContext.beginPath();
        canvasContext.arc(
            this.x + this.width * 0.36,
            this.y + this.height * 0.55,
            this.width * 0.13,
            0,
            2 * Math.PI
        );
        canvasContext.arc(
            this.x + this.width * 0.64,
            this.y + this.height * 0.55,
            this.width * 0.13,
            0,
            2 * Math.PI
        );
        canvasContext.fill();

        canvasContext.fillStyle = pupilColor;
        canvasContext.beginPath();
        canvasContext.arc(
            this.x + this.width * 0.36,
            this.y + this.height * 0.56,
            this.width * 0.06,
            0,
            2 * Math.PI
        );
        canvasContext.arc(
            this.x + this.width * 0.64,
            this.y + this.height * 0.56,
            this.width * 0.06,
            0,
            2 * Math.PI
        );
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
        canvasContext.arc(
            this.x + this.width * 0.38,
            this.y + this.height * 0.48,
            this.width * 0.14,
            0,
            2 * Math.PI
        );
        canvasContext.arc(
            this.x + this.width * 0.62,
            this.y + this.height * 0.48,
            this.width * 0.14,
            0,
            2 * Math.PI
        );
        canvasContext.fill();

        canvasContext.fillStyle = "#2D5BFF";
        canvasContext.beginPath();
        canvasContext.arc(
            this.x + this.width * 0.38,
            this.y + this.height * 0.48,
            this.width * 0.07,
            0,
            2 * Math.PI
        );
        canvasContext.arc(
            this.x + this.width * 0.62,
            this.y + this.height * 0.48,
            this.width * 0.07,
            0,
            2 * Math.PI
        );
        canvasContext.fill();
    }

    draw() {
        if (this.isInHouse()) {
            canvasContext.save();
            canvasContext.globalAlpha = 0.65;
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
            return;
        }

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
